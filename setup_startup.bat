@echo off
setlocal
set "SCRIPT_PATH=%~dp0monitor.js"
set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "BAT_FILE=%STARTUP_FOLDER%\SecureLogin.bat"

echo Creating startup script...
echo @echo off > "%BAT_FILE%"
echo cd /d "%~dp0" >> "%BAT_FILE%"
echo node monitor.js >> "%BAT_FILE%"

echo Done! The secure login will now start automatically when you log in to Windows.
echo To test it now, run: npm run monitor
pause
