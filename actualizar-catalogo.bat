@echo off
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0actualizar-catalogo.ps1"
echo.
echo Pulsa una tecla para cerrar.
pause >nul
