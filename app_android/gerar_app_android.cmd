@echo off
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0gerar_app_android.ps1" %*
echo.
echo Pressione uma tecla para fechar.
pause >nul
