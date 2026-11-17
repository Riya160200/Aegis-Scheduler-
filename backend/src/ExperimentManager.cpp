#include "ExperimentManager.h"
#include <sstream>
#include <iomanip>
#include <chrono>
#include <ctime>

namespace aegis {

nlohmann::json ExperimentConfig::to_json() const {
    return nlohmann::json{
        {"experiment_name", experiment_name},
        {"selected_algorithms", selected_algorithms},
        {"num_workers", num_workers},
        {"rr_quantum_units", rr_quantum_units},
        {"rr_quantum_ms", rr_quantum_ms},
        {"aegis_weights", {
            {"w1", aegis_weights.w1},
            {"w2", aegis_weights.w2},
            {"w3", aegis_weights.w3}
        }},
        {"starvation_threshold_ms", starvation_threshold_ms}
    };
}

ExperimentConfig ExperimentConfig::from_json(const nlohmann::json& j) {
    ExperimentConfig cfg;
    cfg.experiment_name = j.value("experiment_name", "Aegis_Benchmark_01");
    if (j.contains("selected_algorithms") && j["selected_algorithms"].is_array()) {
        cfg.selected_algorithms = j["selected_algorithms"].get<std::vector<std::string>>();
    }
    cfg.num_workers = j.value("num_workers", 2);
    cfg.rr_quantum_units = j.value("rr_quantum_units", 30);
    cfg.rr_quantum_ms = j.value("rr_quantum_ms", 45.0);
    if (j.contains("aegis_weights")) {
        cfg.aegis_weights.w1 = j["aegis_weights"].value("w1", 0.45);
        cfg.aegis_weights.w2 = j["aegis_weights"].value("w2", 0.35);
        cfg.aegis_weights.w3 = j["aegis_weights"].value("w3", 0.20);
    }
    cfg.starvation_threshold_ms = j.value("starvation_threshold_ms", 500.0);
    return cfg;
}

nlohmann::json SavedExperiment::to_json() const {
    nlohmann::json runs_arr = nlohmann::json::array();
    for (const auto& r : algorithm_runs) {
        runs_arr.push_back(r.to_json());
    }
    return nlohmann::json{
        {"id", id},
        {"name", name},
        {"timestamp", timestamp},
        {"config", config.to_json()},
        {"algorithm_runs", runs_arr},
        {"analysis", analysis.to_json()}
    };
}

std::string SavedExperiment::to_csv() const {
    std::ostringstream ss;
    ss << "# AEGIS Benchmark Experiment Report\n";
    ss << "Experiment ID," << id << "\n";
    ss << "Experiment Name," << name << "\n";
    ss << "Timestamp," << timestamp << "\n";
    ss << "Worker Threads," << config.num_workers << "\n\n";

    ss << "Algorithm,Tasks,Avg Waiting Time (ms),Avg Turnaround Time (ms),Avg Response Time (ms),CPU Utilization (%),Throughput (tasks/s),Deadline Misses,Starvation Count,Scheduling Overhead (ms)\n";
    for (const auto& m : analysis.algorithm_metrics) {
        ss << m.algorithm_name << ","
           << m.completed_tasks << ","
           << m.avg_waiting_time_ms << ","
           << m.avg_turnaround_time_ms << ","
           << m.avg_response_time_ms << ","
           << m.cpu_utilization_percent << "%,"
           << m.throughput_tasks_per_sec << ","
           << m.deadline_misses << ","
           << m.starvation_count << ","
           << m.scheduling_overhead_ms << "\n";
    }

    ss << "\n# Execution Insights\n";
    for (const auto& insight : analysis.insights) {
        ss << "\"" << insight << "\"\n";
    }

    return ss.str();
}

ExperimentManager::ExperimentManager(std::shared_ptr<TaskManager> tm)
    : task_manager_(tm) {}

ExperimentManager::~ExperimentManager() {
    stop_experiment();
    if (runner_thread_.joinable()) {
        runner_thread_.join();
    }
}

void ExperimentManager::set_config(const ExperimentConfig& cfg) {
    std::lock_guard<std::mutex> lock(mutex_);
    current_config_ = cfg;
}

ExperimentConfig ExperimentManager::get_config() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return current_config_;
}

