import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { chromium } from '@playwright/test';

/* Refaz as capturas de MELHORIAS.md a partir dos dois index.html.
   Execução: npm run prints */

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pasta = path.join(raiz, 'prints');
const original = pathToFileURL(
  path.join(process.env.TEMP || '/tmp', 'opencode', 'original_site', 'index.html')
).href;
const atual = pathToFileURL(path.join(raiz, 'index.html')).href;

const TELAS = [
  { nome: 'celular', largura: 412, altura: 915 },
  { nome: 'desktop', largura: 1280, altura: 900 }
];

async function abrir(navegador, tela, endereco) {
  const pagina = await navegador.newPage({
    viewport: { width: tela.largura, height: tela.altura },
    deviceScaleFactor: 2
  });
  await pagina.goto(endereco);
  return pagina;
}

async function capturar(pagina, arquivo) {
  await pagina.screenshot({ path: path.join(pasta, arquivo), fullPage: true });
  console.log(arquivo);
}

const navegador = await chromium.launch({ channel: 'chrome' });

for (const tela of TELAS) {
  const antes = await abrir(navegador, tela, original);
  await capturar(antes, 'antes-' + tela.nome + '.png');
  await antes.close();

  const depois = await abrir(navegador, tela, atual);
  await capturar(depois, 'depois-' + tela.nome + '.png');

  if (tela.nome === 'celular') {
    await depois.getByRole('button', { name: /exemplo/i }).click();
    await depois.locator('#calc').click();
    await depois.waitForTimeout(800);
    await capturar(depois, 'depois-resultados-celular.png');
  }
  await depois.close();
}

await navegador.close();
