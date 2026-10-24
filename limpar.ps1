# Limpa o projeto e desinstala as ferramentas usadas na construção.
#
# Uso:
#   powershell -NoProfile -ExecutionPolicy Bypass -File .\limpar.ps1
#   powershell -NoProfile -ExecutionPolicy Bypass -File .\limpar.ps1 -Forcar
#   powershell -NoProfile -ExecutionPolicy Bypass -File .\limpar.ps1 -Simular
#
# -Forcar   dispensa a confirmação escrita
# -Simular  apenas lista os alvos e os tamanhos, sem apagar
#
# O script se eleva sozinho quando precisa remover pastas de Program Files.
# A chave de assinatura em apk/segredos e o repositório .git são preservados.

[CmdletBinding()]
param(
    [switch]$Forcar,
    [switch]$Simular,
    [switch]$Elevado
)

$ErrorActionPreference = "Stop"

$Raiz = $PSScriptRoot
$Perfil = $env:USERPROFILE
$Log = Join-Path $env:TEMP "recupera-solo-limpeza.log"
$Falhas = New-Object System.Collections.Generic.List[string]
$Removidos = New-Object System.Collections.Generic.List[object]

function Escrever {
    param([string]$Texto)
    Write-Host "[limpeza] $Texto"
    if ($Elevado) { Add-Content -LiteralPath $Log -Value $Texto -Encoding UTF8 }
}

function Tamanho {
    param([string]$Caminho)
    if (-not (Test-Path -LiteralPath $Caminho)) { return 0 }
    $item = Get-Item -LiteralPath $Caminho -Force
    if ($item.LinkType) { return 0 }
    if (-not $item.PSIsContainer) { return $item.Length }
    $soma = 0
    foreach ($filho in Get-ChildItem -LiteralPath $Caminho -Force -Recurse -ErrorAction SilentlyContinue) {
        if ($filho.LinkType) { continue }
        if (-not $filho.PSIsContainer) { $soma += $filho.Length }
    }
    return $soma
}

function Remover {
    param([string]$Caminho, [string]$Rotulo = "")

    if (-not (Test-Path -LiteralPath $Caminho)) {
        Escrever "ausente: $Caminho"
        return
    }

    $bytes = Tamanho $Caminho
    if ($Simular) {
        Escrever ("simulacao: {0} ({1:N1} MB)" -f $Caminho, ($bytes / 1MB))
        return
    }

    try {
        $item = Get-Item -LiteralPath $Caminho -Force
        if ($item.PSIsContainer -and $item.LinkType) {
            [System.IO.Directory]::Delete($Caminho)
        }
        else {
            Remove-Item -LiteralPath $Caminho -Recurse -Force
        }
        $Removidos.Add([pscustomobject]@{ Caminho = $Caminho; MB = [math]::Round($bytes / 1MB, 1); Rotulo = $Rotulo })
        Escrever ("removido: {0} ({1:N1} MB)" -f $Caminho, ($bytes / 1MB))
    }
    catch {
        $Falhas.Add("$Caminho -> $($_.Exception.Message)")
        Escrever "falhou: $Caminho -> $($_.Exception.Message)"
    }
}

function Remover-Juncoes {
    param([string]$Pasta)

    if (-not (Test-Path -LiteralPath $Pasta)) { return }
    foreach ($filho in Get-ChildItem -LiteralPath $Pasta -Force) {
        if ($filho.LinkType) {
            Escrever "juncao removida: $($filho.FullName)"
            if (-not $Simular) { [System.IO.Directory]::Delete($filho.FullName) }
        }
    }
}

function Limpar-Variavel {
    param([string]$Nome, [string]$Escopo)

    $valor = [Environment]::GetEnvironmentVariable($Nome, $Escopo)
    if (-not $valor) { return }
    if ($Simular) {
        Escrever "simulacao: $Escopo $Nome = $valor"
        return
    }
    [Environment]::SetEnvironmentVariable($Nome, $null, $Escopo)
    Escrever "variavel removida: $Escopo $Nome = $valor"
}

function Limpar-Path {
    param([string]$Escopo, [string[]]$Trechos)

    $atual = [Environment]::GetEnvironmentVariable("PATH", $Escopo)
    if (-not $atual) { return }
    $partes = $atual -split ';' | Where-Object { $_ }
    $restantes = $partes | Where-Object {
        $parte = $_
        -not ($Trechos | Where-Object { $parte -like "*$_*" })
    }
    if ($restantes.Count -eq $partes.Count) { return }
    $novo = $restantes -join ';'
    if ($Simular) {
        Escrever "simulacao: PATH $Escopo perderia $($partes.Count - $restantes.Count) entrada(s)"
        return
    }
    [Environment]::SetEnvironmentVariable("PATH", $novo, $Escopo)
    Escrever "PATH ajustado: $Escopo, $($partes.Count - $restantes.Count) entrada(s) removida(s)"
}

