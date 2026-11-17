import React from 'react';
import { ListOrdered, Clock, Hourglass, ShieldAlert, Cpu, ArrowRight } from 'lucide-react';
import { ProcessTask } from '../types';

interface ReadyQueuePageProps {
  processes: ProcessTask[];
  onSelectProcess: (task: ProcessTask) => void;
  onNavigateExecute: () => void;
}

export const ReadyQueuePage: React.FC<ReadyQueuePageProps> = ({
  processes,
  onSelectProcess,
  onNavigateExecute
}) => {
  const readyTasks = processes.filter((p) => p.status === 'READY' || p.status === 'NEW' || p.status === 'PAUSED');

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Introduction Banner */}
      <div className="p-5 rounded-xl bg-dark-800 border border-dark-700 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-mono font-semibold uppercase mb-1">
            <ListOrdered className="w-4 h-4" />
            <span>Process State & Ready Queue Architecture</span>
          </div>
          <h2 className="text-lg font-bold text-slate-100">Task Ready Queue & State Progression</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Tasks in the Ready state are queued for CPU dispatch. Schedulers prioritize candidates based on arrival (FCFS), shortest burst (SJF), quantum rotation (RR), or dynamic multi-objective scoring (Aegis).
          </p>
        </div>

        <button
          onClick={onNavigateExecute}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition shrink-0"
        >
          <span>Go to Execution</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* State Transition Flow Diagram */}
      <div className="p-4 rounded-xl bg-dark-800 border border-dark-700">
        <span className="text-xs font-semibold text-slate-300 block mb-3 uppercase tracking-wider font-mono">
          State Transition Lifecycle
        </span>
        <div className="flex items-center justify-between gap-3 text-center text-xs font-mono">
          <div className="flex-1 p-3 rounded-lg bg-dark-900 border border-dark-600">
            <span className="text-slate-400 block text-[10px] mb-1">1. CREATED</span>
            <span className="text-slate-200 font-bold">NEW</span>
            <span className="text-[10px] text-slate-500 block mt-1">Awaiting arrival T=arrival</span>
          </div>
          <div className="text-slate-500 font-bold">→</div>
          <div className="flex-1 p-3 rounded-lg bg-dark-900 border border-cyan-500/40 bg-cyan-950/20">
            <span className="text-cyan-400 block text-[10px] mb-1">2. ELIGIBLE</span>
            <span className="text-cyan-300 font-bold">READY</span>
            <span className="text-[10px] text-slate-400 block mt-1">Enqueued in ReadyQueue</span>
          </div>
          <div className="text-slate-500 font-bold">⇄</div>
          <div className="flex-1 p-3 rounded-lg bg-dark-900 border border-emerald-500/40 bg-emerald-950/20">
            <span className="text-emerald-400 block text-[10px] mb-1">3. EXECUTING</span>
            <span className="text-emerald-300 font-bold">RUNNING</span>
            <span className="text-[10px] text-slate-400 block mt-1">Worker thread active</span>
          </div>
          <div className="text-slate-500 font-bold">→</div>
          <div className="flex-1 p-3 rounded-lg bg-dark-900 border border-purple-500/40 bg-purple-950/20">
            <span className="text-purple-400 block text-[10px] mb-1">4. TERMINATED</span>
            <span className="text-purple-300 font-bold">COMPLETED</span>
            <span className="text-[10px] text-slate-400 block mt-1">TAT & WT finalized</span>
          </div>
        </div>
      </div>

      {/* Ready Queue Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 font-mono">
            Candidate Processes ({readyTasks.length})
          </h3>
          <span className="text-xs text-slate-500 font-mono">Sorted by Arrival & Priority</span>
        </div>

        {readyTasks.length === 0 ? (
          <div className="p-12 text-center bg-dark-800 border border-dark-700 rounded-xl text-slate-500">
            <Hourglass className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-60" />
            <p className="text-sm font-semibold text-slate-400">Ready Queue is Empty</p>
            <p className="text-xs text-slate-500 mt-1">All tasks are currently completed or none have been loaded.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {readyTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => onSelectProcess(task)}
                className="p-4 rounded-xl bg-dark-800 border border-dark-700 hover:border-cyan-500/50 cursor-pointer transition shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono font-bold text-xs">
                      {task.id}
                    </span>
                    <span className="font-semibold text-slate-200 text-sm">{task.name}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-dark-900 border border-dark-600 text-slate-300 font-mono">
                    {task.status}
                  </span>
                </div>

                <div className="text-xs text-slate-400 flex items-center space-x-1">
                  <Cpu className="w-3.5 h-3.5 text-slate-500" />
                  <span>{task.workload_type}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[11px] font-mono bg-dark-900 p-2.5 rounded-lg border border-dark-750">
                  <div>
                    <span className="text-slate-500 text-[9px] block">ARRIVAL</span>
                    <span className="text-slate-300 font-semibold">{task.arrival_time} ms</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[9px] block">BURST</span>
                    <span className="text-slate-300 font-semibold">{task.estimated_burst_time} ms</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[9px] block">DEADLINE</span>
                    <span className="text-amber-400 font-semibold">{task.deadline} ms</span>
                  </div>
                </div>

                {/* Aegis Priority Metric Preview */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>Aegis Priority Score (P)</span>
                    <span className="text-purple-400 font-bold">{task.priority.toFixed(2)}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-dark-900 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-rose-500"
                      style={{ width: `${Math.min(100, Math.max(10, task.priority * 50))}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

