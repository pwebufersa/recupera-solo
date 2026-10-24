# Gera o APK do RECUPERA-SOLO em uma maquina limpa.
# Uso:
#   powershell -NoProfile -ExecutionPolicy Bypass -File .\gerar_app_android.ps1
#   powershell -NoProfile -ExecutionPolicy Bypass -File .\gerar_app_android.ps1 -Versao 1.0.1 -VersionCode 2
# Sem -Versao e -VersionCode, o nome da branch e a hora atual sao usados, para
# que uma compilacao local de cada branch possa ser instalada sobre a anterior.

[CmdletBinding()]
param(
    [string]$Site = "",

    [string]$Versao = "",

    [int]$VersionCode = 0
)

$ErrorActionPreference = "Stop"

$Raiz = $PSScriptRoot
$Ferramentas = Join-Path $Raiz "ferramentas"
$Jdk = Join-Path $Ferramentas "jdk"
$Node = Join-Path $Ferramentas "node"
$Sdk = Join-Path $Ferramentas "android-sdk"
$App = Join-Path $Raiz "app"
$Assets = Join-Path $Raiz "assets"
$Segredos = Join-Path $Raiz "segredos"
$Dist = Join-Path $Raiz "dist"
$Nome = "RECUPERA-SOLO"
$Pacote = "br.edu.ufersa.recuperasolo"

# As versoes das ferramentas nao sao fixadas: a mais recente de cada linha e
# resolvida a cada execucao, a partir das fontes oficiais.
$UrlNodeIndice = "https://nodejs.org/dist/index.json"
$UrlRepoAndroid = "https://dl.google.com/android/repository/repository2-3.xml"
$UrlJdk = "https://api.adoptium.net/v3/info/available_releases"

# Nivel da API do Android e decisao do projeto, nao versao de ferramenta:
# acompanha o compileSdk e o targetSdk declarados em app/android/variables.gradle.
$AndroidApi = $null

function Escrever {
    param([string]$Texto)
    Write-Host "[apk] $Texto"
}

function Falhar {
    param([string]$Texto)
    throw $Texto
}

function Resolver-Ramo {
    try {
        $ramo = & git -C $Raiz rev-parse --abbrev-ref HEAD 2>$null
        if ($LASTEXITCODE -eq 0 -and $ramo) {
            return ($ramo.Trim() -replace '[^0-9A-Za-z.-]', '-')
        }
    }
    catch {
    }
    return "local"
}

function Salvar-Texto {
    param([string]$Caminho, [string]$Texto)
    $utf8 = New-Object System.Text.UTF8Encoding -ArgumentList $false
    [IO.File]::WriteAllText($Caminho, $Texto, $utf8)
}

function Obter-Saida {
    # Programas nativos escrevem avisos em stderr. Com ErrorActionPreference
    # Stop, a juncao de stderr ao fluxo de saida vira erro terminante; por isso
    # a preferencia e suspensa apenas durante a chamada.
    param([string]$Caminho, [string[]]$Argumentos)

    $anterior = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        return ((& $Caminho @Argumentos 2>&1 | ForEach-Object { "$_" }) -join "`n").Trim()
    }
    finally {
        $ErrorActionPreference = $anterior
    }
}

function Verificar-Windows {
    if ($env:OS -ne "Windows_NT") { Falhar "Este script exige Windows." }
    if (-not [Environment]::Is64BitOperatingSystem) { Falhar "Este script exige Windows de 64 bits." }
    if ($PSVersionTable.PSVersion.Major -lt 5) { Falhar "PowerShell 5 ou superior e necessario." }
}

function Achar-NodeGlobal {
    $comando = Get-Command node -ErrorAction SilentlyContinue
    if (-not $comando) { return $null }

    $pasta = Split-Path -Parent $comando.Source
    if (-not (Test-Path (Join-Path $pasta "npm.cmd"))) { return $null }

    $versao = Obter-Saida -Caminho $comando.Source -Argumentos @("-p", "process.versions.node")
    if (-not $versao) { return $null }
    $maior = [int]($versao.Trim().Split('.')[0])
    if ($maior -lt 22) { return $null }

    return [pscustomobject]@{ Pasta = $pasta; Versao = $versao.Trim() }
}

