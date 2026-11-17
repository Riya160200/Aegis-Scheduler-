#pragma once

#include <string>
#include <vector>
#include <memory>
#include <chrono>
#include "json.hpp"   // nlohmann/json – lives in include/

namespace aegis {

// ─────────────────────────────────────────────
//  Enumerations
// ─────────────────────────────────────────────

enum class WorkloadType {
    PRIME_CALC,
    MATRIX_MULT,
    SORTING,
    DATA_PROCESSING,
    MATH_COMPUTATION
};

enum class TaskStatus {
    NEW,
    READY,
    RUNNING,
    PAUSED,
    COMPLETED,
    CANCELLED
};

// ─────────────────────────────────────────────
//  Per-workload incremental execution state
// ─────────────────────────────────────────────

struct WorkloadState {
    // Prime calculation
    uint64_t prime_candidate = 3;
    uint64_t primes_found    = 0;

    // Matrix multiplication
    int    matrix_row  = 0;
    int    matrix_col  = 0;
    double math_result = 0.0;

    // Math computation (Nilakantha series)
    int math_iterations = 0;

    // Sorting
    std::vector<int> sort_data;
    int sort_index = 0;

    // Data processing (FNV hash)
    uint64_t hash_accumulator  = 14695981039346656037ULL;  // FNV offset basis
    int      data_chunk_index  = 0;
};

// ─────────────────────────────────────────────
//  Task struct (matches all .cpp field names)
// ─────────────────────────────────────────────

struct Task {
    // Identity
    std::string id;
    std::string name;
    WorkloadType workload_type;
    int workload_size;

    // Timing (all in milliseconds as double)
    double arrival_time;
    double estimated_burst_time;
    double actual_burst_time;
    double remaining_work;
    int    total_work;
    double deadline;
    double priority;        // dynamic priority (updated by scheduler)
    double base_priority;   // user-assigned base priority (1-10)

    // Tracking
    double waiting_time;
    double cpu_time_consumed;
    double first_execution_time;   // -1 until first run
    double completion_time;        // -1 until done

    // State
    TaskStatus  status;
    double      last_ready_time;    // when the task last entered READY state
    double      last_run_start_time;
    int         assigned_worker_id;
    std::string last_decision_reason;

    // Execution state (CPU-bound workload progress)
    WorkloadState state;

    // ─── Constructors ─────────────────────────
    Task();   // default (P00, Prime, 100 units)
    Task(std::string id, std::string name, WorkloadType type, int work_size,
         double arrival, double estimated_burst, double deadline, double base_prio);

    // ─── Core methods ─────────────────────────

    // Execute a chunk of CPU-bound work. Returns actual elapsed milliseconds.
    double execute_chunk(int chunk_units);

    // Deep copy for running the same workload under different algorithms
    std::shared_ptr<Task> clone() const;

    bool is_completed() const { return remaining_work <= 0.0 || status == TaskStatus::COMPLETED; }
    bool is_cancelled() const { return status == TaskStatus::CANCELLED; }

    // ─── JSON serialization ───────────────────
    nlohmann::json to_json() const;
    static Task from_json(const nlohmann::json& j);
};

// Free-function aliases used by some .cpp files
std::string workloadTypeToString(WorkloadType type);
WorkloadType stringToWorkloadType(const std::string& str);
std::string statusToString(TaskStatus status);
TaskStatus  stringToStatus(const std::string& str);

} // namespace aegis
