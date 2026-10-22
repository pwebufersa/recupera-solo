# Registra ou remove a tarefa do Windows que roda o vigia a cada 5 minutos.
#
# Uso:
#   powershell -NoProfile -ExecutionPolicy Bypass -File .\instalar-vigia.ps1
#   powershell -NoProfile -ExecutionPolicy Bypass -File .\instalar-vigia.ps1 -Remover

param(
    [switch]$Remover
)

$ErrorActionPreference = "Stop"

$Nome = "RECUPERA-SOLO - vigia TODO"
$Script = Join-Path $PSScriptRoot "vigia-todo.ps1"

if ($Remover) {
    schtasks /Delete /TN "$Nome" /F
    Write-Host "Tarefa removida."
    exit 0
}

if (-not (Test-Path $Script)) {
    throw "Script nao encontrado: $Script"
}

$comando = 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "' + $Script + '"'

schtasks /Create /TN "$Nome" /TR "$comando" /SC MINUTE /MO 5 /F
if ($LASTEXITCODE -ne 0) {
    throw "Nao foi possivel registrar a tarefa."
}

Write-Host "Tarefa registrada: $Nome, a cada 5 minutos."
Write-Host "Registro: $(Join-Path (Split-Path -Parent $PSScriptRoot) '.vigia\registro.log')"