function Achar-JdkGlobal {
    # Java 17 nao serve ao Android Gradle Plugin desta versao; a faixa aceita
    # vai de 21 a 24, que e o limite do Gradle 8.
    $candidatos = @()
    if ($env:JAVA_HOME) { $candidatos += $env:JAVA_HOME }
    $comando = Get-Command java -ErrorAction SilentlyContinue
    if ($comando) { $candidatos += (Split-Path -Parent (Split-Path -Parent $comando.Source)) }

    foreach ($candidato in $candidatos) {
        $java = Join-Path $candidato "bin\java.exe"
        if (-not (Test-Path $java)) { continue }
        $saida = Obter-Saida -Caminho $java -Argumentos @("-version")
        if ($saida -notmatch 'version "(\d+)') { continue }
        $feature = [int]$Matches[1]
        if ($feature -lt 21 -or $feature -gt 24) { continue }
        return [pscustomobject]@{ Pasta = $candidato; Feature = $feature }
    }
    return $null
}

function Achar-SdkGlobal {
    param([int]$Api)

    $candidatos = @()
    if ($env:ANDROID_HOME) { $candidatos += $env:ANDROID_HOME }
    if ($env:ANDROID_SDK_ROOT) { $candidatos += $env:ANDROID_SDK_ROOT }
    if ($env:LOCALAPPDATA) { $candidatos += (Join-Path $env:LOCALAPPDATA "Android\Sdk") }

    foreach ($candidato in $candidatos) {
        if (-not $candidato -or -not (Test-Path $candidato)) { continue }
        if (-not (Test-Path (Join-Path $candidato "platform-tools"))) { continue }
        if (-not (Test-Path (Join-Path $candidato "platforms\android-$Api\android.jar"))) { continue }
        if (-not (Test-Path (Join-Path $candidato "cmdline-tools\latest\bin\sdkmanager.bat"))) { continue }
        $buildTools = Get-ChildItem (Join-Path $candidato "build-tools") -Directory -ErrorAction SilentlyContinue |
            Where-Object { Test-Path (Join-Path $_.FullName "apksigner.bat") } |
            Select-Object -First 1
        if (-not $buildTools) { continue }
        return $candidato
    }
    return $null
}

function Resolver-Node {
    $indice = Join-Path $Ferramentas "node-index.json"
    Baixar $UrlNodeIndice $indice
    try {
        $lista = Get-Content -Raw $indice | ConvertFrom-Json
    }
    finally {
        Remove-Item $indice -Force
    }
    # A primeira entrada com LTS e a LTS mais recente do indice, que ja vem
    # ordenado da versao mais nova para a mais antiga.
    $versao = $lista | Where-Object { $_.lts } |
        Select-Object -First 1 -ExpandProperty version
    if (-not $versao) { Falhar "Nenhuma versao LTS do Node.js em $UrlNodeIndice." }
    return $versao
}

function Achar-NodeInstalado {
    $nodeExe = Join-Path $Node "node.exe"
    if (-not (Test-Path $nodeExe)) { return $null }
    return (& $nodeExe -p "process.versions.node").Trim()
}

