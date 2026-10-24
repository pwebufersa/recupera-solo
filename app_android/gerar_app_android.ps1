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
$CorFundo = "#f1f5ed"

# As versoes das ferramentas nao sao fixadas: a mais recente de cada linha e
# resolvida a cada execucao, a partir das fontes oficiais.
$UrlNodeIndice = "https://nodejs.org/dist/index.json"
$UrlRepoAndroid = "https://dl.google.com/android/repository/repository2-3.xml"
$UrlJdk = "https://api.adoptium.net/v3/info/available_releases"

# Nivel da API do Android e decisao do projeto, nao versao de ferramenta:
# acompanha o compileSdk e o targetSdk declarados em app/android/variables.gradle.
$AndroidApi = $null

# O repositorio do Android e baixado uma vez e serve as tres consultas:
# plataforma, build-tools e cmdline-tools.
$RepoAndroid = $null

function Escrever {
    param([string]$Texto)
    Write-Host "[app_android] $Texto"
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

function Adicionar-AoPath {
    param([string]$Pasta)
    $partes = $env:PATH -split ';'
    if (-not ($partes | Where-Object { $_ -ieq $Pasta })) { $env:PATH = "$Pasta;$env:PATH" }
}

function Chamar {
    # Programas nativos escrevem avisos em stderr. Com ErrorActionPreference
    # Stop, a juncao de stderr ao fluxo de saida vira erro terminante; por isso
    # a preferencia e suspensa apenas durante a chamada.
    param([string]$Caminho, [string[]]$Argumentos = @())

    $anterior = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        $texto = (& $Caminho @Argumentos 2>&1 | ForEach-Object { "$_" }) -join "`n"
        return [pscustomobject]@{ Texto = $texto.Trim(); Codigo = $LASTEXITCODE }
    }
    finally {
        $ErrorActionPreference = $anterior
    }
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

# ---------------------------------------------------------------------------
# Consultas as fontes oficiais
# ---------------------------------------------------------------------------

function Obter-RepositorioAndroid {
    if ($script:RepoAndroid) { return $script:RepoAndroid }

    New-Item -ItemType Directory -Force -Path $Ferramentas | Out-Null
    $xml = Join-Path $Ferramentas "repository2-3.xml"
    Baixar $UrlRepoAndroid $xml
    try { $script:RepoAndroid = Get-Content -Raw $xml }
    finally { Remove-Item $xml -Force }
    return $script:RepoAndroid
}

function Obter-Versoes {
    param([string]$Padrao)
    return [regex]::Matches((Obter-RepositorioAndroid), $Padrao) | ForEach-Object { $_.Groups[1].Value }
}

function Resolver-AndroidApi {
    # A plataforma mais recente vem do repositorio oficial do Android.
    $versoes = Obter-Versoes 'path="platforms;android-(\d+)"' |
        ForEach-Object { [int]$_ } | Sort-Object -Descending -Unique
    if (-not $versoes) { Falhar "Nenhuma plataforma no repositorio do Android." }
    return ($versoes | Select-Object -First 1)
}

function Resolver-BuildTools {
    # A versao vem do repositorio oficial do Android, e nao da saida do
    # sdkmanager, que muda de formato entre versoes do cmdline-tools.
    $versoes = Obter-Versoes 'path="build-tools;(\d+(?:\.\d+)*)"' |
        Sort-Object { [version]$_ } -Descending -Unique
    if (-not $versoes) { Falhar "Nenhum build-tools no repositorio do Android." }
    return ($versoes | Select-Object -First 1)
}

function Resolver-CmdlineTools {
    # A versao 20 em diante troca o sdkmanager por um wrapper experimental que
    # falha no download e ainda devolve codigo 0; a maior versao abaixo de 20
    # e escolhida.
    $texto = Obter-RepositorioAndroid
    $numeradas = Obter-Versoes 'path="cmdline-tools;(\d+(?:\.\d+)*)"' |
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
    $escolhida = $info.available_lts_releases | Sort-Object -Descending |
        Where-Object { [int]$_ -le 24 } | Select-Object -First 1
    if (-not $escolhida) { Falhar "Nenhuma versao LTS do JDK compativel com o Gradle em $UrlJdk." }
    return [int]$escolhida
}

# ---------------------------------------------------------------------------
# Ferramentas ja instaladas na maquina
# ---------------------------------------------------------------------------

function Achar-BuildTools {
    param([string]$RaizSdk = $Sdk)

    $pasta = Join-Path $RaizSdk "build-tools"
    if (-not (Test-Path $pasta)) { return $null }

    $dir = Get-ChildItem $pasta -Directory |
        Where-Object { $_.Name -match '^\d+(\.\d+)*$' } |
        Sort-Object { [version]$_.Name } -Descending |
        Select-Object -First 1

    if (-not $dir) { return $null }
    return $dir.FullName
}

function Achar-NodeGlobal {
    $comando = Get-Command node -ErrorAction SilentlyContinue
    if (-not $comando) { return $null }

    $pasta = Split-Path -Parent $comando.Source
    if (-not (Test-Path (Join-Path $pasta "npm.cmd"))) { return $null }

    $versao = (Chamar -Caminho $comando.Source -Argumentos @("-p", "process.versions.node")).Texto
    if (-not $versao) { return $null }
    if ([int]$versao.Split('.')[0] -lt 22) { return $null }

    return [pscustomobject]@{ Pasta = $pasta; Versao = $versao }
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

        $saida = (Chamar -Caminho $java -Argumentos @("-version")).Texto
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
        if (-not (Achar-BuildTools -RaizSdk $candidato)) { continue }
        return $candidato
    }
    return $null
}

