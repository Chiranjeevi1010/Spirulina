@echo off
title Spirulina ERP - Stopping Services
color 0E

echo.
echo  ============================================
echo    SPIRULINA ERP - Stopping All Services
echo  ============================================
echo.

echo  * Stopping Spirulina Client (Vite)...
taskkill /fi "WINDOWTITLE eq Spirulina Client" /t /f >nul 2>&1

echo  * Stopping Spirulina API (Express)...
taskkill /fi "WINDOWTITLE eq Spirulina API" /t /f >nul 2>&1

echo  * Stopping Spirulina DB (PostgreSQL)...
taskkill /fi "WINDOWTITLE eq Spirulina DB" /t /f >nul 2>&1

:: Also kill any orphaned processes on the ports
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173" ^| findstr "LISTENING"') do (
    taskkill /pid %%a /f >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001" ^| findstr "LISTENING"') do (
    taskkill /pid %%a /f >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5432" ^| findstr "LISTENING"') do (
    taskkill /pid %%a /f >nul 2>&1
)

:: Clean up PostgreSQL lock file to prevent stale lock on next start
if exist "data\pg\postmaster.pid" (
    del /f "data\pg\postmaster.pid" >nul 2>&1
    echo  * Cleaned up PostgreSQL lock file.
)

echo.
echo  [OK] All services stopped.
echo.
timeout /t 3 /nobreak >nul