function Instalar-Node {
    New-Item -ItemType Directory -Force -Path $Ferramentas | Out-Null

    $global = Achar-NodeGlobal
    if ($global) {
        $script:Node = $global.Pasta
        Escrever "Node.js $($global.Versao) global em $Node"
        $partes = $env:PATH -split ';'
        if (-not ($partes | Where-Object { $_ -ieq $Node })) { $env:PATH = "$Node;$env:PATH" }
        return
    }

    $instalada = Achar-NodeInstalado
    $versao = $null
    if (-not $instalada) {
        $versao = Resolver-Node
    }

    if ($versao) {
        $nomeZip = "node-$versao-win-x64.zip"
        $zip = Join-Path $Ferramentas "node.zip"
        $somas = Join-Path $Ferramentas "node-SHASUMS256.txt"
        $tmp = Join-Path $Ferramentas "node_tmp"
        $base = "https://nodejs.org/dist/$versao"

        Baixar "$base/$nomeZip" $zip
        Baixar "$base/SHASUMS256.txt" $somas

        $esperado = $null
        $padrao = "^([0-9a-fA-F]{64})\s+\*?" + [regex]::Escape($nomeZip) + "$"
        foreach ($linha in Get-Content $somas) {
            if ($linha -match $padrao) { $esperado = $Matches[1] }
        }
        if (-not $esperado) { Falhar "SHA-256 de $nomeZip ausente no SHASUMS256.txt oficial." }

        $obtido = (Get-FileHash $zip -Algorithm SHA256).Hash
        if ($obtido -ne $esperado.ToUpperInvariant()) {
            Falhar "SHA-256 divergente para $nomeZip. Esperado: $esperado. Obtido: $obtido."
        }

        if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
        Expand-Archive -Path $zip -DestinationPath $tmp -Force
        $pasta = Join-Path $tmp ("node-$versao-win-x64")
        if (-not (Test-Path (Join-Path $pasta "node.exe"))) { Falhar "node.exe ausente no zip do Node.js." }
        if (Test-Path $Node) { Remove-Item $Node -Recurse -Force }
        Move-Item $pasta $Node
        Remove-Item $tmp -Recurse -Force
        Remove-Item $zip -Force
        Remove-Item $somas -Force
        Escrever "Node.js $versao instalado em $Node"
    }
    else {
        Escrever "Node.js $instalada ja instalado."
    }

    $partes = $env:PATH -split ';'
    if (-not ($partes | Where-Object { $_ -ieq $Node })) { $env:PATH = "$Node;$env:PATH" }
}

function Verificar-Node {
    $nodeExe = Join-Path $Node "node.exe"
    $npm = Join-Path $Node "npm.cmd"
    $npx = Join-Path $Node "npx.cmd"

    if (-not (Test-Path $nodeExe)) { Falhar "Node.js ausente em $Node. Rode -Etapa Ferramentas." }
    if (-not (Test-Path $npm)) { Falhar "npm.cmd ausente em $Node." }
    if (-not (Test-Path $npx)) { Falhar "npx.cmd ausente em $Node." }

    $maior = & $nodeExe -p "process.versions.node.split('.')[0]"
    if ([int]$maior -lt 22) { Falhar "Node.js 22 ou superior e necessario. Versao encontrada: $maior." }
}

function Achar-Site {
    param([string]$Caminho)

    if ($Caminho) {
        $resolvido = [IO.Path]::GetFullPath($Caminho)
        if (Test-Path (Join-Path $resolvido "index.html")) { return $resolvido }
        Falhar "O site informado nao contem index.html: $resolvido"
    }

    $pai = Split-Path -Parent $Raiz
    $candidatos = @()
    if ($pai) {
        $candidatos += (Join-Path $pai "codigo_fonte")
        $candidatos += (Join-Path $pai "site")
        $candidatos += $pai
        $candidatos += (Join-Path $pai "recupera-solo")
    }
    $candidatos += (Join-Path $Raiz "site")

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
        & $curl.Source -sS -L --fail --retry 5 --retry-all-errors $Url -o $Destino
        if ($LASTEXITCODE -ne 0) { Falhar "Falha no download: $Url" }
    }
    else {
        try { Invoke-WebRequest -Uri $Url -OutFile $Destino -UseBasicParsing }
        catch { Falhar "Falha no download: $Url" }
    }

    if (-not (Test-Path $Destino)) { Falhar "Arquivo nao baixado: $Destino" }
}

