import React from 'react';
import {
  BarChart2,
  Award,
  Download,
  AlertCircle,
  Clock,
  Zap,
  Cpu,
  Layers,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  Cell
} from 'recharts';
import { ComparisonAnalysis, AlgorithmMetrics } from '../types';

interface ComparisonPageProps {
  comparison: ComparisonAnalysis | null;
  onExportCsv: () => void;
}

const ALGO_COLORS: Record<string, string> = {
  'FCFS': '#38bdf8', // sky
  'SJF': '#f59e0b', // amber
  'Round Robin': '#10b981', // emerald
  'Aegis Adaptive': '#c084fc', // purple
};

export const ComparisonPage: React.FC<ComparisonPageProps> = ({ comparison, onExportCsv }) => {
  const metrics = comparison?.algorithm_metrics || [];
  const winners = comparison?.metric_winners || [];
  const insights = comparison?.insights || [];
  const finalConclusion = comparison?.final_conclusion;

  if (metrics.length === 0) {
    return (
      <div className="p-16 text-center max-w-4xl mx-auto space-y-4">
        <BarChart2 className="w-12 h-12 mx-auto text-slate-600 opacity-60" />
        <h2 className="text-base font-bold text-slate-300">No Comparison Data Available</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Execute a benchmark experiment first to view real measured metrics and cross-algorithm analytics.
        </p>
      </div>
    );
  }

  // Chart data preparation
  const latencyData = metrics.map((m) => ({
    name: m.algorithm_name,
    'Waiting Time (ms)': m.avg_waiting_time_ms,
    'Turnaround Time (ms)': m.avg_turnaround_time_ms,
    'Response Time (ms)': m.avg_response_time_ms,
  }));

  const efficiencyData = metrics.map((m) => ({
    name: m.algorithm_name,
    'CPU Utilization (%)': m.cpu_utilization_percent,
    'Throughput (tasks/s)': m.throughput_tasks_per_sec * 10, // scaled for display
    raw_throughput: m.throughput_tasks_per_sec,
  }));

  const deadlineData = metrics.map((m) => ({
    name: m.algorithm_name,
    'Deadline Misses': m.deadline_misses,
    'Starvation Count': m.starvation_count,
  }));

  const overheadData = metrics.map((m) => ({
    name: m.algorithm_name,
    'Scheduling Overhead (ms)': m.scheduling_overhead_ms,
  }));

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="p-5 rounded-xl bg-dark-800 border border-dark-700 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-mono font-semibold uppercase mb-1">
            <BarChart2 className="w-4 h-4" />
            <span>Empirical Algorithm Evaluation</span>
          </div>
          <h2 className="text-lg font-bold text-slate-100">Intelligent Scheduling Algorithm Comparison</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Objective performance analytics derived from identical multithreaded CPU executions.
          </p>
        </div>

        <button
          onClick={onExportCsv}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 text-slate-200 text-xs font-semibold border border-dark-600 transition shadow-sm"
        >
          <Download className="w-4 h-4 text-cyan-400" />
          <span>Export Results (CSV)</span>
        </button>
      </div>

      {/* Metric Winners Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
          Metric Champions (Based on Authentic Measurements)
        </h3>
        <div className="grid grid-cols-4 gap-4">
          {winners.slice(0, 4).map((w, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-dark-800 border border-dark-700 space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-medium text-slate-400">{w.metric_name}</span>
                <Award className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-base font-bold font-mono text-cyan-400">
                {w.winning_algorithm}
              </div>
              <div className="text-xs font-mono text-slate-300 font-semibold">
                {w.winning_value} {w.unit}
              </div>
              <p className="text-[11px] text-slate-400 leading-tight mt-1">{w.explanation}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Graphical Charts Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Latency Chart */}
        <div className="p-5 rounded-xl bg-dark-800 border border-dark-700 space-y-4">
          <div className="flex justify-between items-center border-b border-dark-700 pb-2">
            <span className="text-xs font-bold font-mono text-slate-200">
              1. Latency & Timing Metrics (ms)
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Lower is better</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={latencyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} unit="ms" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111726', borderColor: '#26334d', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="Waiting Time (ms)" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Turnaround Time (ms)" fill="#a855f7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Response Time (ms)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Efficiency Chart */}
        <div className="p-5 rounded-xl bg-dark-800 border border-dark-700 space-y-4">
          <div className="flex justify-between items-center border-b border-dark-700 pb-2">
            <span className="text-xs font-bold font-mono text-slate-200">
              2. CPU Utilization (%) & Throughput
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Higher is better</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={efficiencyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111726', borderColor: '#26334d', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="CPU Utilization (%)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Throughput (tasks/s)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Real-Time & Fairness Chart */}
        <div className="p-5 rounded-xl bg-dark-800 border border-dark-700 space-y-4">
          <div className="flex justify-between items-center border-b border-dark-700 pb-2">
            <span className="text-xs font-bold font-mono text-slate-200">
              3. Deadline Misses & Starvation Count
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Zero is ideal</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deadlineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111726', borderColor: '#26334d', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="Deadline Misses" fill="#fb7185" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Starvation Count" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Scheduling Overhead Chart */}
        <div className="p-5 rounded-xl bg-dark-800 border border-dark-700 space-y-4">
          <div className="flex justify-between items-center border-b border-dark-700 pb-2">
            <span className="text-xs font-bold font-mono text-slate-200">
              4. Algorithmic Scheduling Overhead (ms)
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Lower is better</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overheadData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} unit="ms" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111726', borderColor: '#26334d', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="Scheduling Overhead (ms)" fill="#38bdf8" radius={[4, 4, 0, 0]}>
                  {overheadData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={ALGO_COLORS[entry.name] || '#38bdf8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Side-by-Side Performance Comparison Summary Table */}
      <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-dark-700 flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
            Performance Summary Matrix
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            Measured across {metrics[0]?.completed_tasks ?? 0} tasks & {metrics[0]?.num_workers ?? 1} worker thread(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-dark-900/70 border-b border-dark-700 text-slate-400 uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Evaluation Metric</th>
                {metrics.map((m) => (
                  <th key={m.algorithm_name} className="py-3 px-4 text-center">
                    <span className="font-bold text-slate-200">{m.algorithm_name}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700/60">
              <tr>
                <td className="py-3 px-4 text-slate-300 font-sans font-medium">Average Waiting Time</td>
                {metrics.map((m) => (
                  <td key={m.algorithm_name} className="py-3 px-4 text-center text-cyan-400 font-bold">
                    {m.avg_waiting_time_ms} ms
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 px-4 text-slate-300 font-sans font-medium">Average Turnaround Time</td>
                {metrics.map((m) => (
                  <td key={m.algorithm_name} className="py-3 px-4 text-center text-purple-400 font-bold">
                    {m.avg_turnaround_time_ms} ms
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 px-4 text-slate-300 font-sans font-medium">Average Response Time</td>
                {metrics.map((m) => (
                  <td key={m.algorithm_name} className="py-3 px-4 text-center text-emerald-400 font-bold">
                    {m.avg_response_time_ms} ms
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 px-4 text-slate-300 font-sans font-medium">CPU Utilization</td>
                {metrics.map((m) => (
                  <td key={m.algorithm_name} className="py-3 px-4 text-center text-slate-200 font-semibold">
                    {m.cpu_utilization_percent}%
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 px-4 text-slate-300 font-sans font-medium">Throughput</td>
                {metrics.map((m) => (
                  <td key={m.algorithm_name} className="py-3 px-4 text-center text-amber-400 font-bold">
                    {m.throughput_tasks_per_sec} tasks/s
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 px-4 text-slate-300 font-sans font-medium">Deadline Misses</td>
                {metrics.map((m) => (
                  <td
                    key={m.algorithm_name}
                    className={`py-3 px-4 text-center font-bold ${
                      m.deadline_misses === 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {m.deadline_misses}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 px-4 text-slate-300 font-sans font-medium">Starvation Count</td>
                {metrics.map((m) => (
                  <td
                    key={m.algorithm_name}
                    className={`py-3 px-4 text-center font-bold ${
                      m.starvation_count === 0 ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {m.starvation_count}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 px-4 text-slate-300 font-sans font-medium">Scheduling Overhead</td>
                {metrics.map((m) => (
                  <td key={m.algorithm_name} className="py-3 px-4 text-center text-slate-400">
                    {m.scheduling_overhead_ms} ms
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Automated Analytical Explanation (Module 6E) */}
      <div className="p-6 rounded-xl bg-dark-800 border border-purple-500/30 space-y-4 shadow-sm">
        <div className="flex items-center space-x-2 text-purple-400 text-xs font-mono font-semibold uppercase">
          <Award className="w-4 h-4" />
          <span>Automated Performance Analysis & Evaluation Report</span>
        </div>

        <div className="space-y-2 text-xs text-slate-300 leading-relaxed font-sans">
          {insights.map((insight, idx) => (
            <div key={idx} className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 mt-1.5" />
              <span>{insight}</span>
            </div>
          ))}
        </div>

        {finalConclusion && (
          <div className="p-3.5 rounded-lg bg-dark-900 border border-purple-500/20 text-xs text-slate-200 font-mono">
            <span className="text-purple-300 font-bold block mb-1">Conclusion:</span>
            <p>{finalConclusion}</p>
          </div>
        )}
      </div>
    </div>
  );
};

