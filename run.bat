@echo off
title Car and Bike Rental Management System
cd /d "%~dp0"
if not exist node_modules (
  echo Installing project dependencies...
  call npm install
  if errorlevel 1 (
    echo Installation failed. Check that Node.js is installed and internet is available.
    pause
    exit /b 1
  )
)
call npm start
pause
