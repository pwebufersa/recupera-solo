# Gera o APK do RECUPERA-SOLO em uma maquina limpa.
# Uso:
#   powershell -NoProfile -ExecutionPolicy Bypass -File .\gerar_apk.ps1
#   powershell -NoProfile -ExecutionPolicy Bypass -File .\gerar_apk.ps1 -Etapa Ferramentas
#   powershell -NoProfile -ExecutionPolicy Bypass -File .\gerar_apk.ps1 -Versao 1.0.1 -VersionCode 2

[CmdletBinding()]
param(
    [ValidateSet("Tudo", "Ferramentas", "Projeto", "Apk")]
    [string]$Etapa = "Tudo",

    [string]$Site = "",

    [string]$Versao = "1.0.0",

    [int]$VersionCode = 1
)

$ErrorActionPreference = "Stop"

$Raiz = $PSScriptRoot
$Ferramentas = Join-Path $Raiz "ferramentas"
$Jdk = Join-Path $Ferramentas "jdk21"
$Sdk = Join-Path $Ferramentas "android-sdk"
$BuildTools = Join-Path $Sdk "build-tools\36.0.0"
$App = Join-Path $Raiz "app"
$Assets = Join-Path $Raiz "assets"
$Segredos = Join-Path $Raiz "segredos"
$Dist = Join-Path $Raiz "dist"
$Nome = "RECUPERA-SOLO"
$Pacote = "br.edu.ufersa.recuperasolo"

function Escrever {
    param([string]$Texto)
    Write-Host "[apk] $Texto"
}

function Falhar {
    param([string]$Texto)
    throw $Texto
}

function Salvar-Texto {
    param([string]$Caminho, [string]$Texto)
    $utf8 = New-Object System.Text.UTF8Encoding -ArgumentList $false
    [IO.File]::WriteAllText($Caminho, $Texto, $utf8)
}

function Verificar-Windows {
    if ($env:OS -ne "Windows_NT") { Falhar "Este script exige Windows." }
    if (-not [Environment]::Is64BitOperatingSystem) { Falhar "Este script exige Windows de 64 bits." }
    if ($PSVersionTable.PSVersion.Major -lt 5) { Falhar "PowerShell 5 ou superior e necessario." }
}

function Verificar-Node {
    $node = Get-Command node.exe -ErrorAction SilentlyContinue
    if (-not $node) { Falhar "Node.js 22 ou superior nao encontrado no PATH." }

    $maior = & $node.Source -p "process.versions.node.split('.')[0]"
    if ([int]$maior -lt 22) { Falhar "Node.js 22 ou superior e necessario. Versao encontrada: $maior." }

    $npm = Get-Command npm.cmd -ErrorAction SilentlyContinue
    if (-not $npm) { Falhar "npm nao encontrado no PATH." }

    $npx = Get-Command npx.cmd -ErrorAction SilentlyContinue
    if (-not $npx) { Falhar "npx nao encontrado no PATH." }
}

function Achar-Site {
    param([string]$Caminho)

    if ($Caminho) {
        $resolvido = [IO.Path]::GetFullPath($Caminho)
        if (Test-Path (Join-Path $resolvido "index.html")) { return $resolvido }
        Falhar "O site informado nao contem index.html: $resolvido"
    }

    $pai = Split-Path -Parent $Raiz
    $candidatos = @((Join-Path $Raiz "site"))
    if ($pai) {
        $candidatos += (Join-Path $pai "site")
        $candidatos += $pai
        $candidatos += (Join-Path $pai "recupera-solo")
    }

    foreach ($candidato in $candidatos) {
        if ($candidato -and (Test-Path (Join-Path $candidato "index.html"))) {
            return $candidato
        }
    }

    Falhar "Site nao encontrado. Use -Site <pasta> ou mantenha a pasta ao lado de recupera-solo."
}

function Baixar {
    param([string]$Url, [string]$Destino)

    Escrever "Baixando $Url"
    $curl = Get-Command curl.exe -ErrorAction SilentlyContinue
    if ($curl) {
        & $curl.Source -L --fail --retry 3 $Url -o $Destino
        if ($LASTEXITCODE -ne 0) { Falhar "Falha no download: $Url" }
    }
    else {
        try { Invoke-WebRequest -Uri $Url -OutFile $Destino -UseBasicParsing }
        catch { Falhar "Falha no download: $Url" }
    }

    if (-not (Test-Path $Destino)) { Falhar "Arquivo nao baixado: $Destino" }
}

