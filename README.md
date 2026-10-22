# RECUPERA-SOLO

Apoio à decisão para recuperação de solos sódicos: diagnóstico, corretivo, dose,
custo e procedimento. Cálculo e orientação do professor Nildo Dias, preservados.

Site e aplicativo Android (APK) com o mesmo conteúdo; o APK funciona sem
internet.

## Abrir

- Site: <https://pwebufersa.github.io/recupera-solo/>
- APK: [RECUPERA-SOLO.apk](https://github.com/pwebufersa/recupera-solo/raw/main/apk/RECUPERA-SOLO.apk)

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
| Preço | R$/t | maior que zero | 425,00 |

Valor fora da faixa avisa durante a digitação e é recusado no envio. Letras não
entram nos campos numéricos.

## Resultado e limites

PST inicial, classificação, adequação de cada corretivo, dose teórica, prática e
comercial, custo e procedimento. A comparação de menor custo exige pureza e
preço em todos os corretivos selecionados.

Textura, drenagem e qualidade da água não entram no cálculo, como no original.
O programa não substitui recomendação agronômica.

## Preços

Consulta de 20/10/2026, por tonelada, sem frete. Cotação da Agrícola Gemelli
de 22/09/2026.

| Corretivo | Granel entregue | Bag entregue | Granel aplicado |
|---|---:|---:|---:|
| Gesso agrícola | R$ 425,00 | R$ 445,00 | R$ 475,00 |
| Calcário dolomítico | R$ 272,00 | R$ 292,00 | R$ 322,00 |
| Calcário calcítico | R$ 295,00 | R$ 315,00 | R$ 345,00 |

| Corretivo | Preço | Fonte |
|---|---|---|
| Enxofre elementar 99% | R$ 6.200,00/t | MF Rural, anúncios de São Paulo |
| Enxofre importado, CFR | US$ 1.200,00/t | Forbes Agro, julho de 2026 |

No exemplo: gesso R$ 29.454,73/ha e enxofre R$ 67.320,25/ha.

## Testes

`npm test` roda cálculo e navegador. O roteiro do teste com pessoas está em
[RECUPERA-SOLO - Teste de uso.docx](<RECUPERA-SOLO - Teste de uso.docx>).

## Estrutura

- `index.html`, `style.css`, `script.js`: cálculo, validação e tela em um único
  arquivo, para upload direto.
- `apk/`: gerador e instruções do aplicativo.
- CI gera o APK.
- Netlify: branch `main`, sem build, diretório `.`. iOS exige macOS com Xcode.

## Comparação

[COMPARACAO.md](COMPARACAO.md), com imagens do original e do atual.

## Autoria

Orientação: [Nildo Dias](https://sigaa.ufersa.edu.br/sigaa/public/docente/portal.jsf?siape=1505717) ·
Apoio: [Francisco de Assis P. V. de Arruda](https://sigaa.ufersa.edu.br/sigaa/public/docente/portal.jsf?siape=1817174)