# ---------------------------------------------------------------------------
# Instalacao das ferramentas
# ---------------------------------------------------------------------------

function Instalar-Node {
    New-Item -ItemType Directory -Force -Path $Ferramentas | Out-Null

    $global = Achar-NodeGlobal
    if ($global) {
        $script:Node = $global.Pasta
        Escrever "Node.js $($global.Versao) global em $Node"
        Adicionar-AoPath $Node
        return
    }

    if (-not (Test-Path (Join-Path $Node "node.exe"))) {
        $indice = Join-Path $Ferramentas "node-index.json"
        Baixar $UrlNodeIndice $indice
        try { $lista = Get-Content -Raw $indice | ConvertFrom-Json }
        finally { Remove-Item $indice -Force }

        # A primeira entrada com LTS e a LTS mais recente do indice, que ja vem
        # ordenado da versao mais nova para a mais antiga.
        $versao = $lista | Where-Object { $_.lts } | Select-Object -First 1 -ExpandProperty version
        if (-not $versao) { Falhar "Nenhuma versao LTS do Node.js em $UrlNodeIndice." }

        $nomeZip = "node-$versao-win-x64.zip"
        $zip = Join-Path $Ferramentas "node.zip"
        $somas = Join-Path $Ferramentas "node-SHASUMS256.txt"
        $tmp = Join-Path $Ferramentas "node_tmp"
        $base = "https://nodejs.org/dist/$versao"

        Baixar "$base/$nomeZip" $zip
        Baixar "$base/SHASUMS256.txt" $somas

        $padrao = "^([0-9a-fA-F]{64})\s+\*?" + [regex]::Escape($nomeZip) + "$"
        $esperado = $null
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

    Adicionar-AoPath $Node
}

function Verificar-Node {
    $nodeExe = Join-Path $Node "node.exe"
    if (-not (Test-Path $nodeExe)) { Falhar "Node.js ausente em $Node; as ferramentas devem ser instaladas novamente." }

    $maior = (Chamar -Caminho $nodeExe -Argumentos @("-p", "process.versions.node.split('.')[0]")).Texto
    if (-not $maior -or [int]$maior -lt 22) {
        Falhar "Node.js 22 ou superior e necessario. Versao encontrada: $maior."
    }
}

function Gravar-Licencas {    # As licencas sao gravadas direto no SDK. A confirmacao pela entrada padrao
    # nao e confiavel em runner sem console.
    $dir = Join-Path $Sdk "licenses"
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    $hash = "24333f8a63b6825ea9c5514f83c2829b004d1fee"
    foreach ($nome in @("android-sdk-license", "android-sdk-preview-license")) {
        Salvar-Texto (Join-Path $dir $nome) ($hash + "`n")
    }
}

function Instalar-Sdk {
    $sdkManager = Join-Path $Sdk "cmdline-tools\latest\bin\sdkmanager.bat"
    if (-not (Test-Path $sdkManager)) {
        $zip = Join-Path $Ferramentas "cmdline-tools.zip"
        $tmp = Join-Path $Ferramentas "cmdline-tools-tmp"
        Baixar (Resolver-CmdlineTools) $zip
        if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
        Expand-Archive -Path $zip -DestinationPath $tmp -Force
        New-Item -ItemType Directory -Force -Path (Join-Path $Sdk "cmdline-tools") | Out-Null
        $latest = Join-Path $Sdk "cmdline-tools\latest"
        if (Test-Path $latest) { Remove-Item $latest -Recurse -Force }
        Move-Item (Join-Path $tmp "cmdline-tools") $latest
        Remove-Item $tmp -Recurse -Force
        Remove-Item $zip -Force
        Escrever "cmdline-tools local em $latest"
    }

    # O cmdline-tools 19 usa ponto e virgula; o 20 em diante usa barra.
    $versaoBuildTools = Resolver-BuildTools
    Escrever "Instalando platform-tools, Android $AndroidApi e build-tools $versaoBuildTools."
    $instalacao = Chamar -Caminho $sdkManager -Argumentos @("--sdk_root=$Sdk", "platform-tools", "platforms;android-$AndroidApi", "build-tools;$versaoBuildTools")
    $buildTools = Achar-BuildTools
    if (-not $buildTools) {
        $instalacao = Chamar -Caminho $sdkManager -Argumentos @("--sdk_root=$Sdk", "platform-tools", "platforms/android-$AndroidApi", "build-tools/$versaoBuildTools")
        $buildTools = Achar-BuildTools
    }
    if (-not $buildTools) {
        Escrever $instalacao.Texto
        Falhar "O sdkmanager terminou sem instalar o build-tools."
    }
}

function Garantir-Android {
    param([string]$Api)

    $marcador = Join-Path $Sdk "platforms\android-$Api\android.jar"
    if (Test-Path $marcador) { return }

    $sdkManager = Join-Path $Sdk "cmdline-tools\latest\bin\sdkmanager.bat"
    if (-not (Test-Path $sdkManager)) { Falhar "cmdline-tools ausente; as ferramentas devem ser instaladas novamente." }

    $env:JAVA_HOME = $Jdk
    Gravar-Licencas
    Escrever "Instalando a plataforma Android $Api exigida pelo projeto."
    $plataforma = Chamar -Caminho $sdkManager -Argumentos @("--sdk_root=$Sdk", "platforms;android-$Api")
    if (-not (Test-Path $marcador)) {
        $plataforma = Chamar -Caminho $sdkManager -Argumentos @("--sdk_root=$Sdk", "platforms/android-$Api")
    }
    if (-not (Test-Path $marcador)) {
        Escrever $plataforma.Texto
        Falhar "Falha ao instalar a plataforma Android $Api."
    }
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
        if (-not (Achar-BuildTools) -or -not (Test-Path (Join-Path $Sdk "platforms\android-$AndroidApi\android.jar"))) {
            Instalar-Sdk
        }
    }

    $env:JAVA_HOME = $Jdk
    $env:ANDROID_HOME = $Sdk
    $env:ANDROID_SDK_ROOT = $Sdk
    $env:PATH = "$Jdk\bin;$Sdk\cmdline-tools\latest\bin;$Sdk\platform-tools;$env:PATH"

    if (-not (Test-Path (Join-Path $Jdk "bin\java.exe"))) { Falhar "JDK ausente." }
    $buildTools = Achar-BuildTools
    if (-not $buildTools) { Falhar "build-tools ausente." }
    if (-not (Test-Path (Join-Path $Sdk "platforms\android-$AndroidApi\android.jar"))) { Falhar "Android $AndroidApi ausente." }
    Escrever "SDK pronto: build-tools $(Split-Path -Leaf $buildTools), Android $AndroidApi."

    Instalar-Node
    Verificar-Node
}

