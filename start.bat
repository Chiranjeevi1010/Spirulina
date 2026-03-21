@echo off
title Spirulina ERP - Starting...
color 0A

echo.
echo  ============================================
echo    SPIRULINA ERP - Startup Script
echo    Cultivation ^& Business Management System
echo  ============================================
echo.

:: -----------------------------------------------
:: 1. Check prerequisites
:: -----------------------------------------------
echo [1/6] Checking prerequisites...

where node >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo  ERROR: Node.js is not installed or not in PATH.
    echo  Please install Node.js v18+ from https://nodejs.org
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo  * Node.js: %NODE_VER%

where pnpm >nul 2>&1
if %errorlevel% neq 0 (
    echo  * pnpm not found - installing...
    npm install -g pnpm
    if %errorlevel% neq 0 (
        color 0C
        echo  ERROR: Failed to install pnpm. Run: npm install -g pnpm
        pause
        exit /b 1
    )
)

for /f "tokens=*" %%i in ('pnpm -v') do set PNPM_VER=%%i
echo  * pnpm:    v%PNPM_VER%
echo  [OK] Prerequisites satisfied.
echo.

:: -----------------------------------------------
:: 2. Install dependencies (if needed)
:: -----------------------------------------------
echo [2/6] Checking dependencies...

if not exist "node_modules" (
    echo  * Installing dependencies (first run)...
    pnpm install
    if %errorlevel% neq 0 (
        color 0C
        echo  ERROR: pnpm install failed.
        pause
        exit /b 1
    )
    echo  [OK] Dependencies installed.
) else (
    echo  [OK] Dependencies already installed.
)
echo.

:: -----------------------------------------------
:: 3. Check .env file
:: -----------------------------------------------
echo [3/6] Checking environment config...

if not exist "server\.env" (
    echo  * Creating server/.env from template...
    if exist "server\.env.example" (
        copy "server\.env.example" "server\.env" >nul
    ) else (
        (
            echo DATABASE_URL=postgresql://postgres:postgres@localhost:5432/spirulina
            echo JWT_SECRET=spirulina-dev-jwt-secret-change-in-production-2024
            echo JWT_EXPIRY=15m
            echo JWT_REFRESH_EXPIRY=7d
            echo PORT=3001
            echo NODE_ENV=development
            echo CORS_ORIGIN=http://localhost:5173
            echo CLAUDE_API_KEY=
            echo OPENAI_API_KEY=
            echo DEFAULT_AI_PROVIDER=claude
            echo DEFAULT_AI_MODEL=claude-sonnet-4-20250514
        ) > "server\.env"
    )
    echo  [OK] Environment file created.
) else (
    echo  [OK] Environment file exists.
)
echo.

:: -----------------------------------------------
:: 4. Start PostgreSQL
:: -----------------------------------------------
echo [4/6] Starting PostgreSQL database...

:: Check if port 5432 is already in use
netstat -ano | findstr ":5432" | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo  [OK] PostgreSQL already running on port 5432.
) else (
    :: Clean up stale lock file from previous unclean shutdown
    if exist "data\pg\postmaster.pid" (
        echo  * Removing stale PostgreSQL lock file...
        del /f "data\pg\postmaster.pid" >nul 2>&1
    )

    echo  * Starting embedded PostgreSQL on port 5432...
    start "Spirulina DB" /min cmd /k "cd /d R:\Softwares\Spirulina && npx tsx scripts/start-db.ts"

    :: Wait for PostgreSQL to be ready (up to 60 seconds)
    echo  * Waiting for database to be ready...
    set /a count=0
    :wait_db
    timeout /t 2 /nobreak >nul
    netstat -ano | findstr ":5432" | findstr "LISTENING" >nul 2>&1
    if %errorlevel% equ 0 (
        echo  [OK] PostgreSQL started successfully.
        goto db_ready
    )
    set /a count+=1
    if %count% lss 30 goto wait_db

    color 0C
    echo  ERROR: PostgreSQL failed to start within 60 seconds.
    echo  Check the "Spirulina DB" window for errors.
    pause
    exit /b 1
)
:db_ready
echo.

:: -----------------------------------------------
:: 5. Run migrations & seed
:: -----------------------------------------------
echo [5/6] Running database migrations and seed...

cd /d R:\Softwares\Spirulina\server
echo  * Applying migrations...
npx tsx src/db/migrate.ts
if %errorlevel% equ 0 (
    echo  [OK] Migrations applied.
) else (
    color 0C
    echo  ERROR: Migrations failed. Check database connection.
    pause
    exit /b 1
)

echo  * Seeding default data...
npx tsx src/db/seed.ts
if %errorlevel% equ 0 (
    echo  [OK] Database seeded.
) else (
    echo  * Seed may already exist (OK).
)
cd /d R:\Softwares\Spirulina
echo.

:: -----------------------------------------------
:: 6. Start application servers
:: -----------------------------------------------
echo [6/6] Starting application...
echo.

:: Start Express API server
echo  * Starting API server on http://localhost:3001 ...
start "Spirulina API" /min cmd /k "cd /d R:\Softwares\Spirulina\server && npx tsx src/app.ts"

:: Wait for API server
set /a count=0
:wait_api
timeout /t 2 /nobreak >nul
netstat -ano | findstr ":3001" | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo  [OK] API server running.
    goto api_ready
)
set /a count+=1
if %count% lss 10 goto wait_api
echo  WARNING: API server may still be starting...
:api_ready

:: Start Vite client
echo  * Starting client on http://localhost:5173 ...
start "Spirulina Client" /min cmd /k "cd /d R:\Softwares\Spirulina\client && npx vite --host"

:: Wait for client
set /a count=0
:wait_client
timeout /t 2 /nobreak >nul
netstat -ano | findstr ":5173" | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo  [OK] Client running.
    goto client_ready
)
set /a count+=1
if %count% lss 10 goto wait_client
echo  WARNING: Client may still be starting...
:client_ready

:: -----------------------------------------------
:: Done!
:: -----------------------------------------------
echo.
echo  ============================================
echo    ALL SERVICES RUNNING!
echo  ============================================
echo.
echo    Database:  postgresql://localhost:5432/spirulina
echo    API:       http://localhost:3001
echo    Client:    http://localhost:5173
echo.
echo    Login:     admin@spirulina.com / Admin@123
echo.
echo    Background windows:
echo      - "Spirulina DB"     (PostgreSQL)
echo      - "Spirulina API"    (Express server)
echo      - "Spirulina Client" (Vite dev server)
echo.
echo    To stop: close this window + all background windows
echo             or run stop.bat
echo  ============================================
echo.

:: Open browser
timeout /t 2 /nobreak >nul
start http://localhost:5173

echo  Press any key to open the stop menu...
pause >nul
goto stop_menu

:stop_menu
echo.
echo  What would you like to do?
echo    1. Stop all services
echo    2. Keep running (close this window only)
echo.
set /p choice="  Enter choice (1 or 2): "

if "%choice%"=="1" (
    echo  Stopping all services...
    taskkill /fi "WINDOWTITLE eq Spirulina Client" /t /f >nul 2>&1
    taskkill /fi "WINDOWTITLE eq Spirulina API" /t /f >nul 2>&1
    taskkill /fi "WINDOWTITLE eq Spirulina DB" /t /f >nul 2>&1
    :: Clean up PostgreSQL lock file
    if exist "data\pg\postmaster.pid" del /f "data\pg\postmaster.pid" >nul 2>&1
    echo  [OK] All services stopped.
    timeout /t 2 /nobreak >nul
)
exit /b 0
