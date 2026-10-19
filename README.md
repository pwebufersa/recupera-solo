# RECUPERA-SOLO

- Site: **https://pwebufersa.github.io/recupera-solo/**
- Original: `https://dapper-flan-955869.netlify.app/`

Cópia do site original com a interface ajustada a telas pequenas. Conteúdo e
cálculo inalterados.

## Uso

1. O endereço acima deve ser aberto no navegador, no computador ou no celular.
2. O botão "Usar exemplo" carrega os dados do exercício e os preços de mercado.
3. O botão "Gerar diagnóstico e recomendação" mostra dose, custo e procedimento.
4. Os campos e os preços podem ser alterados antes do cálculo.
5. "Limpar" apaga os dados; "Nova análise" começa do zero.

Nada precisa ser instalado para usar o site.

## Autoria

| Papel | Nome | SIGAA |
|---|---|---|
| Orientação | Nildo da Silva Dias | [portal](https://sigaa.ufersa.edu.br/sigaa/public/docente/portal.jsf?siape=1505717) |
| Apoio | Francisco de Assis Pereira Vasconcelos de Arruda | [portal](https://sigaa.ufersa.edu.br/sigaa/public/docente/portal.jsf?siape=1817174) |

## Comandos

```bash
npm run servidor   # http://127.0.0.1:8099
npm run prints     # refaz as capturas de MELHORIAS.md
npm test           # 11 testes de cálculo e 8 de navegador
```

## Estrutura

| Caminho | Função |
|---|---|
| `index.html`, `style.css`, `script.js` | página e cálculo, em arquivo único e comentado por seções |
| `testes/` | servidor local, preços, capturas e as duas suítes |
| `.github/workflows/testes.yml` | execução a cada envio |

Antes de cada envio, `npm run prints` refaz as capturas usadas em MELHORIAS.md.
Os relatórios de teste são gerados a cada execução e não são versionados; no
GitHub Actions, o relatório de falha fica disponível por sete dias.

## Publicação

A publicação do GitHub Pages sai da branch `main`. Os testes não entram no site
publicado.

## Documentos

- [MELHORIAS.md](MELHORIAS.md): mudanças na tela, com capturas.
- [PRECOS.md](PRECOS.md): preços por tonelada e fontes.
