#pragma once

#include "Scheduler.h"
#include <mutex>

namespace aegis {

class FCFSScheduler : public Scheduler {
private:
    ReadyQueue ready_queue_;
    mutable std::mutex mutex_;
    std::string last_explanation_;

public:
    FCFSScheduler();

    void add_task(std::shared_ptr<Task> task) override;
    std::shared_ptr<Task> select_next_task(int worker_id, double current_time) override;
    void on_chunk_finished(std::shared_ptr<Task> task, int worker_id, double current_time) override;
    
    bool is_preemptive() const override { return false; }
    int get_work_chunk_units(const std::shared_ptr<Task>& task) const override;
    std::string get_name() const override { return "FCFS"; }
    std::string get_last_explanation() const override;
    size_t ready_count() const override { return ready_queue_.size(); }
    std::vector<std::shared_ptr<Task>> get_ready_tasks() const override { return ready_queue_.get_tasks_snapshot(); }
    void reset() override;
};

} // namespace aegis

