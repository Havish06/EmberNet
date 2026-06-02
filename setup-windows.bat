@echo off
setlocal enabledelayedexpansion

REM EmberNet Setup Script for Windows
REM This script sets up the development environment on Windows

echo.
echo ============================================================
echo.
echo   🚀 EmberNet Setup for Windows
echo.
echo ============================================================
echo.

REM Step 1: Check Node.js
echo [1/6] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo   ❌ Node.js not found
    echo.
    echo   Please install Node.js from: https://nodejs.org/
    echo   Recommended: LTS version (v18 or higher)
    echo.
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo   ✅ Node.js found: !NODE_VERSION!
)

REM Step 2: Check npm
echo.
echo [2/6] Checking npm installation...
npm --version >nul 2>&1
if errorlevel 1 (
    echo   ❌ npm not found
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo   ✅ npm found: v!NPM_VERSION!
)

REM Step 3: Install dependencies
echo.
echo [3/6] Installing npm dependencies...
echo   Running: npm install
npm install
if errorlevel 1 (
    echo   ❌ npm install failed
    echo.
    echo   Try manually:
    echo     npm cache clean --force
    echo     npm install
    echo.
    pause
    exit /b 1
) else (
    echo   ✅ Dependencies installed
)

REM Step 4: Check Redis
echo.
echo [4/6] Checking Redis installation...
redis-cli ping >nul 2>&1
if errorlevel 1 (
    echo   ⚠️  Redis CLI not accessible (but may still work)
    echo.
    echo   To install Redis, choose ONE option:
    echo.
    echo   Option A: Docker (Recommended)
    echo     docker run -d -p 6379:6379 redis:latest
    echo.
    echo   Option B: Memurai (Windows native)
    echo     https://www.memurai.com/
    echo     Then run: msiexec /i memurai-latest.msi
    echo.
    echo   Option C: WSL2 with Linux
    echo     wsl -d Ubuntu apt-get install redis-server
    echo.
    echo   To proceed without verification, press any key...
    pause
    echo   ✅ Proceeding with setup
    echo      Verify Redis manually before running npm run dev
) else (
    echo   ✅ Redis is accessible
)

REM Step 5: Create .env.local
echo.
echo [5/6] Configuring environment...
if not exist .env.local (
    (
        echo REDIS_URL=redis://localhost:6379
        echo NEXT_PUBLIC_API_URL=http://localhost:3000
        echo NODE_ENV=development
    ) > .env.local
    echo   ✅ Created .env.local
) else (
    echo   ℹ️  .env.local already exists
)

REM Step 6: Done
echo.
echo [6/6] Setup complete!
echo.
echo ============================================================
echo.
echo   🎉 Ready to develop!
echo.
echo   Next steps:
echo     1. Make sure Redis is running
echo     2. Run: npm run dev
echo     3. Open: http://localhost:3000
echo.
echo   To verify Redis is running:
echo     redis-cli ping
echo     (Should return: PONG)
echo.
echo ============================================================
echo.

pause
