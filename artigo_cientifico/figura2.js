import { chromium } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/* Captura a Figura 2 do artigo: aviso de valor inválido no campo de pH.
   Execução: node artigo_cientifico/figura2.js */

const pasta = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.dirname(pasta);

const navegador = await chromium.launch();
const pagina = await navegador.newPage({
  viewport: { width: 412, height: 900 },
  deviceScaleFactor: 2
});

await pagina.goto(pathToFileURL(path.join(raiz, 'index.html')).href);
await pagina.locator('#customMode').click();
await pagina.locator('#ph').fill('15');
await pagina.locator('#ph').blur();
await pagina.waitForTimeout(300);

const formulario = pagina.locator('section.cartao').nth(1);
await formulario.scrollIntoViewIfNeeded();
await formulario.screenshot({ path: path.join(pasta, 'figura2.png') });

await navegador.close();
console.log('captura gerada');
