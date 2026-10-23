# Mudanças visuais

Registro da modernização da interface do RECUPERA-SOLO, aplicada na branch
`modernizacao-visual`. O cálculo agronômico, os textos técnicos, os
identificadores e a estrutura da página foram preservados. A alteração de
interface ficou restrita a `index.html`, `style.css` e `script.js`.

A documentação, a geração do artigo e os testes de uso permanecem na `main`.
A branch de modernização carrega o código do site, o gerador do APK e o disparo
do fluxo de integração contínua para a própria branch.

## Cabeçalho compacto

- Espaçamento vertical reduzido e faixa cromática de 2 px.
- Logotipo, título, subtítulo e carimbo com tamanhos menores.
- A partir de 901 px, o cabeçalho permanece fixo com desfoque de fundo.
- No celular, a altura ficou próxima de 129 px; no computador, de 94 px.

## Paleta

As cores da identidade foram mantidas e organizadas em tokens semânticos.

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

Os nomes herdados `--verde`, `--ocre`, `--tinta`, `--linha` e `--papel`
permaneceram, o que manteve a leitura da folha de estilo e o vínculo com a
identidade original. O tema é sempre claro, e a página declara
`color-scheme: light`.

## Tipografia e forma

- Família do sistema iniciada por `system-ui`, com `Segoe UI` como alternativa.
- Títulos com peso 750 e `text-wrap: balance`; parágrafos com `text-wrap: pretty`.
- Tamanhos fluidos por `clamp()` no título, nos cabeçalhos de seção e nos números
  de resultado.
- Escala de raios: 10 px para selos, 14 px para campos e caixas e 20 px para
  cartões.
- Duas sombras discretas, uma para repouso e outra para realce.

## Componentes

- Cartões com borda de 1 px, raio de 20 px e sombra leve; os números de seção
  viraram quadrados arredondados com gradiente.
- Campos com 56 px de altura, borda de 1,5 px, raio de 14 px e anel de foco de
  4 px; o estado inválido continua com fundo de alerta e borda de 2 px.
- Caixa de seleção do corretivo preservada em 22 px, com marca desenhada e
  contorno de foco próprio.
- Botões com 48 px de altura mínima, raio de 12 px, estado pressionado e
  variação secundária; a área de toque acompanha a recomendação de 44 px.
- Tabela com cabeçalho em caixa alta, linhas de 1 px e realce na passagem do
  ponteiro; em telas de até 620 px, cada linha vira um cartão com rótulos.
- Caixas de resultado, aviso de menor custo e resumo de erros receberam as cores
  dos tokens e o mesmo raio das demais superfícies.
- Rodapé com linha de separação e links com realce no ponteiro.

## Acessibilidade

- Foco visível em todos os elementos interativos, com anel de 4 px.
- Contraste reforçado por `prefers-contrast: more`.
- Movimento reduzido por `prefers-reduced-motion`.
- Área de toque de 44 px nos botões.
- Rótulos, dicas, resumo de erros e legenda da tabela preservados.
- Impressão sempre em cores claras.

## Responsividade

- Quatro colunas até 1100 px, três até 900 px, duas até 620 px e uma coluna em
  telas estreitas.
- A tabela deixa de rolar na horizontal e passa a cartões com `data-rotulo`.
- A página não cria rolagem lateral em 320 px.

## Verificação

- 15 testes de unidade aprovados.
- 50 testes de navegador aprovados, em computador e celular.
- Capturas de tela conferidas em 1280 px e 390 px.
- Cabeçalho medido em 94 px no computador e 129 px no celular, com a página
  aberta por `file://`.

## Comparação entre versões

O comando `apk/gerar_apk.cmd` compila o site da branch em uso. Sem parâmetros, o
`versionName` recebe o nome da branch e o `versionCode` recebe ano, mês, dia e
hora em um número de oito dígitos, o que mantém a instalação possível sobre a
versão anterior.

- `main` gera `apk/dist/RECUPERA-SOLO-main.apk`.
- `modernizacao-visual` gera
  `apk/dist/RECUPERA-SOLO-modernizacao-visual.apk`.

A pasta `dist` mantém apenas o APK da última compilação, e
`apk/RECUPERA-SOLO.apk` recebe uma cópia idêntica. As duas pastas passam a
conter o mesmo arquivo depois de cada execução.

As duas versões usam o mesmo pacote `br.edu.ufersa.recuperasolo` e a mesma chave
de assinatura. A versão instalada substitui a anterior, e o nome da branch
aparece nas informações do aplicativo.

O fluxo **Aplicativo Android** também é disparado por push na branch
`modernizacao-visual`. Nesse caso, o APK é publicado apenas como artefato da
execução, sem substituir o arquivo versionado em `apk/RECUPERA-SOLO.apk`.
