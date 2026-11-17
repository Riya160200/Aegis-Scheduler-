#pragma once

#include <memory>
#include <vector>
#include <string>
#include "Task.h"
#include "ReadyQueue.h"

namespace aegis {

class Scheduler {
public:
    virtual ~Scheduler() = default;

    virtual void add_task(std::shared_ptr<Task> task) = 0;
    virtual std::shared_ptr<Task> select_next_task(int worker_id, double current_time) = 0;
    virtual void on_chunk_finished(std::shared_ptr<Task> task, int worker_id, double current_time) = 0;
    
    virtual bool is_preemptive() const = 0;
    virtual int get_work_chunk_units(const std::shared_ptr<Task>& task) const = 0;
    virtual std::string get_name() const = 0;
    virtual std::string get_last_explanation() const = 0;
    virtual size_t ready_count() const = 0;
    virtual std::vector<std::shared_ptr<Task>> get_ready_tasks() const = 0;
    virtual void reset() = 0;
};

} // namespace aegis

