export type TaskStatus = 'NEW' | 'READY' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

export type WorkloadType =
  | 'Prime Number Calculation'
  | 'Matrix Multiplication'
  | 'Sorting'
  | 'Data Processing'
  | 'Mathematical Computation';

export interface ProcessTask {
  id: string;
  name: string;
  workload_type: WorkloadType;
  workload_size: number;
  arrival_time: number;
  estimated_burst_time: number;
  actual_burst_time: number;
  remaining_work: number;
  total_work: number;
  deadline: number;
  priority: number;
  base_priority: number;
  waiting_time: number;
  cpu_time_consumed: number;
  first_execution_time: number;
  completion_time: number;
  status: TaskStatus;
  assigned_worker_id: number;
  last_decision_reason?: string;
}

export interface AlgorithmInfo {
  id: string;
  name: string;
  short_name: string;
  is_preemptive: boolean;
  description: string;
  formula?: string;
  characteristics: string[];
  best_for: string;
}

export interface ExperimentConfig {
  experiment_name: string;
  selected_algorithms: string[];
  num_workers: number;
  rr_quantum_units: number;
  rr_quantum_ms: number;
  aegis_weights: {
    w1: number;
    w2: number;
    w3: number;
  };
  starvation_threshold_ms: number;
}

export interface GanttRecord {
  task_id: string;
  task_name: string;
  worker_id: number;
  start_time: number;
  end_time: number;
  duration: number;
  status: string;
  decision_reason?: string;
}

export interface AlgorithmExecutionStats {
  algorithm_name: string;
  num_workers: number;
  start_timestamp_ms: number;
  total_duration_ms: number;
  total_worker_busy_ms: number;
  scheduling_overhead_us: number;
  total_tasks: number;
  completed_tasks: number;
  completed_task_objects: ProcessTask[];
  gantt_records: GanttRecord[];
}

export interface AlgorithmMetrics {
  algorithm_name: string;
  num_workers: number;
  total_tasks: number;
  completed_tasks: number;
  avg_waiting_time_ms: number;
  avg_turnaround_time_ms: number;
  avg_response_time_ms: number;
  max_waiting_time_ms: number;
  max_turnaround_time_ms: number;
  cpu_utilization_percent: number;
  throughput_tasks_per_sec: number;
  deadline_misses: number;
  deadline_miss_rate_percent: number;
  starvation_count: number;
  scheduling_overhead_ms: number;
  total_duration_ms: number;
}

export interface MetricWinner {
  metric_name: string;
  winning_algorithm: string;
  winning_value: number;
  unit: string;
  explanation: string;
}

export interface ComparisonAnalysis {
  algorithm_metrics: AlgorithmMetrics[];
  metric_winners: MetricWinner[];
  insights: string[];
  final_conclusion: string;
}

export interface SavedExperiment {
  id: string;
  name: string;
  timestamp: string;
  config: ExperimentConfig;
  algorithm_runs: AlgorithmExecutionStats[];
  analysis: ComparisonAnalysis;
}

export interface WorkerLiveStatus {
  worker_id: number;
  status: 'IDLE' | 'WORKING' | 'PAUSED';
  current_task: string;
}

export interface EngineLiveStatus {
  state: 'STOPPED' | 'RUNNING' | 'PAUSED' | 'FINISHED';
  current_time_ms: number;
  algorithm: string;
  total_tasks: number;
  completed_tasks: number;
  ready_tasks: number;
  pending_tasks: number;
  total_worker_busy_ms: number;
  scheduling_overhead_us: number;
  workers: WorkerLiveStatus[];
  last_explanation: string;
}

export interface ExperimentLiveStatus {
  is_running: boolean;
  is_paused: boolean;
  current_algo: string;
  current_algo_index: number;
  total_algos: number;
  engine: EngineLiveStatus | null;
}

