#include "ExecutionEngine.h"
#include <algorithm>
#include <iostream>

namespace aegis {

nlohmann::json ExecutionStats::to_json() const {
    nlohmann::json completed_json = nlohmann::json::array();
    for (const auto& t : completed_task_objects) {
        if (t) completed_json.push_back(t->to_json());
    }

    nlohmann::json gantt_json = nlohmann::json::array();
    for (const auto& g : gantt_records) {
        gantt_json.push_back(g.to_json());
    }

    return nlohmann::json{
        {"algorithm_name", algorithm_name},
        {"num_workers", num_workers},
        {"start_timestamp_ms", start_timestamp_ms},
        {"total_duration_ms", total_duration_ms},
        {"total_worker_busy_ms", total_worker_busy_ms},
        {"scheduling_overhead_us", scheduling_overhead_us},
        {"total_tasks", total_tasks},
        {"completed_tasks", completed_tasks},
        {"completed_task_objects", completed_json},
        {"gantt_records", gantt_json}
    };
}

ExecutionEngine::ExecutionEngine(int num_workers)
    : num_workers_(std::max(1, num_workers)) {
    worker_current_task_.resize(num_workers_, "None");
    worker_status_.resize(num_workers_, "IDLE");
}

ExecutionEngine::~ExecutionEngine() {
    stop();
}

void ExecutionEngine::set_worker_count(int count) {
    num_workers_ = std::max(1, count);
    worker_current_task_.assign(num_workers_, "None");
    worker_status_.assign(num_workers_, "IDLE");
}

void ExecutionEngine::set_progress_callback(std::function<void(const nlohmann::json&)> cb) {
    progress_callback_ = cb;
}

void ExecutionEngine::prepare(std::shared_ptr<Scheduler> scheduler, const std::vector<std::shared_ptr<Task>>& tasks) {
    scheduler_ = scheduler;
    all_tasks_ = tasks;
    pending_tasks_ = tasks;
    completed_tasks_.clear();
    gantt_records_.clear();

    // Sort pending tasks by arrival time
    std::sort(pending_tasks_.begin(), pending_tasks_.end(), [](const std::shared_ptr<Task>& a, const std::shared_ptr<Task>& b) {
        return a->arrival_time < b->arrival_time;
    });

    worker_current_task_.assign(num_workers_, "None");
    worker_status_.assign(num_workers_, "IDLE");
    current_experiment_time_ms_.store(0.0);
    total_worker_busy_ms_ = 0.0;
    scheduling_overhead_us_.store(0);
    stop_requested_.store(false);
    pause_requested_.store(false);
    state_.store(EngineState::STOPPED);
}

void ExecutionEngine::arrival_coordinator_loop() {
    while (!stop_requested_.load()) {
        if (pause_requested_.load()) {
            std::this_thread::sleep_for(std::chrono::milliseconds(5));
            continue;
        }

        auto now = std::chrono::high_resolution_clock::now();
        double elapsed_ms = std::chrono::duration<double, std::milli>(now - experiment_start_tp_).count();
        current_experiment_time_ms_.store(elapsed_ms);

        std::vector<std::shared_ptr<Task>> arrived_now;
        bool all_done = false;
        {
            std::lock_guard<std::mutex> lock(data_mutex_);
            auto it = pending_tasks_.begin();
            while (it != pending_tasks_.end()) {
                if ((*it)->arrival_time <= elapsed_ms) {
                    (*it)->last_ready_time = elapsed_ms;
                    arrived_now.push_back(*it);
                    it = pending_tasks_.erase(it);
                } else {
                    ++it;
                }
            }

            all_done = (completed_tasks_.size() == all_tasks_.size());
        }

        for (auto& t : arrived_now) {
            scheduler_->add_task(t);
        }

        if (!arrived_now.empty()) {
            work_cv_.notify_all();
        }

        if (all_done) {
            work_cv_.notify_all();
            break;
        }

        std::this_thread::sleep_for(std::chrono::milliseconds(2));
    }
}

void ExecutionEngine::worker_loop(int worker_id) {
    while (!stop_requested_.load()) {
        while (pause_requested_.load() && !stop_requested_.load()) {
            worker_status_[worker_id] = "PAUSED";
            std::this_thread::sleep_for(std::chrono::milliseconds(10));
        }

        if (stop_requested_.load()) break;

        // Check if finished
        {
            std::lock_guard<std::mutex> lock(data_mutex_);
            if (completed_tasks_.size() == all_tasks_.size()) {
                break;
            }
        }

        std::shared_ptr<Task> task = nullptr;
        double current_time = current_experiment_time_ms_.load();

        // Select next task with timing for overhead measurement
        {
            auto sched_start = std::chrono::high_resolution_clock::now();
            task = scheduler_->select_next_task(worker_id, current_time);
            auto sched_end = std::chrono::high_resolution_clock::now();
            uint64_t overhead_us = std::chrono::duration_cast<std::chrono::microseconds>(sched_end - sched_start).count();
            scheduling_overhead_us_.fetch_add(overhead_us);
        }

        if (!task) {
            // No ready task right now -> Worker is IDLE
            worker_status_[worker_id] = "IDLE";
            worker_current_task_[worker_id] = "None";

            std::unique_lock<std::mutex> cv_lock(cv_mutex_);
            work_cv_.wait_for(cv_lock, std::chrono::milliseconds(5));
            continue;
        }

        // Execute task slice
        worker_status_[worker_id] = "WORKING";
        worker_current_task_[worker_id] = task->id;
        task->assigned_worker_id = worker_id;

        auto now = std::chrono::high_resolution_clock::now();
        double start_ms = std::chrono::duration<double, std::milli>(now - experiment_start_tp_).count();

        if (task->first_execution_time < 0.0) {
            task->first_execution_time = start_ms;
            task->waiting_time = std::max(0.0, start_ms - task->arrival_time);
        } else {
            task->waiting_time += std::max(0.0, start_ms - task->last_ready_time);
        }

        task->status = TaskStatus::RUNNING;

        int chunk_units = scheduler_->get_work_chunk_units(task);
        double actual_exec_ms = task->execute_chunk(chunk_units);

        auto finish_now = std::chrono::high_resolution_clock::now();
        double end_ms = std::chrono::duration<double, std::milli>(finish_now - experiment_start_tp_).count();
        double actual_duration = end_ms - start_ms;

        // Record Gantt slice
        std::string record_status;
        bool is_done = task->is_completed();
        if (is_done) {
            task->status = TaskStatus::COMPLETED;
            task->completion_time = end_ms;
            record_status = "COMPLETED";
        } else if (scheduler_->is_preemptive()) {
            task->status = TaskStatus::PAUSED;
            record_status = "PAUSED";
        } else {
            record_status = "RUNNING";
        }

        GanttRecord record{
            task->id,
            task->name,
            worker_id,
            start_ms,
            end_ms,
            actual_duration,
            record_status,
            task->last_decision_reason
        };

        {
            std::lock_guard<std::mutex> lock(data_mutex_);
            total_worker_busy_ms_ += actual_duration;
            gantt_records_.push_back(record);

            if (is_done) {
                completed_tasks_.push_back(task);
            }
        }

        if (!is_done) {
            task->last_ready_time = end_ms;
            scheduler_->on_chunk_finished(task, worker_id, end_ms);
        }

        // Notify other workers if more ready work
        work_cv_.notify_all();

        // Optional UI live callback (throttled to at most once per 60ms or on task completion)
        static std::atomic<int64_t> last_cb_ms{0};
        auto cb_now = std::chrono::duration_cast<std::chrono::milliseconds>(
            std::chrono::high_resolution_clock::now().time_since_epoch()).count();
        if (progress_callback_ && (is_done || (cb_now - last_cb_ms.load()) >= 60)) {
            last_cb_ms.store(cb_now);
            progress_callback_(get_live_status());
        }
    }

    worker_status_[worker_id] = "IDLE";
    worker_current_task_[worker_id] = "None";
}

ExecutionStats ExecutionEngine::run() {
    state_.store(EngineState::RUNNING);
    experiment_start_tp_ = std::chrono::high_resolution_clock::now();

    // Spawn arrival coordinator
    arrival_coordinator_thread_ = std::thread(&ExecutionEngine::arrival_coordinator_loop, this);

    // Spawn worker threads
    worker_threads_.clear();
    for (int i = 0; i < num_workers_; ++i) {
        worker_threads_.emplace_back(&ExecutionEngine::worker_loop, this, i);
    }

    // Join arrival coordinator
    if (arrival_coordinator_thread_.joinable()) {
        arrival_coordinator_thread_.join();
    }

    // Join workers
    for (auto& wt : worker_threads_) {
        if (wt.joinable()) {
            wt.join();
        }
    }

    auto exp_end_tp = std::chrono::high_resolution_clock::now();
    double total_duration = std::chrono::duration<double, std::milli>(exp_end_tp - experiment_start_tp_).count();
    current_experiment_time_ms_.store(total_duration);
    state_.store(EngineState::FINISHED);

    ExecutionStats stats;
    stats.algorithm_name = scheduler_ ? scheduler_->get_name() : "Unknown";
    stats.num_workers = num_workers_;
    stats.start_timestamp_ms = 0.0;
    stats.total_duration_ms = total_duration;
    stats.total_worker_busy_ms = total_worker_busy_ms_;
    stats.scheduling_overhead_us = static_cast<double>(scheduling_overhead_us_.load());
    stats.total_tasks = static_cast<int>(all_tasks_.size());
    stats.completed_tasks = static_cast<int>(completed_tasks_.size());
    stats.completed_task_objects = completed_tasks_;
    stats.gantt_records = gantt_records_;

    return stats;
}

void ExecutionEngine::pause() {
    pause_requested_.store(true);
    state_.store(EngineState::PAUSED);
}

void ExecutionEngine::resume() {
    pause_requested_.store(false);
    state_.store(EngineState::RUNNING);
    work_cv_.notify_all();
}

void ExecutionEngine::stop() {
    stop_requested_.store(true);
    pause_requested_.store(false);
    work_cv_.notify_all();
    if (arrival_coordinator_thread_.joinable()) {
        arrival_coordinator_thread_.join();
    }
    for (auto& wt : worker_threads_) {
        if (wt.joinable()) {
            wt.join();
        }
    }
    state_.store(EngineState::STOPPED);
}

nlohmann::json ExecutionEngine::get_live_status() {
    size_t total_tasks_count = 0;
    size_t completed_tasks_count = 0;
    size_t pending_tasks_count = 0;
    double total_busy = 0.0;
    std::vector<std::pair<std::string, std::string>> worker_info(num_workers_);

    {
        std::lock_guard<std::mutex> lock(data_mutex_);
        total_tasks_count = all_tasks_.size();
        completed_tasks_count = completed_tasks_.size();
        pending_tasks_count = pending_tasks_.size();
        total_busy = total_worker_busy_ms_;
        for (int i = 0; i < num_workers_; ++i) {
            worker_info[i] = {worker_status_[i], worker_current_task_[i]};
        }
    }

    size_t ready_count = scheduler_ ? scheduler_->ready_count() : 0;
    std::string last_expl = scheduler_ ? scheduler_->get_last_explanation() : "";
    std::string sched_name = scheduler_ ? scheduler_->get_name() : "";

    nlohmann::json j;
    j["state"] = state_.load() == EngineState::RUNNING ? "RUNNING" :
                 state_.load() == EngineState::PAUSED ? "PAUSED" :
                 state_.load() == EngineState::FINISHED ? "FINISHED" : "STOPPED";
    j["current_time_ms"] = current_experiment_time_ms_.load();
    j["algorithm"] = sched_name;
    j["total_tasks"] = total_tasks_count;
    j["completed_tasks"] = completed_tasks_count;
    j["ready_tasks"] = ready_count;
    j["pending_tasks"] = pending_tasks_count;
    j["total_worker_busy_ms"] = total_busy;
    j["scheduling_overhead_us"] = scheduling_overhead_us_.load();
    j["workers"] = nlohmann::json::array();
    for (int i = 0; i < num_workers_; ++i) {
        j["workers"].push_back({
            {"worker_id", i},
            {"status", worker_info[i].first},
            {"current_task", worker_info[i].second}
        });
    }
    j["last_explanation"] = last_expl;
    return j;
}

} // namespace aegis
