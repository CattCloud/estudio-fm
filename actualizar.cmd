@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Estudio FM - actualizando la lista de canciones...
echo.
node actualizar.mjs
echo.
pause
