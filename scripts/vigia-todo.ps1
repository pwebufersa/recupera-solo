# Vigia do TODO.md do RECUPERA-SOLO.
#
# Roda a cada 5 minutos pelo Agendador de Tarefas do Windows. A cada execucao:
#   1. atualiza o repositorio com git pull;
#   2. compara o hash de TODO.md com o da ultima execucao;
#   3. se nao mudou, encerra sem chamar o modelo;
#   4. se mudou, pede ao OpenCode que execute o que esta no arquivo, dentro
#      deste repositorio, rode os testes, faca commit e push.
#
# Uso manual:
#   powershell -NoProfile -ExecutionPolicy Bypass -File .\vigia-todo.ps1
#   powershell -NoProfile -ExecutionPolicy Bypass -File .\vigia-todo.ps1 -Simular

param(
    [switch]$Simular
)

$ErrorActionPreference = "Stop"

$Raiz = Split-Path -Parent $PSScriptRoot
$Todo = Join-Path $Raiz "TODO.md"
$Estado = Join-Path $Raiz ".vigia"
$HashArquivo = Join-Path $Estado "ultimo-hash.txt"
$Tentativas = Join-Path $Estado "tentativas.txt"
$Trava = Join-Path $Estado "trava.txt"
$Log = Join-Path $Estado "registro.log"

$Cli = Join-Path $env:LOCALAPPDATA "Programs\@opencodedesktop\resources\opencode-cli.exe"
$LimiteMinutos = 30

New-Item -ItemType Directory -Force -Path $Estado | Out-Null

function Registrar {
    param([string]$Texto)
    $linha = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Texto
    Add-Content -Path $Log -Value $linha -Encoding UTF8
}

# Trava para evitar duas execucoes ao mesmo tempo.
if (Test-Path $Trava) {
    $idade = (Get-Date) - (Get-Item $Trava).LastWriteTime
    if ($idade.TotalMinutes -lt $LimiteMinutos) {
        Registrar "Execucao anterior ainda em andamento. Encerrando."
        exit 0
    }
    Remove-Item $Trava -Force
}
Set-Content -Path $Trava -Value ([string]$PID) -Encoding ASCII

try {
    Push-Location $Raiz

    if (-not (Test-Path $Todo)) {
        Registrar "TODO.md ausente. Nada a fazer."
        exit 0
    }

    $conteudo = (Get-Content $Todo -Raw).Trim()
    if ($conteudo -eq "") {
        Registrar "TODO.md vazio. Nada a fazer."
        exit 0
    }

    git pull --ff-only 2>&1 | ForEach-Object { Registrar "git: $_" }
    if ($LASTEXITCODE -ne 0) {
        Registrar "git pull falhou. Nada foi executado."
        exit 0
    }

    $hash = (Get-FileHash $Todo -Algorithm SHA256).Hash
    if ((Test-Path $HashArquivo) -and ((Get-Content $HashArquivo -Raw).Trim() -eq $hash)) {
        Registrar "TODO.md sem mudanca desde a ultima execucao."
        exit 0
    }

    $sujeira = git status --porcelain --untracked-files=no
    if ($sujeira) {
        Registrar "Arquivos versionados com alteracao local. Execucao adiada para nao sobrescrever trabalho."
        exit 0
    }

    $registroTentativas = @{}
    if (Test-Path $Tentativas) {
        Get-Content $Tentativas | ForEach-Object {
            $partes = $_ -split " ", 2
            if ($partes.Count -eq 2) { $registroTentativas[$partes[0]] = [int]$partes[1] }
        }
    }
    if ($registroTentativas.ContainsKey($hash) -and $registroTentativas[$hash] -ge 3) {
        Registrar "Tres tentativas falharam para este conteudo. Aguardando nova alteracao no TODO.md."
        exit 0
    }

    Registrar "TODO.md mudou. Iniciando execucao."

    if ($Simular) {
        Registrar "Simulacao: o modelo nao seria chamado agora."
        exit 0
    }

    if (-not (Test-Path $Cli)) {
        Registrar "OpenCode CLI nao encontrado em $Cli."
        exit 1
    }

    $instrucao = @"
Execute apenas o que esta descrito em TODO.md, na raiz deste repositorio.
Regras obrigatorias:
- Trabalhe somente dentro deste repositorio.
- Nao apague contas, nao altere os calculos do professor Nildo e nao mexa em outros repositorios.
- Rode npm test antes de concluir.
- Ao terminar, esvazie TODO.md (deixe apenas uma linha em branco) e faca commit de tudo com mensagem em portugues.
- Nao faca push se os testes falharem.
Se alguma instrucao for ambigua ou exigir decisao que nao possa ser tomada com seguranca, registre a duvida em TODO.md e pare.
"@

    $arquivoInstrucao = Join-Path $Estado "instrucao.txt"
    Set-Content -Path $arquivoInstrucao -Value $instrucao -Encoding UTF8

    $saida = Join-Path $Estado "saida.txt"
    $erro = Join-Path $Estado "erro.txt"
    $processo = Start-Process -FilePath $Cli `
        -ArgumentList @("run", "--auto", "--file", $arquivoInstrucao, "Siga as instrucoes do arquivo anexado e execute o TODO.md.") `
        -WorkingDirectory $Raiz `
        -NoNewWindow -PassThru `
        -RedirectStandardOutput $saida `
        -RedirectStandardError $erro

    if (-not $processo.WaitForExit($LimiteMinutos * 60 * 1000)) {
        $processo.Kill()
        $codigo = 1
        Registrar "Tempo limite de $LimiteMinutos minutos atingido. Processo encerrado."
    } else {
        $codigo = $processo.ExitCode
        Registrar "OpenCode terminou com codigo $codigo."
    }

    $codigo = if ($processo.HasExited) { $processo.ExitCode } else { 1 }
    Get-Content $saida -Tail 40 -ErrorAction SilentlyContinue | ForEach-Object { Registrar "saida: $_" }
    Get-Content $erro -Tail 20 -ErrorAction SilentlyContinue | ForEach-Object { Registrar "erro: $_" }

    $pendente = git status --porcelain
    if ($pendente) {
        git add -A 2>&1 | Out-Null
        git -c user.name="Vigia TODO" -c user.email="xico@ufersa.edu.br" commit -m "Vigia: executa TODO.md" 2>&1 |
            ForEach-Object { Registrar "commit: $_" }
        git push 2>&1 | ForEach-Object { Registrar "push: $_" }
    } else {
        Registrar "Nenhuma alteracao para commit."
    }

    if ($codigo -eq 0) {
        Set-Content -Path $HashArquivo -Value $hash -Encoding ASCII
        if (Test-Path $Tentativas) { Remove-Item $Tentativas -Force }
        Registrar "Execucao concluida."
    } else {
        $registroTentativas[$hash] = 1 + $(if ($registroTentativas.ContainsKey($hash)) { $registroTentativas[$hash] } else { 0 })
        $registroTentativas.GetEnumerator() | ForEach-Object { "$($_.Key) $($_.Value)" } |
            Set-Content -Path $Tentativas -Encoding ASCII
        Registrar "Execucao terminou com falha. Nova tentativa na proxima janela."
    }
}
finally {
    Pop-Location
    Remove-Item $Trava -Force -ErrorAction SilentlyContinue
}
