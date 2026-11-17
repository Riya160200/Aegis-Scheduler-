#pragma once

#include "Scheduler.h"
#include <mutex>

namespace aegis {

struct AegisWeights {
    double w1 = 0.45; // Deadline urgency weight
    double w2 = 0.35; // Waiting time / aging weight
    double w3 = 0.20; // CPU penalty weight
};

class AegisScheduler : public Scheduler {
private:
    ReadyQueue ready_queue_;
    mutable std::mutex mutex_;
    AegisWeights weights_;
    double starvation_threshold_ms_ = 500.0;
    int chunk_units_ = 25;
    std::string last_explanation_;

    // Calculate dynamic priority for a task at the current time
    double calculate_priority(const std::shared_ptr<Task>& task, double current_time,
                              double& out_D, double& out_W, double& out_C) const;

public:
    explicit AegisScheduler(AegisWeights weights = AegisWeights(), 
                            double starvation_threshold_ms = 500.0,
                            int chunk_units = 25);

    void set_weights(double w1, double w2, double w3);
    AegisWeights get_weights() const { return weights_; }
    void set_starvation_threshold(double ms) { starvation_threshold_ms_ = ms; }

    void add_task(std::shared_ptr<Task> task) override;
    std::shared_ptr<Task> select_next_task(int worker_id, double current_time) override;
    void on_chunk_finished(std::shared_ptr<Task> task, int worker_id, double current_time) override;
    
    // Periodically update priorities for all waiting tasks
    void update_priorities(double current_time);

    bool is_preemptive() const override { return true; }
    int get_work_chunk_units(const std::shared_ptr<Task>& task) const override;
    std::string get_name() const override { return "Aegis Adaptive"; }
    std::string get_last_explanation() const override;
    size_t ready_count() const override { return ready_queue_.size(); }
    std::vector<std::shared_ptr<Task>> get_ready_tasks() const override { return ready_queue_.get_tasks_snapshot(); }
    void reset() override;
};

} // namespace aegis