function Achar-BuildTools {
    $pasta = Join-Path $Sdk "build-tools"
    if (-not (Test-Path $pasta)) { return $null }

    $dir = Get-ChildItem $pasta -Directory |
        Where-Object { $_.Name -match '^\d+(\.\d+)*$' } |
        Sort-Object { [version]$_.Name } -Descending |
        Select-Object -First 1

    if (-not $dir) { return $null }
    return $dir.FullName
}

function Resolver-CmdlineTools {
    $xml = Join-Path $Ferramentas "repository2-3.xml"
    Baixar $UrlRepoAndroid $xml
    $texto = Get-Content -Raw $xml
    Remove-Item $xml -Force

    # A versao 20 em diante troca o sdkmanager por um wrapper experimental que
    # falha no download e ainda devolve codigo 0; a maior versao abaixo de 20
    # e escolhida.
    $numeradas = [regex]::Matches($texto, 'path="cmdline-tools;(\d+(?:\.\d+)*)"') |
        ForEach-Object { $_.Groups[1].Value } |
        Sort-Object { [version]$_ } -Descending -Unique
    $estavel = $numeradas | Where-Object { [version]$_ -lt [version]"20.0" } | Select-Object -First 1

    $bloco = $null
    if ($estavel) {
        $bloco = [regex]::Match($texto, 'path="cmdline-tools;' + [regex]::Escape($estavel) + '".*?</remotePackage>', 'Singleline')
    }
    if (-not $bloco -or -not $bloco.Success) {
        $bloco = [regex]::Match($texto, 'path="cmdline-tools;latest".*?</remotePackage>', 'Singleline')
    }
    if (-not $bloco.Success) { Falhar "Pacote cmdline-tools ausente em $UrlRepoAndroid." }

    $arquivo = [regex]::Match($bloco.Value, '<url>(commandlinetools-win-[^<]+)</url>').Groups[1].Value
    if (-not $arquivo) { Falhar "Pacote Windows do cmdline-tools ausente em $UrlRepoAndroid." }

    return "https://dl.google.com/android/repository/$arquivo"
}

function Resolver-Jdk {
    # A Adoptium informa as versoes LTS disponiveis. O Gradle 8 aceita ate o
    # Java 24, e por isso a maior LTS dentro desse limite e escolhida.
    $info = Invoke-RestMethod -Uri $UrlJdk -UseBasicParsing
    $lts = $info.available_lts_releases | Sort-Object -Descending
    $escolhida = $lts | Where-Object { [int]$_ -le 24 } | Select-Object -First 1
    if (-not $escolhida) { Falhar "Nenhuma versao LTS do JDK compativel com o Gradle em $UrlJdk." }
    return [int]$escolhida
}

function Resolver-AndroidApi {
    # A plataforma mais recente vem do repositorio oficial do Android.
    $xml = Join-Path $Ferramentas "repository2-3-platforms.xml"
    Baixar $UrlRepoAndroid $xml
    $texto = Get-Content -Raw $xml
    Remove-Item $xml -Force

    $versoes = [regex]::Matches($texto, 'path="platforms;android-(\d+)"') |
        ForEach-Object { [int]$_.Groups[1].Value } |
        Sort-Object -Descending -Unique

    if (-not $versoes) { Falhar "Nenhuma plataforma no repositorio do Android." }
    return ($versoes | Select-Object -First 1)
}

function Resolver-BuildTools {
    # A versao vem do repositorio oficial do Android, e nao da saida do
    # sdkmanager, que muda de formato entre versoes do cmdline-tools.
    $xml = Join-Path $Ferramentas "repository2-3-buildtools.xml"
    Baixar $UrlRepoAndroid $xml
    $texto = Get-Content -Raw $xml
    Remove-Item $xml -Force

    $versoes = [regex]::Matches($texto, 'path="build-tools;(\d+(?:\.\d+)*)"') |
        ForEach-Object { $_.Groups[1].Value } |
        Sort-Object { [version]$_ } -Descending -Unique

    if (-not $versoes) { Falhar "Nenhum build-tools no repositorio do Android." }
    return ($versoes | Select-Object -First 1)
}

