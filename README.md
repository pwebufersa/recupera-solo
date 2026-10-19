# RECUPERA-SOLO

Cópia do site `https://dapper-flan-955869.netlify.app/` com a tela ajustada ao
celular. O conteúdo, os oito corretivos e o cálculo são os mesmos da origem.

## Abrir e testar

```bash
npm run servidor   # http://127.0.0.1:8099
npm test           # 9 testes de cálculo e 6 de navegador, em duas telas
```

A publicação é estática, no Netlify. Os testes ficam fora do que é publicado.

## Arquivos

| Arquivo | Assunto |
|---|---|
| [MELHORIAS.md](MELHORIAS.md) | o que mudou na tela, com capturas |
| [PRECOS.md](PRECOS.md) | preços por tonelada usados nos testes, com fontes |

`index.html`, `style.css` e `script.js` formam a página; `calc.js` guarda o
cálculo. `testes/` traz o servidor local, os preços e as duas suítes.
`.github/workflows/testes.yml` roda tudo a cada envio.

## Limitações

Textura, drenagem e qualidade da água não entram no cálculo, como na origem.
