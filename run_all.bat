@echo off
rem ------------------------------------------------------------
rem AEGIS – Full project startup script
rem ------------------------------------------------------------

rem ==== Build C++ backend ==== 
if not exist "backend\build" mkdir backend\build
pushd backend\build
cmake ..
if %errorlevel% neq 0 (
  echo [ERROR] CMake configuration failed.
  popd
  exit /b %errorlevel%
)
cmake --build . --config Release
if %errorlevel% neq 0 (
  echo [ERROR] Backend build failed.
  popd
  exit /b %errorlevel%
)
popd

rem ==== Start backend server ==== 
if exist "backend\build\aegis_server.exe" (
  start "AEGIS Backend" "backend\build\aegis_server.exe"
) else if exist "backend\build\Release\aegis_server.exe" (
  start "AEGIS Backend" "backend\build\Release\aegis_server.exe"
) else (
  echo [ERROR] aegis_server.exe not found!
  exit /b 1
)

rem ==== Install / update frontend dependencies ==== 
pushd frontend
if not exist node_modules (
  echo Installing npm packages...
  npm install
  if %errorlevel% neq 0 (
    echo [ERROR] npm install failed.
    popd
    exit /b %errorlevel%
  )
)
popd

rem ==== Start React dev server ==== 
start "AEGIS Frontend" cmd /c "cd frontend && npm run dev -- --port 3000"

echo.
echo AEGIS is now running.
echo   Backend API : http://localhost:8080/api
echo   Frontend UI : http://localhost:3000
exit /b 0