# O sdkmanager escreve avisos em stderr. No PowerShell 5.1, com
# ErrorActionPreference = Stop, isso vira erro. A funcao abaixo captura a saida
# sem derrubar o script e devolve texto e codigo de saida.
# As licencas sao gravadas direto no SDK. A confirmacao pela entrada padrao
# nao e confiavel em runner sem console.
function Gravar-Licencas {
    $dir = Join-Path $Sdk "licenses"
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    $hash = "24333f8a63b6825ea9c5514f83c2829b004d1fee"
    foreach ($nome in @("android-sdk-license", "android-sdk-preview-license")) {
        Salvar-Texto (Join-Path $dir $nome) ($hash + "`n")
    }
}

function Chamar-SdkManager {
    param([string]$Caminho, [string[]]$Argumentos)

    $anterior = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        $texto = (& $Caminho @Argumentos 2>&1 | ForEach-Object { "$_" }) -join "`n"
        $codigo = $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $anterior
    }

    return [pscustomobject]@{ Texto = $texto; Codigo = $codigo }
}

function Instalar-Ferramentas {
    New-Item -ItemType Directory -Force -Path $Ferramentas | Out-Null

    # O JDK global e usado quando a versao serve ao Android Gradle Plugin.
    $jdkGlobal = Achar-JdkGlobal
    if ($jdkGlobal) {
        $script:Jdk = $jdkGlobal.Pasta
        Escrever "JDK $($jdkGlobal.Feature) global em $Jdk"
    }
    elseif (-not (Test-Path (Join-Path $Jdk "bin\java.exe"))) {
        $feature = Resolver-Jdk
        $zip = Join-Path $Ferramentas "jdk.zip"
        $tmp = Join-Path $Ferramentas "jdk_tmp"
        Baixar "https://api.adoptium.net/v3/binary/latest/$feature/ga/windows/x64/jdk/hotspot/normal/eclipse?project=jdk" $zip
        if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
        Expand-Archive -Path $zip -DestinationPath $tmp -Force
        $pasta = Get-ChildItem $tmp -Directory | Where-Object { $_.Name -like "jdk-*" } | Select-Object -First 1
        if (-not $pasta) { Falhar "Pasta do JDK nao encontrada no zip." }
        if (Test-Path $Jdk) { Remove-Item $Jdk -Recurse -Force }
        Move-Item $pasta.FullName $Jdk
        Remove-Item $tmp -Recurse -Force
        Remove-Item $zip -Force
        Escrever "JDK $feature local em $Jdk"
    }

    if (-not $AndroidApi) { $script:AndroidApi = Resolver-AndroidApi }

    # O SDK global so e aceito quando ja contem tudo o que o build usa, para
    # que nenhum pacote seja instalado fora do repositorio.
    $sdkGlobal = Achar-SdkGlobal -Api $AndroidApi
    if ($sdkGlobal) {
        $script:Sdk = $sdkGlobal
        Escrever "Android SDK global em $Sdk"
    }
    else {
        Gravar-Licencas
        $cmdToolsBin = Join-Path $Sdk "cmdline-tools\latest\bin"
        $sdkManager = Join-Path $cmdToolsBin "sdkmanager.bat"

        if (-not (Test-Path $sdkManager)) {
            $url = Resolver-CmdlineTools
            $zip = Join-Path $Ferramentas "cmdline-tools.zip"
            $tmp = Join-Path $Ferramentas "cmdline-tools-tmp"
            Baixar $url $zip
            if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
            Expand-Archive -Path $zip -DestinationPath $tmp -Force
            $cmdTools = Join-Path $Sdk "cmdline-tools"
            New-Item -ItemType Directory -Force -Path $cmdTools | Out-Null
            $latest = Join-Path $cmdTools "latest"
            if (Test-Path $latest) { Remove-Item $latest -Recurse -Force }
            Move-Item (Join-Path $tmp "cmdline-tools") $latest
            Remove-Item $tmp -Recurse -Force
            Remove-Item $zip -Force
            Escrever "cmdline-tools local em $latest"
        }
    }

    $env:JAVA_HOME = $Jdk
    $env:ANDROID_HOME = $Sdk
    $env:ANDROID_SDK_ROOT = $Sdk
    $env:PATH = "$Jdk\bin;$Sdk\cmdline-tools\latest\bin;$Sdk\platform-tools;$env:PATH"

    $buildTools = Achar-BuildTools
    $apiOk = Test-Path (Join-Path $Sdk "platforms\android-$AndroidApi\android.jar")
    $instaladaBuildTools = ""
    if ($buildTools) { $instaladaBuildTools = Split-Path -Leaf $buildTools }

    if (-not $apiOk -or -not $buildTools) {
        $versaoBuildTools = Resolver-BuildTools
        $sdkManager = Join-Path $Sdk "cmdline-tools\latest\bin\sdkmanager.bat"

        Escrever "Instalando platform-tools, Android $AndroidApi e build-tools $versaoBuildTools."
        # O cmdline-tools 19 usa ponto e virgula; o 20 em diante usa barra.
        $instalacao = Chamar-SdkManager -Caminho $sdkManager `
            -Argumentos @("--sdk_root=$Sdk", "platform-tools", "platforms;android-$AndroidApi", "build-tools;$versaoBuildTools")
        $buildTools = Achar-BuildTools
        if (-not $buildTools) {
            $instalacao = Chamar-SdkManager -Caminho $sdkManager `
                -Argumentos @("--sdk_root=$Sdk", "platform-tools", "platforms/android-$AndroidApi", "build-tools/$versaoBuildTools")
            $buildTools = Achar-BuildTools
        }
        if (-not $buildTools) {
            Escrever $instalacao.Texto
            Falhar "O sdkmanager terminou sem instalar o build-tools."
        }
    }
    else {
        Escrever "SDK pronto: build-tools $instaladaBuildTools, Android $AndroidApi."
    }

    if (-not (Test-Path (Join-Path $Jdk "bin\java.exe"))) { Falhar "JDK ausente." }
    if (-not $buildTools -or -not (Test-Path (Join-Path $buildTools "apksigner.bat"))) { Falhar "build-tools ausente." }
    if (-not (Test-Path (Join-Path $Sdk "platforms\android-$AndroidApi\android.jar"))) { Falhar "Android $AndroidApi ausente." }

    Instalar-Node
    Verificar-Node
}

