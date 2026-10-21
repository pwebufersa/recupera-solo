# RECUPERA-SOLO

Sistema de apoio à decisão para recuperação de solos sódicos. O programa diz
qual é o diagnóstico do solo, qual corretivo faz sentido, qual dose aplicar e
quanto custa, a partir dos dados de uma análise de solo.

Foi feito para uso no campo, muitas vezes sem internet. Por isso existe em duas
formas com o mesmo conteúdo:

- **site**, aberto no navegador;
- **aplicativo Android (APK)**, que funciona instalado no celular e não depende
  de conexão.

O cálculo e a orientação são de autoria do professor Nildo Dias. Esta versão
mantém os cálculos originais e melhora a apresentação, a digitação e a
acessibilidade.

## Como abrir

**No computador ou no celular, com internet:** abra
<https://pwebufersa.github.io/recupera-solo/>.

**No celular, sem internet:** instale o APK que fica na pasta `apk/` do
repositório. A instalação exige permitir "fontes desconhecidas" no aparelho.
Depois de instalado, o aplicativo abre sem rede.

## Como usar, passo a passo

1. **Escolha como iniciar.** O botão "Usar exemplo" preenche todos os campos com
   um caso pronto, útil para conhecer o programa. O botão "Nova análise" limpa
   os campos para os seus dados.
2. **Informe os dados do solo.** Os campos aceitam vírgula ou ponto nos
   decimais. Cada campo mostra, embaixo, a faixa aceita e um exemplo.
3. **Marque os corretivos** que deseja comparar e informe a pureza e o preço de
   cada um. Pureza e preço são os únicos dados que mudam de fornecedor para
   fornecedor.
4. **Gere o diagnóstico.** O programa mostra a classificação do solo, a
   recomendação técnica, a dose em três formas, o custo por hectare, o custo
   total da área e o procedimento de recuperação.

O resultado pode ser lido na tela, impresso ou salvo em PDF pelo próprio
navegador.

## O que cada campo significa

| Campo | Unidade | Faixa aceita | Exemplo |
|---|---|---|---|
| pH (H₂O) | — | 0 a 14 | 9,2 |
| CEes | dS m⁻¹ | 0 a 50 | 2,4 |
| CTC | cmolc kg⁻¹ | 0,1 a 100 | 8,6 |
| Na⁺ trocável | cmolc kg⁻¹ | até a CTC | 7,0 |
| CaCO₃ | % | 0 a 100 | 1,5 |
| Densidade do solo | g cm⁻³ | 0,10 a 3,00 | 1,40 |
| Profundidade a recuperar | cm | 1 a 300, inteiro | 60 |
| PST final desejada | % | 0 a 100 | 10 |
| Área | ha | 0,01 a 10.000 | 1,0 |
| Pureza do corretivo | % | 0,1 a 100 | 80 |
| Preço do corretivo | R$/t | maior que zero | 425,00 |

Letras não entram nos campos numéricos. Vírgula e ponto valem como separador
decimal. Quando um valor está fora da faixa, o campo fica destacado e uma
mensagem explica o que corrigir.

## O que o resultado mostra

- **PST inicial**: percentual de sódio no complexo de troca, calculado a partir
  do Na⁺ e da CTC.
- **Classificação**: sódico, salino, salino-sódico ou não sódico, pelos
  critérios informados.
- **Adequação de cada corretivo**: potencialmente adequado, adequado com
  carbonatos, uso com cautela ou baixa prioridade.
- **Dose teórica, prática e comercial**, em kg/ha.
- **Custo por hectare e custo total** da área informada.
- **Procedimento**: sequência de aplicação, lixiviação e monitoramento.

## O que o sistema não faz

Textura, drenagem e qualidade da água são registradas, mas não entram no
cálculo, exatamente como na versão original. Elas servem de contexto para a
leitura do resultado. O programa também não substitui a recomendação de um
engenheiro-agrônomo ou de um pesquisador de solos.

## Preços usados no exemplo

O exemplo usa gesso a R$ 425,00/t e enxofre a R$ 6.200,00/t. A origem das
cotações está em [PRECOS.md](PRECOS.md). Os preços podem ser editados antes de
gerar o diagnóstico.

## Testes

O programa é conferido em duas camadas:

- **testes automáticos**, que abrem a página em um navegador controlado por
  computador, digitam valores válidos e inválidos, testam colagem, limites,
  campos vazios, foco, contraste de alvos de toque e o cálculo do exemplo;
- **teste de uso**, com pessoas, para o que a máquina não vê: sol, luva, tela
  suja, pressa e entendimento do resultado. O roteiro está no arquivo
  `RECUPERA-SOLO - Teste de uso.docx`, e a lista do que só o teste humano
  alcança está em [USABILIDADE.md](USABILIDADE.md).

Resultado da bateria automática: 44 verificações, nas telas de computador e de
celular.

## Para quem programa

- `index.html`: estrutura da página.
- `script.js`: cálculo, validação e tela em **um único arquivo**, para que a
  publicação possa ser feita por upload direto, sem etapa de compilação.
- `style.css`: apresentação.
- `testes/`: testes de cálculo (`node --test`) e de navegador (Playwright).

```bash
npm run servidor   # http://127.0.0.1:8099
npm test           # cálculo e navegador
npm run prints     # refaz as comparações de MELHORIAS.md
```

Publicação no Netlify: branch `main`, sem comando de build, diretório `.`.
Quatro arquivos são usados: `index.html`, `style.css`, `script.js` e
`favicon.svg`.

O APK é gerado por `apk/gerar_apk.ps1`, que baixa as ferramentas necessárias e
assina o aplicativo. As instruções estão em [apk/README.md](apk/README.md).

## Comparação com o original

As diferenças de interface e de validação estão em [MELHORIAS.md](MELHORIAS.md),
sempre com a imagem do original ao lado da versão atual.

## Autoria

- Orientação: [Nildo da Silva Dias](https://sigaa.ufersa.edu.br/sigaa/public/docente/portal.jsf?siape=1505717)
- Apoio: [Francisco de Assis P. V. de Arruda](https://sigaa.ufersa.edu.br/sigaa/public/docente/portal.jsf?siape=1817174)