function Instalar-Ferramentas {
    New-Item -ItemType Directory -Force -Path $Ferramentas | Out-Null

    if (-not (Test-Path (Join-Path $Jdk "bin\java.exe"))) {
        $zip = Join-Path $Ferramentas "jdk21.zip"
        $tmp = Join-Path $Ferramentas "jdk21_tmp"
        Baixar "https://api.adoptium.net/v3/binary/latest/21/ga/windows/x64/jdk/hotspot/normal/eclipse?project=jdk" $zip
        if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
        Expand-Archive -Path $zip -DestinationPath $tmp -Force
        $pasta = Get-ChildItem $tmp -Directory | Where-Object { $_.Name -like "jdk-21*" } | Select-Object -First 1
        if (-not $pasta) { Falhar "Pasta do JDK nao encontrada no zip." }
        if (Test-Path $Jdk) { Remove-Item $Jdk -Recurse -Force }
        Move-Item $pasta.FullName $Jdk
        Remove-Item $tmp -Recurse -Force
        Remove-Item $zip -Force
        Escrever "JDK 21 instalado em $Jdk"
    }

    $sdkOk = (Test-Path (Join-Path $BuildTools "apksigner.bat")) -and
             (Test-Path (Join-Path $Sdk "platforms\android-36\android.jar"))

    if (-not $sdkOk) {
        $sdkManager = Join-Path $Sdk "cmdline-tools\latest\bin\sdkmanager.bat"
        if (-not (Test-Path $sdkManager)) {
            $zip = Join-Path $Ferramentas "cmdline-tools.zip"
            $tmp = Join-Path $Ferramentas "cmdline-tools-tmp"
            Baixar "https://dl.google.com/android/repository/commandlinetools-win-13114758_latest.zip" $zip
            if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
            Expand-Archive -Path $zip -DestinationPath $tmp -Force
            $cmdTools = Join-Path $Sdk "cmdline-tools"
            New-Item -ItemType Directory -Force -Path $cmdTools | Out-Null
            $latest = Join-Path $cmdTools "latest"
            if (Test-Path $latest) { Remove-Item $latest -Recurse -Force }
            Move-Item (Join-Path $tmp "cmdline-tools") $latest
            Remove-Item $tmp -Recurse -Force
            Remove-Item $zip -Force
        }

        $env:JAVA_HOME = $Jdk
        $env:ANDROID_HOME = $Sdk
        $env:ANDROID_SDK_ROOT = $Sdk
        $env:PATH = "$Jdk\bin;$Sdk\platform-tools;$Sdk\cmdline-tools\latest\bin;$BuildTools;$env:PATH"

        Escrever "Aceitando licencas do SDK."
        1..40 | ForEach-Object { "y" } | & $sdkManager --sdk_root=$Sdk --licenses | Out-Null
        if ($LASTEXITCODE -ne 0) { Falhar "Falha ao aceitar as licencas do SDK." }

        Escrever "Instalando platform-tools, Android 36 e build-tools 36."
        & $sdkManager --sdk_root=$Sdk "platform-tools" "platforms;android-36" "build-tools;36.0.0"
        if ($LASTEXITCODE -ne 0) { Falhar "Falha ao instalar os pacotes do SDK." }
    }
    else {
        Escrever "SDK ja instalado."
    }

    if (-not (Test-Path (Join-Path $Jdk "bin\java.exe"))) { Falhar "JDK 21 ausente." }
    if (-not (Test-Path (Join-Path $BuildTools "apksigner.bat"))) { Falhar "build-tools 36 ausente." }
    if (-not (Test-Path (Join-Path $Sdk "platforms\android-36\android.jar"))) { Falhar "Android 36 ausente." }
}

function Atualizar-Versao {
    param([string]$Gradle)

    if (-not (Test-Path $Gradle)) { Falhar "build.gradle nao encontrado: $Gradle" }

    $texto = [IO.File]::ReadAllText($Gradle)
    if ($texto -notmatch 'versionCode\s+\d+') { Falhar "versionCode nao encontrado no build.gradle." }
    if ($texto -notmatch 'versionName\s+"[^"]+"') { Falhar "versionName nao encontrado no build.gradle." }

    $texto = $texto -replace 'versionCode\s+\d+', ("versionCode " + $VersionCode)
    $texto = $texto -replace 'versionName\s+"[^"]+"', ('versionName "' + $Versao + '"')
    Salvar-Texto $Gradle $texto
}

