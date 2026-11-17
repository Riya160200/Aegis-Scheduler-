import React from 'react';
import {
  Cpu,
  ListOrdered,
  Layers,
  Sliders,
  PlayCircle,
  BarChart2,
  GitCommit,
  History,
  Activity
} from 'lucide-react';

export type TabId =
  | 'process-manager'
  | 'ready-queue'
  | 'algorithm-selection'
  | 'configuration'
  | 'execute-experiment'
  | 'gantt-visualization'
  | 'performance-comparison'
  | 'experiment-history';

interface SidebarProps {
  currentTab: TabId;
  onSelectTab: (tab: TabId) => void;
  isRunning?: boolean;
  activeAlgo?: string;
  totalProcesses?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isRunning,
  activeAlgo,
  totalProcesses = 0
}) => {
  const navItems: { id: TabId; label: string; icon: React.ReactNode; badge?: string | number }[] = [
    { id: 'process-manager', label: 'Process Manager', icon: <Cpu className="w-5 h-5" />, badge: totalProcesses },
    { id: 'ready-queue', label: 'Ready Queue', icon: <ListOrdered className="w-5 h-5" /> },
    { id: 'algorithm-selection', label: 'Algorithm Selection', icon: <Layers className="w-5 h-5" /> },
    { id: 'configuration', label: 'Configuration', icon: <Sliders className="w-5 h-5" /> },
    {
      id: 'execute-experiment',
      label: 'Execute Experiment',
      icon: <PlayCircle className="w-5 h-5" />,
      badge: isRunning ? 'RUNNING' : undefined
    },
    { id: 'gantt-visualization', label: 'Gantt Visualization', icon: <GitCommit className="w-5 h-5" /> },
    { id: 'performance-comparison', label: 'Performance Comparison', icon: <BarChart2 className="w-5 h-5" /> },
    { id: 'experiment-history', label: 'Experiment History', icon: <History className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-64 bg-dark-900 border-r border-dark-700 flex flex-col justify-between shrink-0 select-none">
      <div>
        {/* Brand header */}
        <div className="p-5 border-b border-dark-700 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-sm shadow-cyan-500/10">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-base tracking-wider text-slate-100 font-mono">AEGIS</span>
              <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Multithreaded Task Scheduler</p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-600/15 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-500/5'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-dark-800'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className={isActive ? 'text-cyan-400' : 'text-slate-500'}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      item.badge === 'RUNNING'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse font-semibold'
                        : 'bg-dark-700 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer status box */}
      <div className="p-4 border-t border-dark-700 bg-dark-900/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Engine Status</span>
          <span className="flex items-center space-x-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isRunning ? 'bg-emerald-400 animate-ping' : 'bg-cyan-400'
              }`}
            />
            <span className="text-[11px] font-mono text-slate-300">
              {isRunning ? 'EXECUTING' : 'READY'}
            </span>
          </span>
        </div>

        {isRunning && activeAlgo && (
          <div className="p-2 rounded bg-dark-800 border border-dark-600 text-[11px] font-mono text-cyan-300 truncate">
            Current: <span className="font-semibold text-slate-100">{activeAlgo}</span>
          </div>
        )}

        <div className="mt-3 text-[10px] text-slate-500 flex justify-between">
          <span>Backend: C++17 native</span>
          <span>Port 8080</span>
        </div>
      </div>
    </aside>
  );
};

