# Mudanças visuais

Registro da modernização da interface do RECUPERA-SOLO, aplicada na branch
`modernizacao-visual`. O cálculo agronômico, os textos técnicos, os
identificadores e a estrutura da página foram preservados. A alteração ficou
restrita a `index.html`, `style.css` e `script.js`.

A documentação, a geração do artigo e os testes de uso permanecem na `main`.
A branch de modernização carrega apenas o código do site e o gerador do APK,
herdados da `main`.

## Seletor de tema

O cabeçalho passou a exibir um seletor com duas opções, Claro e Escuro, em um
grupo com rótulo acessível e estado anunciado por `aria-pressed`.

- A escolha é gravada em `localStorage`, na chave `recupera-solo-tema`.
- Sem escolha gravada, o tema do sistema é seguido por `prefers-color-scheme`.
- A mudança do sistema continua a ser acompanhada enquanto não houver escolha
  manual.
- Um script no `<head>` aplica o tema antes da folha de estilo, o que evita a
  piscada de tema claro no carregamento.
- A cor da barra do navegador é atualizada por `meta name="theme-color"`.
- O seletor funciona aberto por `file://` e dentro do APK, inclusive quando o
  armazenamento local está indisponível, situação em que a troca vale apenas
  para a sessão.

## Paleta

As cores da identidade foram mantidas e organizadas em tokens semânticos. O
tema escuro usa a mesma família cromática, com verde e ocre mais claros para
contraste sobre fundo escuro.

| Papel | Claro | Escuro |
|---|---|---|
| Fundo | `#f3f7f5` | `#0a120f` |
| Superfície | `#ffffff` | `#101a16` |
| Texto | `#102a3a` | `#e8f0ea` |
| Texto secundário | `#4b6270` | `#a7bdb2` |
| Verde | `#0c6b46` | `#5cc79a` |
| Ocre | `#9a531e` | `#e3a678` |
| Azul dos títulos | `#123d68` | `#a9cdea` |
| Linha | `#d6e2e1` | `#22352c` |
| Alerta | `#a2470f` | `#f2a87e` |

Os nomes herdados `--verde`, `--ocre`, `--tinta`, `--linha` e `--papel`
permaneceram, o que manteve a leitura da folha de estilo e o vínculo com a
identidade original.

## Tipografia e forma

- Família do sistema iniciada por `system-ui`, com `Segoe UI` como alternativa.
- Títulos com peso 750 e `text-wrap: balance`; parágrafos com `text-wrap: pretty`.
- Tamanhos fluidos por `clamp()` no título, nos cabeçalhos de seção e nos números
  de resultado.
- Escala de raios: 10 px para selos, 14 px para campos e caixas, 20 px para
  cartões e 999 px para o seletor de tema.
- Duas sombras discretas, uma para repouso e outra para realce.

## Componentes

- Cabeçalho com faixa cromática de 3 px e, a partir de 901 px, posição fixa com
  desfoque de fundo por `backdrop-filter`.
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
- Área de toque de 44 px no seletor de tema e nos botões.
- Rótulos, dicas, resumo de erros e legenda da tabela preservados.
- Impressão sempre em cores claras, com o seletor de tema oculto.

## Responsividade

- Quatro colunas até 1100 px, três até 900 px, duas até 620 px e uma coluna em
  telas estreitas.
- A tabela deixa de rolar na horizontal e passa a cartões com `data-rotulo`.
- A página não cria rolagem lateral em 320 px.

## Verificação

- 15 testes de unidade aprovados.
- 50 testes de navegador aprovados, em computador e celular.
- Quatro verificações do seletor, executadas durante o desenvolvimento:
  alternância, persistência após recarga, estado de `aria-pressed` e adesão ao
  tema escuro do sistema.
- Capturas de tela conferidas nos dois temas, em 1280 px e 390 px.

## Comparação entre versões

O comando `apk/gerar_apk.cmd` compila o site da branch em uso. Sem parâmetros, o
`versionName` recebe o nome da branch e o `versionCode` recebe ano, mês, dia e hora
em um número de oito dígitos, o que mantém a instalação possível sobre a versão
anterior.

- `main` gera `apk/dist/RECUPERA-SOLO-main.apk`.
- `modernizacao-visual` gera
  `apk/dist/RECUPERA-SOLO-modernizacao-visual.apk`.

As duas versões usam o mesmo pacote `br.edu.ufersa.recuperasolo` e a mesma chave
de assinatura. A versão instalada substitui a anterior, e o nome da branch
aparece nas informações do aplicativo.
