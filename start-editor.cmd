@echo off
setlocal
cd /d "%~dp0"
python --version >nul 2>nul
if errorlevel 1 (
  echo Python is missing. Install Python 3.12 or newer and enable Add Python to PATH.
  pause
  exit /b 1
)
ffmpeg -version >nul 2>nul
if errorlevel 1 (
  echo FFmpeg is missing. Install FFmpeg and add its bin folder to PATH, then reopen this launcher.
  pause
  exit /b 1
)
ffprobe -version >nul 2>nul
if errorlevel 1 (
  echo FFprobe is missing. Install the full FFmpeg package and add its bin folder to PATH.
  pause
  exit /b 1
)
if not exist ".venv\Scripts\python.exe" (
  python -m venv .venv
  if errorlevel 1 goto failed
)
".venv\Scripts\python.exe" -c "import numpy" >nul 2>nul
if errorlevel 1 (
  ".venv\Scripts\python.exe" -m pip install -r requirements.txt
  if errorlevel 1 goto failed
)
".venv\Scripts\python.exe" server.py --open
if errorlevel 1 goto failed
exit /b 0
:failed
echo.
echo The editor could not start. Review the message above.
pause
exit /b 1
