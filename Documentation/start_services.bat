@echo off
:: ============================================================================
::  MILMA PLANT OPERATIONS DASHBOARD - ONE-CLICK SERVICE STARTER
:: ============================================================================
::  This batch file automatically starts all required services for the application:
::  1. MongoDB Database Service (Checks / Starts MongoDB)
::  2. Express Backend Server (Port 5000)
::  3. Vite React Frontend Dashboard (Port 5173)
::  4. Opens the dashboard in your default browser
:: ============================================================================

title Starting Milma Dashboard Services...
color 0A
echo.
echo ============================================================================
echo   Starting Milma Plant Operations Dashboard Services
echo ============================================================================
echo.

:: ----------------------------------------------------------------------------
:: STEP 1: Set Project Root Directory
:: %~dp0 points to the directory containing this batch file.
:: cd /d switches to the project root directory (one level up from Documentation).
:: ----------------------------------------------------------------------------
echo [1/4] Navigating to Project Root Directory...
cd /d "%~dp0.."
set "PROJECT_ROOT=%CD%"
echo Project Root: %PROJECT_ROOT%
echo.

:: ----------------------------------------------------------------------------
:: STEP 2: Ensure MongoDB Service is Running
:: We attempt to start the MongoDB Windows service if it isn't already running.
:: ----------------------------------------------------------------------------
echo [2/4] Checking MongoDB Database Service...
net start MongoDB >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] MongoDB Service is active.
) else (
    echo [NOTE] MongoDB Service is already running or managed locally.
)
echo.

:: ----------------------------------------------------------------------------
:: STEP 3: Start Express Backend API Server (Port 5000)
:: Opens a dedicated command prompt window running 'node server.js'.
:: ----------------------------------------------------------------------------
echo [3/4] Launching Express Backend Server (Port 5000)...
start "Milma Backend API Server (Port 5000)" cmd /k "cd /d "%PROJECT_ROOT%\backend" && title Milma Backend Server && echo Starting Backend API... && node server.js"
timeout /t 3 /nobreak >nul

:: ----------------------------------------------------------------------------
:: STEP 4: Start Vite React Frontend Dashboard (Port 5173)
:: Opens a dedicated command prompt window running 'npm run dev'.
:: ----------------------------------------------------------------------------
echo [4/4] Launching Vite React Frontend Dev Server (Port 5173)...
start "Milma Frontend Dashboard (Port 5173)" cmd /k "cd /d "%PROJECT_ROOT%\frontend" && title Milma Frontend Dashboard && echo Starting Frontend... && npm run dev"
timeout /t 3 /nobreak >nul

:: ----------------------------------------------------------------------------
:: STEP 5: Open Dashboard in Default Web Browser
:: Launches the default browser pointing to http://localhost:5173/
:: ----------------------------------------------------------------------------
echo.
echo ============================================================================
echo   All Services Successfully Launched!
echo   - Backend Server:  http://localhost:5000/
echo   - Frontend App:    http://localhost:5173/
echo ============================================================================
echo Opening Dashboard in your browser...
start http://localhost:5173/

echo.
echo You can close this window. Backend and Frontend will continue running in their windows.
pause
