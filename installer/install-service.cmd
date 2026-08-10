@echo off
setlocal

title Orderly - Instalacao do Servico

set "ORDERLY_DIR=%~dp0"
set "NODE=%ORDERLY_DIR%node\node.exe"
set "NSSM=%ORDERLY_DIR%nssm\nssm.exe"
set "SERVER=%ORDERLY_DIR%server"
set "BOT=%SERVER%\bot.js"

echo.
echo ========================================
echo        ORDERLY SERVER INSTALLER
echo ========================================
echo.

echo [1/6] Verificando Node.js...

if not exist "%NODE%" (
    echo ERRO: node.exe nao encontrado.
    exit /b 1
)

echo Node encontrado.

echo.
echo [2/6] Verificando servidor...

if not exist "%BOT%" (
    echo ERRO: bot.js nao encontrado.
    exit /b 1
)

echo Servidor encontrado.

echo.
echo [3/6] Verificando NSSM...

if not exist "%NSSM%" (
    echo ERRO: nssm.exe nao encontrado.
    exit /b 1
)

echo NSSM encontrado.

echo.
echo [4/6] Removendo servico antigo...

"%NSSM%" stop OrderlyServer >nul 2>&1
"%NSSM%" remove OrderlyServer confirm >nul 2>&1

echo Servico antigo removido, se existia.

echo.
echo [5/6] Criando servico OrderlyServer...

"%NSSM%" install OrderlyServer "%NODE%"

if errorlevel 1 (
    echo ERRO ao criar o servico.
    exit /b 1
)

"%NSSM%" set OrderlyServer AppDirectory "%SERVER%"

"%NSSM%" set OrderlyServer AppParameters "\"%BOT%\""

"%NSSM%" set OrderlyServer DisplayName "Orderly Server"

"%NSSM%" set OrderlyServer Description "Servidor principal do Orderly - HTTP, WhatsApp, impressora e Bee Delivery."

"%NSSM%" set OrderlyServer Start SERVICE_AUTO_START

"%NSSM%" set OrderlyServer AppExit Default Exit

"%NSSM%" set OrderlyServer AppStdout "%ProgramData%\Orderly\logs\server.log"

"%NSSM%" set OrderlyServer AppStderr "%ProgramData%\Orderly\logs\server-error.log"

"%NSSM%" set OrderlyServer AppRotateFiles 1

"%NSSM%" set OrderlyServer AppRotateOnline 1

"%NSSM%" set OrderlyServer AppRotateBytes 10485760

echo.
echo [6/6] Iniciando servico...

"%NSSM%" start OrderlyServer

if errorlevel 1 (
    echo AVISO: nao foi possivel iniciar o servico automaticamente.
    echo Verifique os logs.
    exit /b 1
)

echo.
echo ========================================
echo      ORDERLY INSTALADO COM SUCESSO
echo ========================================
echo.
echo Servico: OrderlyServer
echo HTTP:    http://localhost:3001
echo.

exit /b 0