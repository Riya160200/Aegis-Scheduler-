cmake_minimum_required(VERSION 3.15)
project(aegis CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Source & header files
file(GLOB_RECURSE SOURCES "src/*.cpp")
file(GLOB_RECURSE HEADERS "include/*.h")

add_executable(aegis_server ${SOURCES} ${HEADERS})

# IMPORTANT: add the include/ directory so every .cpp can find the .h files
target_include_directories(aegis_server PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/include
)

# Windows: link ws2_32 for Winsock (needed by httplib + WebSocket)
if(WIN32)
    target_link_libraries(aegis_server PRIVATE ws2_32)
endif()

# Threading support
find_package(Threads REQUIRED)
target_link_libraries(aegis_server PRIVATE Threads::Threads)

# Enable warnings
if(MSVC)
    target_compile_options(aegis_server PRIVATE /W3)
else()
    target_compile_options(aegis_server PRIVATE -Wall -Wextra -pedantic)
endif()
