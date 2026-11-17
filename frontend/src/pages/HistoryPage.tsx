import React from 'react';
import { History, Download, Eye, Calendar, Cpu, Layers, Award, FileText } from 'lucide-react';
import { SavedExperiment } from '../types';

interface HistoryPageProps {
  history: SavedExperiment[];
  onLoadExperiment: (exp: SavedExperiment) => void;
  onExportCsv: (id: string) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  history,
  onLoadExperiment,
  onExportCsv
}) => {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header card */}
      <div className="p-5 rounded-xl bg-dark-800 border border-dark-700 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-mono font-semibold uppercase mb-1">
            <History className="w-4 h-4" />
            <span>Benchmark Experiment Repository</span>
          </div>
          <h2 className="text-lg font-bold text-slate-100">Saved Experiments & Historical Archives</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Review previous benchmark runs, inspect past Gantt timelines, compare historical metrics, and export data.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400 px-3 py-1.5 rounded-lg bg-dark-900 border border-dark-700">
          Total Archived Runs: <span className="text-cyan-400 font-bold">{history.length}</span>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="p-16 text-center bg-dark-800 border border-dark-700 rounded-xl text-slate-500">
          <History className="w-10 h-10 mx-auto text-slate-600 mb-3 opacity-60" />
          <p className="text-sm font-semibold text-slate-400">No Historical Experiments Recorded</p>
          <p className="text-xs text-slate-500 mt-1">Completed benchmarks are preserved here automatically for review and academic demonstration.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((exp) => {
            const firstWinner = exp.analysis?.metric_winners?.[0];

            return (
              <div
                key={exp.id}
                className="p-5 rounded-xl bg-dark-800 border border-dark-700 hover:border-dark-600 transition shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono font-bold text-xs">
                      {exp.id}
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-slate-100">{exp.name}</h3>
                      <div className="flex items-center space-x-3 text-[11px] text-slate-400 font-mono mt-0.5">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>{exp.timestamp}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center space-x-1">
                          <Cpu className="w-3 h-3 text-slate-500" />
                          <span>{exp.config.num_workers} Worker Thread{exp.config.num_workers > 1 ? 's' : ''}</span>
                        </span>
                        <span>•</span>
                        <span>{exp.algorithm_runs.length} Algorithms Tested</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onExportCsv(exp.id)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-dark-700 hover:bg-dark-600 text-slate-300 text-xs font-semibold border border-dark-600 transition"
                    >
                      <Download className="w-3.5 h-3.5 text-cyan-400" />
                      <span>CSV Export</span>
                    </button>
                    <button
                      onClick={() => onLoadExperiment(exp)}
                      className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm shadow-cyan-600/30 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Load Results</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 text-xs font-mono">
                  {exp.analysis?.algorithm_metrics?.map((m) => (
                    <div key={m.algorithm_name} className="p-3 rounded-lg bg-dark-900 border border-dark-750">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-slate-200">{m.algorithm_name}</span>
                        <span className="text-[10px] text-slate-500">{m.completed_tasks} tasks</span>
                      </div>
                      <div className="text-[11px] text-slate-400 space-y-0.5">
                        <div>Wait: <span className="text-cyan-400">{m.avg_waiting_time_ms}ms</span></div>
                        <div>Turnaround: <span className="text-purple-400">{m.avg_turnaround_time_ms}ms</span></div>
                        <div>Misses: <span className={m.deadline_misses === 0 ? 'text-emerald-400' : 'text-rose-400'}>{m.deadline_misses}</span></div>
                      </div>
                    </div>
                  ))}
                </div>

                {firstWinner && (
                  <div className="p-2.5 rounded-lg bg-dark-900/60 border border-dark-750 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center space-x-1.5 text-slate-300">
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      <span>{firstWinner.metric_name} Winner:</span>
                      <strong className="text-cyan-400 font-mono">{firstWinner.winning_algorithm}</strong> ({firstWinner.winning_value} {firstWinner.unit})
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Overhead: {(exp.analysis.algorithm_metrics[0]?.scheduling_overhead_ms ?? 0).toFixed(2)}ms
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