void ExperimentManager::broadcast_event(const nlohmann::json& event_data) {
    for (const auto& listener : event_listeners_) {
        if (listener) listener(event_data);
    }
}

void ExperimentManager::add_event_listener(std::function<void(const nlohmann::json&)> listener) {
    std::lock_guard<std::mutex> lock(mutex_);
    event_listeners_.push_back(listener);
}

bool ExperimentManager::start_experiment() {
    if (is_running_.load()) return false;
    if (task_manager_->count() == 0) return false;

    if (runner_thread_.joinable()) {
        runner_thread_.join();
    }

    is_running_.store(true);
    is_paused_.store(false);
    stop_requested_.store(false);

    runner_thread_ = std::thread(&ExperimentManager::run_experiments_internal, this);
    return true;
}

void ExperimentManager::run_experiments_internal() {
    ExperimentConfig cfg;
    {
        std::lock_guard<std::mutex> lock(mutex_);
        cfg = current_config_;
        last_results_.clear();
        total_algos_to_run_ = static_cast<int>(cfg.selected_algorithms.size());
        current_algo_index_ = 0;
    }

    for (size_t i = 0; i < cfg.selected_algorithms.size(); ++i) {
        if (stop_requested_.load()) break;

        std::string algo_name = cfg.selected_algorithms[i];
        {
            std::lock_guard<std::mutex> lock(mutex_);
            current_executing_algo_ = algo_name;
            current_algo_index_ = static_cast<int>(i + 1);
        }

        // 1. Instantiate scheduler
        std::shared_ptr<Scheduler> scheduler = nullptr;
        if (algo_name == "FCFS") {
            scheduler = std::make_shared<FCFSScheduler>();
        } else if (algo_name == "SJF") {
            scheduler = std::make_shared<SJFScheduler>();
        } else if (algo_name == "Round Robin" || algo_name == "RR") {
            scheduler = std::make_shared<RoundRobinScheduler>(cfg.rr_quantum_units, cfg.rr_quantum_ms);
        } else {
            scheduler = std::make_shared<AegisScheduler>(cfg.aegis_weights, cfg.starvation_threshold_ms);
        }

        // 2. Clone fresh identical workload definition
        auto task_clones = task_manager_->get_cloned_tasks();

        // 3. Create execution engine with the identical worker count
        auto engine = std::make_unique<ExecutionEngine>(cfg.num_workers);
        {
            std::lock_guard<std::mutex> lock(mutex_);
            active_engine_ = std::move(engine);
        }

        active_engine_->prepare(scheduler, task_clones);
        active_engine_->set_progress_callback([this](const nlohmann::json& live) {
            nlohmann::json evt;
            evt["type"] = "PROGRESS";
            evt["data"] = live;
            evt["current_algo"] = current_executing_algo_;
            evt["algo_index"] = current_algo_index_;
            evt["total_algos"] = total_algos_to_run_;
            broadcast_event(evt);
        });

        // Broadcast algo start event
        {
            nlohmann::json evt;
            evt["type"] = "ALGORITHM_START";
            evt["algorithm"] = algo_name;
            evt["algo_index"] = current_algo_index_;
            evt["total_algos"] = total_algos_to_run_;
            broadcast_event(evt);
        }

        ExecutionStats stats = active_engine_->run();

        if (stop_requested_.load()) {
            break;
        }

        {
            std::lock_guard<std::mutex> lock(mutex_);
            last_results_.push_back(stats);
        }

        // Broadcast algo finish event
        {
            nlohmann::json evt;
            evt["type"] = "ALGORITHM_COMPLETE";
            evt["algorithm"] = algo_name;
            evt["stats"] = stats.to_json();
            broadcast_event(evt);
        }

        // Brief delay between algorithm runs for UI transitions
        std::this_thread::sleep_for(std::chrono::milliseconds(200));
    }

    if (!stop_requested_.load()) {
        std::lock_guard<std::mutex> lock(mutex_);
        last_analysis_ = PerformanceAnalyzer::compare(last_results_, cfg.starvation_threshold_ms);

        // Save experiment to history
        auto now = std::chrono::system_clock::now();
        std::time_t now_time = std::chrono::system_clock::to_time_t(now);
        char time_str[64];
        std::strftime(time_str, sizeof(time_str), "%Y-%m-%d %H:%M:%S", std::localtime(&now_time));

        SavedExperiment exp;
        exp.id = "EXP_" + std::to_string(history_.size() + 1);
        exp.name = cfg.experiment_name;
        exp.timestamp = time_str;
        exp.config = cfg;
        exp.algorithm_runs = last_results_;
        exp.analysis = last_analysis_;
        history_.push_back(exp);

        nlohmann::json finish_evt;
        finish_evt["type"] = "EXPERIMENT_COMPLETE";
        finish_evt["experiment_id"] = exp.id;
        nlohmann::json results_arr = nlohmann::json::array();
        for (const auto& r : last_results_) {
            results_arr.push_back(r.to_json());
        }
        finish_evt["results"] = results_arr;
        finish_evt["comparison"] = last_analysis_.to_json();
        broadcast_event(finish_evt);
    }

    is_running_.store(false);
    is_paused_.store(false);
    stop_requested_.store(false);
}

