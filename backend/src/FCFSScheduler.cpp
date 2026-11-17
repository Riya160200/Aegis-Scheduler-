#include "FCFSScheduler.h"
#include <sstream>

namespace aegis {

FCFSScheduler::FCFSScheduler() : last_explanation_("FCFS Initialized") {}

void FCFSScheduler::add_task(std::shared_ptr<Task> task) {
    if (!task) return;
    std::lock_guard<std::mutex> lock(mutex_);
    ready_queue_.push(task);
    // Sort strictly by arrival time
    ready_queue_.sort([](const std::shared_ptr<Task>& a, const std::shared_ptr<Task>& b) {
        if (a->arrival_time != b->arrival_time) {
            return a->arrival_time < b->arrival_time;
        }
        return a->id < b->id;
    });
}

std::shared_ptr<Task> FCFSScheduler::select_next_task(int /*worker_id*/, double current_time) {
    std::lock_guard<std::mutex> lock(mutex_);
    if (ready_queue_.empty()) return nullptr;

    auto task = ready_queue_.pop();
    if (task) {
        std::ostringstream oss;
        oss << "FCFS: Selected " << task->id << " (" << task->name << ") because it arrived earliest at T=" 
            << task->arrival_time << "ms.";
        last_explanation_ = oss.str();
        task->last_decision_reason = last_explanation_;
    }
    return task;
}

void FCFSScheduler::on_chunk_finished(std::shared_ptr<Task> task, int /*worker_id*/, double /*current_time*/) {
    // Non-preemptive: if unfinished, put it right back at the front to finish
    if (!task || task->is_completed()) return;
    std::lock_guard<std::mutex> lock(mutex_);
    ready_queue_.push(task);
    ready_queue_.sort([](const std::shared_ptr<Task>& a, const std::shared_ptr<Task>& b) {
        if (a->arrival_time != b->arrival_time) {
            return a->arrival_time < b->arrival_time;
        }
        return a->id < b->id;
    });
}

int FCFSScheduler::get_work_chunk_units(const std::shared_ptr<Task>& task) const {
    if (!task) return 50;
    // For non-preemptive FCFS, allow reasonable chunking for progress tracking (e.g. 50 units)
    // while keeping execution assigned to current worker until completion
    return 50;
}

std::string FCFSScheduler::get_last_explanation() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return last_explanation_;
}

void FCFSScheduler::reset() {
    std::lock_guard<std::mutex> lock(mutex_);
    ready_queue_.clear();
    last_explanation_ = "FCFS Reset";
}

} // namespace aegis

