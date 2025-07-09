@echo off
:: 🚀 Odoo Investment Portfolio - Quick Start (Windows)
:: This script starts all services for development

echo 🚀 Starting Odoo Investment Portfolio System...
echo ================================================

:: Check if Docker is running
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

:: Start Odoo Backend
echo 📦 Starting Odoo Backend...
cd odoo-18-docker-compose
docker-compose up -d
if %errorlevel% neq 0 (
    echo ❌ Failed to start Odoo Backend
    pause
    exit /b 1
)
cd ..

:: Wait for Odoo to be ready
echo ⏳ Waiting for Odoo to initialize...
timeout /t 30 /nobreak >nul

:: Start API Middleware in new window
echo 🌐 Starting API Middleware...
start "API Middleware" cmd /k "cd api-middleware && nodemon start-dev.js"

:: Start Mobile App in new window
echo 📱 Starting Mobile App...
start "Mobile App" cmd /k "cd client_app && npx expo start"

echo ✅ All services started!
echo.
echo 📋 Access Points:
echo - Odoo Admin: http://localhost:11018
echo - API Middleware: http://localhost:3001
echo - Mobile App: Scan QR code with Expo Go
echo.
echo 🔧 Default Credentials:
echo - Username: admin
echo - Password: admin
echo.
echo Press any key to exit...
pause >nul 