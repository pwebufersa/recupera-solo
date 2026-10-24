import { chromium } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/* Captura as telas usadas na Figura 1 do resumo expandido.
   Execução: node artigo_cientifico/figuras.js */

const pasta = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.dirname(pasta);

const navegador = await chromium.launch();
const pagina = await navegador.newPage({
  viewport: { width: 1000, height: 1100 },
  deviceScaleFactor: 2
});

await pagina.goto(pathToFileURL(path.join(raiz, 'codigo_fonte', 'index.html')).href);
await pagina.getByRole('button', { name: /exemplo/i }).click();
await pagina.locator('#calc').click();
await pagina.waitForTimeout(700);

const resultado = pagina.locator('.grade-resultados');
await resultado.scrollIntoViewIfNeeded();
await resultado.screenshot({ path: path.join(pasta, 'figura1.png') });

await navegador.close();
console.log('captura gerada');
