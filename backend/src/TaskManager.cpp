#include "TaskManager.h"
#include <sstream>
#include <iomanip>
#include <random>
#include <algorithm>

namespace aegis {

TaskManager::TaskManager() : next_pid_counter_(1) {}

std::string TaskManager::generate_next_pid() {
    std::ostringstream oss;
    oss << "P" << std::setw(2) << std::setfill('0') << next_pid_counter_++;
    return oss.str();
}

Task TaskManager::add_task(Task task) {
    std::lock_guard<std::mutex> lock(mutex_);
    if (task.id.empty() || task.id == "auto" || task.id == "P00") {
        task.id = generate_next_pid();
    } else {
        // Parse number from PID if possible to keep counter ahead
        if (task.id.size() >= 2 && task.id[0] == 'P') {
            try {
                int num = std::stoi(task.id.substr(1));
                if (num >= next_pid_counter_) {
                    next_pid_counter_ = num + 1;
                }
            } catch (...) {}
        }
    }
    task.remaining_work = task.workload_size;
    task.total_work = task.workload_size;
    task.status = TaskStatus::READY;
    tasks_.push_back(task);
    return task;
}

bool TaskManager::get_task(const std::string& id, Task& out_task) const {
    std::lock_guard<std::mutex> lock(mutex_);
    for (const auto& t : tasks_) {
        if (t.id == id) {
            out_task = t;
            return true;
        }
    }
    return false;
}

std::vector<Task> TaskManager::get_all_tasks() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return tasks_;
}

bool TaskManager::update_task(const std::string& id, const Task& updated_task) {
    std::lock_guard<std::mutex> lock(mutex_);
    for (auto& t : tasks_) {
        if (t.id == id) {
            t.name = updated_task.name;
            t.workload_type = updated_task.workload_type;
            t.workload_size = updated_task.workload_size;
            t.remaining_work = updated_task.workload_size;
            t.total_work = updated_task.workload_size;
            t.arrival_time = updated_task.arrival_time;
            t.estimated_burst_time = updated_task.estimated_burst_time;
            t.deadline = updated_task.deadline;
            t.base_priority = updated_task.base_priority;
            t.priority = updated_task.base_priority;
            return true;
        }
    }
    return false;
}

bool TaskManager::delete_task(const std::string& id) {
    std::lock_guard<std::mutex> lock(mutex_);
    auto it = std::remove_if(tasks_.begin(), tasks_.end(), [&](const Task& t) {
        return t.id == id;
    });
    if (it != tasks_.end()) {
        tasks_.erase(it, tasks_.end());
        return true;
    }
    return false;
}

void TaskManager::clear_tasks() {
    std::lock_guard<std::mutex> lock(mutex_);
    tasks_.clear();
    next_pid_counter_ = 1;
}

std::vector<Task> TaskManager::generate_tasks(int count, const std::string& mode,
                                             int min_size, int max_size,
                                             unsigned int seed) {
    std::lock_guard<std::mutex> lock(mutex_);
    tasks_.clear();
    next_pid_counter_ = 1;

    std::mt19937 rng(seed == 0 ? 42 : seed);
    std::uniform_int_distribution<int> type_dist(0, 4);
    std::uniform_real_distribution<double> arrival_dist(0.0, 300.0);
    std::uniform_real_distribution<double> prio_dist(1.0, 10.0);

    const std::vector<WorkloadType> types = {
        WorkloadType::PRIME_CALC,
        WorkloadType::MATRIX_MULT,
        WorkloadType::SORTING,
        WorkloadType::DATA_PROCESSING,
        WorkloadType::MATH_COMPUTATION
    };

    const std::vector<std::string> prefixes = {
        "PrimeCalc", "MatrixWorker", "QuickSort", "DataHasher", "TaylorMath"
    };

    for (int i = 0; i < count; ++i) {
        std::string pid = generate_next_pid();
        int type_idx = type_dist(rng);
        WorkloadType type = types[type_idx];
        std::string name = prefixes[type_idx] + "_" + std::to_string(i + 1);

        int work_size = 100;
        double arrival = 0.0;
        double est_burst = 100.0;
        double deadline = 1000.0;
        double prio = std::round(prio_dist(rng));

        if (mode == "mixed") {
            // 40% short, 40% medium, 20% long
            double r = std::uniform_real_distribution<double>(0.0, 1.0)(rng);
            if (r < 0.40) {
                work_size = min_size + (rng() % std::max(1, (max_size - min_size) / 4));
            } else if (r < 0.80) {
                work_size = min_size + (max_size - min_size) / 4 + (rng() % std::max(1, (max_size - min_size) / 2));
            } else {
                work_size = min_size + 3 * (max_size - min_size) / 4 + (rng() % std::max(1, (max_size - min_size) / 4));
            }
            arrival = (i % 3 == 0) ? 0.0 : std::round(arrival_dist(rng) / 10.0) * 10.0;
            est_burst = static_cast<double>(work_size) * 1.5;
            deadline = arrival + est_burst * std::uniform_real_distribution<double>(1.5, 3.5)(rng);
        } else if (mode == "deadline_sensitive") {
            work_size = min_size + (rng() % (max_size - min_size + 1));
            arrival = (i * 25.0);
            est_burst = static_cast<double>(work_size) * 1.5;
            // Tight deadline: only 1.2 to 2.0x of burst
            deadline = arrival + est_burst * std::uniform_real_distribution<double>(1.2, 2.0)(rng);
        } else if (mode == "cpu_intensive") {
            // Heavier workloads, focus on matrix/sorting
            type = (rng() % 2 == 0) ? WorkloadType::MATRIX_MULT : WorkloadType::SORTING;
            work_size = std::max(max_size * 2 / 3, min_size) + (rng() % std::max(1, max_size / 3));
            arrival = (i % 2 == 0) ? 0.0 : (rng() % 100);
            est_burst = static_cast<double>(work_size) * 2.0;
            deadline = arrival + est_burst * 2.5;
        } else {
            // Standard random
            work_size = min_size + (rng() % (max_size - min_size + 1));
            arrival = (i % 4 == 0) ? 0.0 : std::round(arrival_dist(rng) / 10.0) * 10.0;
            est_burst = static_cast<double>(work_size) * 1.5;
            deadline = arrival + est_burst * std::uniform_real_distribution<double>(1.5, 4.0)(rng);
        }

        deadline = std::round(deadline);
        est_burst = std::round(est_burst);

        Task t(pid, name, type, work_size, arrival, est_burst, deadline, prio);
        t.status = TaskStatus::READY;
        tasks_.push_back(t);
    }

    return tasks_;
}

std::vector<std::shared_ptr<Task>> TaskManager::get_cloned_tasks() const {
    std::lock_guard<std::mutex> lock(mutex_);
    std::vector<std::shared_ptr<Task>> clones;
    clones.reserve(tasks_.size());
    for (const auto& t : tasks_) {
        clones.push_back(t.clone());
    }
    return clones;
}

size_t TaskManager::count() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return tasks_.size();
}

} // namespace aegis

