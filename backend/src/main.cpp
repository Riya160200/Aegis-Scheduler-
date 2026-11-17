#include <iostream>
#include <memory>
#include "httplib.h"
#include "json.hpp"
#include "TaskManager.h"
#include "ExperimentManager.h"
#include "WebSocketServer.h"

using namespace aegis;
using json = nlohmann::json;

void set_cors_headers(httplib::Response& res) {
    res.set_header("Access-Control-Allow-Origin", "*");
    res.set_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.set_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
}

int main() {
    std::cout << "====================================================\n";
    std::cout << "  AEGIS - Adaptive Multithreaded Task Scheduler    \n";
    std::cout << "  OS Course Project Backend Service                \n";
    std::cout << "====================================================\n";

    auto task_manager = std::make_shared<TaskManager>();
    auto experiment_manager = std::make_shared<ExperimentManager>(task_manager);

    // Seed initial default processes so user can immediately experiment or view
    task_manager->generate_tasks(6, "mixed", 50, 250, 42);

    // Initialize WebSocket Server on port 8081
    WebSocketServer ws_server(8081);
    if (ws_server.start()) {
        std::cout << "[WebSocket] Server listening on ws://localhost:8081/ws/execution\n";
    } else {
        std::cerr << "[WebSocket] Failed to bind port 8081 (continuing with HTTP)\n";
    }

    // Connect experiment events to WebSocket broadcast
    experiment_manager->add_event_listener([&ws_server](const json& evt) {
        ws_server.broadcast(evt.dump());
    });

    httplib::Server svr;

    // Handle OPTIONS Preflight for all endpoints
    svr.Options(R"(/.*)", [](const httplib::Request&, httplib::Response& res) {
        set_cors_headers(res);
        res.status = 200;
    });

    // ----------------------------------------------------
    // Process Management Endpoints
    // ----------------------------------------------------

    // GET /api/processes
    svr.Get("/api/processes", [&task_manager](const httplib::Request&, httplib::Response& res) {
        set_cors_headers(res);
        auto tasks = task_manager->get_all_tasks();
        json arr = json::array();
        for (const auto& t : tasks) {
            arr.push_back(t.to_json());
        }
        res.set_content(arr.dump(), "application/json");
    });

    // POST /api/processes
    svr.Post("/api/processes", [&task_manager](const httplib::Request& req, httplib::Response& res) {
        set_cors_headers(res);
        try {
            json body = json::parse(req.body);
            // Compatibility shim: map UI's workload_type to the field expected by Task::from_json
            if (body.contains("workload_type") && !body.contains("workload")) {
                body["workload"] = body["workload_type"];
            }
            // Verify required fields are present (helps produce clearer errors)
            const std::vector<std::string> required = {
                "name", "workload", "workload_size", "arrival_time",
                "estimated_burst_time", "deadline", "priority", "base_priority"
            };
            for (const auto& key : required) {
                if (!body.contains(key)) {
                    throw std::runtime_error("Missing required field: " + key);
                }
            }
            Task task = Task::from_json(body);
            Task created = task_manager->add_task(task);
            res.status = 201;
            res.set_content(created.to_json().dump(), "application/json");
        } catch (const std::exception& e) {
            res.status = 400;
            res.set_content(json{{"error", e.what()}}.dump(), "application/json");
        }
    });

    // GET /api/processes/:id
    svr.Get(R"(/api/processes/([^/]+))", [&task_manager](const httplib::Request& req, httplib::Response& res) {
        set_cors_headers(res);
        std::string id = req.matches[1];
        Task task;
        if (task_manager->get_task(id, task)) {
            res.set_content(task.to_json().dump(), "application/json");
        } else {
            res.status = 404;
            res.set_content(json{{"error", "Task not found"}}.dump(), "application/json");
        }
    });

    // PUT /api/processes/:id
    svr.Put(R"(/api/processes/([^/]+))", [&task_manager](const httplib::Request& req, httplib::Response& res) {
        set_cors_headers(res);
        std::string id = req.matches[1];
        try {
            json body = json::parse(req.body);
            body["id"] = id;
            Task updated = Task::from_json(body);
            if (task_manager->update_task(id, updated)) {
                res.set_content(updated.to_json().dump(), "application/json");
            } else {
                res.status = 404;
                res.set_content(json{{"error", "Task not found"}}.dump(), "application/json");
            }
        } catch (const std::exception& e) {
            res.status = 400;
            res.set_content(json{{"error", e.what()}}.dump(), "application/json");
        }
    });

    // DELETE /api/processes/:id
    svr.Delete(R"(/api/processes/([^/]+))", [&task_manager](const httplib::Request& req, httplib::Response& res) {
        set_cors_headers(res);
        std::string id = req.matches[1];
        if (task_manager->delete_task(id)) {
            res.set_content(json{{"success", true, "id", id}}.dump(), "application/json");
        } else {
            res.status = 404;
            res.set_content(json{{"error", "Task not found"}}.dump(), "application/json");
        }
    });

    // DELETE /api/processes (clear all)
    svr.Delete("/api/processes", [&task_manager](const httplib::Request&, httplib::Response& res) {
        set_cors_headers(res);
        task_manager->clear_tasks();
        res.set_content(json{{"success", true, "message", "All processes cleared"}}.dump(), "application/json");
    });

    // POST /api/processes/generate
    svr.Post("/api/processes/generate", [&task_manager](const httplib::Request& req, httplib::Response& res) {
        set_cors_headers(res);
        try {
            json body = json::parse(req.body);
            int count = body.value("count", 8);
            std::string mode = body.value("mode", "mixed");
            int min_size = body.value("min_size", 50);
            int max_size = body.value("max_size", 300);
            unsigned int seed = body.value("seed", 42);

            auto generated = task_manager->generate_tasks(count, mode, min_size, max_size, seed);
            json arr = json::array();
            for (const auto& t : generated) {
                arr.push_back(t.to_json());
            }
            res.set_content(arr.dump(), "application/json");
        } catch (const std::exception& e) {
            res.status = 400;
            res.set_content(json{{"error", e.what()}}.dump(), "application/json");
        }
    });

    // ----------------------------------------------------
    // Algorithm Information Endpoint
    // ----------------------------------------------------
    svr.Get("/api/algorithms", [](const httplib::Request&, httplib::Response& res) {
        set_cors_headers(res);
        json algos = json::array({
            {
                {"id", "FCFS"},
                {"name", "First Come First Served"},
                {"short_name", "FCFS"},
                {"is_preemptive", false},
                {"description", "Processes are scheduled strictly according to arrival order."},
                {"characteristics", json::array({
                    "Non-preemptive scheduling policy",
                    "Deterministic arrival-time ordering",
                    "Minimal decision overhead",
                    "Subject to convoy effect when blocked by long jobs"
                })},
                {"best_for", "Batch operations with uniform burst durations"}
            },
            {
                {"id", "SJF"},
                {"name", "Shortest Job First"},
                {"short_name", "SJF"},
                {"is_preemptive", false},
                {"description", "Selects the ready process with the shortest estimated CPU burst."},
                {"characteristics", json::array({
                    "Non-preemptive burst optimization",
                    "Minimizes theoretical average waiting time",
                    "Requires burst-time estimation",
                    "Vulnerable to starvation for long processes"
                })},
                {"best_for", "Interactive workloads with predictable burst times"}
            },
            {
                {"id", "Round Robin"},
                {"name", "Round Robin"},
                {"short_name", "RR"},
                {"is_preemptive", true},
                {"description", "Allocates fixed time slices (quanta) in circular FIFO order."},
                {"characteristics", json::array({
                    "Preemptive time sharing",
                    "Fair allocation of CPU opportunities",
                    "Responsiveness depends on quantum size",
                    "Higher scheduling and context overhead"
                })},
                {"best_for", "Time-sharing multi-user environments"}
            },
            {
                {"id", "Aegis Adaptive"},
                {"name", "Aegis Adaptive Scheduler"},
                {"short_name", "Aegis"},
                {"is_preemptive", true},
                {"description", "Dynamic multi-objective priority scheduler balancing deadlines, aging, and CPU penalty."},
                {"formula", "P = w1*D + w2*W - w3*C"},
                {"characteristics", json::array({
                    "Dynamic multi-factor priority evaluation",
                    "Continuous aging mechanism prevents starvation",
                    "Deadline urgency awareness for real-time tasks",
                    "Penalizes CPU-intensive processes to favor responsive tasks",
                    "Transparent explainability for every dispatch decision"
                })},
                {"best_for", "Heterogeneous workloads with mixed deadlines and burst profiles"}
            }
        });
        res.set_content(algos.dump(), "application/json");
    });

    // ----------------------------------------------------
    // Experiment Configuration & Execution Endpoints
    // ----------------------------------------------------

    // POST /api/experiments/configure
    svr.Post("/api/experiments/configure", [&experiment_manager](const httplib::Request& req, httplib::Response& res) {
        set_cors_headers(res);
        try {
            json body = json::parse(req.body);
            ExperimentConfig cfg = ExperimentConfig::from_json(body);
            experiment_manager->set_config(cfg);
            res.set_content(cfg.to_json().dump(), "application/json");
        } catch (const std::exception& e) {
            res.status = 400;
            res.set_content(json{{"error", e.what()}}.dump(), "application/json");
        }
    });

    // GET /api/experiments/config
    svr.Get("/api/experiments/config", [&experiment_manager](const httplib::Request&, httplib::Response& res) {
        set_cors_headers(res);
        res.set_content(experiment_manager->get_config().to_json().dump(), "application/json");
    });

    // POST /api/experiments/start
    svr.Post("/api/experiments/start", [&experiment_manager, &task_manager](const httplib::Request& req, httplib::Response& res) {
        set_cors_headers(res);
        if (task_manager->count() == 0) {
            res.status = 400;
            res.set_content(json{{"error", "No processes created. Add or generate processes first."}}.dump(), "application/json");
            return;
        }

        // Optional config in start body
        if (!req.body.empty()) {
            try {
                json body = json::parse(req.body);
                ExperimentConfig cfg = ExperimentConfig::from_json(body);
                experiment_manager->set_config(cfg);
            } catch (...) {}
        }

        bool started = experiment_manager->start_experiment();
        if (started) {
            res.set_content(json{{"success", true, "message", "Experiment comparison started"}}.dump(), "application/json");
        } else {
            res.status = 409;
            res.set_content(json{{"error", "Experiment already running"}}.dump(), "application/json");
        }
    });

    // POST /api/experiments/pause
    svr.Post("/api/experiments/pause", [&experiment_manager](const httplib::Request&, httplib::Response& res) {
        set_cors_headers(res);
        bool paused = experiment_manager->pause_experiment();
        res.set_content(json{{"success", paused}}.dump(), "application/json");
    });

    // POST /api/experiments/resume
    svr.Post("/api/experiments/resume", [&experiment_manager](const httplib::Request&, httplib::Response& res) {
        set_cors_headers(res);
        bool resumed = experiment_manager->resume_experiment();
        res.set_content(json{{"success", resumed}}.dump(), "application/json");
    });

    // POST /api/experiments/stop
    svr.Post("/api/experiments/stop", [&experiment_manager](const httplib::Request&, httplib::Response& res) {
        set_cors_headers(res);
        bool stopped = experiment_manager->stop_experiment();
        res.set_content(json{{"success", stopped}}.dump(), "application/json");
    });

    // GET /api/experiments/status
    svr.Get("/api/experiments/status", [&experiment_manager](const httplib::Request&, httplib::Response& res) {
        set_cors_headers(res);
        res.set_content(experiment_manager->get_status().dump(), "application/json");
    });

    // GET /api/experiments/results
    svr.Get("/api/experiments/results", [&experiment_manager](const httplib::Request&, httplib::Response& res) {
        set_cors_headers(res);
        res.set_content(experiment_manager->get_results().dump(), "application/json");
    });

    // GET /api/experiments/gantt
    svr.Get("/api/experiments/gantt", [&experiment_manager](const httplib::Request& req, httplib::Response& res) {
        set_cors_headers(res);
        std::string algo = req.has_param("algo") ? req.get_param_value("algo") : "";
        res.set_content(experiment_manager->get_gantt(algo).dump(), "application/json");
    });

    // GET /api/experiments/comparison
    svr.Get("/api/experiments/comparison", [&experiment_manager](const httplib::Request&, httplib::Response& res) {
        set_cors_headers(res);
        res.set_content(experiment_manager->get_comparison().dump(), "application/json");
    });

    // GET /api/experiments/history
    svr.Get("/api/experiments/history", [&experiment_manager](const httplib::Request&, httplib::Response& res) {
        set_cors_headers(res);
        auto hist = experiment_manager->get_history();
        json arr = json::array();
        for (const auto& exp : hist) {
            arr.push_back(exp.to_json());
        }
        res.set_content(arr.dump(), "application/json");
    });

    // GET /api/experiments/export
    svr.Get("/api/experiments/export", [&experiment_manager](const httplib::Request& req, httplib::Response& res) {
        set_cors_headers(res);
        std::string exp_id = req.has_param("id") ? req.get_param_value("id") : "";
        std::string csv_data = experiment_manager->export_csv(exp_id);
        res.set_header("Content-Disposition", "attachment; filename=\"aegis_experiment_results.csv\"");
        res.set_content(csv_data, "text/csv");
    });

    std::cout << "[HTTP] AEGIS REST API server listening on http://localhost:8080\n";
    svr.listen("0.0.0.0", 8080);

    ws_server.stop();
    return 0;
}

