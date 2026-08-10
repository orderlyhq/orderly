@echo off
setlocal

set "ORDERLY_DIR=%~dp0"
set "NSSM=%ORDERLY_DIR%nssm\nssm.exe"

echo.
echo ========================================
echo       REMOVENDO ORDERLY SERVER
echo ========================================
echo.

if not exist "%NSSM%" (
    echo NSSM nao encontrado.
    exit /b 0
)

echo Parando servico...

"%NSSM%" stop OrderlyServer >nul 2>&1

timeout /t 2 /nobreak >nul

echo Removendo servico...

"%NSSM%" remove OrderlyServer confirm >nul 2>&1

echo.
echo Servico OrderlyServer removido.
echo.

exit /b 0