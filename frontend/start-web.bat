@echo off
echo Starting CommUnity Web Admin Panel...
echo.

REM Add Node.js to PATH temporarily
set PATH=%~dp0..\node-v20.11.1-win-x64;%PATH%

REM Start the React development server
npm start

pause
