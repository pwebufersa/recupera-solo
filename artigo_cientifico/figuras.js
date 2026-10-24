import { chromium } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/* Captura as figuras do artigo: resultados integrados e aviso de valor
   inválido no campo de pH.
   Execução: node artigo_cientifico/figuras.js */

const pasta = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.dirname(pasta);
const site = pathToFileURL(path.join(raiz, 'codigo_fonte', 'index.html')).href;

const navegador = await chromium.launch();

async function abrir(viewport) {
  const pagina = await navegador.newPage({ viewport, deviceScaleFactor: 2 });
  await pagina.goto(site);
  return pagina;
}

// Figura 1: diagnóstico e recomendação do caso demonstrativo.
const resultadoPagina = await abrir({ width: 1000, height: 1100 });
await resultadoPagina.getByRole('button', { name: /exemplo/i }).click();
await resultadoPagina.locator('#calc').click();
await resultadoPagina.waitForTimeout(700);
const resultado = resultadoPagina.locator('.grade-resultados');
await resultado.scrollIntoViewIfNeeded();
await resultado.screenshot({ path: path.join(pasta, 'figura1.png') });
await resultadoPagina.close();

// Figura 2: aviso de valor inválido, com a faixa aceita.
const avisoPagina = await abrir({ width: 412, height: 900 });
await avisoPagina.locator('#customMode').click();
await avisoPagina.locator('#ph').fill('15');
await avisoPagina.locator('#ph').blur();
await avisoPagina.waitForTimeout(300);
const formulario = avisoPagina.locator('section.cartao').nth(1);
await formulario.scrollIntoViewIfNeeded();
await formulario.screenshot({ path: path.join(pasta, 'figura2.png') });
await avisoPagina.close();

await navegador.close();
console.log('figuras geradas');
