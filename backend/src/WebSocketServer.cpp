#include "WebSocketServer.h"
#include <iostream>
#include <sstream>
#include <algorithm>
#include <cstring>

namespace aegis {

namespace crypto {

// Standard SHA1 implementation
class SHA1 {
public:
    SHA1() { reset(); }

    void update(const uint8_t* data, size_t length) {
        for (size_t i = 0; i < length; ++i) {
            buffer_[buffer_index_++] = data[i];
            if (buffer_index_ == 64) {
                process_block(buffer_);
                total_bits_ += 512;
                buffer_index_ = 0;
            }
        }
    }

    void final(uint8_t digest[20]) {
        total_bits_ += buffer_index_ * 8;
        buffer_[buffer_index_++] = 0x80;
        if (buffer_index_ > 56) {
            while (buffer_index_ < 64) buffer_[buffer_index_++] = 0;
            process_block(buffer_);
            buffer_index_ = 0;
        }
        while (buffer_index_ < 56) buffer_[buffer_index_++] = 0;
        for (int i = 7; i >= 0; --i) {
            buffer_[56 + i] = static_cast<uint8_t>(total_bits_ >> ((7 - i) * 8));
        }
        process_block(buffer_);

        for (int i = 0; i < 5; ++i) {
            digest[i * 4 + 0] = static_cast<uint8_t>(h_[i] >> 24);
            digest[i * 4 + 1] = static_cast<uint8_t>(h_[i] >> 16);
            digest[i * 4 + 2] = static_cast<uint8_t>(h_[i] >> 8);
            digest[i * 4 + 3] = static_cast<uint8_t>(h_[i]);
        }
    }

private:
    uint32_t h_[5];
    uint8_t buffer_[64];
    size_t buffer_index_ = 0;
    uint64_t total_bits_ = 0;

    static uint32_t rol(uint32_t value, size_t bits) {
        return (value << bits) | (value >> (32 - bits));
    }

    void reset() {
        h_[0] = 0x67452301;
        h_[1] = 0xEFCDAB89;
        h_[2] = 0x98BADCFE;
        h_[3] = 0x10325476;
        h_[4] = 0xC3D2E1F0;
        buffer_index_ = 0;
        total_bits_ = 0;
    }

    void process_block(const uint8_t* block) {
        uint32_t w[80];
        for (int i = 0; i < 16; ++i) {
            w[i] = (block[i * 4] << 24) | (block[i * 4 + 1] << 16) | (block[i * 4 + 2] << 8) | block[i * 4 + 3];
        }
        for (int i = 16; i < 80; ++i) {
            w[i] = rol(w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16], 1);
        }

        uint32_t a = h_[0], b = h_[1], c = h_[2], d = h_[3], e = h_[4];
        for (int i = 0; i < 80; ++i) {
            uint32_t f, k;
            if (i < 20) {
                f = (b & c) | ((~b) & d);
                k = 0x5A827999;
            } else if (i < 40) {
                f = b ^ c ^ d;
                k = 0x6ED9EBA1;
            } else if (i < 60) {
                f = (b & c) | (b & d) | (c & d);
                k = 0x8F1BBCDC;
            } else {
                f = b ^ c ^ d;
                k = 0xCA62C1D6;
            }
            uint32_t temp = rol(a, 5) + f + e + k + w[i];
            e = d;
            d = c;
            c = rol(b, 30);
            b = a;
            a = temp;
        }

        h_[0] += a; h_[1] += b; h_[2] += c; h_[3] += d; h_[4] += e;
    }
};

static const std::string base64_chars = 
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    "abcdefghijklmnopqrstuvwxyz"
    "0123456789+/";

std::string base64_encode(const uint8_t* bytes_to_encode, size_t in_len) {
    std::string ret;
    int i = 0, j = 0;
    uint8_t char_array_3[3];
    uint8_t char_array_4[4];

    while (in_len--) {
        char_array_3[i++] = *(bytes_to_encode++);
        if (i == 3) {
            char_array_4[0] = (char_array_3[0] & 0xfc) >> 2;
            char_array_4[1] = ((char_array_3[0] & 0x03) << 4) + ((char_array_3[1] & 0xf0) >> 4);
            char_array_4[2] = ((char_array_3[1] & 0x0f) << 2) + ((char_array_3[2] & 0xc0) >> 6);
            char_array_4[3] = char_array_3[2] & 0x3f;

            for (i = 0; i < 4; i++) ret += base64_chars[char_array_4[i]];
            i = 0;
        }
    }

    if (i) {
        for (j = i; j < 3; j++) char_array_3[j] = '\0';
        char_array_4[0] = (char_array_3[0] & 0xfc) >> 2;
        char_array_4[1] = ((char_array_3[0] & 0x03) << 4) + ((char_array_3[1] & 0xf0) >> 4);
        char_array_4[2] = ((char_array_3[1] & 0x0f) << 2) + ((char_array_3[2] & 0xc0) >> 6);

        for (j = 0; j < i + 1; j++) ret += base64_chars[char_array_4[j]];
        while ((i++ < 3)) ret += '=';
    }

    return ret;
}

} // namespace crypto

WebSocketServer::WebSocketServer(int port) : port_(port) {}

WebSocketServer::~WebSocketServer() {
    stop();
}

std::string WebSocketServer::calculate_accept_key(const std::string& client_key) {
    const std::string ws_guid = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
    std::string combined = client_key + ws_guid;

    crypto::SHA1 sha1;
    sha1.update(reinterpret_cast<const uint8_t*>(combined.data()), combined.size());
    uint8_t digest[20];
    sha1.final(digest);

    return crypto::base64_encode(digest, 20);
}

