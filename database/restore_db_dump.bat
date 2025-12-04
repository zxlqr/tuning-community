@echo off
chcp 65001 >nul
title Восстановление базы данных из дампа

echo ======================================================================
echo             ВОССТАНОВЛЕНИЕ БАЗЫ ДАННЫХ ИЗ ДАМПА
echo ======================================================================
echo.

cd /d "%~dp0\.."

REM Ищем psql в стандартных местах установки PostgreSQL
set PSQL_PATH=
where psql >nul 2>&1
if not errorlevel 1 (
    REM Найден в PATH
    set PSQL_PATH=psql
) else (
    REM Ищем в стандартных путях установки
    for /d %%i in ("C:\Program Files\PostgreSQL\*\bin") do (
        if exist "%%i\psql.exe" (
            set PSQL_PATH=%%i\psql.exe
            goto :found_psql
        )
    )
    for /d %%i in ("C:\Program Files (x86)\PostgreSQL\*\bin") do (
        if exist "%%i\psql.exe" (
            set PSQL_PATH=%%i\psql.exe
            goto :found_psql
        )
    )
    echo [ОШИБКА] psql не найден!
    echo.
    echo Проверьте:
    echo 1. PostgreSQL установлен
    echo 2. Утилиты PostgreSQL добавлены в PATH, ИЛИ
    echo 3. PostgreSQL установлен в стандартную папку Program Files
    echo.
    echo Вы можете указать путь к psql вручную:
    set /p PSQL_PATH="Введите полный путь к psql.exe (например: C:\Program Files\PostgreSQL\15\bin\psql.exe): "
    if "%PSQL_PATH%"=="" (
        pause
        exit /b 1
    )
    if not exist "%PSQL_PATH%" (
        echo [ОШИБКА] Файл не найден: %PSQL_PATH%
        pause
        exit /b 1
    )
    goto :found_psql
)
:found_psql

REM Читаем настройки
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
echo Выберите файл дампа:
echo.

REM Показываем список дампов
if exist "database\database_dumps\*.sql" (
    echo Доступные дампы:
    dir /b database\database_dumps\*.sql
    echo.
) else (
    echo [ОШИБКА] Не найдено ни одного дампа в папке database\database_dumps
    pause
    exit /b 1
)

echo Введите имя файла дампа (например: dump_tuning_studio_db_2025-12-02_1200.sql):
set /p DUMP_FILE=

if not exist "database\database_dumps\%DUMP_FILE%" (
    echo [ОШИБКА] Файл database\database_dumps\%DUMP_FILE% не найден!
    pause
    exit /b 1
)

echo.
echo ВНИМАНИЕ: Это действие перезапишет существующую базу данных %DB_NAME%!
echo Продолжить? (Y/N)
set /p CONFIRM=
if /i not "%CONFIRM%"=="Y" (
    echo Отменено.
    pause
    exit /b 0
)

echo.
echo Восстановление базы данных из дампа...
echo.

REM Удаляем старую базу и создаем новую
echo Удаление старой базы данных (если существует)...
"%PSQL_PATH%" -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d postgres -c "DROP DATABASE IF EXISTS %DB_NAME%;" 2>nul
"%PSQL_PATH%" -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d postgres -c "CREATE DATABASE %DB_NAME%;"

if errorlevel 1 (
    echo [ОШИБКА] Не удалось создать базу данных
    pause
    exit /b 1
)

REM Восстанавливаем дамп
echo Восстановление дампа...
"%PSQL_PATH%" -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f "database\database_dumps\%DUMP_FILE%"

if errorlevel 1 (
    echo [ОШИБКА] Не удалось восстановить дамп
    pause
    exit /b 1
)

echo.
echo ======================================================================
echo База данных успешно восстановлена!
echo.
echo Теперь примените миграции Django:
echo   cd backend
echo   python manage.py migrate
echo ======================================================================
echo.
pause

