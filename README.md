# ⚡ AEGIS Adaptive Scheduler
### CPU Scheduling Algorithm Benchmarking Platform

> An Operating Systems course project that implements and benchmarks **4 CPU scheduling algorithms** side-by-side using real CPU workloads — built with a native C++17 backend and a React frontend.

---

## 🧠 What is AEGIS?

AEGIS is a full-stack benchmarking tool that:
1. Lets you **create processes** with different workload types (Prime, Matrix, Sorting, etc.)
2. Runs them through **4 scheduling algorithms** simultaneously on cloned workloads (fair comparison)
3. Shows **live Gantt charts**, execution timelines, and **performance metrics**
4. Compares algorithms by wait time, turnaround time, throughput, and deadline misses

### The Aegis Priority Formula
```
P = w1·D + w2·W - w3·C
```
| Weight | Meaning |
|--------|---------|
| **w1 · D** | Deadline urgency — rush tasks close to their deadline |
| **w2 · W** | Waiting/aging — boost tasks that have waited too long (prevents starvation) |
| **w3 · C** | CPU penalty — lower priority for tasks that already consumed a lot of CPU |

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | C++17, httplib.h (REST on port 8080), custom WebSocket (port 8081) |
| Scheduling | FCFS, SJF, Round Robin, Aegis Adaptive (all native C++) |
| Frontend | React + TypeScript + Vite + Tailwind CSS |
| Charts | Recharts (Gantt + Performance graphs) |
| JSON | nlohmann/json |

---

## 📋 Prerequisites

Before running, make sure you have:
- [w64devkit (MinGW)](https://github.com/skeeto/w64devkit/releases) — C++ compiler (GCC)
- [CMake](https://cmake.org/download/) — build system
- [Node.js](https://nodejs.org/) (v18+) — for the React frontend

---

## 🚀 Quick Start

### Option A — One-Click Launch (Windows)
```bat
run_all.bat
```
This compiles the backend, installs frontend dependencies, and starts both servers.

### Option B — Manual

**Backend:**
```bash
cd backend
mkdir build && cd build
cmake .. -G "MinGW Makefiles"
mingw32-make
cd ..\..\
.\backend\build\aegis_server.exe
```

**Frontend (new terminal):**
```bash
cd frontend
npm install
npm run dev -- --port 3000
```

Then open **http://localhost:3000** in your browser.

---

## 🎮 How to Use (Step-by-Step)

| Step | Page | Action |
|------|------|--------|
| 1 | **Process Manager** | Click "Add Process" → fill in name, workload type, priority, deadline |
| 2 | **Ready Queue** | View all added processes waiting to be scheduled |
| 3 | **Algorithm Selection** | Choose which algorithms to benchmark (FCFS, SJF, RR, Aegis) |
| 4 | **Configuration** | Set worker threads (1/2/4/8), Round Robin quantum, Aegis weights (w1, w2, w3) |
| 5 | **Execute Experiment** | Click "Run Experiment" — all algorithms run on cloned workloads in parallel |
| 6 | **Gantt Visualization** | Watch live Gantt charts per algorithm as tasks execute |
| 7 | **Performance Comparison** | See side-by-side metrics: avg wait, turnaround, throughput, deadline misses |
| 8 | **Experiment History** | Review all past benchmark runs |

---

## ⚙️ 5 Workload Types

| Workload | Real CPU Work |
|----------|--------------|
| **Prime** | Trial division primality tests |
| **Matrix** | Block dot-product matrix multiplication |
| **Sorting** | Incremental insertion sort |
| **Data Processing** | FNV-1a hash computation |
| **Math** | Nilakantha series (π approximation) |

> These are **real CPU workloads** — not fake sleeps or timers. Each algorithm gets cloned workloads to ensure a fair race.

---

## 📊 4 Scheduling Algorithms

| Algorithm | Strategy |
|-----------|---------|
| **FCFS** | First Come First Served — processes run in arrival order |
| **SJF** | Shortest Job First — smallest remaining work runs next |
| **Round Robin** | Each process gets a fixed time quantum in rotation |
| **Aegis Adaptive** | Dynamic priority `P = w1·D + w2·W - w3·C` — balances deadline, starvation, and CPU fairness |

---

## 📁 Project Structure

```
OS CP FINALL/
├── backend/
│   ├── include/              # Header files (Task.h, Scheduler.h, etc.)
│   ├── src/                  # C++ source files
│   │   ├── main.cpp          # REST API (port 8080) + WebSocket (port 8081)
│   │   ├── Task.cpp          # Task struct + 5 workload implementations
│   │   ├── ExecutionEngine.cpp  # Multi-threaded task executor
│   │   ├── ExperimentManager.cpp # Manages benchmark runs
│   │   ├── AegisScheduler.cpp   # Aegis adaptive algorithm
│   │   ├── FCFSScheduler.cpp    # FCFS algorithm
│   │   ├── SJFScheduler.cpp     # SJF algorithm
│   │   └── RoundRobinScheduler.cpp # Round Robin algorithm
│   ├── third_party/          # httplib.h, nlohmann/json.hpp
│   └── CMakeLists.txt
├── frontend/
│   ├── src/
│   │   ├── pages/            # ProcessManager, ReadyQueue, Configuration, etc.
│   │   ├── components/       # Reusable UI components
│   │   └── App.tsx           # Main app + routing
│   ├── package.json
│   └── vite.config.ts        # Proxy: /api → localhost:8080
├── run_all.bat               # One-click launcher (Windows)
└── README.md
```

---

## 📈 Sample Results

| Metric | FCFS | SJF | Round Robin | Aegis |
|--------|------|-----|-------------|-------|
| Avg Wait Time | 6.02ms | **2.78ms ✅** | 4.5ms | 3.9ms |
| Avg Turnaround | 10.05ms | **6.65ms ✅** | 8.2ms | 7.4ms |
| Throughput | 15/s | 18/s | **20.07/s ✅** | 18.5/s |
| Deadline Misses | 2 | 1 | 3 | **0 ✅** |
| Starvation Events | 1 | 1 | 0 | **0 ✅** |

> Aegis wins where it matters most: **zero deadline misses and zero starvation** — the two guarantees classical algorithms fail to provide together.

---

## 👩‍💻 Author

**Riya Gupta** — Operating Systems Course Project  
B.Tech, 2026

---

## 📝 License

This project is for academic purposes.