bool WebSocketServer::start() {
    if (is_running_.load()) return true;

    WSADATA wsaData;
    if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0) {
        return false;
    }

    listen_socket_ = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (listen_socket_ == INVALID_SOCKET) {
        WSACleanup();
        return false;
    }

    int opt = 1;
    setsockopt(listen_socket_, SOL_SOCKET, SO_REUSEADDR, reinterpret_cast<const char*>(&opt), sizeof(opt));

    sockaddr_in server_addr{};
    server_addr.sin_family = AF_INET;
    server_addr.sin_addr.s_addr = INADDR_ANY;
    server_addr.sin_port = htons(static_cast<u_short>(port_));

    if (bind(listen_socket_, reinterpret_cast<sockaddr*>(&server_addr), sizeof(server_addr)) == SOCKET_ERROR) {
        closesocket(listen_socket_);
        WSACleanup();
        return false;
    }

    if (listen(listen_socket_, SOMAXCONN) == SOCKET_ERROR) {
        closesocket(listen_socket_);
        WSACleanup();
        return false;
    }

    is_running_.store(true);
    server_thread_ = std::thread(&WebSocketServer::run_server, this);
    return true;
}

void WebSocketServer::stop() {
    if (!is_running_.load()) return;
    is_running_.store(false);

    if (listen_socket_ != INVALID_SOCKET) {
        closesocket(listen_socket_);
        listen_socket_ = INVALID_SOCKET;
    }

    {
        std::lock_guard<std::mutex> lock(clients_mutex_);
        for (auto sock : client_sockets_) {
            closesocket(sock);
        }
        client_sockets_.clear();
    }

    if (server_thread_.joinable()) {
        server_thread_.join();
    }

    WSACleanup();
}

void WebSocketServer::run_server() {
    while (is_running_.load()) {
        sockaddr_in client_addr{};
        int client_addr_len = sizeof(client_addr);
        SOCKET client_sock = accept(listen_socket_, reinterpret_cast<sockaddr*>(&client_addr), &client_addr_len);
        if (client_sock == INVALID_SOCKET) {
            if (!is_running_.load()) break;
            std::this_thread::sleep_for(std::chrono::milliseconds(50));
            continue;
        }

        std::thread([this, client_sock]() {
            handle_client(client_sock);
        }).detach();
    }
}

void WebSocketServer::handle_client(SOCKET client_socket) {
    char buffer[2048];
    int bytes_read = recv(client_socket, buffer, sizeof(buffer) - 1, 0);
    if (bytes_read <= 0) {
        closesocket(client_socket);
        return;
    }
    buffer[bytes_read] = '\0';
    std::string request(buffer);

    // Look for Sec-WebSocket-Key
    std::string key_header = "Sec-WebSocket-Key: ";
    size_t key_pos = request.find(key_header);
    if (key_pos == std::string::npos) {
        closesocket(client_socket);
        return;
    }

    size_t key_end = request.find("\r\n", key_pos);
    std::string client_key = request.substr(key_pos + key_header.size(), key_end - (key_pos + key_header.size()));
    
    // Trim
    while (!client_key.empty() && (client_key.back() == ' ' || client_key.back() == '\r')) {
        client_key.pop_back();
    }

    std::string accept_key = calculate_accept_key(client_key);

    std::ostringstream response;
    response << "HTTP/1.1 101 Switching Protocols\r\n"
             << "Upgrade: websocket\r\n"
             << "Connection: Upgrade\r\n"
             << "Sec-WebSocket-Accept: " << accept_key << "\r\n\r\n";

    std::string resp_str = response.str();
    send(client_socket, resp_str.data(), static_cast<int>(resp_str.size()), 0);

    {
        std::lock_guard<std::mutex> lock(clients_mutex_);
        client_sockets_.push_back(client_socket);
    }

    // Keep connection alive or read pings
    while (is_running_.load()) {
        char dummy[128];
        int r = recv(client_socket, dummy, sizeof(dummy), 0);
        if (r <= 0) {
            break;
        }
    }

    {
        std::lock_guard<std::mutex> lock(clients_mutex_);
        auto it = std::find(client_sockets_.begin(), client_sockets_.end(), client_socket);
        if (it != client_sockets_.end()) {
            client_sockets_.erase(it);
        }
    }
    closesocket(client_socket);
}

void WebSocketServer::broadcast(const std::string& message) {
    std::vector<uint8_t> frame;
    frame.push_back(0x81); // FIN + Text opcode

    size_t len = message.size();
    if (len <= 125) {
        frame.push_back(static_cast<uint8_t>(len));
    } else if (len <= 65535) {
        frame.push_back(126);
        frame.push_back(static_cast<uint8_t>((len >> 8) & 0xFF));
        frame.push_back(static_cast<uint8_t>(len & 0xFF));
    } else {
        frame.push_back(127);
        for (int i = 7; i >= 0; --i) {
            frame.push_back(static_cast<uint8_t>((len >> (i * 8)) & 0xFF));
        }
    }

    frame.insert(frame.end(), message.begin(), message.end());

    std::lock_guard<std::mutex> lock(clients_mutex_);
    for (auto it = client_sockets_.begin(); it != client_sockets_.end();) {
        int res = send(*it, reinterpret_cast<const char*>(frame.data()), static_cast<int>(frame.size()), 0);
        if (res == SOCKET_ERROR) {
            closesocket(*it);
            it = client_sockets_.erase(it);
        } else {
            ++it;
        }
    }
}

} // namespace aegis

