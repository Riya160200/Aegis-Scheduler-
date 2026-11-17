import React, { useState } from 'react';
import { Sliders, Cpu, Clock, Sparkles, Save, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { ExperimentConfig } from '../types';

interface ConfigurationPageProps {
  config: ExperimentConfig;
  onSaveConfig: (cfg: ExperimentConfig) => void;
  onNavigateExecute: () => void;
}

export const ConfigurationPage: React.FC<ConfigurationPageProps> = ({
  config,
  onSaveConfig,
  onNavigateExecute
}) => {
  const [experimentName, setExperimentName] = useState(config.experiment_name);
  const [numWorkers, setNumWorkers] = useState(config.num_workers);
  const [rrQuantumUnits, setRrQuantumUnits] = useState(config.rr_quantum_units);
  const [rrQuantumMs, setRrQuantumMs] = useState(config.rr_quantum_ms);
  const [w1, setW1] = useState(config.aegis_weights.w1);
  const [w2, setW2] = useState(config.aegis_weights.w2);
  const [w3, setW3] = useState(config.aegis_weights.w3);
  const [starvationThreshold, setStarvationThreshold] = useState(config.starvation_threshold_ms);
  const [savedMessage, setSavedMessage] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: ExperimentConfig = {
      ...config,
      experiment_name: experimentName,
      num_workers: numWorkers,
      rr_quantum_units: rrQuantumUnits,
      rr_quantum_ms: rrQuantumMs,
      aegis_weights: { w1, w2, w3 },
      starvation_threshold_ms: starvationThreshold
    };
    onSaveConfig(updated);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header card */}
      <div className="p-5 rounded-xl bg-dark-800 border border-dark-700 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-mono font-semibold uppercase mb-1">
            <Sliders className="w-4 h-4" />
            <span>Execution Environment & Parameters</span>
          </div>
          <h2 className="text-lg font-bold text-slate-100">Scheduler Configuration & Worker Threads</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure multithreaded worker core concurrency, Round Robin time slice budgets, and Aegis dynamic priority weights.
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

      <form onSubmit={handleSave} className="space-y-6">
        {/* Experiment Identity */}
        <div className="p-5 rounded-xl bg-dark-800 border border-dark-700 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 font-mono flex items-center space-x-2">
            <span>Experiment Identity</span>
          </h3>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Benchmark Experiment Name
            </label>
            <input
              type="text"
              required
              value={experimentName}
              onChange={(e) => setExperimentName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-dark-900 border border-dark-600 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>
        </div>

        {/* Worker Threads & Multithreading Section */}
        <div className="p-5 rounded-xl bg-dark-800 border border-dark-700 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 font-mono flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Worker Threads (Concurrency Core Pool)</span>
            </h3>
            <span className="text-xs font-mono text-cyan-400 font-semibold">
              {numWorkers === 1 ? 'Single-Core CPU Simulation' : `${numWorkers} Concurrent Worker Threads`}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 4, 8].map((cores) => {
              const isSelected = numWorkers === cores;
              return (
                <div
                  key={cores}
                  onClick={() => setNumWorkers(cores)}
                  className={`p-3.5 rounded-lg border text-center cursor-pointer transition ${
                    isSelected
                      ? 'bg-cyan-600/15 border-cyan-500 text-slate-100 ring-1 ring-cyan-500/40 shadow-sm'
                      : 'bg-dark-900 border-dark-700 text-slate-400 hover:border-dark-600'
                  }`}
                >
                  <div className="text-base font-bold font-mono text-slate-200">{cores} Worker{cores > 1 ? 's' : ''}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {cores === 1 ? 'Single CPU Mode' : `SMP Parallel Pool`}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 rounded-lg bg-dark-900 border border-dark-700 text-[11px] text-slate-400 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-300">Single vs. Multi-Worker Architecture:</span>
              <p className="mt-0.5">
                • <strong>1 Worker</strong> replicates classical single-core CPU scheduling where only one process executes at any timestamp.<br/>
                • <strong>2, 4, or 8 Workers</strong> demonstrate true multithreaded task scheduling where independent worker threads pull tasks from the shared scheduler concurrently.
              </p>
            </div>
          </div>
        </div>

        {/* Round Robin Quantum Parameters */}
        <div className="p-5 rounded-xl bg-dark-800 border border-dark-700 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 font-mono flex items-center space-x-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>Round Robin Time Quantum Configuration</span>
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Quantum Work Units per Slice
              </label>
              <input
                type="number"
                min="5"
                max="200"
                required
                value={rrQuantumUnits}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 10;
                  setRrQuantumUnits(val);
                  setRrQuantumMs(Math.round(val * 1.5));
                }}
                className="w-full px-3 py-2 rounded-lg bg-dark-900 border border-dark-600 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Workload iteration units executed before yielding</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Nominal Quantum Time (ms)
              </label>
              <input
                type="number"
                min="5"
                max="500"
                required
                value={rrQuantumMs}
                onChange={(e) => setRrQuantumMs(parseFloat(e.target.value) || 10)}
                className="w-full px-3 py-2 rounded-lg bg-dark-900 border border-dark-600 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Estimated wall-clock duration of quantum</span>
            </div>
          </div>
        </div>

        {/* Aegis Adaptive Weights Configuration */}
        <div className="p-5 rounded-xl bg-dark-800 border border-dark-700 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 font-mono flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Aegis Dynamic Priority Weights (Formula: P = w1·D + w2·W - w3·C)</span>
            </h3>
            <span className="text-xs font-mono text-purple-300">
              w1={w1.toFixed(2)}, w2={w2.toFixed(2)}, w3={w3.toFixed(2)}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>w1 — Deadline Urgency Weight (D)</span>
                <span className="font-mono text-cyan-400 font-bold">{w1.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={w1}
                onChange={(e) => setW1(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 block">Higher value prioritizes tasks whose deadlines are impending or tight.</span>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>w2 — Waiting Time / Starvation Aging Weight (W)</span>
                <span className="font-mono text-emerald-400 font-bold">{w2.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={w2}
                onChange={(e) => setW2(parseFloat(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 block">Boosts priority as task sits waiting in the ready queue, strictly preventing starvation.</span>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>w3 — Recent CPU Consumption Penalty Weight (C)</span>
                <span className="font-mono text-rose-400 font-bold">{w3.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={w3}
                onChange={(e) => setW3(parseFloat(e.target.value))}
                className="w-full accent-rose-400 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 block">Penalizes long CPU hogs to ensure quick initial response times for newer tasks.</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Starvation Threshold (ms)
              </label>
              <input
                type="number"
                min="100"
                max="5000"
                required
                value={starvationThreshold}
                onChange={(e) => setStarvationThreshold(parseFloat(e.target.value) || 500)}
                className="w-full px-3 py-2 rounded-lg bg-dark-900 border border-dark-600 text-slate-200 text-xs focus:outline-none focus:border-purple-500 font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Waiting duration beyond which a process is classified as starved and aging reaches saturation.</span>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-2">
          {savedMessage && (
            <span className="text-xs font-mono text-emerald-400 flex items-center space-x-1.5 animate-in fade-in">
              <ShieldCheck className="w-4 h-4" />
              <span>Configuration successfully saved to C++ backend!</span>
            </span>
          )}
          {!savedMessage && <span />}

          <button
            type="submit"
            className="flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-600/30 transition ml-auto"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};

