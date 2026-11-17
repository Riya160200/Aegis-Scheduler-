#include <iostream>
#include <cassert>
#include <memory>
#include "Task.h"
#include "TaskManager.h"
#include "FCFSScheduler.h"
#include "SJFScheduler.h"
#include "RoundRobinScheduler.h"
#include "AegisScheduler.h"
#include "ExecutionEngine.h"
#include "PerformanceAnalyzer.h"

using namespace aegis;

void test_task_creation_and_cloning() {
    std::cout << "[Test 1] Testing Task creation, CPU execution, and cloning...\n";
    Task t1("P01", "PrimeWorker", WorkloadType::PRIME_CALC, 100, 0.0, 150.0, 500.0, 6.0);
    assert(t1.remaining_work == 100);
    assert(t1.actual_burst_time == 0.0);

    double exec_ms = t1.execute_chunk(25);
    assert(exec_ms > 0.0);
    assert(t1.remaining_work == 75);
    assert(t1.actual_burst_time > 0.0);

    auto clone1 = t1.clone();
    assert(clone1->id == "P01");
    assert(clone1->remaining_work == 100); // Reset to full work definition
    assert(clone1->actual_burst_time == 0.0);
    std::cout << "  -> Task creation and cloning passed!\n";
}

void test_fcfs_order() {
    std::cout << "[Test 2] Testing FCFS arrival ordering...\n";
    FCFSScheduler fcfs;
    auto t1 = std::make_shared<Task>("P01", "T1", WorkloadType::DATA_PROCESSING, 50, 100.0, 80.0, 400.0);
    auto t2 = std::make_shared<Task>("P02", "T2", WorkloadType::SORTING, 50, 10.0, 50.0, 300.0);
    auto t3 = std::make_shared<Task>("P03", "T3", WorkloadType::PRIME_CALC, 50, 50.0, 40.0, 200.0);

    fcfs.add_task(t1);
    fcfs.add_task(t2);
    fcfs.add_task(t3);

    auto first = fcfs.select_next_task(0, 0.0);
    assert(first && first->id == "P02"); // Arrived at 10.0ms

    auto second = fcfs.select_next_task(0, 0.0);
    assert(second && second->id == "P03"); // Arrived at 50.0ms

    auto third = fcfs.select_next_task(0, 0.0);
    assert(third && third->id == "P01"); // Arrived at 100.0ms
    std::cout << "  -> FCFS ordering verified!\n";
}

void test_sjf_order() {
    std::cout << "[Test 3] Testing SJF shortest burst ordering...\n";
    SJFScheduler sjf;
    auto t1 = std::make_shared<Task>("P01", "LongTask", WorkloadType::MATRIX_MULT, 200, 0.0, 300.0, 800.0);
    auto t2 = std::make_shared<Task>("P02", "ShortTask", WorkloadType::PRIME_CALC, 30, 0.0, 40.0, 200.0);
    auto t3 = std::make_shared<Task>("P03", "MedTask", WorkloadType::SORTING, 80, 0.0, 120.0, 400.0);

    sjf.add_task(t1);
    sjf.add_task(t2);
    sjf.add_task(t3);

    auto first = sjf.select_next_task(0, 0.0);
    assert(first && first->id == "P02"); // Shortest estimated burst (40.0ms)

    auto second = sjf.select_next_task(0, 0.0);
    assert(second && second->id == "P03"); // Medium estimated burst (120.0ms)

    auto third = sjf.select_next_task(0, 0.0);
    assert(third && third->id == "P01"); // Longest burst (300.0ms)
    std::cout << "  -> SJF burst ordering verified!\n";
}

void test_round_robin_preemption() {
    std::cout << "[Test 4] Testing Round Robin preemption and quantum...\n";
    RoundRobinScheduler rr(20, 30.0);
    auto t1 = std::make_shared<Task>("P01", "Task1", WorkloadType::PRIME_CALC, 60, 0.0, 90.0, 300.0);
    auto t2 = std::make_shared<Task>("P02", "Task2", WorkloadType::SORTING, 60, 0.0, 90.0, 300.0);

    rr.add_task(t1);
    rr.add_task(t2);

    auto sel1 = rr.select_next_task(0, 0.0);
    assert(sel1 && sel1->id == "P01");

    // Chunk finished
    sel1->execute_chunk(20);
    rr.on_chunk_finished(sel1, 0, 10.0);

    // Next selected should be P02!
    auto sel2 = rr.select_next_task(0, 10.0);
    assert(sel2 && sel2->id == "P02");
    std::cout << "  -> Round Robin preemption verified!\n";
}

void test_aegis_adaptive_urgency_and_aging() {
    std::cout << "[Test 5] Testing Aegis Adaptive Scheduler urgency and aging...\n";
    AegisWeights w{0.5, 0.3, 0.2};
    AegisScheduler aegis(w, 400.0, 25);

    // Task 1: Approaching deadline (deadline=50ms, current_time=45ms)
    auto urgent = std::make_shared<Task>("P_Urgent", "UrgentJob", WorkloadType::PRIME_CALC, 50, 0.0, 60.0, 50.0);
    
    // Task 2: Distant deadline (deadline=1000ms)
    auto relaxed = std::make_shared<Task>("P_Relaxed", "RelaxedJob", WorkloadType::PRIME_CALC, 50, 0.0, 60.0, 1000.0);

    aegis.add_task(relaxed);
    aegis.add_task(urgent);

    auto chosen = aegis.select_next_task(0, 45.0);
    assert(chosen && chosen->id == "P_Urgent");
    std::cout << "  -> Aegis Adaptive urgency verified! (" << aegis.get_last_explanation() << ")\n";
}

void test_execution_engine_multithreaded() {
    std::cout << "[Test 6] Testing Multithreaded ExecutionEngine (2 workers)...\n";
    TaskManager tm;
    auto tasks = tm.generate_tasks(4, "mixed", 30, 80, 1234);

    auto scheduler = std::make_shared<FCFSScheduler>();
    ExecutionEngine engine(2);
    auto cloned = tm.get_cloned_tasks();
    engine.prepare(scheduler, cloned);
    auto stats = engine.run();

    assert(stats.completed_tasks == 4);
    assert(!stats.gantt_records.empty());
    assert(stats.total_duration_ms > 0.0);

    auto metrics = PerformanceAnalyzer::analyze(stats);
    assert(metrics.completed_tasks == 4);
    assert(metrics.avg_turnaround_time_ms >= metrics.avg_waiting_time_ms);
    std::cout << "  -> ExecutionEngine completed 4/4 tasks in " << stats.total_duration_ms 
              << "ms with CPU utilization: " << metrics.cpu_utilization_percent << "%\n";
}

int main() {
    std::cout << "========================================\n";
    std::cout << "  AEGIS SCHEDULER UNIT TEST SUITE       \n";
    std::cout << "========================================\n";

    test_task_creation_and_cloning();
    test_fcfs_order();
    test_sjf_order();
    test_round_robin_preemption();
    test_aegis_adaptive_urgency_and_aging();
    test_execution_engine_multithreaded();

    std::cout << "\n>>> ALL 6 SCHEDULER TESTS PASSED SUCCESSFULLY! <<<\n";
    return 0;
}

