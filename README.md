# RECUPERA-SOLO

- Site: **https://pwebufersa.github.io/recupera-solo/**
- Original: `https://dapper-flan-955869.netlify.app/`

Cópia do original com a interface ajustada. Conteúdo e cálculo iguais.

## Uso

O endereço acima abre no navegador. "Usar exemplo" preenche dados e preços;
"Gerar diagnóstico e recomendação" calcula.

## APK para Android

O aplicativo Android é gerado a partir deste site. O script e os ícones ficam em
[`apk/`](apk/). O APK não é versionado: é gravado localmente em `apk/dist/`, com
o hash em `apk/dist/SHA256.txt`. A compilação é feita por `apk/gerar_apk.ps1`,
que baixa sozinho o JDK 21, o Node.js 22 e o Android SDK, sempre na versão mais
recente de cada linha.

```powershell
cd apk
powershell -NoProfile -ExecutionPolicy Bypass -File .\gerar_apk.ps1
```

O APK usa a WebView do Android e funciona sem internet, exceto nos links
externos do rodapé.

## Teste de uso

O protocolo está em [RECUPERA-SOLO - Teste de uso.docx](<RECUPERA-SOLO - Teste de uso.docx>). Os casos usam dados fictícios e não substituem recomendação agronômica.

## Comandos

```bash
npm run servidor   # http://127.0.0.1:8099
npm run prints     # comparações de MELHORIAS.md
npm test           # 11 testes de cálculo e 8 de navegador
```

## Netlify

Branch `main`, sem comando de build, diretório de publicação `.`.
Só quatro arquivos são usados: `index.html`, `style.css`, `script.js` e
`favicon.svg`.

## Autoria

- Nildo da Silva Dias: [SIGAA](https://sigaa.ufersa.edu.br/sigaa/public/docente/portal.jsf?siape=1505717)
- Francisco de Assis Pereira Vasconcelos de Arruda: [SIGAA](https://sigaa.ufersa.edu.br/sigaa/public/docente/portal.jsf?siape=1817174)

## Documentos

- [MELHORIAS.md](MELHORIAS.md): comparação e mudanças.
- [PRECOS.md](PRECOS.md): preços usados nos testes.
