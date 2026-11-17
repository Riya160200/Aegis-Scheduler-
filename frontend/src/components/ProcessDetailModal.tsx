import React from 'react';
import { X, Cpu, Clock, Calendar, ShieldAlert, Award, Hash, Zap } from 'lucide-react';
import { ProcessTask } from '../types';

interface ProcessDetailModalProps {
  task: ProcessTask | null;
  onClose: () => void;
}

export const ProcessDetailModal: React.FC<ProcessDetailModalProps> = ({ task, onClose }) => {
  if (!task) return null;

  const tat = task.completion_time >= 0 ? Math.max(0, task.completion_time - task.arrival_time) : 0;
  const wt = task.completion_time >= 0 ? Math.max(0, tat - task.actual_burst_time) : task.waiting_time;
  const rt = task.first_execution_time >= 0 ? Math.max(0, task.first_execution_time - task.arrival_time) : -1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-dark-800 border border-dark-600 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in duration-200">
        <div className="px-6 py-4 border-b border-dark-700 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono font-bold text-sm">
              {task.id}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">{task.name}</h2>
              <p className="text-xs text-slate-400">{task.workload_type}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-dark-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Note regarding simulated task vs OS task */}
          <div className="p-3 rounded-lg bg-dark-900 border border-dark-700 text-[11px] text-slate-400">
            <span className="font-semibold text-slate-300">Architecture Note:</span> This task is an application-level computational work descriptor scheduled on worker threads. It performs actual CPU operations without Windows kernel context switch spoofing.
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-dark-900 border border-dark-700">
              <span className="text-slate-400 block mb-1">Execution Status</span>
              <span className="font-mono font-bold text-emerald-400">{task.status}</span>
            </div>
            <div className="p-3 rounded-lg bg-dark-900 border border-dark-700">
              <span className="text-slate-400 block mb-1">Workload Size</span>
              <span className="font-mono font-bold text-slate-200">{task.workload_size} units ({task.remaining_work} rem)</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-2.5 rounded bg-dark-900 border border-dark-700">
              <span className="text-slate-500 text-[10px] block">ARRIVAL TIME</span>
              <span className="text-slate-200 font-semibold">{task.arrival_time} ms</span>
            </div>
            <div className="p-2.5 rounded bg-dark-900 border border-dark-700">
              <span className="text-slate-500 text-[10px] block">EST. BURST</span>
              <span className="text-slate-200 font-semibold">{task.estimated_burst_time} ms</span>
            </div>
            <div className="p-2.5 rounded bg-dark-900 border border-dark-700">
              <span className="text-slate-500 text-[10px] block">ACTUAL BURST</span>
              <span className="text-cyan-400 font-semibold">{task.actual_burst_time.toFixed(1)} ms</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-2.5 rounded bg-dark-900 border border-dark-700">
              <span className="text-slate-500 text-[10px] block">DEADLINE</span>
              <span className="text-amber-400 font-semibold">{task.deadline} ms</span>
            </div>
            <div className="p-2.5 rounded bg-dark-900 border border-dark-700">
              <span className="text-slate-500 text-[10px] block">BASE PRIORITY</span>
              <span className="text-slate-200 font-semibold">{task.base_priority} / 10</span>
            </div>
            <div className="p-2.5 rounded bg-dark-900 border border-dark-700">
              <span className="text-slate-500 text-[10px] block">DYNAMIC PRIO</span>
              <span className="text-purple-400 font-semibold">{task.priority.toFixed(2)}</span>
            </div>
          </div>

          {task.completion_time >= 0 && (
            <div className="p-3 rounded-lg bg-dark-900 border border-dark-700 space-y-2">
              <span className="text-xs font-semibold text-slate-300 block">Measured OS Scheduling Metrics</span>
              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                <div>
                  <span className="text-slate-500 text-[10px] block">WAITING TIME</span>
                  <span className="text-slate-200">{wt.toFixed(1)} ms</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">TURNAROUND</span>
                  <span className="text-slate-200">{tat.toFixed(1)} ms</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">RESPONSE TIME</span>
                  <span className="text-slate-200">{rt >= 0 ? `${rt.toFixed(1)} ms` : 'N/A'}</span>
                </div>
              </div>
            </div>
          )}

          {task.last_decision_reason && (
            <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-800/40 text-xs text-cyan-200">
              <span className="font-semibold block mb-0.5 text-cyan-300">Dispatch Decision Logic:</span>
              <p className="font-mono text-[11px]">{task.last_decision_reason}</p>
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-dark-700">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 text-slate-300 text-xs font-medium transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

