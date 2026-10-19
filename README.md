# RECUPERA-SOLO

Site em funcionamento: **https://pwebufersa.github.io/recupera-solo/**

Derivado de `https://dapper-flan-955869.netlify.app/`. Conteúdo e cálculo
inalterados; interface ajustada a telas pequenas.

## Para quem vai testar

1. O endereço acima deve ser aberto no navegador, no computador ou no celular.
2. O botão "Usar exemplo" carrega os dados do exercício e os preços de mercado.
3. O botão "Gerar diagnóstico e recomendação" mostra dose, custo e procedimento.
4. Os campos e os preços podem ser alterados antes do cálculo.
5. "Limpar" apaga os dados; "Nova análise" começa do zero.

Nada é instalado para usar o site. A calculadora funciona só com o navegador.

## Comandos

```bash
npm run servidor   # http://127.0.0.1:8099
npm run prints     # refaz as capturas de MELHORIAS.md
npm test           # 11 testes de cálculo e 8 de navegador
```

## Publicação

- Cópia em funcionamento: `https://pwebufersa.github.io/recupera-solo/`
- Original: `https://dapper-flan-955869.netlify.app/`

A publicação do GitHub Pages sai da branch `main`; os testes não entram no site.

## Estrutura

| Caminho | Função |
|---|---|
| `index.html`, `style.css`, `script.js` | página e cálculo, em arquivo único |
| `testes/` | servidor local, preços, capturas e as duas suítes |
| `.github/workflows/testes.yml` | execução a cada envio |

## Documentos

- [MELHORIAS.md](MELHORIAS.md): mudanças na tela, com capturas.
- [PRECOS.md](PRECOS.md): preços por tonelada e fontes.
