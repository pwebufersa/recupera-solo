# APK do RECUPERA-SOLO

[![Aplicativo Android](https://github.com/pwebufersa/recupera-solo/actions/workflows/aplicativo-android.yml/badge.svg?branch=main)](https://github.com/pwebufersa/recupera-solo/actions/workflows/aplicativo-android.yml)

**Baixar:** [RECUPERA-SOLO.apk](https://github.com/pwebufersa/recupera-solo/raw/main/apk/RECUPERA-SOLO.apk)

O arquivo da pasta é substituído a cada build. A pasta `dist` mantém apenas o
APK da última compilação, e `apk/RECUPERA-SOLO.apk` recebe uma cópia idêntica.
Cada execução também publica o artefato `recupera-solo-apk`, com hash e versão.

## Gerar

Dois cliques em `gerar_apk.cmd`. O script confere o que já existe e baixa só o
que falta: JDK, Node.js, Android SDK, depois compila, assina e verifica. Leva
cerca de 10 minutos na primeira vez e ocupa cerca de 2 GB.

Pelo terminal:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\gerar_apk.ps1
```

Saída em `dist/RECUPERA-SOLO-<versão>.apk`, com hash em `dist/SHA256.txt`.
Versão nova: `-Versao 1.0.4 -VersionCode 5`.

## Assinatura

A chave fica em `segredos/`, com a senha em `keystore.properties`. Sem ela, o
APK novo não atualiza uma instalação anterior. A pasta não deve ser publicada.

## CI

O fluxo gera o APK quando muda `index.html`, `style.css`, `script.js`,
`favicon.svg`, o gerador ou os ícones. Documentação não dispara. Os testes ficam
no fluxo separado **Testes automáticos**.

Ferramentas, projeto gerado, Gradle e npm ficam em cache: o primeiro build baixa
tudo, os seguintes reaproveitam. Para assinar com a mesma
chave, os segredos `KEYSTORE_BASE64` e `KEYSTORE_PROPERTIES` devem existir.

## Instalar

```powershell
adb install -r RECUPERA-SOLO.apk
```

Sem cabo, o arquivo pode ser copiado para o aparelho e aberto pelo gerenciador
de arquivos, com fontes desconhecidas permitidas.
