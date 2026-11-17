import {
  ProcessTask,
  AlgorithmInfo,
  ExperimentConfig,
  AlgorithmExecutionStats,
  ComparisonAnalysis,
  SavedExperiment,
  ExperimentLiveStatus
} from '../types';

const API_BASE = 'http://localhost:8080/api';

export const api = {
  // Process CRUD
  async getProcesses(): Promise<ProcessTask[]> {
    const res = await fetch(`${API_BASE}/processes`);
    if (!res.ok) throw new Error('Failed to fetch processes');
    return res.json();
  },

  async createProcess(task: Partial<ProcessTask>): Promise<ProcessTask> {
    const res = await fetch(`${API_BASE}/processes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    if (!res.ok) throw new Error('Failed to create process');
    return res.json();
  },

  async getProcess(id: string): Promise<ProcessTask> {
    const res = await fetch(`${API_BASE}/processes/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch process ${id}`);
    return res.json();
  },

  async updateProcess(id: string, task: Partial<ProcessTask>): Promise<ProcessTask> {
    const res = await fetch(`${API_BASE}/processes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    if (!res.ok) throw new Error(`Failed to update process ${id}`);
    return res.json();
  },

  async deleteProcess(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/processes/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`Failed to delete process ${id}`);
    return res.json();
  },

  async clearProcesses(): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/processes`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to clear processes');
    return res.json();
  },

  async generateProcesses(params: {
    count: number;
    mode: string;
    min_size: number;
    max_size: number;
    seed?: number;
  }): Promise<ProcessTask[]> {
    const res = await fetch(`${API_BASE}/processes/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to generate processes');
    return res.json();
  },

  // Algorithm Info
  async getAlgorithms(): Promise<AlgorithmInfo[]> {
    const res = await fetch(`${API_BASE}/algorithms`);
    if (!res.ok) throw new Error('Failed to fetch algorithms');
    return res.json();
  },

  // Experiment Configuration
  async getExperimentConfig(): Promise<ExperimentConfig> {
    const res = await fetch(`${API_BASE}/experiments/config`);
    if (!res.ok) throw new Error('Failed to fetch config');
    return res.json();
  },

  async configureExperiment(config: ExperimentConfig): Promise<ExperimentConfig> {
    const res = await fetch(`${API_BASE}/experiments/configure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (!res.ok) throw new Error('Failed to save configuration');
    return res.json();
  },

  // Experiment Controls
  async startExperiment(config?: ExperimentConfig): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/experiments/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: config ? JSON.stringify(config) : '{}',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to start experiment' }));
      throw new Error(err.error || 'Failed to start experiment');
    }
    return res.json();
  },

  async pauseExperiment(): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/experiments/pause`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to pause experiment');
    return res.json();
  },

  async resumeExperiment(): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/experiments/resume`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to resume experiment');
    return res.json();
  },

  async stopExperiment(): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/experiments/stop`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to stop experiment');
    return res.json();
  },

  async getExperimentStatus(): Promise<ExperimentLiveStatus> {
    const res = await fetch(`${API_BASE}/experiments/status`);
    if (!res.ok) throw new Error('Failed to get status');
    return res.json();
  },

  // Results & Analytics
  async getExperimentResults(): Promise<AlgorithmExecutionStats[]> {
    const res = await fetch(`${API_BASE}/experiments/results`);
    if (!res.ok) throw new Error('Failed to fetch results');
    return res.json();
  },

  async getGanttData(algo?: string): Promise<Record<string, { num_workers: number; total_duration_ms: number; records: any[] }>> {
    const url = algo ? `${API_BASE}/experiments/gantt?algo=${encodeURIComponent(algo)}` : `${API_BASE}/experiments/gantt`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch Gantt data');
    return res.json();
  },

  async getComparison(): Promise<ComparisonAnalysis> {
    const res = await fetch(`${API_BASE}/experiments/comparison`);
    if (!res.ok) throw new Error('Failed to fetch comparison');
    return res.json();
  },

  async getHistory(): Promise<SavedExperiment[]> {
    const res = await fetch(`${API_BASE}/experiments/history`);
    if (!res.ok) throw new Error('Failed to fetch history');
    return res.json();
  },

  getExportCsvUrl(id?: string): string {
    return id ? `${API_BASE}/experiments/export?id=${encodeURIComponent(id)}` : `${API_BASE}/experiments/export`;
  }
};

