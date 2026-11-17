#include "ReadyQueue.h"
#include <algorithm>

namespace aegis {

void ReadyQueue::push(std::shared_ptr<Task> task) {
    if (!task) return;
    std::lock_guard<std::mutex> lock(mutex_);
    task->status = TaskStatus::READY;
    queue_.push_back(task);
}

std::shared_ptr<Task> ReadyQueue::pop() {
    std::lock_guard<std::mutex> lock(mutex_);
    if (queue_.empty()) return nullptr;
    auto task = queue_.front();
    queue_.erase(queue_.begin());
    return task;
}

std::shared_ptr<Task> ReadyQueue::peek() const {
    std::lock_guard<std::mutex> lock(mutex_);
    if (queue_.empty()) return nullptr;
    return queue_.front();
}

bool ReadyQueue::remove(const std::string& task_id) {
    std::lock_guard<std::mutex> lock(mutex_);
    auto it = std::find_if(queue_.begin(), queue_.end(), [&](const std::shared_ptr<Task>& t) {
        return t && t->id == task_id;
    });
    if (it != queue_.end()) {
        queue_.erase(it);
        return true;
    }
    return false;
}

size_t ReadyQueue::size() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return queue_.size();
}

bool ReadyQueue::empty() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return queue_.empty();
}

void ReadyQueue::clear() {
    std::lock_guard<std::mutex> lock(mutex_);
    queue_.clear();
}

void ReadyQueue::sort(std::function<bool(const std::shared_ptr<Task>&, const std::shared_ptr<Task>&)> comp) {
    std::lock_guard<std::mutex> lock(mutex_);
    std::stable_sort(queue_.begin(), queue_.end(), comp);
}

std::vector<std::shared_ptr<Task>> ReadyQueue::get_tasks_snapshot() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return queue_;
}

bool ReadyQueue::contains(const std::string& task_id) const {
    std::lock_guard<std::mutex> lock(mutex_);
    return std::any_of(queue_.begin(), queue_.end(), [&](const std::shared_ptr<Task>& t) {
        return t && t->id == task_id;
    });
}

} // namespace aegis

