# ==========================================================
# ORDERLY SERVER
# BUILD SCRIPT
# ==========================================================

$ErrorActionPreference = "Stop"

$InstallerDir = Split-Path -Parent $MyInvocation.MyCommand.Path

$ProjectRoot = Split-Path -Parent $InstallerDir

$ServerDir = Join-Path $ProjectRoot "server"

$OutputDir = Join-Path $InstallerDir "output"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " ORDERLY SERVER - BUILD" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# ----------------------------------------------------------
# VERIFICAR SERVER
# ----------------------------------------------------------

if (-not (Test-Path $ServerDir)) {
    throw "Pasta server não encontrada: $ServerDir"
}

# ----------------------------------------------------------
# VERIFICAR NODE
# ----------------------------------------------------------

$NodeRuntime = Join-Path $InstallerDir "runtime\node.exe"

if (-not (Test-Path $NodeRuntime)) {
    throw "node.exe não encontrado em: $NodeRuntime"
}

# ----------------------------------------------------------
# VERIFICAR NSSM
# ----------------------------------------------------------

$Nssm = Join-Path $InstallerDir "bin\nssm.exe"

if (-not (Test-Path $Nssm)) {
    throw "nssm.exe não encontrado em: $Nssm"
}

# ----------------------------------------------------------
# LIMPAR OUTPUT
# ----------------------------------------------------------

if (Test-Path $OutputDir) {
    Remove-Item $OutputDir -Recurse -Force
}

New-Item -ItemType Directory -Path $OutputDir | Out-Null

# ----------------------------------------------------------
# VERIFICAR INNO SETUP
# ----------------------------------------------------------

$ISCCCandidates = @(
    "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe",
    "${env:ProgramFiles}\Inno Setup 6\ISCC.exe"
)

$ISCC = $null

foreach ($Candidate in $ISCCCandidates) {

    if (Test-Path $Candidate) {
        $ISCC = $Candidate
        break
    }
}

if (-not $ISCC) {
    throw "ISCC.exe do Inno Setup não foi encontrado."
}

Write-Host "Inno Setup:" $ISCC
Write-Host ""

# ----------------------------------------------------------
# COMPILAR
# ----------------------------------------------------------

$ISS = Join-Path $InstallerDir "OrderlyServer.iss"

if (-not (Test-Path $ISS)) {
    throw "Arquivo OrderlyServer.iss não encontrado."
}

Write-Host "Compilando instalador..." -ForegroundColor Yellow

& $ISCC $ISS

if ($LASTEXITCODE -ne 0) {
    throw "Falha ao compilar o instalador."
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host " INSTALADOR GERADO COM SUCESSO" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

Get-ChildItem $OutputDir