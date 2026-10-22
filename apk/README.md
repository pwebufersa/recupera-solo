# APK do RECUPERA-SOLO

[![Aplicativo Android](https://github.com/pwebufersa/recupera-solo/actions/workflows/apk.yml/badge.svg?branch=main)](https://github.com/pwebufersa/recupera-solo/actions/workflows/apk.yml)

**Baixar:** [RECUPERA-SOLO.apk](https://github.com/pwebufersa/recupera-solo/raw/main/apk/RECUPERA-SOLO.apk)
· [execuções do CI](https://github.com/pwebufersa/recupera-solo/actions/workflows/apk.yml)

O arquivo desta pasta é substituído a cada build. O artefato de cada execução,
com hash e versão, fica em **Actions → Aplicativo Android → recupera-solo-apk**.

## Gerar no computador

Dê dois cliques em `gerar_apk.cmd`. A janela mostra o andamento e permanece
aberta no final.

O script baixa JDK, Node.js e Android SDK, compila, assina e verifica. Uma
execução limpa leva cerca de 10 minutos e ocupa cerca de 2 GB em `ferramentas/`
e `app/`, que são recriados quando necessário.

Também funciona pelo terminal:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\gerar_apk.ps1
```

- Saída: `dist/RECUPERA-SOLO-<versão>.apk`, com hash em `dist/SHA256.txt`.
- Versão nova: `-Versao 1.0.4 -VersionCode 5`.
- Site: procurado em `..` ou informado com `-Site <pasta>`.

## Assinatura

A chave fica em `segredos/recupera-solo.keystore`, com a senha em
`keystore.properties`. A pasta não deve ser publicada nem perdida: sem ela, o
APK novo não atualiza uma instalação anterior.

## Integração contínua

O fluxo `.github/workflows/apk.yml` roda os testes e gera o APK. Ele só dispara
quando muda o código da aplicação (`index.html`, `style.css`, `script.js`,
`favicon.svg`), o gerador ou os ícones; documentação não dispara.

Para usar a mesma chave no CI, os segredos `KEYSTORE_BASE64` e
`KEYSTORE_PROPERTIES` devem existir no repositório. O teste no aparelho é manual.

## Instalar

```powershell
adb install -r RECUPERA-SOLO.apk
```

Sem cabo, o arquivo pode ser copiado para o aparelho e aberto pelo gerenciador
de arquivos, com fontes desconhecidas permitidas.