# ---------------------------------------------------------------------------
# Projeto e APK
# ---------------------------------------------------------------------------

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
    }

    foreach ($candidato in $candidatos) {
        if ($candidato -and (Test-Path (Join-Path $candidato "index.html"))) { return $candidato }
    }

    Falhar "Site nao encontrado. Use -Site <pasta> ou mantenha a pasta ao lado de recupera-solo."
}

function Copiar-Arquivos {
    param([string]$Origem, [string]$Destino, [string[]]$Arquivos, [string]$Rotulo)

    New-Item -ItemType Directory -Force -Path $Destino | Out-Null
    foreach ($arquivo in $Arquivos) {
        $caminho = Join-Path $Origem $arquivo
        if (-not (Test-Path $caminho)) { Falhar "Arquivo ausente em ${Rotulo}: $arquivo" }
        Copy-Item $caminho (Join-Path $Destino $arquivo) -Force
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

    $npm = Join-Path $Node "npm.cmd"
    $npx = Join-Path $Node "npx.cmd"

    Copiar-Arquivos $SiteResolvido (Join-Path $App "www") `
        @("index.html", "style.css", "script.js", "favicon.svg") "o site"
    Copiar-Arquivos $Assets (Join-Path $App "assets") `
        @("icon-only.png", "splash.png", "icon-foreground.png", "icon-background.png") "assets"

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

    # O sharp 0.32 do @capacitor/assets baixa o libvips pelo script de instalacao,
    # que o npm recente bloqueia por padrao. O 0.33 traz o binario como dependencia
    # opcional e funciona mesmo com o script bloqueado.
    $pacote = Get-Content $packageJson -Raw | ConvertFrom-Json
    if (-not $pacote.PSObject.Properties["overrides"]) {
        $pacote | Add-Member -NotePropertyName overrides -NotePropertyValue ([pscustomobject]@{})
    }
    if ($pacote.overrides.sharp -ne "^0.33.5") {
        $pacote.overrides | Add-Member -NotePropertyName sharp -NotePropertyValue "^0.33.5" -Force
        Salvar-Texto $packageJson (($pacote | ConvertTo-Json -Depth 8) + "`n")
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
        $cli = Join-Path $App "node_modules\@capacitor\cli"
        $assetsPacote = Join-Path $App "node_modules\@capacitor\assets"
        if ((Test-Path $cli) -and (Test-Path $assetsPacote)) {
            Escrever "Dependencias do Capacitor vindas do cache."
            & $npm install --prefer-offline --no-audit --no-fund
            if ($LASTEXITCODE -ne 0) { Falhar "Falha ao instalar as dependencias do Capacitor." }
        }
        else {
            Escrever "Instalando as dependencias mais recentes do Capacitor."
            & $npm install --prefer-offline --no-audit --no-fund "@capacitor/core@latest" "@capacitor/cli@latest" "@capacitor/android@latest" "@capacitor/status-bar@latest" "@capacitor/share@latest" "@capacitor/splash-screen@latest"
            if ($LASTEXITCODE -ne 0) { Falhar "Falha ao instalar as dependencias do Capacitor." }

            & $npm install --prefer-offline --no-audit --no-fund --save-dev "@capacitor/assets@latest"
            if ($LASTEXITCODE -ne 0) { Falhar "Falha ao instalar o @capacitor/assets." }
        }

        $android = Join-Path $App "android"
        if (-not (Test-Path (Join-Path $android "app\build.gradle"))) {
            if (Test-Path $android) {
                Escrever "Pasta android incompleta; recriando."
                Remove-Item $android -Recurse -Force
            }
            & $npx cap add android
            if ($LASTEXITCODE -ne 0) { Falhar "Falha ao adicionar a plataforma Android." }
        }

        & $npx cap sync android
        if ($LASTEXITCODE -ne 0) { Falhar "Falha ao sincronizar o projeto Android." }

        $gradle = Join-Path $android "app\build.gradle"
        Atualizar-Versao $gradle

        $variaveis = Join-Path $android "variables.gradle"
        if (Test-Path $variaveis) {
            $texto = [IO.File]::ReadAllText($variaveis)
            if ($texto -match 'compileSdkVersion\s*=\s*(\d+)') { Garantir-Android -Api $Matches[1] }
        }

        Salvar-Texto (Join-Path $android "local.properties") ("sdk.dir=" + ($Sdk -replace '\\', '/') + "`n")

        $marcador = Join-Path $App ".assets-hash"
        $entradas = @(
            (Join-Path $Assets "icon-only.png"),
            (Join-Path $Assets "splash.png"),
            (Join-Path $Assets "icon-foreground.png"),
            (Join-Path $Assets "icon-background.png"),
            $config
        )
        $assinatura = (@($entradas | ForEach-Object { (Get-FileHash -Algorithm SHA256 -Path $_).Hash }) -join "") + $CorFundo
        $icone = Join-Path $android "app\src\main\res\mipmap-xxxhdpi\ic_launcher.png"
        $regerar = (-not (Test-Path $marcador)) -or ((Get-Content $marcador -Raw).Trim() -ne $assinatura) -or (-not (Test-Path $icone))

        if ($regerar) {
            & $npx capacitor-assets generate --android `
                --iconBackgroundColor $CorFundo `
                --iconBackgroundColorDark $CorFundo `
                --splashBackgroundColor $CorFundo `
                --splashBackgroundColorDark $CorFundo
            if ($LASTEXITCODE -ne 0) { Falhar "Falha ao gerar icones e splash." }
            Salvar-Texto $marcador $assinatura
        }
        else {
            Escrever "Icones e splash reaproveitados."
        }
    }
    finally {
        Pop-Location
    }

    Escrever "Projeto pronto em $App"
}

function Obter-Chave {
    # A chave e a senha ficam em segredos/. Quando a chave existe sem o arquivo
    # de senhas, a senha gravada e perdida e a chave nao pode ser reutilizada.
    New-Item -ItemType Directory -Force -Path $Segredos | Out-Null

    $props = Join-Path $Segredos "keystore.properties"
    $keystore = Join-Path $Segredos "recupera-solo.keystore"

    if ((Test-Path $keystore) -and -not (Test-Path $props)) {
        Falhar "A chave existe, mas keystore.properties nao. O arquivo de senhas deve ser restaurado."
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

    $valores = ConvertFrom-StringData -StringData (Get-Content $props -Raw)
    $senha = $valores["storePassword"]
    $alias = $valores["keyAlias"]
    if (-not $senha -or -not $alias) { Falhar "keystore.properties incompleto." }

    return [pscustomobject]@{ Arquivo = $keystore; Senha = $senha; Alias = $alias }
}

function Gerar-AppAndroid {
    $gradle = Join-Path $App "android\app\build.gradle"
    $buildTools = Achar-BuildTools
    if (-not (Test-Path (Join-Path $Jdk "bin\java.exe"))) { Falhar "JDK ausente; as ferramentas devem ser instaladas novamente." }
    if (-not $buildTools) { Falhar "build-tools ausente; as ferramentas devem ser instaladas novamente." }
    if (-not (Test-Path $gradle)) { Falhar "Projeto Android ausente; o projeto deve ser gerado antes." }

    New-Item -ItemType Directory -Force -Path $Dist | Out-Null
    $chave = Obter-Chave

    $env:JAVA_HOME = $Jdk
    $env:ANDROID_HOME = $Sdk
    $env:ANDROID_SDK_ROOT = $Sdk
    $env:PATH = "$Jdk\bin;$Sdk\platform-tools;$buildTools;$env:PATH"

    $keytool = Join-Path $Jdk "bin\keytool.exe"
    if (-not (Test-Path $chave.Arquivo)) {
        Escrever "Gerando a chave de assinatura."
        & $keytool -genkeypair -v `
            -keystore $chave.Arquivo -storetype PKCS12 -alias $chave.Alias `
            -keyalg RSA -keysize 2048 -validity 10000 `
            -storepass $chave.Senha -keypass $chave.Senha `
            -dname "CN=RECUPERA-SOLO, OU=DCETI, O=UFERSA, L=Angicos, ST=RN, C=BR"
        if ($LASTEXITCODE -ne 0) { Falhar "Falha ao gerar a chave." }
    }

    & $keytool -list -keystore $chave.Arquivo -storepass $chave.Senha -alias $chave.Alias | Out-Null
    if ($LASTEXITCODE -ne 0) { Falhar "Nao foi possivel abrir a chave com a senha gravada." }

    $texto = [IO.File]::ReadAllText($gradle)
    if ($texto -notmatch 'versionName\s+"([^"]+)"') { Falhar "versionName nao encontrado no build.gradle." }
    $versaoAtual = $Matches[1]

    Push-Location (Join-Path $App "android")
    try {
        & .\gradlew.bat assembleRelease --no-daemon --build-cache --parallel
        if ($LASTEXITCODE -ne 0) { Falhar "Falha na compilacao do APK." }
    }
    finally {
        Pop-Location
    }

    $semAssinatura = Join-Path $App "android\app\build\outputs\apk\release\app-release-unsigned.apk"
    if (-not (Test-Path $semAssinatura)) { Falhar "APK sem assinatura nao encontrado." }

    $alinhado = Join-Path $Dist ("alinhado-" + $versaoAtual + ".apk")
    $final = Join-Path $Dist ("$Nome-" + $versaoAtual + ".apk")

    & (Join-Path $buildTools "zipalign.exe") -p -f 4 $semAssinatura $alinhado
    if ($LASTEXITCODE -ne 0) { Falhar "Falha no zipalign." }

    & (Join-Path $buildTools "apksigner.bat") sign `
        --ks $chave.Arquivo --ks-key-alias $chave.Alias `
        --ks-pass "pass:$($chave.Senha)" --key-pass "pass:$($chave.Senha)" `
        --out $final $alinhado
    if ($LASTEXITCODE -ne 0) { Falhar "Falha na assinatura." }

    & (Join-Path $buildTools "apksigner.bat") verify --verbose $final
    if ($LASTEXITCODE -ne 0) { Falhar "Falha na verificacao da assinatura." }

    # A pasta dist guarda apenas o APK desta compilacao, e a pasta app_android recebe
    # uma copia identica, para que as duas permanecam iguais.
    Remove-Item $alinhado -Force
    Get-ChildItem $Dist -File | Where-Object { $_.FullName -ne $final } | Remove-Item -Force

    $publicado = Join-Path $Raiz "$Nome.apk"
    Copy-Item $final $publicado -Force

    $hash = (Get-FileHash $final -Algorithm SHA256).Hash
    Salvar-Texto (Join-Path $Dist "SHA256.txt") ($hash + "  " + (Split-Path -Leaf $final) + "`n")

    Escrever "APK gerado: $final"
    Escrever "APK publicado: $publicado"
    Escrever "Versao: $versaoAtual"
    Escrever "SHA-256: $hash"
}

# ---------------------------------------------------------------------------

if ($env:OS -ne "Windows_NT") { Falhar "Este script exige Windows." }
if (-not [Environment]::Is64BitOperatingSystem) { Falhar "Este script exige Windows de 64 bits." }
if ($PSVersionTable.PSVersion.Major -lt 5) { Falhar "PowerShell 5 ou superior e necessario." }

if (-not $Versao) {
    try {
        $ramo = (& git -C $Raiz rev-parse --abbrev-ref HEAD 2>$null)
        $Versao = if ($LASTEXITCODE -eq 0 -and $ramo) { $ramo.Trim() -replace '[^0-9A-Za-z.-]', '-' } else { "local" }
    }
    catch {
        $Versao = "local"
    }
}
if ($VersionCode -le 0) {
    $VersionCode = [int](Get-Date).ToString("yyMMddHH", [Globalization.CultureInfo]::InvariantCulture)
}
Escrever "Versao local: $Versao ($VersionCode)"

$siteResolvido = Achar-Site -Caminho $Site
Escrever "Site: $siteResolvido"

Instalar-Ferramentas
Criar-Projeto -SiteResolvido $siteResolvido
Gerar-AppAndroid

Escrever "Concluido."
