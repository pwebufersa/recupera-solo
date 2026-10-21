# RECUPERA-SOLO APK

Gera um APK autônomo do RECUPERA-SOLO, com o site dentro do aplicativo. O aplicativo funciona sem internet e sem depender do Chrome. Android Studio e WSL não são usados.

## Comando único

Na raiz desta pasta:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\gerar_apk.ps1
```

O script executa as três etapas em sequência:

1. Baixa o JDK 21, o Node.js 22 e o Android SDK mínimo, se ainda não existirem.
2. Cria o projeto Capacitor, copia o site, gera ícones e splash e sincroniza o Android.
3. Compila, assina e verifica o APK.

O APK é gravado em:

```text
dist\RECUPERA-SOLO-1.0.2.apk
```

O hash SHA-256 é gravado em `dist\SHA256.txt`.

## Etapas separadas

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\gerar_apk.ps1 -Etapa Ferramentas
powershell -NoProfile -ExecutionPolicy Bypass -File .\gerar_apk.ps1 -Etapa Projeto
powershell -NoProfile -ExecutionPolicy Bypass -File .\gerar_apk.ps1 -Etapa Apk
```

- `Ferramentas`: apenas o JDK, o Node.js e o SDK.
- `Projeto`: apenas a cópia do site e o projeto Capacitor.
- `Apk`: apenas a compilação, a assinatura e a verificação.
- `Tudo`: as três etapas, que é o padrão.

## Máquina limpa

Requisitos:

- Windows 10 ou 11 de 64 bits.
- PowerShell 5 ou superior.
- Conexão com a internet na primeira execução.
- Cerca de 2 GB livres.

O JDK, o Node.js 22, o Android SDK, o Gradle e as dependências do projeto são baixados pelo próprio script. O Android Studio não é necessário. Node.js não precisa estar instalado: uma cópia própria é baixada para `ferramentas\node22` e usada por `node.exe`, `npm.cmd` e `npx.cmd` dessa pasta. O SHA-256 do pacote é conferido contra o `SHASUMS256.txt` oficial antes da extração.

Em uma máquina limpa, o comando único é suficiente:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\gerar_apk.ps1
```

A primeira execução baixa o JDK 21, o Node.js 22, o Android SDK 36 e as dependências do Node. As execuções seguintes reaproveitam `ferramentas`, `app` e o cache do Gradle.

## Versões

Nenhuma versão de ferramenta fica fixada no script. A cada execução, a mais recente de cada linha é resolvida nas fontes oficiais:

- JDK 21: canal `latest/21/ga` da Adoptium.
- Node.js: primeira versão da série 22 no `index.json` da nodejs.org, com SHA-256 conferido no `SHASUMS256.txt`.
- cmdline-tools: pacote `cmdline-tools;latest` do `repository2-3.xml` do Google.
- build-tools: maior versão oferecida pelo `sdkmanager`.
- Capacitor e `@capacitor/assets`: `@latest` do npm.
- Gradle e Android Gradle Plugin: os do modelo do Capacitor.

A única versão fixa é a da API do Android (36), porque é decisão do projeto e acompanha o `compileSdk` e o `targetSdk`. Se o modelo do Capacitor exigir outra, a plataforma correspondente é instalada na hora.

O hash só se repete enquanto as fontes não publicarem versões novas. O `SHA256.txt` vale para o build do dia.

## Site de origem

O script procura o site automaticamente, nesta ordem:

1. `.\site`
2. `..\site`
3. `..`
4. `..\recupera-solo`

A pasta escolhida precisa conter `index.html`, `style.css`, `script.js` e `favicon.svg`.

Se o site estiver em outro lugar, o caminho pode ser informado:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\gerar_apk.ps1 -Site "C:\caminho\recupera-solo"
```

## Versão nova

A versão e o `versionCode` são atualizados na etapa `Projeto`:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\gerar_apk.ps1 -Versao 1.0.1 -VersionCode 2
```

O `versionCode` deve ser incrementado a cada APK publicado. O `versionName` é o nome exibido e pode seguir a versão do projeto.

## Estrutura

- `gerar_apk.ps1`: script único de geração.
- `assets/`: ícone e splash usados pelo Android.
- `README.md`: este roteiro.
- `ferramentas/`: JDK, Node.js 22 e SDK baixados. Não versionar.
- `app/`: projeto Capacitor gerado. Não versionar.
- `segredos/`: chave de assinatura e senhas. Não versionar.
- `dist/`: APK e hash. Não versionar.

## Assinatura

Na primeira execução, são criados:

- `segredos/recupera-solo.keystore`
- `segredos/keystore.properties`

A senha é aleatória e fica no `keystore.properties`. Os dois arquivos devem ser guardados em local privado. A mesma chave é exigida para atualizar um APK já instalado. Se a chave for perdida, a atualização sobre a versão anterior não é possível.

O APK é assinado com os esquemas v2 e v3. A verificação é feita pelo próprio script com `apksigner`.

Em uma máquina limpa, uma chave nova é gerada. O APK gerado com essa chave não atualiza uma instalação anterior feita com outra chave. Para atualizar a instalação existente, a pasta `segredos` original deve ser restaurada antes da compilação.

## Repositório

Esta pasta fica em `recupera-solo/apk`, no repositório
https://github.com/pwebufersa/recupera-solo. O site é encontrado em `..`.

O APK não é versionado. Cada pessoa gera o seu com o script; o arquivo fica em
`dist/`, fora do Git.

O arquivo `.gitignore` mantém fora do repositório:

- `ferramentas/`
- `app/`
- `segredos/`
- `dist/`
- `node_modules/`
- arquivos `.apk`, `.idsig`, `.keystore`, `.jks` e `keystore.properties`

## Atualizar o site no APK

Depois de alterar o site:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\gerar_apk.ps1
```

O script copia novamente `index.html`, `style.css`, `script.js` e `favicon.svg`, recompila e assina.

## Identificação

- Nome: RECUPERA-SOLO
- Pacote: `br.edu.ufersa.recuperasolo`
- Versão: 1.0.2 (versionCode 3)
- `minSdkVersion`: 24 (Android 7.0)
- `targetSdkVersion`: 36 (Android 16)

O nome e o identificador ficam em `app/capacitor.config.json` e em `app/android/app/build.gradle`. O `versionCode` e o `versionName` também ficam no `build.gradle`.

## Instalação no aparelho

Com o cabo e a depuração USB ativada:

```powershell
adb install -r dist\RECUPERA-SOLO-1.0.2.apk
```

Sem cabo, o APK pode ser copiado para o aparelho e aberto pelo gerenciador de arquivos. A instalação de fontes desconhecidas precisa estar permitida.

## Observações

- O aplicativo usa a WebView do Android, não o Chrome.
- O cálculo e o `localStorage` funcionam offline.
- Os links do rodapé para o SIGAA abrem dentro da WebView e exigem internet.
- Cada alteração no site exige um novo APK, pois os arquivos são empacotados.
- Para registro no INPI, o APK é a versão distribuível; o depósito do registro é feito com o código-fonte e a documentação, não com o APK.
