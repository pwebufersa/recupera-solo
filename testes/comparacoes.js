import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { chromium } from '@playwright/test';

/* Refaz as comparações de COMPARACAO.md entre o site original e esta versão.
   As capturas mostram a seção de resultados, onde a diferença é maior.
   Execução: npm run prints */

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pasta = path.join(raiz, 'imagens');
const temporaria = fs.mkdtempSync(path.join(os.tmpdir(), 'recupera-prints-'));
const original = pathToFileURL(path.join(raiz, 'original', 'index.html')).href;
const atual = pathToFileURL(path.join(raiz, 'index.html')).href;

const TELAS = [
  { nome: 'desktop', largura: 1280, coluna: 600 },
  { nome: 'celular', largura: 412, coluna: 330 }
];

async function capturar(navegador, tela, endereco, arquivo, alvo) {
  const pagina = await navegador.newPage({
    viewport: { width: tela.largura, height: 900 },
    deviceScaleFactor: 2
  });
  await pagina.goto(endereco);
  await pagina.addStyleTag({ content: '.barra-mobile { display: none !important; }' });
  await pagina.getByRole('button', { name: /exemplo/i }).click();
  if (alvo === 'resultados') {
    await pagina.locator('#calc').click();
    await pagina.waitForTimeout(700);
  }
  const elemento = alvo === 'formulario'
    ? pagina.locator('.cartao, .card').nth(1)
    : pagina.locator('#results');
  await elemento.screenshot({ path: arquivo, type: 'jpeg', quality: 85 });
  await pagina.close();
}

function paginaDeComparacao(tela, esquerda, direita) {
  const html = '<!doctype html><meta charset="utf-8"><style>' +
    'body{margin:0;background:#eef2f0;font:600 15px/1.4 "Segoe UI",Arial,sans-serif;color:#102a3a;padding:14px}' +
    '.par{display:flex;gap:14px;align-items:flex-start}' +
    'figure{margin:0;background:#fff;border:1px solid #cfdedd;border-radius:8px;overflow:hidden;width:' + tela.coluna + 'px}' +
    'figcaption{padding:7px 10px;border-bottom:1px solid #cfdedd;background:#f6faf8;font-size:14px}' +
    'img{display:block;width:100%}</style>' +
    '<div class="par">' +
     '<figure><figcaption>Original</figcaption><img src="' + esquerda + '"></figure>' +
    '<figure><figcaption>Atual</figcaption><img src="' + direita + '"></figure>' +
    '</div>';
  const caminho = path.join(temporaria, 'comparacao-' + tela.nome + '.html');
  fs.writeFileSync(caminho, html);
  return caminho;
}

async function capturarValidacao(navegador) {
  const pagina = await navegador.newPage({
    viewport: { width: 900, height: 1200 },
    deviceScaleFactor: 2
  });
  await pagina.goto(atual);
  await pagina.getByRole('button', { name: /exemplo/i }).click();
  await pagina.locator('#ph').fill('15');
  await pagina.locator('#calc').click();
  await pagina.waitForTimeout(500);
  await pagina.locator('.cartao, .card').nth(1).screenshot({
    path: path.join(pasta, 'validacao-ph15.jpg')
  });
  await pagina.close();
  console.log('validacao-ph15.jpg');
}

const navegador = await chromium.launch({ channel: 'chrome' });


for (const tela of TELAS) {
  for (const alvo of ['resultados', 'formulario']) {
    const antes = path.join(temporaria, 'original-' + alvo + '-' + tela.nome + '.jpg');
    const depois = path.join(temporaria, 'atual-' + alvo + '-' + tela.nome + '.jpg');

    await capturar(navegador, tela, original, antes, alvo);
    await capturar(navegador, tela, atual, depois, alvo);

    const comparacao = paginaDeComparacao(
      tela,
      'original-' + alvo + '-' + tela.nome + '.jpg',
      'atual-' + alvo + '-' + tela.nome + '.jpg'
    );
    const pagina = await navegador.newPage({
      viewport: { width: tela.coluna * 2 + 46, height: 900 }
    });
    await pagina.goto(pathToFileURL(comparacao).href);
    const nome = alvo === 'resultados'
      ? 'comparacao-' + tela.nome + '.jpg'
      : 'comparacao-formulario-' + tela.nome + '.jpg';
    await pagina.locator('.par').screenshot({ path: path.join(pasta, nome), type: 'jpeg', quality: 85 });
    await pagina.close();
    console.log(nome);
  }
}

await capturarValidacao(navegador);

await navegador.close();
fs.rmSync(temporaria, { recursive: true, force: true });
