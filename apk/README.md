# APK do RECUPERA-SOLO

Aplicativo Android do site, com o conteúdo empacotado. Funciona sem internet.

## Gerar

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\gerar_apk.ps1
```

O script baixa JDK, Node.js e Android SDK, compila, assina e verifica. Uma
execução limpa leva cerca de 10 minutos.

- Saída: `dist/RECUPERA-SOLO-<versão>.apk`, com hash em `dist/SHA256.txt`.
- Versão nova: `-Versao 1.0.3 -VersionCode 4`.
- Site: procurado em `..` ou informado com `-Site <pasta>`.

## Assinatura

A chave fica em `segredos/recupera-solo.keystore`, com a senha em
`keystore.properties`. A pasta não deve ser publicada nem perdida: sem ela, o
APK novo não atualiza uma instalação anterior.

## Integração contínua

O fluxo `.github/workflows/apk.yml` roda os testes e gera o APK, com artefato
`recupera-solo-apk` (APK, hash e versão). Para usar a mesma chave, os segredos
`KEYSTORE_BASE64` e `KEYSTORE_PROPERTIES` devem existir no repositório.

## Instalar

```powershell
adb install -r dist\RECUPERA-SOLO-1.0.2.apk
```

Sem cabo, o APK pode ser copiado para o aparelho e aberto pelo gerenciador de
arquivos, com fontes desconhecidas permitidas.
