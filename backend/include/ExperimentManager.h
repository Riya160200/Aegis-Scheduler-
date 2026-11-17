#pragma once

#include <string>
#include <vector>
#include <memory>
#include <mutex>
#include <thread>
#include <atomic>
#include "TaskManager.h"
#include "Scheduler.h"
#include "FCFSScheduler.h"
#include "SJFScheduler.h"
#include "RoundRobinScheduler.h"
#include "AegisScheduler.h"
#include "ExecutionEngine.h"
#include "PerformanceAnalyzer.h"
#include "json.hpp"

namespace aegis {

struct ExperimentConfig {
    std::string experiment_name = "Aegis_Benchmark_01";
    std::vector<std::string> selected_algorithms = {"FCFS", "SJF", "Round Robin", "Aegis Adaptive"};
    int num_workers = 2;
    int rr_quantum_units = 30;
    double rr_quantum_ms = 45.0;
    AegisWeights aegis_weights;
    double starvation_threshold_ms = 500.0;

    nlohmann::json to_json() const;
    static ExperimentConfig from_json(const nlohmann::json& j);
};

struct SavedExperiment {
    std::string id;
    std::string name;
    std::string timestamp;
    ExperimentConfig config;
    std::vector<ExecutionStats> algorithm_runs;
    ComparisonAnalysis analysis;

    nlohmann::json to_json() const;
    std::string to_csv() const;
};

class ExperimentManager {
private:
    std::shared_ptr<TaskManager> task_manager_;
    mutable std::mutex mutex_;

    ExperimentConfig current_config_;
    std::atomic<bool> is_running_{false};
    std::atomic<bool> is_paused_{false};
    std::atomic<bool> stop_requested_{false};

    std::string current_executing_algo_;
    int current_algo_index_ = 0;
    int total_algos_to_run_ = 0;

    std::unique_ptr<ExecutionEngine> active_engine_;
    std::thread runner_thread_;

    std::vector<ExecutionStats> last_results_;
    ComparisonAnalysis last_analysis_;
    std::vector<SavedExperiment> history_;

    std::vector<std::function<void(const nlohmann::json&)>> event_listeners_;

    void run_experiments_internal();
    void broadcast_event(const nlohmann::json& event_data);

public:
    explicit ExperimentManager(std::shared_ptr<TaskManager> tm);
    ~ExperimentManager();

    void set_config(const ExperimentConfig& cfg);
    ExperimentConfig get_config() const;

    bool start_experiment();
    bool pause_experiment();
    bool resume_experiment();
    bool stop_experiment();

    bool is_running() const { return is_running_.load(); }
    bool is_paused() const { return is_paused_.load(); }

    nlohmann::json get_status();
    nlohmann::json get_results() const;
    nlohmann::json get_gantt(const std::string& algo_name = "") const;
    nlohmann::json get_comparison() const;

    void add_event_listener(std::function<void(const nlohmann::json&)> listener);

    std::vector<SavedExperiment> get_history() const;
    bool get_history_experiment(const std::string& id, SavedExperiment& out_exp) const;
    std::string export_csv(const std::string& experiment_id = "") const;
};

} // namespace aegis

