import React, { useState } from 'react';
import { GitCommit, Clock, Cpu, Eye, Info, Layers, ChevronRight } from 'lucide-react';
import { GanttRecord } from '../types';

interface GanttPageProps {
  ganttData: Record<string, { num_workers: number; total_duration_ms: number; records: GanttRecord[] }>;
  selectedAlgorithms: string[];
}

// Consistent color palette for tasks
const TASK_COLORS = [
  '#0284c7', // sky
  '#10b981', // emerald
  '#f59e0b', // amber
  '#a855f7', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#6366f1', // indigo
  '#14b8a6', // teal
];

export const GanttPage: React.FC<GanttPageProps> = ({ ganttData, selectedAlgorithms }) => {
  const availableAlgos = Object.keys(ganttData);
  const [activeAlgo, setActiveAlgo] = useState<string>(availableAlgos[0] || selectedAlgorithms[0] || 'FCFS');
  const [selectedRecord, setSelectedRecord] = useState<GanttRecord | null>(null);

  const currentDataset = ganttData[activeAlgo];
  const numWorkers = currentDataset?.num_workers || 1;
  const totalDuration = Math.max(10, currentDataset?.total_duration_ms || 100);
  const records = currentDataset?.records || [];

  // Map PIDs to consistent colors
  const getColorForTask = (taskId: string) => {
    let hash = 0;
    for (let i = 0; i < taskId.length; i++) {
      hash = (hash << 5) - hash + taskId.charCodeAt(i);
    }
    const idx = Math.abs(hash) % TASK_COLORS.length;
    return TASK_COLORS[idx];
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header Card */}
      <div className="p-5 rounded-xl bg-dark-800 border border-dark-700 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-mono font-semibold uppercase mb-1">
            <GitCommit className="w-4 h-4" />
            <span>Multi-Threaded Gantt Timeline Analyzer</span>
          </div>
          <h2 className="text-lg font-bold text-slate-100">CPU Execution Slices & Worker Lanes</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Interactive horizontal Gantt charts visualizing execution order, preemptions, quantum slices, and multithreaded worker core concurrency.
          </p>
        </div>

        {/* Algorithm Tabs */}
        <div className="flex items-center space-x-2 bg-dark-900 p-1.5 rounded-lg border border-dark-700">
          {availableAlgos.length === 0 ? (
            <span className="text-xs text-slate-500 px-3 py-1">No execution runs recorded yet</span>
          ) : (
            availableAlgos.map((algo) => (
              <button
                key={algo}
                onClick={() => {
                  setActiveAlgo(algo);
                  setSelectedRecord(null);
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition ${
                  activeAlgo === algo
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-dark-800'
                }`}
              >
                {algo}
              </button>
            ))
          )}
        </div>
      </div>

      {records.length === 0 ? (
        <div className="p-16 text-center bg-dark-800 border border-dark-700 rounded-xl text-slate-500">
          <Clock className="w-10 h-10 mx-auto text-slate-600 mb-3 opacity-60" />
          <p className="text-sm font-semibold text-slate-400">No Gantt Timeline Data Available</p>
          <p className="text-xs text-slate-500 mt-1">Execute the experiment to generate real backend CPU Gantt execution charts.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Gantt Canvas */}
          <div className="p-6 rounded-xl bg-dark-800 border border-dark-700 shadow-sm space-y-5 overflow-x-auto">
            <div className="flex justify-between items-center text-xs font-mono border-b border-dark-700 pb-3">
              <span className="text-slate-300 font-bold">
                Algorithm: <span className="text-cyan-400">{activeAlgo}</span> ({numWorkers} Worker Thread{numWorkers > 1 ? 's' : ''})
              </span>
              <span className="text-slate-400">
                Total Benchmark Duration: <span className="text-emerald-400 font-bold">{totalDuration.toFixed(1)} ms</span>
              </span>
            </div>

            {/* Worker Lanes */}
            <div className="space-y-4">
              {Array.from({ length: numWorkers }).map((_, workerIdx) => {
                const workerRecords = records.filter((r) => r.worker_id === workerIdx);

                return (
                  <div key={workerIdx} className="space-y-1.5">
                    <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
                      <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="font-semibold text-slate-200">Worker Lane #{workerIdx}</span>
                      <span className="text-[10px] text-slate-500">({workerRecords.length} slices)</span>
                    </div>

                    {/* Timeline bar */}
                    <div className="relative w-full h-12 bg-dark-900 border border-dark-700 rounded-lg overflow-hidden flex items-center">
                      {workerRecords.map((rec, rIdx) => {
                        const leftPercent = (rec.start_time / totalDuration) * 100;
                        const widthPercent = Math.max(1.5, (rec.duration / totalDuration) * 100);
                        const color = getColorForTask(rec.task_id);
                        const isSelected = selectedRecord === rec;

                        return (
                          <div
                            key={rIdx}
                            onClick={() => setSelectedRecord(rec)}
                            title={`${rec.task_id} (${rec.task_name}) [${rec.start_time.toFixed(1)}ms - ${rec.end_time.toFixed(1)}ms]`}
                            style={{
                              left: `${leftPercent}%`,
                              width: `${widthPercent}%`,
                              backgroundColor: color,
                            }}
                            className={`absolute h-9 rounded cursor-pointer transition-all flex items-center justify-center font-mono text-[10px] font-bold text-white shadow-sm border ${
                              isSelected
                                ? 'ring-2 ring-white border-white scale-105 z-20'
                                : 'border-black/30 hover:brightness-125 z-10'
                            }`}
                          >
                            <span className="truncate px-1">{rec.task_id}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Time Axis Ruler */}
            <div className="border-t border-dark-700 pt-2 flex justify-between text-[10px] font-mono text-slate-500">
              <span>0.0 ms</span>
              <span>{(totalDuration * 0.25).toFixed(0)} ms</span>
              <span>{(totalDuration * 0.5).toFixed(0)} ms</span>
              <span>{(totalDuration * 0.75).toFixed(0)} ms</span>
              <span>{totalDuration.toFixed(1)} ms</span>
            </div>
          </div>

          {/* Selected Execution Slice Inspection Box */}
          {selectedRecord && (
            <div className="p-5 rounded-xl bg-dark-800 border border-cyan-500/40 shadow-lg space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-dark-700 pb-2">
                <div className="flex items-center space-x-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getColorForTask(selectedRecord.task_id) }}
                  />
                  <span className="text-sm font-bold text-slate-100 font-mono">
                    {selectedRecord.task_id} — {selectedRecord.task_name}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-dark-900 border border-dark-600 text-slate-300 font-mono">
                    Worker #{selectedRecord.worker_id}
                  </span>
                </div>
                <span className="text-xs font-mono font-semibold text-emerald-400">
                  Status: {selectedRecord.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-2.5 rounded bg-dark-900 border border-dark-750">
                  <span className="text-slate-500 text-[10px] block">SLICE START</span>
                  <span className="text-slate-200 font-semibold">{selectedRecord.start_time.toFixed(2)} ms</span>
                </div>
                <div className="p-2.5 rounded bg-dark-900 border border-dark-750">
                  <span className="text-slate-500 text-[10px] block">SLICE END</span>
                  <span className="text-slate-200 font-semibold">{selectedRecord.end_time.toFixed(2)} ms</span>
                </div>
                <div className="p-2.5 rounded bg-dark-900 border border-dark-750">
                  <span className="text-slate-500 text-[10px] block">SLICE DURATION</span>
                  <span className="text-cyan-400 font-semibold">{selectedRecord.duration.toFixed(2)} ms</span>
                </div>
              </div>

              {selectedRecord.decision_reason && (
                <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-800/40 text-xs text-cyan-200">
                  <span className="font-semibold block mb-0.5 text-cyan-300">Dispatch Decision Reason:</span>
                  <p className="font-mono text-[11px]">{selectedRecord.decision_reason}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