function Tem-Administrador {
    $identidade = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal $identidade
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Alvos dentro do repositorio, todos baixaveis de novo.
$Projeto = @(
    (Join-Path $Raiz "node_modules"),
    (Join-Path $Raiz "test-results"),
    (Join-Path $Raiz "playwright-report"),
    (Join-Path $Raiz ".pytest_cache"),
    (Join-Path $Raiz "apk/app"),
    (Join-Path $Raiz "apk/dist")
)

# Ferramentas instaladas fora do repositorio.
$Globais = @(
    (Join-Path $Perfil "jdk21"),
    "C:\Android\sdk",
    (Join-Path $Perfil ".gradle"),
    (Join-Path $Perfil ".android"),
    (Join-Path $env:LOCALAPPDATA "ms-playwright"),
    (Join-Path $env:LOCALAPPDATA "npm-cache"),
    (Join-Path $env:LOCALAPPDATA "pip\Cache"),
    (Join-Path $env:APPDATA "npm"),
    "C:\Program Files\nodejs",
    "C:\Program Files\Python313"
)

$TrechosPath = @(
    "jdk21", "Android\sdk", ".gradle", "nodejs", "Python313", "ms-playwright"
)

$Total = 0
foreach ($caminho in ($Projeto + $Globais)) { $Total += Tamanho $caminho }

if (-not $Simular) {
    Add-Content -LiteralPath $Log -Value ("--- limpeza em " + (Get-Date).ToString("s")) -Encoding UTF8
    Escrever ("alvos: {0} GB" -f [math]::Round($Total / 1GB, 2))

    if (-not $Forcar) {
        Write-Host ""
        Write-Host "Serao apagados o projeto, as ferramentas de construcao e os caches."
        Write-Host "Node.js, Python, JDK, Android SDK, Gradle e Playwright serao desinstalados."
        $resposta = Read-Host "Digite APAGAR para continuar"
        if ($resposta -ne "APAGAR") {
            Escrever "cancelado"
            exit 1
        }
        $Forcar = $true
    }
}

# Elevacao apenas quando ha pasta de Program Files a remover.
if (-not $Simular -and -not (Tem-Administrador)) {
    $argumentos = @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", "`"$PSCommandPath`"", "-Elevado")
    if ($Forcar) { $argumentos += "-Forcar" }
    Escrever "elevacao solicitada para remover C:\Program Files"
    $processo = Start-Process powershell -ArgumentList $argumentos -Verb RunAs -Wait -PassThru
    if (Test-Path -LiteralPath $Log) { Get-Content -LiteralPath $Log | Select-Object -Last 40 }
    exit $processo.ExitCode
}

foreach ($caminho in $Projeto) { Remover $caminho "projeto" }

Remover-Juncoes (Join-Path $Raiz "apk/ferramentas")
Remover (Join-Path $Raiz "apk/ferramentas") "projeto"

Get-ChildItem -LiteralPath $Raiz -Filter "__pycache__" -Directory -Recurse -Force -ErrorAction SilentlyContinue |
    ForEach-Object { Remover $_.FullName "cache" }
Get-ChildItem -LiteralPath $Raiz -Filter "*.log" -File -Recurse -Force -ErrorAction SilentlyContinue |
    ForEach-Object { Remover $_.FullName "log" }
Get-ChildItem -LiteralPath $Raiz -Filter "~`$*" -File -Recurse -Force -ErrorAction SilentlyContinue |
    ForEach-Object { Remover $_.FullName "trava" }

foreach ($caminho in $Globais) { Remover $caminho "global" }

if ((Test-Path -LiteralPath "C:\Android") -and -not (Get-ChildItem -LiteralPath "C:\Android" -Force)) {
    Remover "C:\Android" "global"
}

foreach ($nome in @("JAVA_HOME", "ANDROID_HOME", "ANDROID_SDK_ROOT", "GRADLE_HOME")) {
    Limpar-Variavel $nome "User"
    if (Tem-Administrador) { Limpar-Variavel $nome "Machine" }
}
Limpar-Path "User" $TrechosPath
if (Tem-Administrador) { Limpar-Path "Machine" $TrechosPath }

if ($Simular) {
    Escrever ("total a liberar: {0:N1} GB" -f ($Total / 1GB))
    exit 0
}

$liberado = ($Removidos | Measure-Object -Property MB -Sum).Sum
Escrever ("liberado: {0:N1} GB" -f ($liberado / 1024))

$restantes = @()
foreach ($nome in @("JAVA_HOME", "ANDROID_HOME", "ANDROID_SDK_ROOT", "GRADLE_HOME")) {
    foreach ($escopo in @("User", "Machine")) {
        $valor = [Environment]::GetEnvironmentVariable($nome, $escopo)
        if ($valor) { $restantes += "$escopo $nome=$valor" }
    }
}
if ($restantes.Count -eq 0) { Escrever "variaveis de construcao: nenhuma definida" }
else { $restantes | ForEach-Object { Escrever "variavel restante: $_" } }

if ($Falhas.Count -gt 0) {
    Escrever "falhas: $($Falhas.Count)"
    $Falhas | ForEach-Object { Escrever "  $_" }
    exit 1
}

Escrever "concluido; a construcao do APK baixa tudo de novo em apk/gerar_apk.cmd"
exit 0
