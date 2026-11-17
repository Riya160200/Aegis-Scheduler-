#pragma once

#include <vector>
#include <memory>
#include <mutex>
#include <functional>
#include "Task.h"

namespace aegis {

class ReadyQueue {
private:
    mutable std::mutex mutex_;
    std::vector<std::shared_ptr<Task>> queue_;

public:
    ReadyQueue() = default;

    void push(std::shared_ptr<Task> task);
    
    std::shared_ptr<Task> pop();
    
    std::shared_ptr<Task> peek() const;
    
    bool remove(const std::string& task_id);
    
    size_t size() const;
    
    bool empty() const;
    
    void clear();
    
    // Sort queue with custom comparator
    void sort(std::function<bool(const std::shared_ptr<Task>&, const std::shared_ptr<Task>&)> comp);
    
    // Snapshot of current tasks in queue
    std::vector<std::shared_ptr<Task>> get_tasks_snapshot() const;
    
    // Check if task exists in queue
    bool contains(const std::string& task_id) const;
};

} // namespace aegis

