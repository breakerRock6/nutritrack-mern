@echo off
setlocal EnableDelayedExpansion
title NutriTrack Launcher
cd /d "%~dp0"

echo ==================================================
echo   NutriTrack launcher
echo ==================================================
echo.

rem ---- 1. Check Node.js ----
where node >nul 2>nul
if errorlevel 1 (
  echo [X] Node.js is not installed or not on PATH.
  echo     Install the LTS version from https://nodejs.org and run this file again.
  pause
  exit /b 1
)

rem ---- 2. Check we are in the project root ----
if not exist "server\package.json" (
  echo [X] Cannot find the server folder.
  echo     Put this file in the project root, the folder that contains "server" and "client".
  pause
  exit /b 1
)
set HAS_CLIENT=0
if exist "client\package.json" set HAS_CLIENT=1

rem ---- 3. Create server\.env on first run ----
if not exist "server\.env" (
  echo [*] Creating server\.env with a fresh secret...
  for /f "usebackq delims=" %%i in (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`) do set SECRET=%%i
  (
    echo NODE_ENV=development
    echo PORT=5000
    echo MONGODB_URI=mongodb://127.0.0.1:27017/nutrition_tracker
    echo JWT_SECRET=!SECRET!
    echo JWT_EXPIRES_IN=7d
    echo CLIENT_URL=http://localhost:5173
    echo COOKIE_SAMESITE=lax
    echo FOOD_PROVIDER=local
  ) > "server\.env"
)

rem ---- 4. Warn if local MongoDB is not running ----
findstr /c:"127.0.0.1" "server\.env" >nul 2>nul
if not errorlevel 1 (
  powershell -NoProfile -Command "try{$c=New-Object Net.Sockets.TcpClient;$c.Connect('127.0.0.1',27017);exit 0}catch{exit 1}"
  if errorlevel 1 (
    echo.
    echo [!] MongoDB does not seem to be running on this PC.
    echo     Start the MongoDB service, or put a MongoDB Atlas link in server\.env
    echo     as MONGODB_URI. The API will fail to connect until you do.
    echo.
    pause
  )
)

rem ---- 5. Install dependencies on first run ----
if not exist "server\node_modules" (
  echo [*] Installing server packages, this can take a minute...
  pushd server
  call npm install
  if errorlevel 1 ( popd & echo [X] Server install failed. & pause & exit /b 1 )
  popd
)
if "%HAS_CLIENT%"=="1" if not exist "client\node_modules" (
  echo [*] Installing client packages, this can take a minute...
  pushd client
  call npm install
  if errorlevel 1 ( popd & echo [X] Client install failed. & pause & exit /b 1 )
  popd
)

rem ---- 6. Seed the database once ----
if not exist "server\.seeded" (
  echo [*] Loading foods and the demo user into the database...
  pushd server
  call npm run seed:demo
  if errorlevel 1 (
    popd
    echo [X] Seeding failed. Check that MongoDB is reachable, then run this file again.
    pause
    exit /b 1
  )
  popd
  echo done> "server\.seeded"
)

rem ---- 7. Start servers in their own windows ----
echo [*] Starting the API on http://localhost:5000
start "NutriTrack API" /d "%~dp0server" cmd /k npm run dev

if "%HAS_CLIENT%"=="1" (
  echo [*] Starting the website on http://localhost:5173
  start "NutriTrack Web" /d "%~dp0client" cmd /k npm run dev
  echo [*] Opening your browser in a few seconds...
  timeout /t 8 /nobreak >nul
  start "" http://localhost:5173
) else (
  echo.
  echo [i] The client folder was not found, so only the API is running.
  echo     Extract nutrition-tracker-full.zip to get the website too.
  timeout /t 5 /nobreak >nul
  start "" http://localhost:5000/api/health
)

echo.
echo ==================================================
echo   NutriTrack is running.
echo   Demo login:  demo@example.com  /  Demo@1234
echo   To stop: run stop-nutritrack.bat or close the two windows.
echo ==================================================
timeout /t 6 >nul
endlocal