import React, { useState, useEffect } from 'react';
import { X, Cpu, Clock, AlertCircle } from 'lucide-react';
import { ProcessTask, WorkloadType } from '../types';

interface ProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (processData: Partial<ProcessTask>) => void;
  initialData?: ProcessTask | null;
}

const WORKLOAD_TYPES: WorkloadType[] = [
  'Prime Number Calculation',
  'Matrix Multiplication',
  'Sorting',
  'Data Processing',
  'Mathematical Computation'
];

export const ProcessModal: React.FC<ProcessModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData
}) => {
  const [name, setName] = useState('Task_1');
  const [workloadType, setWorkloadType] = useState<WorkloadType>('Prime Number Calculation');
  const [workloadSize, setWorkloadSize] = useState<number>(100);
  const [arrivalTime, setArrivalTime] = useState<number>(0);
  const [estimatedBurst, setEstimatedBurst] = useState<number>(150);
  const [deadline, setDeadline] = useState<number>(500);
  const [priority, setPriority] = useState<number>(5);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setWorkloadType(initialData.workload_type);
      setWorkloadSize(initialData.workload_size);
      setArrivalTime(initialData.arrival_time);
      setEstimatedBurst(initialData.estimated_burst_time);
      setDeadline(initialData.deadline);
      setPriority(initialData.base_priority);
    } else {
      setName(`Task_${Math.floor(Math.random() * 900 + 100)}`);
      setWorkloadType('Prime Number Calculation');
      setWorkloadSize(100);
      setArrivalTime(0);
      setEstimatedBurst(150);
      setDeadline(600);
      setPriority(5);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      workload_type: workloadType,
      workload_size: workloadSize,
      arrival_time: arrivalTime,
      estimated_burst_time: estimatedBurst,
      deadline,
      priority,
      base_priority: priority
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-dark-800 border border-dark-600 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in duration-200">
        <div className="px-6 py-4 border-b border-dark-700 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                {initialData ? `Edit Task (${initialData.id})` : 'Add New Computational Process'}
              </h2>
              <p className="text-xs text-slate-400">Configure CPU workload parameters and timing bounds</p>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Process Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-dark-900 border border-dark-600 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Workload Type</label>
              <select
                value={workloadType}
                onChange={(e) => setWorkloadType(e.target.value as WorkloadType)}
                className="w-full px-3 py-2 rounded-lg bg-dark-900 border border-dark-600 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
              >
                {WORKLOAD_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Workload Size (Units)
                <span className="text-[10px] text-slate-400 ml-1">(50 - 2000)</span>
              </label>
              <input
                type="number"
                min="10"
                max="5000"
                required
                value={workloadSize}
                onChange={(e) => {
                  const sz = parseInt(e.target.value) || 10;
                  setWorkloadSize(sz);
                  // auto suggest estimated burst
                  setEstimatedBurst(Math.round(sz * 1.5));
                }}
                className="w-full px-3 py-2 rounded-lg bg-dark-900 border border-dark-600 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Estimated Burst Time (ms)
              </label>
              <input
                type="number"
                min="5"
                required
                value={estimatedBurst}
                onChange={(e) => setEstimatedBurst(parseFloat(e.target.value) || 5)}
                className="w-full px-3 py-2 rounded-lg bg-dark-900 border border-dark-600 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Arrival Time (ms)
              </label>
              <input
                type="number"
                min="0"
                required
                value={arrivalTime}
                onChange={(e) => setArrivalTime(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-lg bg-dark-900 border border-dark-600 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Deadline (ms)
              </label>
              <input
                type="number"
                min="10"
                required
                value={deadline}
                onChange={(e) => setDeadline(parseFloat(e.target.value) || 10)}
                className="w-full px-3 py-2 rounded-lg bg-dark-900 border border-dark-600 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Priority (1-10)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                required
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value) || 5)}
                className="w-full px-3 py-2 rounded-lg bg-dark-900 border border-dark-600 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-dark-900 border border-dark-700 flex items-start space-x-2 text-[11px] text-slate-400">
            <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p>
              This task triggers genuine CPU-bound calculations in C++ worker threads. Workload units directly govern matrix dimensions, sorting array size, or prime sieve spans.
            </p>
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
              className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-600/30 transition"
            >
              {initialData ? 'Save Changes' : 'Create Process'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

