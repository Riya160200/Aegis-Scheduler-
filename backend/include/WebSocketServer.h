#pragma once

#include <string>
#include <vector>
#include <mutex>
#include <thread>
#include <atomic>
#include <functional>
#include <winsock2.h>
#include <ws2tcpip.h>

namespace aegis {

class WebSocketServer {
private:
    int port_;
    SOCKET listen_socket_ = INVALID_SOCKET;
    std::vector<SOCKET> client_sockets_;
    mutable std::mutex clients_mutex_;
    std::thread server_thread_;
    std::atomic<bool> is_running_{false};

    void run_server();
    void handle_client(SOCKET client_socket);
    std::string calculate_accept_key(const std::string& client_key);

public:
    explicit WebSocketServer(int port = 8081);
    ~WebSocketServer();

    bool start();
    void stop();
    void broadcast(const std::string& message);
};

} // namespace aegis

