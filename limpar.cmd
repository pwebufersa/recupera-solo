@echo off
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0limpar.ps1" %*
echo.
echo Pressione uma tecla para fechar.
pause >nul
