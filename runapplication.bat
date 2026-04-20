@echo off
title Microblog — Running
echo.
echo  ======================================
echo   Microblog — Starting Application
echo  ======================================
echo.

REM ── Activate virtual environment ────────────────────────────
call env\Scripts\activate
if errorlevel 1 (
    echo  ERROR: Virtual environment not found.
    echo  Run setupdev.bat first.
    pause & exit /b 1
)

REM ── Start Backend ────────────────────────────────────────────
echo  Starting backend on http://localhost:8000 ...
echo  Swagger UI will be at http://localhost:8000/docs
start "Microblog Backend" cmd /k "call env\Scripts\activate && cd backend && uvicorn main:app --reload --port 8000"

REM ── Wait for backend to boot ─────────────────────────────────
echo  Waiting for backend to start...
timeout /t 4 /nobreak >nul

REM ── Start Frontend ───────────────────────────────────────────
echo  Starting frontend on http://localhost:3000 ...
start "Microblog Frontend" cmd /k "cd frontend && npm start"

echo.
echo  ======================================
echo   Both servers are starting!
echo.
echo   Frontend : http://localhost:3000
echo   Backend  : http://localhost:8000
echo   Swagger  : http://localhost:8000/docs
echo   OpenAPI  : http://localhost:8000/openapi.json
echo  ======================================
echo.
echo  To stop: close the two terminal windows.
echo.
pause
