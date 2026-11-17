import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, TabId } from './components/Sidebar';
import { Header } from './components/Header';
import { ProcessModal } from './components/ProcessModal';
import { GenerateModal } from './components/GenerateModal';
import { ProcessDetailModal } from './components/ProcessDetailModal';

import { ProcessManagerPage } from './pages/ProcessManagerPage';
import { ReadyQueuePage } from './pages/ReadyQueuePage';
import { AlgorithmSelectionPage } from './pages/AlgorithmSelectionPage';
import { ConfigurationPage } from './pages/ConfigurationPage';
import { ExecutionPage } from './pages/ExecutionPage';
import { GanttPage } from './pages/GanttPage';
import { ComparisonPage } from './pages/ComparisonPage';
import { HistoryPage } from './pages/HistoryPage';

import { api } from './services/api';
import { wsClient } from './services/websocket';
import {
  ProcessTask,
  AlgorithmInfo,
  ExperimentConfig,
  ExperimentLiveStatus,
  ComparisonAnalysis,
  SavedExperiment,
  GanttRecord
} from './types';

export const App: React.FC = () => {
  // Navigation State - STRICTLY defaults to 'process-manager'
  const [currentTab, setCurrentTab] = useState<TabId>('process-manager');

  // Data State
  const [processes, setProcesses] = useState<ProcessTask[]>([]);
  const [algorithms, setAlgorithms] = useState<AlgorithmInfo[]>([]);
  const [selectedAlgorithms, setSelectedAlgorithms] = useState<string[]>([
    'FCFS',
    'SJF',
    'Round Robin',
    'Aegis Adaptive'
  ]);
  const [config, setConfig] = useState<ExperimentConfig>({
    experiment_name: 'Aegis_Benchmark_Run_01',
    selected_algorithms: ['FCFS', 'SJF', 'Round Robin', 'Aegis Adaptive'],
    num_workers: 2,
    rr_quantum_units: 30,
    rr_quantum_ms: 45.0,
    aegis_weights: { w1: 0.45, w2: 0.35, w3: 0.20 },
    starvation_threshold_ms: 500.0
  });

  const [liveStatus, setLiveStatus] = useState<ExperimentLiveStatus | null>(null);
  const [ganttData, setGanttData] = useState<Record<string, { num_workers: number; total_duration_ms: number; records: GanttRecord[] }>>({});
  const [comparison, setComparison] = useState<ComparisonAnalysis | null>(null);
  const [history, setHistory] = useState<SavedExperiment[]>([]);

  // Modal State
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [selectedDetailTask, setSelectedDetailTask] = useState<ProcessTask | null>(null);
  const [editingTask, setEditingTask] = useState<ProcessTask | null>(null);

  // Fetch initial processes and algorithms
  const loadProcesses = useCallback(async () => {
    try {
      const data = await api.getProcesses();
      setProcesses(data);
    } catch (e) {
      console.error('Failed to load processes', e);
    }
  }, []);

  const loadAlgorithms = useCallback(async () => {
    try {
      const algos = await api.getAlgorithms();
      setAlgorithms(algos);
    } catch (e) {
      console.error('Failed to load algorithms', e);
    }
  }, []);

  const loadConfig = useCallback(async () => {
    try {
      const cfg = await api.getExperimentConfig();
      setConfig(cfg);
      if (cfg.selected_algorithms && cfg.selected_algorithms.length > 0) {
        setSelectedAlgorithms(cfg.selected_algorithms);
      }
    } catch (e) {
      console.error('Failed to load config', e);
    }
  }, []);

  const loadResultsAndHistory = useCallback(async () => {
    try {
      const [gData, comp, hist] = await Promise.all([
        api.getGanttData(),
        api.getComparison().catch(() => null),
        api.getHistory().catch(() => [])
      ]);
      setGanttData(gData);
      if (comp) setComparison(comp);
      setHistory(hist);
    } catch (e) {
      console.error('Failed to load results', e);
    }
  }, []);

  useEffect(() => {
    loadProcesses();
    loadAlgorithms();
    loadConfig();
    loadResultsAndHistory();

    // Setup WebSocket
    wsClient.connect();
    const unsubscribe = wsClient.subscribe((evt) => {
      if (evt.type === 'PROGRESS') {
        setLiveStatus({
          is_running: true,
          is_paused: false,
          current_algo: evt.current_algo,
          current_algo_index: evt.algo_index,
          total_algos: evt.total_algos,
          engine: evt.data
        });
      } else if (evt.type === 'ALGORITHM_COMPLETE') {
        loadProcesses();
      } else if (evt.type === 'EXPERIMENT_COMPLETE') {
        loadResultsAndHistory();
        loadProcesses();
        setLiveStatus({
          is_running: false,
          is_paused: false,
          current_algo: '',
          current_algo_index: 0,
          total_algos: 0,
          engine: null
        });
      }
    });

    // Fallback polling for live status
    const pollInterval = setInterval(async () => {
      try {
        const stat = await api.getExperimentStatus();
        setLiveStatus(stat);
        if (stat.is_running) {
          loadProcesses();
        }
      } catch (e) {}
    }, 1200);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
      wsClient.disconnect();
    };
  }, [loadProcesses, loadAlgorithms, loadConfig, loadResultsAndHistory]);

  // Process Handlers
  const handleAddProcess = () => {
    setEditingTask(null);
    setIsProcessModalOpen(true);
  };

  const handleEditProcess = (task: ProcessTask) => {
    setEditingTask(task);
    setIsProcessModalOpen(true);
  };

  const handleProcessSubmit = async (taskData: Partial<ProcessTask>) => {
    try {
      if (editingTask) {
        await api.updateProcess(editingTask.id, taskData);
      } else {
        await api.createProcess(taskData);
      }
      await loadProcesses();
    } catch (e) {
      console.error('Failed to submit process', e);
    }
  };

  const handleDeleteProcess = async (id: string) => {
    try {
      await api.deleteProcess(id);
      await loadProcesses();
    } catch (e) {
      console.error('Failed to delete process', e);
    }
  };

  const handleClearProcesses = async () => {
    try {
      await api.clearProcesses();
      await loadProcesses();
    } catch (e) {
      console.error('Failed to clear processes', e);
    }
  };

  const handleGenerateProcesses = async (params: {
    count: number;
    mode: string;
    min_size: number;
    max_size: number;
    seed: number;
  }) => {
    try {
      await api.generateProcesses(params);
      await loadProcesses();
    } catch (e) {
      console.error('Failed to generate processes', e);
    }
  };

  // Algorithm Selection Handlers
  const handleToggleAlgorithm = (algoId: string) => {
    const updated = selectedAlgorithms.includes(algoId)
      ? selectedAlgorithms.filter((a) => a !== algoId)
      : [...selectedAlgorithms, algoId];
    setSelectedAlgorithms(updated);
    const newCfg = { ...config, selected_algorithms: updated };
    setConfig(newCfg);
    api.configureExperiment(newCfg).catch(console.error);
  };

  const handleSelectAllAlgorithms = () => {
    const all = algorithms.map((a) => a.id);
    setSelectedAlgorithms(all);
    const newCfg = { ...config, selected_algorithms: all };
    setConfig(newCfg);
    api.configureExperiment(newCfg).catch(console.error);
  };

  const handleDeselectAllAlgorithms = () => {
    setSelectedAlgorithms([]);
    const newCfg = { ...config, selected_algorithms: [] };
    setConfig(newCfg);
    api.configureExperiment(newCfg).catch(console.error);
  };

  // Configuration Handler
  const handleSaveConfig = async (newConfig: ExperimentConfig) => {
    try {
      await api.configureExperiment(newConfig);
      setConfig(newConfig);
      setSelectedAlgorithms(newConfig.selected_algorithms);
    } catch (e) {
      console.error('Failed to save config', e);
    }
  };

  // Execution Handlers
  const handleStartComparison = async () => {
    try {
      const activeCfg = { ...config, selected_algorithms: selectedAlgorithms };
      await api.startExperiment(activeCfg);
      setCurrentTab('execute-experiment');
    } catch (e: any) {
      alert(e.message || 'Failed to start comparison');
    }
  };

  const handlePause = async () => {
    try {
      await api.pauseExperiment();
    } catch (e) {
      console.error('Failed to pause', e);
    }
  };

  const handleResume = async () => {
    try {
      await api.resumeExperiment();
    } catch (e) {
      console.error('Failed to resume', e);
    }
  };

  const handleStop = async () => {
    try {
      await api.stopExperiment();
    } catch (e) {
      console.error('Failed to stop', e);
    }
  };

  // History load
  const handleLoadHistoryExperiment = (exp: SavedExperiment) => {
    setComparison(exp.analysis);
    const gObj: Record<string, any> = {};
    for (const r of exp.algorithm_runs) {
      gObj[r.algorithm_name] = {
        num_workers: r.num_workers,
        total_duration_ms: r.total_duration_ms,
        records: r.gantt_records
      };
    }
    setGanttData(gObj);
    setCurrentTab('performance-comparison');
  };

  const handleExportCsv = (id?: string) => {
    const url = api.getExportCsvUrl(id);
    window.open(url, '_blank');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-dark-900 text-slate-100 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isRunning={liveStatus?.is_running}
        activeAlgo={liveStatus?.current_algo}
        totalProcesses={processes.length}
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <Header
          currentTab={currentTab}
          totalProcesses={processes.length}
          onAddProcess={handleAddProcess}
          onGenerateProcesses={() => setIsGenerateModalOpen(true)}
          onStartComparison={handleStartComparison}
          onNavigateTab={setCurrentTab}
          isRunning={liveStatus?.is_running}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto bg-dark-900/60">
          {currentTab === 'process-manager' && (
            <ProcessManagerPage
              processes={processes}
              onAddProcess={handleAddProcess}
              onGenerateProcesses={() => setIsGenerateModalOpen(true)}
              onEditProcess={handleEditProcess}
              onDeleteProcess={handleDeleteProcess}
              onClearProcesses={handleClearProcesses}
              onSelectProcess={setSelectedDetailTask}
              onNavigateNext={() => setCurrentTab('algorithm-selection')}
            />
          )}

          {currentTab === 'ready-queue' && (
            <ReadyQueuePage
              processes={processes}
              onSelectProcess={setSelectedDetailTask}
              onNavigateExecute={() => setCurrentTab('execute-experiment')}
            />
          )}

          {currentTab === 'algorithm-selection' && (
            <AlgorithmSelectionPage
              algorithms={algorithms}
              selectedAlgorithms={selectedAlgorithms}
              onToggleAlgorithm={handleToggleAlgorithm}
              onSelectAll={handleSelectAllAlgorithms}
              onDeselectAll={handleDeselectAllAlgorithms}
              onNavigateNext={() => setCurrentTab('configuration')}
            />
          )}

          {currentTab === 'configuration' && (
            <ConfigurationPage
              config={{ ...config, selected_algorithms: selectedAlgorithms }}
              onSaveConfig={handleSaveConfig}
              onNavigateExecute={() => setCurrentTab('execute-experiment')}
            />
          )}

          {currentTab === 'execute-experiment' && (
            <ExecutionPage
              status={liveStatus}
              config={{ ...config, selected_algorithms: selectedAlgorithms }}
              totalProcesses={processes.length}
              onStart={handleStartComparison}
              onPause={handlePause}
              onResume={handleResume}
              onStop={handleStop}
              onNavigateGantt={() => setCurrentTab('gantt-visualization')}
              onNavigateComparison={() => setCurrentTab('performance-comparison')}
              onNavigateProcesses={() => setCurrentTab('process-manager')}
            />
          )}

          {currentTab === 'gantt-visualization' && (
            <GanttPage
              ganttData={ganttData}
              selectedAlgorithms={selectedAlgorithms}
            />
          )}

          {currentTab === 'performance-comparison' && (
            <ComparisonPage
              comparison={comparison}
              onExportCsv={() => handleExportCsv()}
            />
          )}

          {currentTab === 'experiment-history' && (
            <HistoryPage
              history={history}
              onLoadExperiment={handleLoadHistoryExperiment}
              onExportCsv={handleExportCsv}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <ProcessModal
        isOpen={isProcessModalOpen}
        onClose={() => setIsProcessModalOpen(false)}
        onSubmit={handleProcessSubmit}
        initialData={editingTask}
      />

      <GenerateModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        onGenerate={handleGenerateProcesses}
      />

      <ProcessDetailModal
        task={selectedDetailTask}
        onClose={() => setSelectedDetailTask(null)}
      />
    </div>
  );
};

export default App;
