@echo off
echo ===================================
echo Clean Install - Expo Project
echo ===================================
echo.

echo [1/5] Stopping Metro bundler...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo [2/5] Removing node_modules...
if exist node_modules (
    rmdir /s /q node_modules
    echo   - node_modules removed
)

echo [3/5] Removing lock files and cache...
if exist package-lock.json (
    del /f /q package-lock.json
    echo   - package-lock.json removed
)
if exist yarn.lock (
    del /f /q yarn.lock
    echo   - yarn.lock removed
)
if exist .expo (
    rmdir /s /q .expo
    echo   - .expo cache removed
)

echo [4/5] Installing dependencies...
call npm install

echo [5/5] Done! Now run: npx expo start -c
echo.
pause

