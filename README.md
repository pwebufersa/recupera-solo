# RECUPERA-SOLO

Página estática derivada de `https://dapper-flan-955869.netlify.app/`. Conteúdo
e cálculo inalterados; interface ajustada a telas pequenas.

## Comandos

```bash
npm run servidor   # http://127.0.0.1:8099
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
| `testes/` | servidor local, preços e as duas suítes |
| `.github/workflows/testes.yml` | execução a cada envio |

## Documentos

- [MELHORIAS.md](MELHORIAS.md): mudanças na tela, com capturas.
- [PRECOS.md](PRECOS.md): preços por tonelada e fontes.

