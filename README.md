# RECUPERA-SOLO

Cópia do site `https://dapper-flan-955869.netlify.app/` com a tela ajustada ao
celular. O conteúdo, os oito corretivos e o cálculo são os mesmos da origem.

## Abrir e testar

```bash
npm run servidor   # http://127.0.0.1:8099
npm test           # 11 testes de cálculo e 8 de navegador, em duas telas
```

O botão "Usar exemplo" carrega os dados do exercício com os preços de mercado
de outubro de 2026 já preenchidos, todos editáveis.

A publicação é estática, no Netlify. Os testes ficam fora do que é publicado.

## Arquivos

| Arquivo | Assunto |
|---|---|
| [MELHORIAS.md](MELHORIAS.md) | o que mudou na tela, com capturas |
| [PRECOS.md](PRECOS.md) | preços por tonelada usados nos testes, com fontes |

`index.html`, `style.css` e `script.js` formam a página, com o cálculo no
mesmo arquivo, como no original. `testes/` traz o servidor local, os preços e
as duas suítes. `.github/workflows/testes.yml` roda tudo a cada envio.

## Limitações

Textura, drenagem e qualidade da água não entram no cálculo, como na origem.