function Criar-Projeto {
    param([string]$SiteResolvido)

    Verificar-Node

    foreach ($arquivo in @("index.html", "style.css", "script.js", "favicon.svg")) {
        if (-not (Test-Path (Join-Path $SiteResolvido $arquivo))) {
            Falhar "Arquivo ausente no site: $arquivo"
        }
    }

    foreach ($arquivo in @("icon-only.png", "splash.png", "icon-foreground.png", "icon-background.png")) {
        if (-not (Test-Path (Join-Path $Assets $arquivo))) {
            Falhar "Arquivo ausente em assets: $arquivo"
        }
    }

    New-Item -ItemType Directory -Force -Path (Join-Path $App "www") | Out-Null
    New-Item -ItemType Directory -Force -Path (Join-Path $App "assets") | Out-Null

    Copy-Item (Join-Path $SiteResolvido "index.html") (Join-Path $App "www\index.html") -Force
    Copy-Item (Join-Path $SiteResolvido "style.css") (Join-Path $App "www\style.css") -Force
    Copy-Item (Join-Path $SiteResolvido "script.js") (Join-Path $App "www\script.js") -Force
    Copy-Item (Join-Path $SiteResolvido "favicon.svg") (Join-Path $App "www\favicon.svg") -Force

    Copy-Item (Join-Path $Assets "icon-only.png") (Join-Path $App "assets\icon-only.png") -Force
    Copy-Item (Join-Path $Assets "splash.png") (Join-Path $App "assets\splash.png") -Force
    Copy-Item (Join-Path $Assets "icon-foreground.png") (Join-Path $App "assets\icon-foreground.png") -Force
    Copy-Item (Join-Path $Assets "icon-background.png") (Join-Path $App "assets\icon-background.png") -Force

    $packageJson = Join-Path $App "package.json"
    if (-not (Test-Path $packageJson)) {
        $json = @"
{
  "name": "recupera-solo-app",
  "version": "$Versao",
  "private": true,
  "dependencies": {
    "@capacitor/core": "8.5.3",
    "@capacitor/cli": "8.5.3",
    "@capacitor/android": "8.5.3"
  },
  "devDependencies": {
    "@capacitor/assets": "3.0.5"
  }
}
"@
        Salvar-Texto $packageJson $json
    }

    $config = Join-Path $App "capacitor.config.json"
    if (-not (Test-Path $config)) {
        $json = @"
{
  "appId": "$Pacote",
  "appName": "$Nome",
  "webDir": "www"
}
"@
        Salvar-Texto $config $json
    }

    Push-Location $App
    try {
        & npm.cmd install --no-audit --no-fund
        if ($LASTEXITCODE -ne 0) { Falhar "Falha ao instalar as dependencias do Capacitor." }

        $android = Join-Path $App "android"
        if (-not (Test-Path (Join-Path $android "app\build.gradle"))) {
            if (Test-Path $android) {
                Falhar "A pasta app\android existe mas esta incompleta. Remova-a e rode novamente."
            }
            & npx.cmd cap add android
            if ($LASTEXITCODE -ne 0) { Falhar "Falha ao adicionar a plataforma Android." }
        }

        & npx.cmd cap sync android
        if ($LASTEXITCODE -ne 0) { Falhar "Falha ao sincronizar o projeto Android." }

        $gradle = Join-Path $App "android\app\build.gradle"
        Atualizar-Versao $gradle

        $local = Join-Path $App "android\local.properties"
        Salvar-Texto $local ("sdk.dir=" + ($Sdk -replace '\\', '/') + "`n")

        & npx.cmd capacitor-assets generate --android `
            --iconBackgroundColor "#f1f5ed" `
            --iconBackgroundColorDark "#f1f5ed" `
            --splashBackgroundColor "#f1f5ed" `
            --splashBackgroundColorDark "#f1f5ed"
        if ($LASTEXITCODE -ne 0) { Falhar "Falha ao gerar icones e splash." }
    }
    finally {
        Pop-Location
    }

    Escrever "Projeto pronto em $App"
}

