#include "SJFScheduler.h"
#include <sstream>

namespace aegis {

SJFScheduler::SJFScheduler() : last_explanation_("SJF Initialized") {}

void SJFScheduler::add_task(std::shared_ptr<Task> task) {
    if (!task) return;
    std::lock_guard<std::mutex> lock(mutex_);
    ready_queue_.push(task);
    // Sort strictly by estimated burst time, then arrival time
    ready_queue_.sort([](const std::shared_ptr<Task>& a, const std::shared_ptr<Task>& b) {
        if (a->estimated_burst_time != b->estimated_burst_time) {
            return a->estimated_burst_time < b->estimated_burst_time;
        }
        if (a->arrival_time != b->arrival_time) {
            return a->arrival_time < b->arrival_time;
        }
        return a->id < b->id;
    });
}

std::shared_ptr<Task> SJFScheduler::select_next_task(int /*worker_id*/, double /*current_time*/) {
    std::lock_guard<std::mutex> lock(mutex_);
    if (ready_queue_.empty()) return nullptr;

    auto task = ready_queue_.pop();
    if (task) {
        std::ostringstream oss;
        oss << "SJF: Selected " << task->id << " (" << task->name << ") with shortest estimated burst time (" 
            << task->estimated_burst_time << "ms).";
        last_explanation_ = oss.str();
        task->last_decision_reason = last_explanation_;
    }
    return task;
}

void SJFScheduler::on_chunk_finished(std::shared_ptr<Task> task, int /*worker_id*/, double /*current_time*/) {
    // Non-preemptive: if unfinished, put it back at front
    if (!task || task->is_completed()) return;
    std::lock_guard<std::mutex> lock(mutex_);
    ready_queue_.push(task);
    ready_queue_.sort([](const std::shared_ptr<Task>& a, const std::shared_ptr<Task>& b) {
        if (a->estimated_burst_time != b->estimated_burst_time) {
            return a->estimated_burst_time < b->estimated_burst_time;
        }
        return a->arrival_time < b->arrival_time;
    });
}

int SJFScheduler::get_work_chunk_units(const std::shared_ptr<Task>& task) const {
    if (!task) return 50;
    return 50;
}

std::string SJFScheduler::get_last_explanation() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return last_explanation_;
}

void SJFScheduler::reset() {
    std::lock_guard<std::mutex> lock(mutex_);
    ready_queue_.clear();
    last_explanation_ = "SJF Reset";
}

} // namespace aegis

