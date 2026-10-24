# APK do RECUPERA-SOLO

[![Aplicativo Android](https://github.com/pwebufersa/recupera-solo/actions/workflows/aplicativo-android.yml/badge.svg?branch=main)](https://github.com/pwebufersa/recupera-solo/actions/workflows/aplicativo-android.yml)

**Baixar:** [RECUPERA-SOLO.apk](https://github.com/pwebufersa/recupera-solo/raw/main/app_android/RECUPERA-SOLO.apk)

O APK é republicado pelo fluxo a cada alteração em `codigo_fonte/`, no gerador ou
nos ícones; documentação não dispara.
Cada execução publica o artefato `recupera-solo-app-android`, com hash e versão, e grava
uma cópia idêntica em `app_android/RECUPERA-SOLO.apk`.

## Gerar

Dois cliques em `gerar_app_android.cmd`. O script usa Node.js, JDK e Android SDK já
instalados na máquina quando as versões servem ao build; o que faltar é baixado
para `app_android/ferramentas`, sem alterar variáveis do usuário. Depois compila, assina e
verifica. Leva cerca de 10 minutos na primeira vez e ocupa cerca de 2 GB.

Pelo terminal:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\gerar_app_android.ps1
```

Saída em `dist/RECUPERA-SOLO-<versão>.apk`, com hash em `dist/SHA256.txt`.
A versão e o `versionCode` são informados na chamada; sem eles, valem o nome da branch e a hora atual.

## Assinatura

A chave fica em `segredos/`, com a senha em `keystore.properties`. Sem ela, o
APK novo não atualiza uma instalação anterior. A pasta não deve ser publicada.
No fluxo, os segredos `KEYSTORE_BASE64` e `KEYSTORE_PROPERTIES` assinam com a
mesma chave.

## CI

Ferramentas, projeto gerado, npm, Android, Gradle e o Gradle do projeto ficam em
cache: o primeiro build baixa tudo, os seguintes reaproveitam. O cache do projeto
gerado muda de chave quando o gerador ou o site mudam, para que dependências e
ícones já gerados não fiquem presos a uma versão antiga. Os testes ficam no fluxo
separado **Testes automáticos**.

## Instalar

```powershell
adb install -r RECUPERA-SOLO.apk
```

Sem cabo, o arquivo pode ser copiado para o aparelho e aberto pelo gerenciador
de arquivos, com fontes desconhecidas permitidas.
