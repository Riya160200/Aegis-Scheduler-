#pragma once

#include <vector>
#include <string>
#include <map>
#include "ExecutionEngine.h"
#include "json.hpp"

namespace aegis {

struct AlgorithmMetrics {
    std::string algorithm_name;
    int num_workers;
    int total_tasks;
    int completed_tasks;
    
    double avg_waiting_time_ms;
    double avg_turnaround_time_ms;
    double avg_response_time_ms;
    
    double max_waiting_time_ms;
    double max_turnaround_time_ms;
    
    double cpu_utilization_percent;
    double throughput_tasks_per_sec;
    
    int deadline_misses;
    double deadline_miss_rate_percent;
    
    int starvation_count;
    double scheduling_overhead_ms;
    double total_duration_ms;

    nlohmann::json to_json() const;
};

struct MetricWinner {
    std::string metric_name;
    std::string winning_algorithm;
    double winning_value;
    std::string unit;
    std::string explanation;

    nlohmann::json to_json() const;
};

struct ComparisonAnalysis {
    std::vector<AlgorithmMetrics> algorithm_metrics;
    std::vector<MetricWinner> metric_winners;
    std::vector<std::string> insights;
    std::string final_conclusion;

    nlohmann::json to_json() const;
};

class PerformanceAnalyzer {
public:
    static AlgorithmMetrics analyze(const ExecutionStats& stats, double starvation_threshold_ms = 500.0);
    
    static ComparisonAnalysis compare(const std::vector<ExecutionStats>& all_stats, double starvation_threshold_ms = 500.0);
};

} // namespace aegis

