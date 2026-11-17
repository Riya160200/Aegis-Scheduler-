#pragma once

#include <vector>
#include <memory>
#include <mutex>
#include <string>
#include "Task.h"

namespace aegis {

class TaskManager {
private:
    mutable std::mutex mutex_;
    std::vector<Task> tasks_;
    int next_pid_counter_ = 1;

    std::string generate_next_pid();

public:
    TaskManager();

    // Add manual task
    Task add_task(Task task);

    // Get task by ID
    bool get_task(const std::string& id, Task& out_task) const;

    // Get all tasks
    std::vector<Task> get_all_tasks() const;

    // Update task
    bool update_task(const std::string& id, const Task& updated_task);

    // Delete task
    bool delete_task(const std::string& id);

    // Clear all tasks
    void clear_tasks();

    // Generate tasks automatically
    std::vector<Task> generate_tasks(int count, const std::string& mode,
                                     int min_size, int max_size,
                                     unsigned int seed);

    // Clone tasks for fair algorithm comparisons
    std::vector<std::shared_ptr<Task>> get_cloned_tasks() const;
    
    // Count
    size_t count() const;
};

} // namespace aegis

