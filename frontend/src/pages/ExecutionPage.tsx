import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Square,
  Activity,
  Cpu,
  Layers,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  GitCommit,
  BarChart2
} from 'lucide-react';
import { ExperimentLiveStatus, ExperimentConfig, ProcessTask } from '../types';

interface ExecutionPageProps {
  status: ExperimentLiveStatus | null;
  config: ExperimentConfig;
  totalProcesses: number;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onNavigateGantt: () => void;
  onNavigateComparison: () => void;
  onNavigateProcesses: () => void;
}

export const ExecutionPage: React.FC<ExecutionPageProps> = ({
  status,
  config,
  totalProcesses,
  onStart,
  onPause,
  onResume,
  onStop,
  onNavigateGantt,
  onNavigateComparison,
  onNavigateProcesses
}) => {
  const isRunning = status?.is_running ?? false;
  const isPaused = status?.is_paused ?? false;
  const currentAlgo = status?.current_algo || config.selected_algorithms[0] || 'Ready';
  const algoIndex = status?.current_algo_index ?? 0;
  const totalAlgos = status?.total_algos || config.selected_algorithms.length || 1;
  const engine = status?.engine;

  const completedTasks = engine?.completed_tasks ?? 0;
  const taskCount = engine?.total_tasks || totalProcesses;
  const taskProgress = taskCount > 0 ? Math.round((completedTasks / taskCount) * 100) : 0;
  const overallProgress = totalAlgos > 0
    ? Math.round((((Math.max(0, algoIndex - 1)) + (taskProgress / 100)) / totalAlgos) * 100)
    : 0;

  const isFinished = !isRunning && completedTasks > 0 && algoIndex >= totalAlgos;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner and Controls */}
      <div className="p-6 rounded-xl bg-dark-800 border border-dark-700 shadow-sm flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-mono font-semibold uppercase">
            <Activity className="w-4 h-4 animate-pulse" />
            <span>Benchmark Execution Engine</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100">
            {isRunning
              ? `Executing: ${currentAlgo} (${algoIndex} of ${totalAlgos})`
              : isFinished
              ? 'Benchmark Suite Completed'
              : 'Ready to Run Fair Algorithm Comparison'}
          </h2>
          <p className="text-xs text-slate-400">
            {isRunning
              ? 'C++ worker threads are actively computing CPU-bound chunk slices on identical cloned workloads.'
              : 'Each selected algorithm will execute sequentially against the pristine workload definitions.'}
          </p>
        </div>

        {/* Action Button Set */}
        <div className="flex items-center space-x-3">
          {totalProcesses === 0 ? (
            <button
              onClick={onNavigateProcesses}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition shadow-md shadow-amber-600/30"
            >
              <span>Create Processes First</span>
            </button>
          ) : !isRunning ? (
            <button
              onClick={onStart}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/30 animate-pulse"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Comparison</span>
            </button>
          ) : (
            <>
              {isPaused ? (
                <button
                  onClick={onResume}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Resume</span>
                </button>
              ) : (
                <button
                  onClick={onPause}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md transition"
                >
                  <Pause className="w-4 h-4" />
                  <span>Pause</span>
                </button>
              )}
              <button
                onClick={onStop}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md transition"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>Stop</span>
              </button>
            </>
          )}

          {isFinished && (
            <div className="flex items-center space-x-2 ml-2">
              <button
                onClick={onNavigateGantt}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-600/30 transition"
              >
                <GitCommit className="w-4 h-4" />
                <span>View Gantt Timeline</span>
              </button>
              <button
                onClick={onNavigateComparison}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/30 transition"
              >
                <BarChart2 className="w-4 h-4" />
                <span>View Analytics</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bars */}
      <div className="grid grid-cols-2 gap-4">
        {/* Overall Suite Progress */}
        <div className="p-4 rounded-xl bg-dark-800 border border-dark-700 space-y-2">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-400">Total Benchmark Progress ({algoIndex}/{totalAlgos} Algorithms)</span>
            <span className="text-cyan-400 font-bold">{overallProgress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-dark-900 overflow-hidden">
            <div
              className="h-full bg-cyan-500 transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>Selected: {config.selected_algorithms.join(', ')}</span>
            <span>Workers: {config.num_workers} threads</span>
          </div>
        </div>

        {/* Current Algorithm Progress */}
        <div className="p-4 rounded-xl bg-dark-800 border border-dark-700 space-y-2">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-400">
              Active: <span className="text-slate-200 font-bold">{currentAlgo}</span> ({completedTasks}/{taskCount} tasks)
            </span>
            <span className="text-emerald-400 font-bold">{taskProgress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-dark-900 overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${taskProgress}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>Elapsed: {((engine?.current_time_ms ?? 0) / 1000).toFixed(2)}s</span>
            <span>Overhead: {((engine?.scheduling_overhead_us ?? 0) / 1000).toFixed(2)}ms</span>
          </div>
        </div>
      </div>

      {/* Real-time Worker Thread Lanes */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-200 font-mono flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span>Active Worker Thread Pool ({config.num_workers} Threads)</span>
        </h3>

        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: config.num_workers }).map((_, idx) => {
            const worker = engine?.workers?.find((w) => w.worker_id === idx);
            const isWorking = worker?.status === 'WORKING';
            const isPausedWorker = worker?.status === 'PAUSED';

            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border transition-all ${
                  isWorking
                    ? 'bg-dark-800 border-cyan-500/50 shadow-md shadow-cyan-500/5 ring-1 ring-cyan-500/20'
                    : isPausedWorker
                    ? 'bg-dark-800 border-amber-500/40'
                    : 'bg-dark-850 border-dark-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-slate-200">
                    Worker #{idx}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                      isWorking
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse'
                        : isPausedWorker
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-dark-900 text-slate-500 border border-dark-700'
                    }`}
                  >
                    {worker?.status || (isRunning ? 'IDLE' : 'STANDBY')}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-dark-900 border border-dark-750 font-mono text-xs">
                  <span className="text-slate-500 text-[10px] block">CURRENT TASK</span>
                  <span className={`font-bold ${isWorking ? 'text-cyan-300' : 'text-slate-500'}`}>
                    {worker?.current_task && worker.current_task !== 'None' ? worker.current_task : 'Idle / Waiting Work'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Decision Explanation Ticker */}
      <div className="p-4 rounded-xl bg-dark-800 border border-dark-700 space-y-2">
        <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400 font-semibold uppercase">
          <Clock className="w-3.5 h-3.5" />
          <span>Real-time Scheduler Decision Logic Log</span>
        </div>
        <div className="p-3 rounded-lg bg-dark-900 border border-dark-600 font-mono text-xs text-slate-200">
          {engine?.last_explanation || 'Scheduler ready. Awaiting task execution...'}
        </div>
      </div>
    </div>
  );
};

