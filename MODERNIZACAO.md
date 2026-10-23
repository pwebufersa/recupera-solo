# Modernização

Atualização visual incorporada à `main`. Fórmulas, coeficientes, textos
técnicos, identificadores e estrutura da página foram preservados.

## Mudanças

| Item | Antes | Atual |
|---|---|---|
| Cabeçalho | alto | compacto, com faixa de 2 px e fixo a partir de 901 px |
| Paleta | cores soltas | tokens semânticos |
| Superfícies | raio de 16 px | raio de 20 px, borda de 1 px e sombra leve |
| Campos | 54 px, raio de 12 px | 56 px, raio de 14 px e anel de foco de 4 px |
| Botões | padding de 13 px | 48 px de altura mínima e raio de 12 px |
| Tabela | linhas finas | cabeçalho em caixa alta e cartões abaixo de 620 px |

Altura do cabeçalho: 94 px no computador e 129 px no celular.

## Paleta

| Papel | Cor |
|---|---|
| Fundo | `#f3f7f5` |
| Superfície | `#ffffff` |
| Texto | `#102a3a` |
| Texto secundário | `#4b6270` |
| Verde | `#0c6b46` |
| Ocre | `#9a531e` |
| Azul dos títulos | `#123d68` |
| Linha | `#d6e2e1` |
| Alerta | `#a2470f` |

## Acessibilidade

- Foco visível em todos os elementos interativos.
- Contraste reforçado por `prefers-contrast: more`.
- Movimento reduzido por `prefers-reduced-motion`.
- Alvos de toque de 44 px nos botões.
- Impressão sempre em cores claras.

## Verificação

- 15 testes de unidade e 50 testes de navegador aprovados.
- Capturas em `imagens/`, comparadas com a versão anterior.
- APK em `apk/dist`, com cópia idêntica em `apk/RECUPERA-SOLO.apk`.

## Compilação

`apk/gerar_apk.cmd` compila a branch em uso, grava
`apk/dist/RECUPERA-SOLO-<branch>.apk` e copia o arquivo para
`apk/RECUPERA-SOLO.apk`. Sem parâmetros, o `versionName` recebe o nome da branch
e o `versionCode` recebe ano, mês, dia e hora.

O fluxo **Aplicativo Android** roda a cada push na `main`, publica o artefato da
execução e atualiza o APK versionado.
