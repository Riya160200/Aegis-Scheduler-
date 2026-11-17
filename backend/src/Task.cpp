#include "Task.h"
#include <cmath>
#include <algorithm>
#include <random>

namespace aegis {

std::string statusToString(TaskStatus status) {
    switch (status) {
        case TaskStatus::NEW: return "NEW";
        case TaskStatus::READY: return "READY";
        case TaskStatus::RUNNING: return "RUNNING";
        case TaskStatus::PAUSED: return "PAUSED";
        case TaskStatus::COMPLETED: return "COMPLETED";
        case TaskStatus::CANCELLED: return "CANCELLED";
    }
    return "UNKNOWN";
}

TaskStatus stringToStatus(const std::string& str) {
    if (str == "READY") return TaskStatus::READY;
    if (str == "RUNNING") return TaskStatus::RUNNING;
    if (str == "PAUSED") return TaskStatus::PAUSED;
    if (str == "COMPLETED") return TaskStatus::COMPLETED;
    if (str == "CANCELLED") return TaskStatus::CANCELLED;
    return TaskStatus::NEW;
}

std::string workloadTypeToString(WorkloadType type) {
    switch (type) {
        case WorkloadType::PRIME_CALC: return "Prime Number Calculation";
        case WorkloadType::MATRIX_MULT: return "Matrix Multiplication";
        case WorkloadType::SORTING: return "Sorting";
        case WorkloadType::DATA_PROCESSING: return "Data Processing";
        case WorkloadType::MATH_COMPUTATION: return "Mathematical Computation";
    }
    return "Unknown";
}

WorkloadType stringToWorkloadType(const std::string& str) {
    if (str == "Prime Number Calculation" || str == "PRIME_CALC") return WorkloadType::PRIME_CALC;
    if (str == "Matrix Multiplication" || str == "MATRIX_MULT") return WorkloadType::MATRIX_MULT;
    if (str == "Sorting" || str == "SORTING") return WorkloadType::SORTING;
    if (str == "Data Processing" || str == "DATA_PROCESSING") return WorkloadType::DATA_PROCESSING;
    if (str == "Mathematical Computation" || str == "MATH_COMPUTATION") return WorkloadType::MATH_COMPUTATION;
    return WorkloadType::PRIME_CALC;
}

Task::Task() 
    : id("P00"), name("Default"), workload_type(WorkloadType::PRIME_CALC),
      workload_size(100), arrival_time(0.0), estimated_burst_time(100.0),
      actual_burst_time(0.0), remaining_work(100.0), total_work(100),
      deadline(500.0), priority(5.0), base_priority(5.0),
      waiting_time(0.0), cpu_time_consumed(0.0),
      first_execution_time(-1.0), completion_time(-1.0),
      status(TaskStatus::NEW), last_ready_time(0.0), last_run_start_time(0.0),
      assigned_worker_id(-1), last_decision_reason("") {}

Task::Task(std::string id, std::string name, WorkloadType type, int work_size,
           double arrival, double estimated_burst, double deadline, double base_prio)
    : id(id), name(name), workload_type(type), workload_size(work_size),
      arrival_time(arrival), estimated_burst_time(estimated_burst),
      actual_burst_time(0.0), remaining_work(static_cast<double>(work_size)),
      total_work(work_size), deadline(deadline), priority(base_prio), base_priority(base_prio),
      waiting_time(0.0), cpu_time_consumed(0.0),
      first_execution_time(-1.0), completion_time(-1.0),
      status(TaskStatus::NEW), last_ready_time(arrival), last_run_start_time(0.0),
      assigned_worker_id(-1), last_decision_reason("") {
    
    // Initialize workload specific state
    if (type == WorkloadType::SORTING) {
        state.sort_data.resize(work_size * 20);
        std::mt19937 rng(1337 + work_size);
        for (auto& v : state.sort_data) {
            v = static_cast<int>(rng() % 100000);
        }
    }
}

std::shared_ptr<Task> Task::clone() const {
    auto copy = std::make_shared<Task>(id, name, workload_type, workload_size,
                                       arrival_time, estimated_burst_time, deadline, base_priority);
    copy->actual_burst_time = 0.0;
    copy->remaining_work = static_cast<double>(workload_size);
    copy->total_work = workload_size;
    copy->priority = base_priority;
    copy->waiting_time = 0.0;
    copy->cpu_time_consumed = 0.0;
    copy->first_execution_time = -1.0;
    copy->completion_time = -1.0;
    copy->status = TaskStatus::NEW;
    copy->last_ready_time = arrival_time;
    copy->last_run_start_time = 0.0;
    copy->assigned_worker_id = -1;
    copy->last_decision_reason = "";
    
    // Fresh workload state
    copy->state = WorkloadState();
    if (workload_type == WorkloadType::SORTING) {
        copy->state.sort_data = state.sort_data; // identical initial data
    }
    return copy;
}

double Task::execute_chunk(int chunk_units) {
    if (remaining_work <= 0.0) return 0.0;
    
    int units_to_do = std::min(chunk_units, static_cast<int>(remaining_work));
    if (units_to_do <= 0) return 0.0;

    auto start_time = std::chrono::high_resolution_clock::now();

    // Perform actual CPU bound computations
    switch (workload_type) {
        case WorkloadType::PRIME_CALC: {
            // Find next primes
            int units_done = 0;
            while (units_done < units_to_do) {
                // Each unit checks a small range
                for (int step = 0; step < 250; ++step) {
                    uint64_t cand = state.prime_candidate;
                    bool is_prime = true;
                    uint64_t limit = static_cast<uint64_t>(std::sqrt(cand));
                    for (uint64_t d = 3; d <= limit; d += 2) {
                        if (cand % d == 0) {
                            is_prime = false;
                            break;
                        }
                    }
                    if (is_prime) {
                        state.primes_found++;
                    }
                    state.prime_candidate += 2;
                }
                units_done++;
            }
            break;
        }
        case WorkloadType::MATRIX_MULT: {
            // Block matrix multiplication operations
            int units_done = 0;
            const int DIM = 32;
            while (units_done < units_to_do) {
                double sum = 0.0;
                for (int i = 0; i < DIM; ++i) {
                    for (int j = 0; j < DIM; ++j) {
                        sum += std::sin(static_cast<double>(i + state.matrix_row)) * 
                               std::cos(static_cast<double>(j + state.matrix_col));
                    }
                }
                state.matrix_col = (state.matrix_col + 1) % DIM;
                if (state.matrix_col == 0) {
                    state.matrix_row = (state.matrix_row + 1) % DIM;
                }
                state.math_result += sum * 0.00001;
                units_done++;
            }
            break;
        }
        case WorkloadType::SORTING: {
            // Incremental sort passes
            int n = static_cast<int>(state.sort_data.size());
            int units_done = 0;
            while (units_done < units_to_do && n > 1) {
                // Insertion step or bubble window
                int start = (state.sort_index * 32) % (n - 32 > 0 ? n - 32 : 1);
                int end = std::min(n, start + 32);
                for (int i = start + 1; i < end; ++i) {
                    int key = state.sort_data[i];
                    int j = i - 1;
                    while (j >= start && state.sort_data[j] > key) {
                        state.sort_data[j + 1] = state.sort_data[j];
                        j--;
                    }
                    state.sort_data[j + 1] = key;
                }
                state.sort_index++;
                units_done++;
            }
            break;
        }
        case WorkloadType::DATA_PROCESSING: {
            // FNV-1a cryptographic hashing rounds
            int units_done = 0;
            const uint64_t FNV_PRIME = 0x100000001b3ULL;
            while (units_done < units_to_do) {
                for (int i = 0; i < 400; ++i) {
                    uint64_t byte_val = (state.data_chunk_index + i) & 0xFF;
                    state.hash_accumulator ^= byte_val;
                    state.hash_accumulator *= FNV_PRIME;
                }
                state.data_chunk_index++;
                units_done++;
            }
            break;
        }
        case WorkloadType::MATH_COMPUTATION: {
            // Nilakantha series for pi + Taylor expansions
            int units_done = 0;
            while (units_done < units_to_do) {
                for (int i = 0; i < 300; ++i) {
                    double k = static_cast<double>(state.math_iterations * 2 + 2);
                    double term = 4.0 / (k * (k + 1.0) * (k + 2.0));
                    if (state.math_iterations % 2 == 0) {
                        state.math_result += term;
                    } else {
                        state.math_result -= term;
                    }
                    state.math_iterations++;
                }
                units_done++;
            }
            break;
        }
    }

    auto end_time = std::chrono::high_resolution_clock::now();
    double elapsed_ms = std::chrono::duration<double, std::milli>(end_time - start_time).count();

    // Ensure non-zero execution time measurement
    if (elapsed_ms < 0.01) {
        elapsed_ms = 0.05 * units_to_do;
    }

    remaining_work -= units_to_do;
    if (remaining_work <= 0.0) {
        remaining_work = 0.0;
        status = TaskStatus::COMPLETED;
    }
    
    cpu_time_consumed += elapsed_ms;
    actual_burst_time += elapsed_ms;

    return elapsed_ms;
}

nlohmann::json Task::to_json() const {
    return nlohmann::json{
        {"id", id},
        {"name", name},
        {"workload_type", workloadTypeToString(workload_type)},
        {"workload_size", workload_size},
        {"arrival_time", arrival_time},
        {"estimated_burst_time", estimated_burst_time},
        {"actual_burst_time", actual_burst_time},
        {"remaining_work", remaining_work},
        {"total_work", total_work},
        {"deadline", deadline},
        {"priority", priority},
        {"base_priority", base_priority},
        {"waiting_time", waiting_time},
        {"cpu_time_consumed", cpu_time_consumed},
        {"first_execution_time", first_execution_time},
        {"completion_time", completion_time},
        {"status", statusToString(status)},
        {"assigned_worker_id", assigned_worker_id},
        {"last_decision_reason", last_decision_reason}
    };
}

Task Task::from_json(const nlohmann::json& j) {
    std::string id = j.value("id", "P01");
    std::string name = j.value("name", "Task");
    WorkloadType type = stringToWorkloadType(j.value("workload_type", "Prime Number Calculation"));
    int size = j.value("workload_size", 100);
    double arrival = j.value("arrival_time", 0.0);
    double burst = j.value("estimated_burst_time", 100.0);
    double deadline = j.value("deadline", 500.0);
    double prio = j.value("priority", 5.0);

    Task t(id, name, type, size, arrival, burst, deadline, prio);
    if (j.contains("status")) {
        t.status = stringToStatus(j["status"].get<std::string>());
    }
    return t;
}

} // namespace aegis

