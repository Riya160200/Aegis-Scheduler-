#include "RoundRobinScheduler.h"
#include <sstream>

namespace aegis {

RoundRobinScheduler::RoundRobinScheduler(int quantum_units, double time_quantum_ms)
    : quantum_units_(quantum_units), time_quantum_ms_(time_quantum_ms),
      last_explanation_("Round Robin Initialized") {}

void RoundRobinScheduler::set_quantum(int quantum_units, double time_quantum_ms) {
    std::lock_guard<std::mutex> lock(mutex_);
    quantum_units_ = quantum_units;
    time_quantum_ms_ = time_quantum_ms;
}

void RoundRobinScheduler::add_task(std::shared_ptr<Task> task) {
    if (!task) return;
    std::lock_guard<std::mutex> lock(mutex_);
    ready_queue_.push(task); // Append to FIFO tail
}

std::shared_ptr<Task> RoundRobinScheduler::select_next_task(int /*worker_id*/, double /*current_time*/) {
    std::lock_guard<std::mutex> lock(mutex_);
    if (ready_queue_.empty()) return nullptr;

    auto task = ready_queue_.pop();
    if (task) {
        std::ostringstream oss;
        oss << "Round Robin: Dispatched " << task->id << " (" << task->name 
            << ") for quantum budget (" << quantum_units_ << " units / ~" << time_quantum_ms_ << "ms).";
        last_explanation_ = oss.str();
        task->last_decision_reason = last_explanation_;
    }
    return task;
}

void RoundRobinScheduler::on_chunk_finished(std::shared_ptr<Task> task, int /*worker_id*/, double /*current_time*/) {
    if (!task || task->is_completed()) return;
    std::lock_guard<std::mutex> lock(mutex_);
    // Preemption: task consumed its quantum chunk, so it yields to the tail of ready queue
    task->status = TaskStatus::PAUSED;
    ready_queue_.push(task);
}

int RoundRobinScheduler::get_work_chunk_units(const std::shared_ptr<Task>& /*task*/) const {
    return quantum_units_;
}

std::string RoundRobinScheduler::get_last_explanation() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return last_explanation_;
}

void RoundRobinScheduler::reset() {
    std::lock_guard<std::mutex> lock(mutex_);
    ready_queue_.clear();
    last_explanation_ = "Round Robin Reset";
}

} // namespace aegis

