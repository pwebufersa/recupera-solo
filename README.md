# RECUPERA-SOLO

Apoio à decisão para recuperação de solos sódicos: diagnóstico, corretivo, dose,
custo e procedimento a partir da análise de solo. Cálculo e orientação do
professor Nildo Dias, preservados.

Duas formas, mesmo conteúdo: site e aplicativo Android (APK) que funciona sem
internet.

## Abrir

- Site: <https://pwebufersa.github.io/recupera-solo/>
- APK: `apk/dist/RECUPERA-SOLO-1.0.2.apk` (instalação exige permitir fontes
  desconhecidas)

## Usar

1. "Usar exemplo" preenche um caso pronto; "Nova análise" limpa os campos.
2. Informe os dados do solo. Vírgula ou ponto nos decimais.
3. Marque os corretivos e informe pureza e preço.
4. "Gerar diagnóstico" mostra classificação, dose, custo e procedimento.

## Campos

| Campo | Unidade | Faixa | Exemplo |
|---|---|---|---|
| pH (H₂O) | — | 0 a 14 | 9,2 |
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

Letras não entram nos campos numéricos. Valor fora da faixa é recusado com
mensagem no campo.

## Resultado

PST inicial, classificação do solo, adequação de cada corretivo, dose teórica,
prática e comercial, custo por hectare e total, e o procedimento de recuperação.

## Limites

Textura, drenagem e qualidade da água não entram no cálculo, como no original.
O programa não substitui recomendação agronômica.

## Preços do exemplo

Gesso R$ 425,00/t e enxofre R$ 6.200,00/t. Origem em [PRECOS.md](PRECOS.md).

## Testes

- 44 verificações de navegador (computador e celular) e 15 de unidade.
- Teste humano para o que a máquina não vê: [USABILIDADE.md](USABILIDADE.md) e o roteiro em [RECUPERA-SOLO - Teste de uso.docx](<RECUPERA-SOLO - Teste de uso.docx>).

```bash
npm run servidor   # http://127.0.0.1:8099
npm test           # unidade e navegador
npm run prints     # refaz as comparações
```

## Estrutura

- `index.html`, `style.css`, `script.js` (cálculo, validação e tela em um único
  arquivo, para upload direto).
- `apk/`: gerador e instruções do aplicativo.
- Publicação no Netlify: branch `main`, sem build, diretório `.`.

## Comparação com o original

[MELHORIAS.md](MELHORIAS.md), com prints do original e do atual.

## Autoria

Orientação: [Nildo Dias](https://sigaa.ufersa.edu.br/sigaa/public/docente/portal.jsf?siape=1505717) ·
Apoio: [Francisco de Assis P. V. de Arruda](https://sigaa.ufersa.edu.br/sigaa/public/docente/portal.jsf?siape=1817174)
