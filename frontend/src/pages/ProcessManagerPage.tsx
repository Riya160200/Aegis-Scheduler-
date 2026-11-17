import React, { useState } from 'react';
import {
  Plus,
  Sparkles,
  Trash2,
  Eye,
  Edit2,
  ArrowRight,
  Cpu,
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { ProcessTask } from '../types';

interface ProcessManagerPageProps {
  processes: ProcessTask[];
  onAddProcess: () => void;
  onGenerateProcesses: () => void;
  onEditProcess: (task: ProcessTask) => void;
  onDeleteProcess: (id: string) => void;
  onClearProcesses: () => void;
  onSelectProcess: (task: ProcessTask) => void;
  onNavigateNext: () => void;
}

export const ProcessManagerPage: React.FC<ProcessManagerPageProps> = ({
  processes,
  onAddProcess,
  onGenerateProcesses,
  onEditProcess,
  onDeleteProcess,
  onClearProcesses,
  onSelectProcess,
  onNavigateNext
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  const filteredProcesses = processes.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.workload_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalWorkUnits = processes.reduce((acc, p) => acc + p.workload_size, 0);
  const avgBurst = processes.length > 0
    ? Math.round(processes.reduce((acc, p) => acc + p.estimated_burst_time, 0) / processes.length)
    : 0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top summary cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-dark-800 border border-dark-700 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs uppercase tracking-wider font-semibold">Total Processes</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">{processes.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Ready for benchmarking</div>
        </div>

        <div className="p-4 rounded-xl bg-dark-800 border border-dark-700 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs uppercase tracking-wider font-semibold">Total Compute Work</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">{totalWorkUnits} <span className="text-xs font-normal text-slate-400">units</span></div>
          <div className="text-[11px] text-slate-400 mt-1">Real CPU arithmetic tasks</div>
        </div>

        <div className="p-4 rounded-xl bg-dark-800 border border-dark-700 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs uppercase tracking-wider font-semibold">Avg Estimated Burst</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">{avgBurst} <span className="text-xs font-normal text-slate-400">ms</span></div>
          <div className="text-[11px] text-slate-400 mt-1">Estimated task burst</div>
        </div>

        <div className="p-4 rounded-xl bg-dark-800 border border-dark-700 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs uppercase tracking-wider font-semibold">Workload Distribution</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-sm font-semibold text-slate-100 mt-1">5 Compute Kernels</div>
          <div className="text-[11px] text-slate-400 mt-1">Primes, Matrix, Sort, Hash, Math</div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between gap-4 bg-dark-800 p-4 rounded-xl border border-dark-700">
        <div className="flex items-center space-x-3">
          <button
            onClick={onAddProcess}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm shadow-cyan-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Process Manually</span>
          </button>
          <button
            onClick={onGenerateProcesses}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 text-slate-200 text-xs font-medium border border-dark-600 transition"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Generate Workload</span>
          </button>
          {processes.length > 0 && (
            confirmClear ? (
              <div className="flex items-center space-x-2 bg-rose-950/40 border border-rose-800/60 px-3 py-1.5 rounded-lg text-xs">
                <span className="text-rose-300">Clear all tasks?</span>
                <button
                  onClick={() => {
                    onClearProcesses();
                    setConfirmClear(false);
                  }}
                  className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold"
                >
                  Yes
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="px-2 py-0.5 rounded bg-dark-700 text-slate-300"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClear(true)}
                className="flex items-center space-x-1 px-3 py-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-dark-700 text-xs transition"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear All</span>
              </button>
            )
          )}
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="text"
            placeholder="Search processes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3.5 py-1.5 rounded-lg bg-dark-900 border border-dark-600 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 w-52"
          />
          {processes.length > 0 && (
            <button
              onClick={onNavigateNext}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition"
            >
              <span>Algorithm Selection</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Process Table */}
      <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-dark-900/70 border-b border-dark-700 text-slate-400 uppercase font-mono tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">PID</th>
                <th className="py-3 px-4">Process Name</th>
                <th className="py-3 px-4">Workload Kernel</th>
                <th className="py-3 px-3 text-right">Arrival</th>
                <th className="py-3 px-3 text-right">Est. Burst</th>
                <th className="py-3 px-3 text-right">Work Units</th>
                <th className="py-3 px-3 text-right">Deadline</th>
                <th className="py-3 px-3 text-center">Priority</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700/60 font-mono">
              {filteredProcesses.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500 font-sans">
                    <Cpu className="w-10 h-10 mx-auto text-slate-600 mb-3 opacity-60" />
                    <p className="text-sm font-semibold text-slate-400">No computational processes created yet</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Click <span className="text-cyan-400">"Add Process Manually"</span> or <span className="text-amber-400">"Generate Workload"</span> to create processes for the scheduling algorithms.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProcesses.map((task) => (
                  <tr key={task.id} className="hover:bg-dark-750 transition-colors">
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold">
                        {task.id}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans font-medium text-slate-200">
                      {task.name}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-300">
                      <span className="inline-flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-cyan-400" />
                        <span>{task.workload_type}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-300">{task.arrival_time} ms</td>
                    <td className="py-3 px-3 text-right text-slate-300">{task.estimated_burst_time} ms</td>
                    <td className="py-3 px-3 text-right text-slate-300">
                      {task.workload_size}
                      {task.remaining_work < task.workload_size && (
                        <span className="text-[10px] text-amber-400 ml-1">({task.remaining_work} rem)</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right text-amber-400 font-semibold">{task.deadline} ms</td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-1.5 py-0.5 rounded bg-dark-900 border border-dark-600 text-slate-200">
                        {task.base_priority}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          task.status === 'COMPLETED'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : task.status === 'RUNNING'
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 animate-pulse'
                            : task.status === 'PAUSED'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-dark-900 text-slate-400 border border-dark-600'
                        }`}
                      >
                        {task.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => onSelectProcess(task)}
                          title="View Details"
                          className="p-1.5 rounded hover:bg-dark-700 text-slate-400 hover:text-cyan-400 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onEditProcess(task)}
                          title="Edit Task"
                          className="p-1.5 rounded hover:bg-dark-700 text-slate-400 hover:text-slate-200 transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteProcess(task.id)}
                          title="Delete Task"
                          className="p-1.5 rounded hover:bg-dark-700 text-slate-400 hover:text-rose-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

