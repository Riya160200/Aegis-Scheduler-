#pragma once

#include "Scheduler.h"
#include <mutex>

namespace aegis {

class RoundRobinScheduler : public Scheduler {
private:
    ReadyQueue ready_queue_;
    mutable std::mutex mutex_;
    int quantum_units_;
    double time_quantum_ms_;
    std::string last_explanation_;

public:
    explicit RoundRobinScheduler(int quantum_units = 30, double time_quantum_ms = 45.0);

    void set_quantum(int quantum_units, double time_quantum_ms);
    int get_quantum_units() const { return quantum_units_; }
    double get_quantum_ms() const { return time_quantum_ms_; }

    void add_task(std::shared_ptr<Task> task) override;
    std::shared_ptr<Task> select_next_task(int worker_id, double current_time) override;
    void on_chunk_finished(std::shared_ptr<Task> task, int worker_id, double current_time) override;
    
    bool is_preemptive() const override { return true; }
    int get_work_chunk_units(const std::shared_ptr<Task>& task) const override;
    std::string get_name() const override { return "Round Robin"; }
    std::string get_last_explanation() const override;
    size_t ready_count() const override { return ready_queue_.size(); }
    std::vector<std::shared_ptr<Task>> get_ready_tasks() const override { return ready_queue_.get_tasks_snapshot(); }
    void reset() override;
};

} // namespace aegis

