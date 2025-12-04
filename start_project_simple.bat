@echo off
chcp 65001 >nul
title Запуск проекта Homies

echo ======================================================================
echo                    ЗАПУСК ПРОЕКТА HOMIES
echo ======================================================================
echo.

cd /d "%~dp0"

REM Проверяем виртуальное окружение
if not exist "backend\venv\Scripts\python.exe" (
    echo [ОШИБКА] Виртуальное окружение не найдено!
    pause
    exit /b 1
)

REM Применяем миграции
echo Применение миграций...
set PYTHON_PATH=%~dp0backend\venv\Scripts\python.exe

if not exist "%PYTHON_PATH%" (
    echo [ОШИБКА] Python не найден по пути: %PYTHON_PATH%
    pause
    exit /b 1
)

cd /d "%~dp0backend"
"%PYTHON_PATH%" manage.py migrate --noinput
cd /d "%~dp0"

REM Запускаем backend
echo.
echo Запуск Django сервера (backend)...
start "Homies Backend" cmd /k "cd /d %~dp0backend && %PYTHON_PATH% manage.py runserver"

REM Ждем немного
timeout /t 3 /nobreak >nul

REM Запускаем frontend
echo Запуск Vite сервера (frontend)...
start "Homies Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ======================================================================
echo Серверы запущены в окнах:
echo   - Backend:  http://localhost:8000
echo   - Frontend: http://localhost:5173
echo ======================================================================
echo.
pause

