@echo off
setlocal enabledelayedexpansion

echo ========================================
echo    FUND P2P PROJECT - QUICK START
echo ========================================
echo.

echo [1/5] Checking if Docker is running...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not installed or not running!
    echo Please install Docker Desktop and start it.
    pause
    exit /b 1
)
echo Docker is running ✓
echo.

echo [2/5] Starting Odoo services...
cd /d "%~dp0odoo-18-docker-compose"
docker-compose up -d
if errorlevel 1 (
    echo ERROR: Failed to start Odoo services!
    pause
    exit /b 1
)
echo Odoo services started ✓
cd /d "%~dp0"
echo.

echo [3/5] Starting API Middleware...
cd /d "%~dp0api-middleware"
echo Installing dependencies...
call yarn install
if errorlevel 1 (
    echo ERROR: Failed to install API middleware dependencies!
    pause
    exit /b 1
)
echo Starting API middleware server...
start "API Middleware" cmd /k "cd /d "%~dp0api-middleware" && yarn dev"
cd /d "%~dp0"
echo.

echo [4/5] Starting eKYC Service...
cd /d "%~dp0ekyc_service"
echo Building and starting eKYC Docker container...
docker-compose up -d --build
if errorlevel 1 (
    echo ERROR: Failed to start eKYC Docker service!
    pause
    exit /b 1
)
echo eKYC service started ✓
cd /d "%~dp0"
echo.

echo [5/5] Starting React Native Client...
cd /d "%~dp0client_app"
echo Installing dependencies...
call yarn install
if errorlevel 1 (
    echo ERROR: Failed to install client dependencies!
    pause
    exit /b 1
)
echo Starting React Native development server...
start "React Native Client" cmd /k "cd /d "%~dp0client_app" && yarn start"
cd /d "%~dp0"
echo.

echo ========================================
echo    ALL SERVICES STARTED SUCCESSFULLY!
echo ========================================
echo.
echo Services running:
echo - Odoo: http://localhost:8069
echo - API Middleware: http://localhost:3000
echo - eKYC Service: http://localhost:8000
echo - React Native: Metro bundler
echo.
echo Press any key to exit...
pause >nul
