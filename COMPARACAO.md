# Original e atual

Comparação com o site que estava no Netlify, preservado em
[`original/`](original/). Essa é a referência fixa: `npm run prints` refaz as
capturas sempre contra ela.

## Lighthouse

| Verificação | Original | Atual |
|---|---|---|
| Acessibilidade | 0,81 | 1,00 |
| Boas práticas | 1,00 | 1,00 |
| Busca e estrutura | 0,75 | 1,00 |

## Formulário

![Computador](imagens/comparacao-formulario-desktop.jpg)

![Celular](imagens/comparacao-formulario-celular.jpg)

## Validação em ação

Com pH 15, a versão atual recusa o valor e explica a faixa; o original aceitava
e seguia para o cálculo.

![Validação do pH 15](imagens/validacao-ph15.jpg)

## Resultados

![Computador](imagens/comparacao-desktop.jpg)

![Celular](imagens/comparacao-celular.jpg)

## Comportamento

| Item | Original | Atual |
|---|---|---|
| Digitação | aceita letra e notação científica | só dígitos, vírgula e ponto |
| Colagem | entra como está | recusada com aviso |
| Decimais | sem limite | 0, 1 ou 2 casas por campo |
| Aviso | só no envio | imediato ao digitar valor fora da faixa |
| Preço | obrigatório para calcular | opcional; sem preço, custo não aparece |
| Comparação de custo | qualquer item com preço | exige preço em todos os selecionados |
| Faixas | parciais | todos os campos |
| Erro | genérico | campo, faixa e correção |
| Dicas | ausentes | faixa e exemplo por campo |
| Exemplo | ponto decimal | vírgula |

## Aparência

| Item | Original | Atual |
|---|---|---|
| Cabeçalho | alto | compacto, 94 px no computador e 129 px no celular |
| Paleta | cores soltas | tokens semânticos |
| Superfícies | raio de 16 px | raio de 20 px, borda de 1 px e sombra leve |
| Campos | 46 px | 56 px, raio de 14 px e anel de foco de 4 px |
| Botões | padding de 13 px | 48 px de altura mínima e raio de 12 px |
| Tabela | linhas finas | cabeçalho em caixa alta e cartões abaixo de 620 px |

Paleta atual: fundo `#f3f7f5`, superfície `#ffffff`, texto `#102a3a`, verde
`#0c6b46`, ocre `#9a531e`, azul dos títulos `#123d68`, linha `#d6e2e1`.

## Acessibilidade

- Foco visível em todos os elementos interativos.
- Contraste reforçado por `prefers-contrast: more`.
- Movimento reduzido por `prefers-reduced-motion`.
- Alvos de toque de 44 px nos botões.
- Impressão sempre em cores claras.

## Verificação

- 15 testes de unidade e 50 testes de navegador aprovados.
- Capturas em `imagens/`, refeitas contra `original/`.
- APK em `apk/dist`, com cópia idêntica em `apk/RECUPERA-SOLO.apk`.

## Preservado

Fórmulas, coeficientes, PE, critérios de classificação, textos técnicos,
estrutura e uso por `file://`.

## Pendência

Textura, drenagem e qualidade da água seguem fora do cálculo.