function Gerar-Apk {
    $gradle = Join-Path $App "android\app\build.gradle"
    if (-not (Test-Path (Join-Path $Jdk "bin\java.exe"))) { Falhar "JDK ausente. Rode -Etapa Ferramentas." }
    if (-not (Test-Path (Join-Path $BuildTools "apksigner.bat"))) { Falhar "build-tools ausente. Rode -Etapa Ferramentas." }
    if (-not (Test-Path $gradle)) { Falhar "Projeto Android ausente. Rode -Etapa Projeto." }

    New-Item -ItemType Directory -Force -Path $Segredos | Out-Null
    New-Item -ItemType Directory -Force -Path $Dist | Out-Null

    $props = Join-Path $Segredos "keystore.properties"
    $keystore = Join-Path $Segredos "recupera-solo.keystore"

    if ((Test-Path $keystore) -and -not (Test-Path $props)) {
        Falhar "A chave existe, mas keystore.properties nao. Restaure o arquivo de senhas."
    }

    if (-not (Test-Path $props)) {
        $senha = [guid]::NewGuid().ToString("N").Substring(0, 24)
        @(
            "storePassword=$senha",
            "keyPassword=$senha",
            "keyAlias=recuperasolo",
            "keystore=recupera-solo.keystore"
        ) | Set-Content -Encoding ASCII $props
        Escrever "Senha da chave gerada em $props. Guarde a pasta segredos."
    }

    $valores = @{}
    Get-Content $props | ForEach-Object {
        $partes = $_ -split "=", 2
        if ($partes.Count -eq 2) { $valores[$partes[0]] = $partes[1] }
    }

    $senha = $valores["storePassword"]
    $alias = $valores["keyAlias"]
    if (-not $senha -or -not $alias) { Falhar "keystore.properties incompleto." }

    $env:JAVA_HOME = $Jdk
    $env:ANDROID_HOME = $Sdk
    $env:ANDROID_SDK_ROOT = $Sdk
    $env:PATH = "$Jdk\bin;$Sdk\platform-tools;$BuildTools;$env:PATH"

    if (-not (Test-Path $keystore)) {
        Escrever "Gerando a chave de assinatura."
        & (Join-Path $Jdk "bin\keytool.exe") -genkeypair -v `
            -keystore $keystore -storetype PKCS12 -alias $alias `
            -keyalg RSA -keysize 2048 -validity 10000 `
            -storepass $senha -keypass $senha `
            -dname "CN=RECUPERA-SOLO, OU=DCETI, O=UFERSA, L=Angicos, ST=RN, C=BR"
        if ($LASTEXITCODE -ne 0) { Falhar "Falha ao gerar a chave." }
    }

    & (Join-Path $Jdk "bin\keytool.exe") -list -keystore $keystore -storepass $senha -alias $alias | Out-Null
    if ($LASTEXITCODE -ne 0) { Falhar "Nao foi possivel abrir a chave com a senha gravada." }

    $texto = [IO.File]::ReadAllText($gradle)
    if ($texto -match 'versionName\s+"([^"]+)"') {
        $versaoAtual = $Matches[1]
    }
    else {
        Falhar "versionName nao encontrado no build.gradle."
    }

    Push-Location (Join-Path $App "android")
    try {
        & .\gradlew.bat assembleRelease --no-daemon
        if ($LASTEXITCODE -ne 0) { Falhar "Falha na compilacao do APK." }
    }
    finally {
        Pop-Location
    }

    $semAssinatura = Join-Path $App "android\app\build\outputs\apk\release\app-release-unsigned.apk"
    if (-not (Test-Path $semAssinatura)) { Falhar "APK sem assinatura nao encontrado." }

    $alinhado = Join-Path $Dist ("alinhado-" + $versaoAtual + ".apk")
    $final = Join-Path $Dist ("$Nome-" + $versaoAtual + ".apk")

    & (Join-Path $BuildTools "zipalign.exe") -p -f 4 $semAssinatura $alinhado
    if ($LASTEXITCODE -ne 0) { Falhar "Falha no zipalign." }

    if (Test-Path $final) { Remove-Item $final -Force }

    & (Join-Path $BuildTools "apksigner.bat") sign `
        --ks $keystore --ks-key-alias $alias `
        --ks-pass "pass:$senha" --key-pass "pass:$senha" `
        --out $final $alinhado
    if ($LASTEXITCODE -ne 0) { Falhar "Falha na assinatura." }

    & (Join-Path $BuildTools "apksigner.bat") verify --verbose $final
    if ($LASTEXITCODE -ne 0) { Falhar "Falha na verificacao da assinatura." }

    Remove-Item $alinhado -Force
    Get-ChildItem $Dist -Filter "*.idsig" | Remove-Item -Force

    $hash = (Get-FileHash $final -Algorithm SHA256).Hash
    $linha = $hash + "  " + (Split-Path -Leaf $final)
    Salvar-Texto (Join-Path $Dist "SHA256.txt") ($linha + "`n")

    Write-Host ""
    Write-Host "APK gerado: $final"
    Write-Host "Versao: $versaoAtual"
    Write-Host "SHA-256: $hash"
}

Verificar-Windows

$siteResolvido = $null
if ($Etapa -eq "Tudo" -or $Etapa -eq "Projeto") {
    $siteResolvido = Achar-Site -Caminho $Site
    Escrever "Site: $siteResolvido"
}

if ($Etapa -eq "Tudo" -or $Etapa -eq "Ferramentas") {
    Instalar-Ferramentas
}

if ($Etapa -eq "Tudo" -or $Etapa -eq "Projeto") {
    Criar-Projeto -SiteResolvido $siteResolvido
}

if ($Etapa -eq "Tudo" -or $Etapa -eq "Apk") {
    Gerar-Apk
}

Escrever "Concluido."
