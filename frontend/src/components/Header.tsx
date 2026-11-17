import React from 'react';
import { Play, Plus, RefreshCw, Sparkles } from 'lucide-react';
import { TabId } from './Sidebar';

interface HeaderProps {
  currentTab: TabId;
  totalProcesses: number;
  onAddProcess: () => void;
  onGenerateProcesses: () => void;
  onStartComparison: () => void;
  onNavigateTab: (tab: TabId) => void;
  isRunning?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  totalProcesses,
  onAddProcess,
  onGenerateProcesses,
  onStartComparison,
  onNavigateTab,
  isRunning
}) => {
  const getTabTitle = () => {
    switch (currentTab) {
      case 'process-manager': return 'Process Manager & Workload Creation';
      case 'ready-queue': return 'Real-time Ready Queue & Task States';
      case 'algorithm-selection': return 'Scheduling Algorithm Selection';
      case 'configuration': return 'Worker & Algorithm Parameter Configuration';
      case 'execute-experiment': return 'Benchmark Execution & Live Monitor';
      case 'gantt-visualization': return 'Multi-Worker Gantt Timeline Visualizer';
      case 'performance-comparison': return 'Comprehensive Performance Metrics Comparison';
      case 'experiment-history': return 'Experiment History & Artifact Archive';
    }
  };

  return (
    <header className="h-16 border-b border-dark-700 bg-dark-900/80 backdrop-blur px-6 flex items-center justify-between shrink-0">
      <div>
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <span className="font-mono text-cyan-400">AEGIS</span>
          <span>/</span>
          <span className="capitalize">{currentTab.replace('-', ' ')}</span>
        </div>
        <h1 className="text-base font-bold text-slate-100">{getTabTitle()}</h1>
      </div>

      <div className="flex items-center space-x-3">
        {currentTab === 'process-manager' && (
          <>
            <button
              onClick={onGenerateProcesses}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-dark-700 hover:bg-dark-600 text-slate-200 text-xs font-medium border border-dark-600 transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Generate Workload</span>
            </button>
            <button
              onClick={onAddProcess}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm shadow-cyan-600/30 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Process</span>
            </button>
            <button
              onClick={() => onNavigateTab('algorithm-selection')}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm shadow-emerald-600/30 transition-all ml-2"
            >
              <span>Next: Select Algorithms</span>
              <span className="text-emerald-200">→</span>
            </button>
          </>
        )}

        {currentTab !== 'process-manager' && (
          <div className="flex items-center space-x-3">
            <div className="px-3 py-1 rounded bg-dark-800 border border-dark-700 text-xs text-slate-300 font-mono">
              Tasks: <span className="text-cyan-400 font-bold">{totalProcesses}</span>
            </div>
            {!isRunning && totalProcesses > 0 && currentTab !== 'execute-experiment' && (
              <button
                onClick={onStartComparison}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm shadow-emerald-600/30 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Benchmark</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

