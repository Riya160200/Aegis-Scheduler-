#include "AegisScheduler.h"
#include <sstream>
#include <iomanip>
#include <cmath>
#include <algorithm>

namespace aegis {

AegisScheduler::AegisScheduler(AegisWeights weights, double starvation_threshold_ms, int chunk_units)
    : weights_(weights), starvation_threshold_ms_(starvation_threshold_ms),
      chunk_units_(chunk_units), last_explanation_("Aegis Adaptive Initialized") {}

void AegisScheduler::set_weights(double w1, double w2, double w3) {
    std::lock_guard<std::mutex> lock(mutex_);
    weights_.w1 = w1;
    weights_.w2 = w2;
    weights_.w3 = w3;
}

double AegisScheduler::calculate_priority(const std::shared_ptr<Task>& task, double current_time,
                                         double& out_D, double& out_W, double& out_C) const {
    if (!task) return 0.0;

    // 1. Deadline urgency (D)
    double slack = task->deadline - current_time;
    double burst_denom = std::max(50.0, task->estimated_burst_time * 2.0);
    if (slack <= 0.0) {
        // Approaching or past deadline -> maximum urgency
        out_D = 1.0 + std::min(1.0, (-slack) / burst_denom);
    } else {
        out_D = std::max(0.0, 1.0 - (slack / burst_denom));
    }
    out_D = std::min(2.0, std::max(0.0, out_D));

    // 2. Waiting time score / Aging (W)
    double current_wait = task->waiting_time;
    if (task->status == TaskStatus::READY && task->last_ready_time > 0.0) {
        current_wait += std::max(0.0, current_time - task->last_ready_time);
    }
    out_W = std::min(1.0, current_wait / std::max(10.0, starvation_threshold_ms_));

    // 3. CPU consumption penalty (C)
    double burst_est = std::max(20.0, task->estimated_burst_time);
    out_C = std::min(1.0, task->cpu_time_consumed / burst_est);

    // Dynamic formula: P = w1 * D + w2 * W - w3 * C
    double base_bonus = (task->base_priority - 5.0) * 0.02; // Minor user priority bias
    double P = (weights_.w1 * out_D) + (weights_.w2 * out_W) - (weights_.w3 * out_C) + base_bonus;
    
    return P;
}

void AegisScheduler::update_priorities(double current_time) {
    auto snapshot = ready_queue_.get_tasks_snapshot();
    for (auto& task : snapshot) {
        if (!task) continue;
        double D = 0, W = 0, C = 0;
        task->priority = calculate_priority(task, current_time, D, W, C);
    }
    // Re-sort ready queue by priority descending, tie-break by arrival time
    ready_queue_.sort([](const std::shared_ptr<Task>& a, const std::shared_ptr<Task>& b) {
        if (std::abs(a->priority - b->priority) > 0.001) {
            return a->priority > b->priority; // Higher priority first
        }
        if (a->arrival_time != b->arrival_time) {
            return a->arrival_time < b->arrival_time;
        }
        return a->id < b->id;
    });
}

void AegisScheduler::add_task(std::shared_ptr<Task> task) {
    if (!task) return;
    std::lock_guard<std::mutex> lock(mutex_);
    ready_queue_.push(task);
}

std::shared_ptr<Task> AegisScheduler::select_next_task(int /*worker_id*/, double current_time) {
    std::lock_guard<std::mutex> lock(mutex_);
    if (ready_queue_.empty()) return nullptr;

    // Recalculate priority of all ready candidates dynamically
    auto snapshot = ready_queue_.get_tasks_snapshot();
    for (auto& t : snapshot) {
        if (!t) continue;
        double D = 0, W = 0, C = 0;
        t->priority = calculate_priority(t, current_time, D, W, C);
    }

    ready_queue_.sort([](const std::shared_ptr<Task>& a, const std::shared_ptr<Task>& b) {
        if (std::abs(a->priority - b->priority) > 0.001) {
            return a->priority > b->priority;
        }
        if (a->arrival_time != b->arrival_time) {
            return a->arrival_time < b->arrival_time;
        }
        return a->id < b->id;
    });

    auto task = ready_queue_.pop();
    if (task) {
        double D = 0, W = 0, C = 0;
        double P = calculate_priority(task, current_time, D, W, C);
        task->priority = P;

        std::ostringstream oss;
        oss << std::fixed << std::setprecision(2);
        oss << "Aegis: Selected " << task->id << " (P=" << P << "): ";
        if (D > 0.70) {
            oss << "deadline is approaching (D=" << D << ") ";
        }
        if (W > 0.50) {
            oss << (D > 0.70 ? "and " : "") << "aging prevented starvation (W=" << W << ") ";
        }
        if (C < 0.30) {
            oss << "with low CPU footprint (C=" << C << ").";
        } else {
            oss << "balanced across metrics (C=" << C << ").";
        }
        last_explanation_ = oss.str();
        task->last_decision_reason = last_explanation_;
    }
    return task;
}

void AegisScheduler::on_chunk_finished(std::shared_ptr<Task> task, int /*worker_id*/, double current_time) {
    if (!task || task->is_completed()) return;
    std::lock_guard<std::mutex> lock(mutex_);
    task->status = TaskStatus::PAUSED;
    ready_queue_.push(task);
    
    // Update priorities and re-order
    auto snapshot = ready_queue_.get_tasks_snapshot();
    for (auto& t : snapshot) {
        if (!t) continue;
        double D = 0, W = 0, C = 0;
        t->priority = calculate_priority(t, current_time, D, W, C);
    }
    ready_queue_.sort([](const std::shared_ptr<Task>& a, const std::shared_ptr<Task>& b) {
        if (std::abs(a->priority - b->priority) > 0.001) {
            return a->priority > b->priority;
        }
        return a->arrival_time < b->arrival_time;
    });
}

int AegisScheduler::get_work_chunk_units(const std::shared_ptr<Task>& /*task*/) const {
    return chunk_units_;
}

std::string AegisScheduler::get_last_explanation() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return last_explanation_;
}

void AegisScheduler::reset() {
    std::lock_guard<std::mutex> lock(mutex_);
    ready_queue_.clear();
    last_explanation_ = "Aegis Adaptive Reset";
}

} // namespace aegis