bool ExperimentManager::pause_experiment() {
    if (!is_running_.load() || is_paused_.load()) return false;
    is_paused_.store(true);
    std::lock_guard<std::mutex> lock(mutex_);
    if (active_engine_) {
        active_engine_->pause();
    }
    return true;
}

bool ExperimentManager::resume_experiment() {
    if (!is_running_.load() || !is_paused_.load()) return false;
    is_paused_.store(false);
    std::lock_guard<std::mutex> lock(mutex_);
    if (active_engine_) {
        active_engine_->resume();
    }
    return true;
}

bool ExperimentManager::stop_experiment() {
    if (!is_running_.load()) return false;
    stop_requested_.store(true);
    is_paused_.store(false);
    std::lock_guard<std::mutex> lock(mutex_);
    if (active_engine_) {
        active_engine_->stop();
    }
    return true;
}

nlohmann::json ExperimentManager::get_status() {
    std::lock_guard<std::mutex> lock(mutex_);
    nlohmann::json j;
    j["is_running"] = is_running_.load();
    j["is_paused"] = is_paused_.load();
    j["current_algo"] = current_executing_algo_;
    j["current_algo_index"] = current_algo_index_;
    j["total_algos"] = total_algos_to_run_;
    if (active_engine_) {
        j["engine"] = active_engine_->get_live_status();
    } else {
        j["engine"] = nullptr;
    }
    return j;
}

nlohmann::json ExperimentManager::get_results() const {
    std::lock_guard<std::mutex> lock(mutex_);
    nlohmann::json j = nlohmann::json::array();
    for (const auto& r : last_results_) {
        j.push_back(r.to_json());
    }
    return j;
}

nlohmann::json ExperimentManager::get_gantt(const std::string& algo_name) const {
    std::lock_guard<std::mutex> lock(mutex_);
    nlohmann::json out = nlohmann::json::object();
    for (const auto& r : last_results_) {
        if (algo_name.empty() || r.algorithm_name == algo_name) {
            nlohmann::json records = nlohmann::json::array();
            for (const auto& g : r.gantt_records) {
                records.push_back(g.to_json());
            }
            out[r.algorithm_name] = {
                {"num_workers", r.num_workers},
                {"total_duration_ms", r.total_duration_ms},
                {"records", records}
            };
        }
    }
    return out;
}

nlohmann::json ExperimentManager::get_comparison() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return last_analysis_.to_json();
}

std::vector<SavedExperiment> ExperimentManager::get_history() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return history_;
}

bool ExperimentManager::get_history_experiment(const std::string& id, SavedExperiment& out_exp) const {
    std::lock_guard<std::mutex> lock(mutex_);
    for (const auto& exp : history_) {
        if (exp.id == id) {
            out_exp = exp;
            return true;
        }
    }
    return false;
}

std::string ExperimentManager::export_csv(const std::string& experiment_id) const {
    std::lock_guard<std::mutex> lock(mutex_);
    if (!experiment_id.empty()) {
        for (const auto& exp : history_) {
            if (exp.id == experiment_id) {
                return exp.to_csv();
            }
        }
    }
    if (!history_.empty()) {
        return history_.back().to_csv();
    }
    return "No experiment results found to export.\n";
}

} // namespace aegis