function Garantir-Android {
    param([string]$Api)

    if (Test-Path (Join-Path $Sdk "platforms\android-$Api\android.jar")) { return }

    $sdkManager = Join-Path $Sdk "cmdline-tools\latest\bin\sdkmanager.bat"
    if (-not (Test-Path $sdkManager)) { Falhar "cmdline-tools ausente. Rode -Etapa Ferramentas." }

    $env:JAVA_HOME = $Jdk
    Gravar-Licencas
    Escrever "Instalando a plataforma Android $Api exigida pelo projeto."
    $plataforma = Chamar-SdkManager -Caminho $sdkManager -Argumentos @("--sdk_root=$Sdk", "platforms;android-$Api")
    if (-not (Test-Path (Join-Path $Sdk "platformsndroid-$Apindroid.jar"))) {
        $plataforma = Chamar-SdkManager -Caminho $sdkManager -Argumentos @("--sdk_root=$Sdk", "platforms/android-$Api")
    }
    if (-not (Test-Path (Join-Path $Sdk "platformsndroid-$Apindroid.jar"))) {
        Escrever $plataforma.Texto
        Falhar "Falha ao instalar a plataforma Android $Api."
    }
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

    Instalar-Node
    Verificar-Node
    $npm = Join-Path $Node "npm.cmd"
    $npx = Join-Path $Node "npx.cmd"

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
  "private": true
}
"@
        Salvar-Texto $packageJson $json
    }

    $config = Join-Path $App "capacitor.config.json"
    $json = @"
{
  "appId": "$Pacote",
  "appName": "$Nome",
  "webDir": "www",
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 700,
      "backgroundColor": "#f3f7f5",
      "showSpinner": false,
      "launchAutoHide": true
    }
  }
}
"@
    Salvar-Texto $config $json

    Push-Location $App
    try {
        Escrever "Instalando as dependencias mais recentes do Capacitor."
        & $npm install --prefer-offline --no-audit --no-fund "@capacitor/core@latest" "@capacitor/cli@latest" "@capacitor/android@latest" "@capacitor/status-bar@latest" "@capacitor/share@latest" "@capacitor/splash-screen@latest"
        if ($LASTEXITCODE -ne 0) { Falhar "Falha ao instalar as dependencias do Capacitor." }

        & $npm install --prefer-offline --no-audit --no-fund --save-dev "@capacitor/assets@latest"
        if ($LASTEXITCODE -ne 0) { Falhar "Falha ao instalar o @capacitor/assets." }

        $android = Join-Path $App "android"
        if (-not (Test-Path (Join-Path $android "app\build.gradle"))) {
            if (Test-Path $android) {
                Falhar "A pasta app\android existe mas esta incompleta. Remova-a e rode novamente."
            }
            & $npx cap add android
            if ($LASTEXITCODE -ne 0) { Falhar "Falha ao adicionar a plataforma Android." }
        }

        & $npx cap sync android
        if ($LASTEXITCODE -ne 0) { Falhar "Falha ao sincronizar o projeto Android." }

        $gradle = Join-Path $App "android\app\build.gradle"
        Atualizar-Versao $gradle

        $variaveis = Join-Path $App "android\variables.gradle"
        if (Test-Path $variaveis) {
            $texto = [IO.File]::ReadAllText($variaveis)
            if ($texto -match 'compileSdkVersion\s*=\s*(\d+)') { Garantir-Android -Api $Matches[1] }
        }

        $local = Join-Path $App "android\local.properties"
        Salvar-Texto $local ("sdk.dir=" + ($Sdk -replace '\\', '/') + "`n")

        & $npx capacitor-assets generate --android `
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
    $BuildTools = Achar-BuildTools
    if (-not (Test-Path (Join-Path $Jdk "bin\java.exe"))) { Falhar "JDK ausente. Rode -Etapa Ferramentas." }
    if (-not $BuildTools) { Falhar "build-tools ausente. Rode -Etapa Ferramentas." }
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
        & .\gradlew.bat assembleRelease --no-daemon --build-cache
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

    # A pasta dist guarda apenas o APK desta compilacao, e a pasta apk recebe
    # uma copia identica, para que as duas permanecam iguais.
    Get-ChildItem $Dist -Filter "*.apk" |
        Where-Object { $_.FullName -ne $final } |
        Remove-Item -Force

    $publicado = Join-Path $Raiz "$Nome.apk"
    Copy-Item $final $publicado -Force

    $hash = (Get-FileHash $final -Algorithm SHA256).Hash
    $linha = $hash + "  " + (Split-Path -Leaf $final)
    Salvar-Texto (Join-Path $Dist "SHA256.txt") ($linha + "`n")

    Write-Host ""
    Write-Host "APK gerado: $final"
    Write-Host "APK publicado: $publicado"
    Write-Host "Versao: $versaoAtual"
    Write-Host "SHA-256: $hash"
}

Verificar-Windows

if (-not $Versao) {
    $Versao = Resolver-Ramo
}
if ($VersionCode -le 0) {
    $VersionCode = [int](Get-Date).ToString("yyMMddHH", [Globalization.CultureInfo]::InvariantCulture)
}
Escrever "Versao local: $Versao ($VersionCode)"

$siteResolvido = Achar-Site -Caminho $Site
Escrever "Site: $siteResolvido"

Instalar-Ferramentas
Criar-Projeto -SiteResolvido $siteResolvido
Gerar-Apk

Escrever "Concluido."
