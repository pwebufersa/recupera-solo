# O que mudou no site RECUPERA-SOLO

Este texto explica, sem termos técnicos, o que foi feito na cópia do site
`https://dapper-flan-955869.netlify.app/`. O conteúdo continua o mesmo: os oito
corretivos, as contas de dose e custo e o passo a passo de recuperação.

## O problema da versão original

No celular, a tela ficava maior que o aparelho. Os campos de digitação e os
botões saíam pela direita, e a pessoa precisava arrastar a página para o lado
para conseguir ler e preencher. A imagem a seguir mostra o começo da página
nessa situação, com o texto cortado na borda.

![Antes, no celular](prints/antes-celular.png)

## Como ficou

Nada sai mais da tela. Os campos que ficavam lado a lado descem um para baixo
do outro, os botões ocupam a largura toda e a tabela de resultados se
transforma em cartões, com o nome de cada coluna ao lado do valor.

![Depois, no celular](prints/depois-celular.png)

No computador, o desenho foi mantido, como mostra a comparação a seguir.

| Antes | Depois |
|---|---|
| ![Antes, no computador](prints/antes-desktop.png) | ![Depois, no computador](prints/depois-desktop.png) |

## Outras mudanças que a pessoa percebe

- O aviso de campo em branco aparece ao lado do próprio campo, com a frase do
  que falta, em vez de uma janela que precisa ser fechada.
- Os campos numéricos abrem o teclado de números no celular.
- Quem usa leitor de tela ouve o resultado da validação e sabe quantos campos
  precisam de atenção.
- Os botões mostram quando o ponteiro está por cima, quando estão apertados e
  quando estão selecionados.
- A página pode ser impressa sem os botões e sem o cabeçalho.

## Testes feitos

| Verificação | Antes | Depois |
|---|---|---|
| Nota de acessibilidade | 0,81 | 1,00 |
| Nota de boas práticas | 1,00 | 1,00 |
| Nota de busca e estrutura | 0,75 | 1,00 |
| Campos sem nome acessível | não medido | nenhum |
| Rolagem para o lado | presente no celular | ausente |
| Erro de preenchimento | janela de aviso | mensagem no campo |

O cálculo foi conferido com os dados do exemplo: o resultado indica 81,40% de
sódio trocável, classificação sódica, duas linhas de comparação e seis passos
no procedimento. Com preços de mercado, o enxofre aparece como menor custo,
com R$ 20.630,40 por hectare.

## O que ficou por fazer

- A textura, a drenagem e a qualidade da água continuam sem peso no cálculo,
  como na versão original. Essa decisão é do autor do sistema.
- A janela de captura automática do navegador não gerou imagens. As imagens
  deste texto foram produzidas diretamente pelo navegador, em modo de
  visualização sem janela.
