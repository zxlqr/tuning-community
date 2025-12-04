@echo off
chcp 65001 >nul
title Создание дампа базы данных

echo ======================================================================
echo             СОЗДАНИЕ ДАМПА БАЗЫ ДАННЫХ
echo ======================================================================
echo.

cd /d "%~dp0\.."

REM Ищем pg_dump в стандартных местах установки PostgreSQL
set PG_DUMP_PATH=
where pg_dump >nul 2>&1
if not errorlevel 1 (
    REM Найден в PATH
    set PG_DUMP_PATH=pg_dump
    goto :found
)

REM Ищем в стандартных путях установки
echo Поиск PostgreSQL в стандартных местах...
for /d %%i in ("C:\Program Files\PostgreSQL\*\bin") do (
    if exist "%%i\pg_dump.exe" (
        set PG_DUMP_PATH=%%i\pg_dump.exe
        echo Найден: %%i\pg_dump.exe
        goto :found
    )
)
for /d %%i in ("C:\Program Files (x86)\PostgreSQL\*\bin") do (
    if exist "%%i\pg_dump.exe" (
        set PG_DUMP_PATH=%%i\pg_dump.exe
        echo Найден: %%i\pg_dump.exe
        goto :found
    )
)

REM Ищем через реестр (если доступен)
echo Поиск через реестр...
for /f "tokens=2*" %%a in ('reg query "HKLM\SOFTWARE\PostgreSQL" /s /v "Base Directory" 2^>nul ^| findstr /i "Base Directory"') do (
    set REG_PATH=%%b
    if exist "!REG_PATH!\bin\pg_dump.exe" (
        set PG_DUMP_PATH=!REG_PATH!\bin\pg_dump.exe
        echo Найден через реестр: !PG_DUMP_PATH!
        goto :found
    )
)

REM Если не найден, просим пользователя указать путь
echo.
echo [ОШИБКА] pg_dump не найден автоматически!
echo.
echo Как найти путь к pg_dump.exe:
echo 1. Откройте Проводник Windows
echo 2. Перейдите в C:\Program Files\PostgreSQL\
echo 3. Найдите папку с версией (например: 15, 16, 17)
echo 4. Откройте папку bin
echo 5. Скопируйте полный путь к pg_dump.exe
echo.
echo Примеры путей:
echo   C:\Program Files\PostgreSQL\15\bin\pg_dump.exe
echo   C:\Program Files\PostgreSQL\16\bin\pg_dump.exe
echo   C:\Program Files (x86)\PostgreSQL\15\bin\pg_dump.exe
echo.
set /p PG_DUMP_PATH="Введите полный путь к pg_dump.exe: "
if "%PG_DUMP_PATH%"=="" (
    echo [ОШИБКА] Путь не указан!
    pause
    exit /b 1
)
REM Убираем кавычки, если пользователь их ввел
set PG_DUMP_PATH=%PG_DUMP_PATH:"=%
if not exist "%PG_DUMP_PATH%" (
    echo [ОШИБКА] Файл не найден: %PG_DUMP_PATH%
    echo.
    echo Проверьте правильность пути и попробуйте снова.
    pause
    exit /b 1
)
:found
setlocal enabledelayedexpansion
echo.
echo Используется: %PG_DUMP_PATH%
echo.
endlocal

REM Читаем настройки из .env или используем значения по умолчанию
set DB_NAME=tuning_studio_db
set DB_USER=postgres
set DB_HOST=localhost
set DB_PORT=5432

echo Введите имя базы данных [%DB_NAME%]:
set /p DB_NAME_INPUT=
if not "%DB_NAME_INPUT%"=="" set DB_NAME=%DB_NAME_INPUT%

echo Введите пользователя БД [%DB_USER%]:
set /p DB_USER_INPUT=
if not "%DB_USER_INPUT%"=="" set DB_USER=%DB_USER_INPUT%

echo Введите хост [%DB_HOST%]:
set /p DB_HOST_INPUT=
if not "%DB_HOST_INPUT%"=="" set DB_HOST=%DB_HOST_INPUT%

echo Введите порт [%DB_PORT%]:
set /p DB_PORT_INPUT=
if not "%DB_PORT_INPUT%"=="" set DB_PORT=%DB_PORT_INPUT%

echo.
echo Создание дампа базы данных %DB_NAME%...
echo.

REM Создаем папку для дампов, если её нет
if not exist "database\database_dumps" mkdir database\database_dumps

REM Создаем дамп с датой и временем в имени файла
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c-%%a-%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)
set mytime=%mytime: =0%

set DUMP_FILE=database\database_dumps\dump_%DB_NAME%_%mydate%_%mytime%.sql

echo Создание дампа: %DUMP_FILE%
echo.

"%PG_DUMP_PATH%" -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -F p -f "%DUMP_FILE%"

if errorlevel 1 (
    echo [ОШИБКА] Не удалось создать дамп базы данных
    echo Проверьте:
    echo - Запущен ли PostgreSQL
    echo - Правильность данных подключения
    echo - Права доступа пользователя
    pause
    exit /b 1
)

echo.
echo ======================================================================
echo Дамп успешно создан: %DUMP_FILE%
echo.
echo ВАЖНО: Проверьте дамп на наличие чувствительных данных!
echo Убедитесь, что в дампе нет реальных паролей и личной информации.
echo ======================================================================
echo.
pause

