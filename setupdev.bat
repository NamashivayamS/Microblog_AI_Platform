@echo off
setlocal enabledelayedexpansion
title Microblog — Setup

echo.
echo  ======================================
echo   Microblog — Development Setup
echo  ======================================
echo.

REM ── Step 1: Python virtual environment ──────────────────────
echo [1/5] Creating Python virtual environment...
python -m venv env
if errorlevel 1 (
    echo  ERROR: Python not found. Install Python 3.10+ from https://python.org
    pause & exit /b 1
)
echo       Done.

REM ── Step 2: Install Python dependencies ─────────────────────
echo [2/5] Installing Python dependencies...
call env\Scripts\activate
pip install -r backend\requirements.txt --quiet
if errorlevel 1 (
    echo  ERROR: pip install failed. Check your internet connection.
    pause & exit /b 1
)
echo       Done.

REM ── Step 3: Run database migrations ─────────────────────────
echo [3/5] Running database migrations...
cd backend
alembic upgrade head
if errorlevel 1 (
    echo  ERROR: Alembic migration failed.
    pause & exit /b 1
)
cd ..
echo       Done.

REM ── Step 4: Seed initial data ────────────────────────────────
echo [4/5] Seeding sample data...
if exist backend\microblog.db (
    sqlite3 backend\microblog.db < backend\seed_data.sql 2>nul
    if errorlevel 1 (
        echo       Note: sqlite3 CLI not found — skipping seed. DB is still ready.
    ) else (
        echo       Done.
    )
) else (
    echo       Skipping seed — DB not found.
)

REM ── Step 5: Install frontend dependencies ───────────────────
echo [5/5] Installing frontend dependencies...
cd frontend
call npm install --silent
if errorlevel 1 (
    echo  ERROR: npm install failed. Make sure Node.js 18+ is installed.
    pause & exit /b 1
)
cd ..
echo       Done.

echo.
echo  ======================================
echo   Setup complete!
echo   Run runapplication.bat to start.
echo  ======================================
echo.
pause
