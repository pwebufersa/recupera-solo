# RECUPERA-SOLO

Apoio à decisão para recuperação de solos sódicos: diagnóstico, corretivo, dose,
custo e procedimento a partir da análise de solo. Cálculo e orientação do
professor Nildo Dias, preservados.

Duas formas, mesmo conteúdo: site e aplicativo Android (APK) que funciona sem
internet.

## Abrir

- Site: <https://pwebufersa.github.io/recupera-solo/>
- APK: `apk/dist/RECUPERA-SOLO-1.0.2.apk` (instalação exige permitir fontes
  desconhecidas)

## Usar

1. "Usar exemplo" preenche um caso pronto; "Nova análise" limpa os campos.
2. Informe os dados do solo. Vírgula ou ponto nos decimais.
3. Marque os corretivos e informe a pureza. O preço é opcional; sem ele, o
   custo não é calculado.
4. "Gerar diagnóstico" mostra classificação, dose, custo e procedimento.

## Campos

| Campo | Unidade | Faixa | Exemplo |
|---|---|---|---|
| pH (H₂O) | — | 0 a 14 | 9,2 |
| CEes | dS m⁻¹ | 0 a 50 | 2,4 |
| CTC | cmolc kg⁻¹ | 0,1 a 100 | 8,6 |
| Na⁺ trocável | cmolc kg⁻¹ | até a CTC | 7,0 |
| CaCO₃ | % | 0 a 100 | 1,5 |
| Densidade do solo | g cm⁻³ | 0,10 a 3,00 | 1,40 |
| Profundidade | cm | 1 a 300, inteiro | 60 |
| PST final | % | 0 a 100 | 10 |
| Área | ha | 0,01 a 10.000 | 1,0 |
| Pureza | % | 0,1 a 100 | 80 |
| Preço | R$/t | maior que zero | 425,00 |

Letras não entram nos campos numéricos. Valor fora da faixa avisa durante a
digitação e é recusado no envio, com rolagem até o primeiro erro.

## Resultado

PST inicial, classificação do solo, adequação de cada corretivo, dose teórica,
prática e comercial, custo por hectare e total, e o procedimento de recuperação.

A comparação de menor custo só aparece quando todos os corretivos selecionados
têm pureza e preço. Com apenas um preço, não há comparação.

## Limites

Textura, drenagem e qualidade da água não entram no cálculo, como no original.
O programa não substitui recomendação agronômica.

## Preços do exemplo

Gesso R$ 425,00/t e enxofre R$ 6.200,00/t. Origem em [PRECOS.md](PRECOS.md).

## Testes

- 48 verificações de navegador (computador e celular) e 15 de unidade.
- Teste humano para o que a máquina não vê: [USABILIDADE.md](USABILIDADE.md) e o roteiro em [RECUPERA-SOLO - Teste de uso.docx](<RECUPERA-SOLO - Teste de uso.docx>).

```bash
npm run servidor   # http://127.0.0.1:8099
npm test           # unidade e navegador
npm run prints     # refaz as comparações
```

## Estrutura

- `index.html`, `style.css`, `script.js` (cálculo, validação e tela em um único
  arquivo, para upload direto).
- `apk/`: gerador e instruções do aplicativo.
- Publicação no Netlify: branch `main`, sem build, diretório `.`.
- GitHub Actions: `Testes` roda a bateria; `APK` gera o aplicativo, publica o
  artefato com versão, hash e resultado dos testes, e tenta abrir o app em
  emulador.
- iOS: a compilação exige macOS com Xcode e conta Apple Developer. No Windows, a
  alternativa é usar a versão web como PWA no Safari.`.

## Automação

`scripts/vigia-todo.ps1` roda a cada 5 minutos pelo Agendador de Tarefas, atualiza
o repositório e executa o que estiver em `TODO.md` quando o arquivo muda. O
registro fica em `.vigia/registro.log`.

```bash
powershell -ExecutionPolicy Bypass -File scripts/instalar-vigia.ps1
```

## Comparação com o original

[MELHORIAS.md](MELHORIAS.md), com prints do original e do atual.

## Autoria

Orientação: [Nildo Dias](https://sigaa.ufersa.edu.br/sigaa/public/docente/portal.jsf?siape=1505717) ·
Apoio: [Francisco de Assis P. V. de Arruda](https://sigaa.ufersa.edu.br/sigaa/public/docente/portal.jsf?siape=1817174)
