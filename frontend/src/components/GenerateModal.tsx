import React, { useState } from 'react';
import { X, Sparkles, Layers, Sliders, Dna } from 'lucide-react';

interface GenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (params: {
    count: number;
    mode: string;
    min_size: number;
    max_size: number;
    seed: number;
  }) => void;
}

export const GenerateModal: React.FC<GenerateModalProps> = ({
  isOpen,
  onClose,
  onGenerate
}) => {
  const [count, setCount] = useState<number>(8);
  const [mode, setMode] = useState<string>('mixed');
  const [minSize, setMinSize] = useState<number>(50);
  const [maxSize, setMaxSize] = useState<number>(250);
  const [seed, setSeed] = useState<number>(42);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate({
      count,
      mode,
      min_size: minSize,
      max_size: maxSize,
      seed
    });
    onClose();
  };

  const modes = [
    {
      id: 'mixed',
      title: 'Mixed Workload (Recommended)',
      desc: '40% short, 40% medium, 20% long jobs. Ideal for comparing convoy effect vs time-sharing.'
    },
    {
      id: 'deadline_sensitive',
      title: 'Deadline-Sensitive Workload',
      desc: 'Tight deadlines relative to burst duration. Ideal for testing Aegis deadline urgency.'
    },
    {
      id: 'cpu_intensive',
      title: 'CPU-Intensive Workload',
      desc: 'Heavy matrix multiplication & sorting passes with high burst profiles.'
    },
    {
      id: 'random',
      title: 'Uniform Random Workload',
      desc: 'Uniform randomized distribution across all 5 computation kernels.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-dark-800 border border-dark-600 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in duration-200">
        <div className="px-6 py-4 border-b border-dark-700 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Generate Benchmark Workload</h2>
              <p className="text-xs text-slate-400">Synthesize realistic deterministic task batches</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-dark-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">Workload Generation Mode</label>
            <div className="grid grid-cols-1 gap-2">
              {modes.map((m) => {
                const isSelected = mode === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/40 text-slate-100'
                        : 'bg-dark-900 border-dark-700 text-slate-400 hover:border-dark-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200">{m.title}</span>
                      {isSelected && <span className="w-2 h-2 rounded-full bg-amber-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{m.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Number of Processes
              </label>
              <input
                type="number"
                min="1"
                max="50"
                required
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-lg bg-dark-900 border border-dark-600 text-slate-200 text-xs focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Random Seed (Reproducibility)
              </label>
              <input
                type="number"
                required
                value={seed}
                onChange={(e) => setSeed(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-lg bg-dark-900 border border-dark-600 text-slate-200 text-xs focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Min Workload Size
              </label>
              <input
                type="number"
                min="10"
                max="1000"
                required
                value={minSize}
                onChange={(e) => setMinSize(parseInt(e.target.value) || 10)}
                className="w-full px-3 py-2 rounded-lg bg-dark-900 border border-dark-600 text-slate-200 text-xs focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Max Workload Size
              </label>
              <input
                type="number"
                min="20"
                max="5000"
                required
                value={maxSize}
                onChange={(e) => setMaxSize(parseInt(e.target.value) || 20)}
                className="w-full px-3 py-2 rounded-lg bg-dark-900 border border-dark-600 text-slate-200 text-xs focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-dark-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 text-slate-300 text-xs font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md shadow-amber-600/30 transition flex items-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate Workload</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

