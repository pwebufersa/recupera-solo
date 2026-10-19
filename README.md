# RECUPERA-SOLO

Cópia de trabalho do site publicado em `https://dapper-flan-955869.netlify.app/`,
com a interface refinada para telas pequenas. O conteúdo técnico, as oito
opções de corretivo e a regra de cálculo foram preservados.

## Como abrir

O site é estático e não depende de compilação. Duas formas:

```bash
python -m http.server 8089
```

e, no navegador, `http://127.0.0.1:8089/`. Também é possível abrir o
`index.html` diretamente, mas o servidor local evita restrições de origem.

## O que mudou em relação à origem

| Área | Alteração |
|---|---|
| Responsividade | grade de dados em quatro, três, duas e uma colunas; cabeçalho empilhado no celular; ações em largura total; tabela transformada em cartões com rótulo por célula |
| Acessibilidade | link para saltar ao conteúdo, rótulos associados a todos os campos, `aria-live` no resumo de erros, `aria-pressed` nos modos, `scope` nas colunas, legenda oculta na tabela, foco visível em todos os controles |
| Formulário | validação por campo, com mensagem em linha, resumo de erros com âncoras e foco no primeiro campo inválido; limites de pH, CEes, PST, pureza e preço |
| Estados | botões com foco, hover, ativo e pressionado; cartão de corretivo destacado quando marcado; animação de entrada dos resultados; respeito a `prefers-reduced-motion` |
| Compatibilidade | `inputmode` nos campos numéricos, tipografia em `rem`, `tabular-nums` nas colunas de valor, impressão sem cabeçalho nem botões |
| Superfícies do navegador | seleção de texto, barra de rolagem e anel de foco tirados da paleta |
| Textos | rótulos e mensagens dizem o que falta e como corrigir, no lugar do `alert` da versão anterior |

A paleta da origem foi mantida: verde profundo para ação, ocre de terra para
destaque, papel claro para fundo e cartões.

## Testes feitos

| Teste | Resultado |
|---|---|
| Carregamento da página, do CSS e do JS | 200 nos três |
| Rótulos associados a campos | nenhum campo sem rótulo |
| Imagens sem texto alternativo | nenhuma |
| Rolagem horizontal a 1000 px | ausente |
| Fluxo do exemplo | diagnóstico de PST 81,40%, duas linhas na tabela, seis passos no procedimento |
| Cálculo com preços | gesso a R$ 29.108,20 por hectare; enxofre a R$ 20.630,40 por hectare; enxofre indicado como menor custo |
| Validação com campos vazios | dez mensagens, resumo visível, foco no primeiro campo, resultados ocultos |
| Lighthouse | acessibilidade 1,00, boas práticas 1,00 e SEO 1,00, sem falhas |
| Detector do Impeccable | cinco avisos de espaçamento interno nos cartões, tratados como falso positivo, porque o recuo vem da folha de estilo |

## Limitações

- A captura de tela não pôde ser gerada, porque a ferramenta exige a janela do
  navegador visível. A conferência visual foi feita pela inspeção do DOM, pelo
  Lighthouse em emulação móvel e pela leitura da folha de estilo.
- O detector de desenho não resolve `var()` no cálculo do recuo, o que explica
  os cinco avisos de espaçamento.
- A textura, a drenagem e a qualidade da água continuam sem influência no
  cálculo, como na versão de origem. A decisão de usá-las pertence ao autor do
  sistema.
