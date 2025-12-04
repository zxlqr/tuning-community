@echo off
chcp 65001 >nul
title Поиск PostgreSQL

echo ======================================================================
echo             ПОИСК УСТАНОВКИ POSTGRESQL
echo ======================================================================
echo.

echo Поиск pg_dump.exe и psql.exe...
echo.

REM Проверяем PATH
where pg_dump >nul 2>&1
if not errorlevel 1 (
    echo [НАЙДЕНО В PATH]
    where pg_dump
    where psql
    echo.
)

REM Ищем в стандартных местах
echo Поиск в стандартных папках установки...
echo.

set FOUND=0

for /d %%i in ("C:\Program Files\PostgreSQL\*\bin") do (
    if exist "%%i\pg_dump.exe" (
        echo [НАЙДЕНО] %%i
        echo   pg_dump.exe: %%i\pg_dump.exe
        echo   psql.exe: %%i\psql.exe
        echo.
        set FOUND=1
    )
)

for /d %%i in ("C:\Program Files (x86)\PostgreSQL\*\bin") do (
    if exist "%%i\pg_dump.exe" (
        echo [НАЙДЕНО] %%i
        echo   pg_dump.exe: %%i\pg_dump.exe
        echo   psql.exe: %%i\psql.exe
        echo.
        set FOUND=1
    )
)

if %FOUND%==0 (
    echo [НЕ НАЙДЕНО] PostgreSQL не найден в стандартных местах.
    echo.
    echo Попробуйте найти вручную:
    echo 1. Откройте Проводник
    echo 2. Перейдите в C:\Program Files\PostgreSQL\
    echo 3. Найдите папку с версией (15, 16, 17 и т.д.)
    echo 4. Откройте папку bin
    echo 5. Проверьте наличие pg_dump.exe и psql.exe
    echo.
)

echo ======================================================================
pause

