#pragma once

#include <vector>
#include <memory>
#include <thread>
#include <mutex>
#include <condition_variable>
#include <atomic>
#include <functional>
#include "Task.h"
#include "Scheduler.h"
#include "json.hpp"

namespace aegis {

struct GanttRecord {
    std::string task_id;
    std::string task_name;
    int worker_id;
    double start_time;
    double end_time;
    double duration;
    std::string status; // "RUNNING", "PAUSED", "COMPLETED", "IDLE"
    std::string decision_reason;

    nlohmann::json to_json() const {
        return nlohmann::json{
            {"task_id", task_id},
            {"task_name", task_name},
            {"worker_id", worker_id},
            {"start_time", start_time},
            {"end_time", end_time},
            {"duration", duration},
            {"status", status},
            {"decision_reason", decision_reason}
        };
    }
};

struct ExecutionStats {
    std::string algorithm_name;
    int num_workers;
    double start_timestamp_ms;
    double total_duration_ms;
    double total_worker_busy_ms;
    double scheduling_overhead_us;
    int total_tasks;
    int completed_tasks;
    std::vector<std::shared_ptr<Task>> completed_task_objects;
    std::vector<GanttRecord> gantt_records;

    nlohmann::json to_json() const;
};

enum class EngineState {
    STOPPED,
    RUNNING,
    PAUSED,
    FINISHED
};

class ExecutionEngine {
private:
    int num_workers_;
    std::shared_ptr<Scheduler> scheduler_;
    std::vector<std::shared_ptr<Task>> pending_tasks_; // Waiting to arrive
    std::vector<std::shared_ptr<Task>> all_tasks_;     // Cloned tasks for this run
    std::vector<std::shared_ptr<Task>> completed_tasks_;
    
    std::vector<GanttRecord> gantt_records_;
    mutable std::mutex data_mutex_;
    mutable std::mutex cv_mutex_;
    std::condition_variable work_cv_;

    std::atomic<EngineState> state_{EngineState::STOPPED};
    std::atomic<bool> stop_requested_{false};
    std::atomic<bool> pause_requested_{false};

    std::vector<std::thread> worker_threads_;
    std::thread arrival_coordinator_thread_;

    std::chrono::high_resolution_clock::time_point experiment_start_tp_;
    std::atomic<double> current_experiment_time_ms_{0.0};
    double total_worker_busy_ms_{0.0};
    std::atomic<uint64_t> scheduling_overhead_us_{0};

    std::vector<std::string> worker_current_task_;
    std::vector<std::string> worker_status_; // "IDLE", "WORKING", "PAUSED"

    // Optional progress callback for streaming updates
    std::function<void(const nlohmann::json&)> progress_callback_;

    void worker_loop(int worker_id);
    void arrival_coordinator_loop();

public:
    ExecutionEngine(int num_workers = 1);
    ~ExecutionEngine();

    void set_worker_count(int count);
    int get_worker_count() const { return num_workers_; }

    void set_progress_callback(std::function<void(const nlohmann::json&)> cb);

    // Initialize an execution run with a scheduler and task instances
    void prepare(std::shared_ptr<Scheduler> scheduler, const std::vector<std::shared_ptr<Task>>& tasks);

    // Run execution (synchronously blocks until all tasks complete or stopped)
    ExecutionStats run();

    // Asynchronous controls
    void pause();
    void resume();
    void stop();

    EngineState get_state() const { return state_.load(); }
    double get_current_time_ms() const { return current_experiment_time_ms_.load(); }
    
    // Live snapshot for UI WebSocket / polling
    nlohmann::json get_live_status();
};

} // namespace aegis
