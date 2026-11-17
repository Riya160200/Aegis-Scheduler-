import React from 'react';
import {
  Layers,
  CheckSquare,
  Square,
  ArrowRight,
  Sparkles,
  Zap,
  Clock,
  Shuffle,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { AlgorithmInfo } from '../types';

interface AlgorithmSelectionPageProps {
  algorithms: AlgorithmInfo[];
  selectedAlgorithms: string[];
  onToggleAlgorithm: (algoId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onNavigateNext: () => void;
}

export const AlgorithmSelectionPage: React.FC<AlgorithmSelectionPageProps> = ({
  algorithms,
  selectedAlgorithms,
  onToggleAlgorithm,
  onSelectAll,
  onDeselectAll,
  onNavigateNext
}) => {
  const isAllSelected = algorithms.length > 0 && selectedAlgorithms.length === algorithms.length;

  const getAlgoIcon = (id: string) => {
    switch (id) {
      case 'FCFS': return <Clock className="w-5 h-5 text-cyan-400" />;
      case 'SJF': return <Zap className="w-5 h-5 text-amber-400" />;
      case 'Round Robin': return <Shuffle className="w-5 h-5 text-emerald-400" />;
      case 'Aegis Adaptive': return <Sparkles className="w-5 h-5 text-purple-400" />;
      default: return <Layers className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header card */}
      <div className="p-5 rounded-xl bg-dark-800 border border-dark-700 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-mono font-semibold uppercase mb-1">
            <Layers className="w-4 h-4" />
            <span>Interactive Scheduling Comparison Matrix</span>
          </div>
          <h2 className="text-lg font-bold text-slate-100">Select Algorithms for Benchmark Comparison</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Choose which CPU scheduling policies will compete on the exact same set of computational workloads.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={isAllSelected ? onDeselectAll : onSelectAll}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 text-slate-200 text-xs font-medium border border-dark-600 transition"
          >
            {isAllSelected ? <Square className="w-4 h-4" /> : <CheckSquare className="w-4 h-4 text-cyan-400" />}
            <span>{isAllSelected ? 'Deselect All' : 'Select All Algorithms'}</span>
          </button>

          <button
            disabled={selectedAlgorithms.length === 0}
            onClick={onNavigateNext}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition shadow-md ${
              selectedAlgorithms.length > 0
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                : 'bg-dark-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            <span>Configure Parameters ({selectedAlgorithms.length})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {selectedAlgorithms.length === 0 && (
        <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/50 flex items-center space-x-3 text-xs text-amber-200">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <span>Please select at least one algorithm to benchmark before proceeding.</span>
        </div>
      )}

      {/* Algorithm Cards Grid */}
      <div className="grid grid-cols-2 gap-5">
        {algorithms.map((algo) => {
          const isSelected = selectedAlgorithms.includes(algo.id) || selectedAlgorithms.includes(algo.name);

          return (
            <div
              key={algo.id}
              onClick={() => onToggleAlgorithm(algo.id)}
              className={`p-5 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'bg-dark-800 border-cyan-500/60 shadow-lg shadow-cyan-500/5 ring-1 ring-cyan-500/30'
                  : 'bg-dark-850 border-dark-700 hover:border-dark-600 opacity-70 hover:opacity-100'
              }`}
            >
              {/* Top Bar */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-dark-900 border border-dark-700">
                      {getAlgoIcon(algo.id)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                        <span>{algo.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-dark-900 font-mono text-slate-400">
                          {algo.short_name}
                        </span>
                      </h3>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {algo.is_preemptive ? 'Preemptive Time-Sliced' : 'Non-Preemptive Batch'}
                      </span>
                    </div>
                  </div>

                  <div className="text-cyan-400">
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-cyan-400 fill-cyan-400/20" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-500" />
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {algo.description}
                </p>

                {/* Mathematical Formula if present */}
                {algo.formula && (
                  <div className="p-3 rounded-lg bg-dark-900 border border-purple-500/30 font-mono text-xs text-purple-300 mb-4 flex items-center justify-between">
                    <span className="text-slate-400 text-[10px] uppercase font-semibold">Adaptive Scoring Formula:</span>
                    <span className="font-bold text-purple-200">{algo.formula}</span>
                  </div>
                )}

                {/* Characteristics */}
                <div className="space-y-1.5 mb-4">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block font-mono">
                    Key Scheduling Properties:
                  </span>
                  {algo.characteristics.map((char, idx) => (
                    <div key={idx} className="flex items-center space-x-2 text-xs text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                      <span>{char}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Best For Pill */}
              <div className="pt-3 border-t border-dark-700/80 flex items-center justify-between text-[11px] text-slate-400">
                <span className="text-slate-500 font-medium">Optimal Workload:</span>
                <span className="font-semibold text-slate-300">{algo.best_for}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

