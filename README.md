# RECUPERA-SOLO

Apoio à decisão para recuperação de solos sódicos: diagnóstico, corretivo, dose,
custo e procedimento. Cálculo e orientação do professor Nildo Dias, preservados.

Site e aplicativo Android (APK) com o mesmo conteúdo; o APK funciona sem
internet.

## Abrir

- Site: <https://pwebufersa.github.io/recupera-solo/>
- APK: [RECUPERA-SOLO.apk](https://github.com/pwebufersa/recupera-solo/raw/main/app_android/RECUPERA-SOLO.apk),
  com [instruções do aplicativo](app_android/README.md).
- Original, por registro histórico: <https://dapper-flan-955869.netlify.app/>

## Usar

1. "Usar exemplo" carrega um caso pronto; "Nova análise" limpa os campos.
2. Informe os dados do solo; vírgula ou ponto nos decimais.
3. Marque os corretivos e informe a pureza. Preço é opcional.
4. "Gerar diagnóstico" mostra classificação, dose, custo e procedimento.

## Campos

| Campo | Unidade | Faixa | Exemplo |
|---|---|---|---|
| pH (H₂O) | - | 0 a 14 | 9,2 |
| CEes | dS m⁻¹ | 0 a 50 | 2,4 |
| CTC | cmolc kg⁻¹ | 0,1 a 100 | 8,6 |
| Na⁺ trocável | cmolc kg⁻¹ | até a CTC | 7,0 |
| CaCO₃ | % | 0 a 100 | 1,5 |
| Densidade do solo | g cm⁻³ | 0,10 a 3,00 | 1,40 |
| Profundidade | cm | 1 a 300, inteiro | 60 |
| PST final | % | 0 a 100 | 10 |
| Área | ha | 0,01 a 10.000 | 1,0 |
| Pureza | % | 0,1 a 100 | 80 |
| Preço | R$/t | maior que zero | 410,00 |

Valor fora da faixa avisa durante a digitação e é recusado no envio. Letras não
entram nos campos numéricos.

## Resultado e limites

PST inicial, classificação, adequação de cada corretivo, dose teórica, prática e
comercial, custo e procedimento. A comparação de menor custo exige pureza e
preço em todos os corretivos selecionados.

Textura, drenagem e qualidade da água não entram no cálculo, como no original.
O programa não substitui recomendação agronômica.

## Preços

Consulta de 24/10/2026, por tonelada, sem frete. Cotações da Agrícola Gemelli
atualizadas em 16/01/2026.

| Corretivo | Granel | Bag |
|---|---:|---:|
| Gesso agrícola | R$ 410,00 | R$ 430,00 |
| Calcário dolomítico | R$ 255,00 | R$ 275,00 |
| Calcário calcítico | R$ 278,00 | R$ 298,00 |

Enxofre elementar 99%: R$ 7.998,00/t, anúncio do MF Rural em Dumont-SP.

No exemplo: gesso R$ 28.415,15/ha e enxofre R$ 86.843,13/ha.

## Testes

`npm ci` instala as dependências na raiz, e `npm test` roda os testes de cálculo
e de navegador. O roteiro do teste com pessoas está em
[Teste de uso.docx](<testes/RECUPERA-SOLO - Teste de uso.docx>).

## Ferramentas

`app_android/gerar_apk.ps1` usa Node.js, JDK e Android SDK globais quando as versões
servem ao build; caso contrário, instala tudo em `app_android/ferramentas`. O SDK global
só é aceito quando já contém a plataforma, o build-tools e o cmdline-tools
exigidos, para que nada seja instalado fora do repositório. A pasta fica fora do
controle de versão.

## Estrutura

- `codigo_fonte/`: `index.html`, `style.css`, `script.js` e `favicon.svg`, para
  upload direto e para o APK.
- `testes/`: unidade, navegador, servidor local, capturas e o roteiro do teste de
  uso.
- `comparacao/`: capturas e o `COMPARACAO.md`, com o site do Netlify preservado em
  `comparacao/site_original/`.
- `app_android/`: gerador, instruções e APK publicado.
- `artigo_cientifico/`: artigo e figuras.
- Publicação: GitHub Pages, a partir de `codigo_fonte/`, e APK gerado pelo fluxo
  **Aplicativo Android**. iOS exige macOS com Xcode.
- Diferenças em relação ao original: [COMPARACAO.md](comparacao/COMPARACAO.md).

## Autoria

Orientação: [Nildo Dias](https://sigaa.ufersa.edu.br/sigaa/public/docente/portal.jsf?siape=1505717) ·
Apoio: [Francisco de Assis P. V. de Arruda](https://sigaa.ufersa.edu.br/sigaa/public/docente/portal.jsf?siape=1817174)
