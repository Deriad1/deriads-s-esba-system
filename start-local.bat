@echo off
echo ========================================
echo Starting Local Development Environment
echo ========================================
echo.
echo [1/3] Checking environment variables...
if not exist .env (
    echo ERROR: .env file not found!
    echo Please create a .env file with your DATABASE_URL
    pause
    exit /b 1
)

echo [2/3] Starting API server on port 3000...
start "API Server" cmd /k "node dev-server.js"
timeout /t 3 /nobreak >nul

echo [3/3] Starting frontend on port 9000...
start "Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo  Servers Starting...
echo ========================================
echo  Frontend: http://localhost:9000
echo  API:      http://localhost:3000
echo ========================================
echo.
echo Press any key to stop all servers...
pause >nul

echo Stopping servers...
taskkill /F /FI "WINDOWTITLE eq API Server*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Frontend*" >nul 2>&1
echo Servers stopped.
