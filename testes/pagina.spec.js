import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { expect, test } from '@playwright/test';

import { PRECOS } from './precos.js';

const GESSO = 0;
const ENXOFRE = 2;
const ARQUIVO = pathToFileURL(path.resolve('index.html')).href;

async function carregarExemploComPrecos(pagina) {
  await pagina.goto('/');
  await pagina.getByRole('button', { name: /exemplo/i }).click();
  await pagina.locator('#price' + GESSO).fill(String(PRECOS.gessoGranelEntregue));
  await pagina.locator('#price' + ENXOFRE).fill(String(PRECOS.enxofreElementar));
  await pagina.locator('#calc').click();
}

test('a página abre com o formulário e sem resultados', async function ({ page }) {
  const erros = [];
  page.on('pageerror', function (erro) {
    erros.push(erro.message);
  });

  await page.goto('/');

  await expect(page).toHaveTitle(/RECUPERA-SOLO/i);
  await expect(page.locator('#results')).toBeHidden();
  await expect(page.locator('#amendGrid .corretivo')).toHaveCount(8);
  expect(erros).toEqual([]);
});

test('o botão Usar exemplo preenche os campos', async function ({ page }) {
  await page.goto('/');
  await page.getByRole('button', { name: /exemplo/i }).click();

  await expect(page.locator('#ph')).toHaveValue('9.2');
  await expect(page.locator('#na')).toHaveValue('7');
  await expect(page.locator('#use' + GESSO)).toBeChecked();
  await expect(page.locator('#use' + ENXOFRE)).toBeChecked();
});

test('a página funciona aberta direto do arquivo', async function ({ page }) {
  await page.goto(ARQUIVO);
  await page.getByRole('button', { name: /exemplo/i }).click();

  await expect(page.locator('#ph')).toHaveValue('9.2');
});

test('o exemplo com preços de mercado indica o gesso como menor custo', async function ({ page }) {
  await carregarExemploComPrecos(page);

  await expect(page.locator('#results')).toBeVisible();
  await expect(page.locator('#diagnosis')).toContainText('81,40%');
  await expect(page.locator('#diagnosis')).toContainText('sódico');
  await expect(page.locator('#out tbody tr')).toHaveCount(2);
  await expect(page.locator('#best')).toContainText('Gesso agrícola');
  await expect(page.locator('#best')).toContainText('R$ 29.454,73/ha');
  await expect(page.locator('#procedure ol li')).toHaveCount(6);
});

test('o formulário vazio aponta dez campos e leva ao primeiro', async function ({ page }) {
  await page.goto('/');
  await page.locator('#calc').click();

  await expect(page.locator('#legenda-erros')).toBeVisible();
  await expect(page.locator('#legenda-erros li')).toHaveCount(10);
  await expect(page.locator('#legenda-erros')).toContainText('campos precisam de atenção');
  await expect(page.locator('#ph')).toBeFocused();
  await expect(page.locator('#results')).toBeHidden();
});

test('o cálculo não cria rolagem lateral em tela estreita', async function ({ page }) {
  await page.setViewportSize({ width: 320, height: 800 });
  await carregarExemploComPrecos(page);

  const medida = await page.evaluate(function () {
    const raiz = document.documentElement;
    return { conteudo: raiz.scrollWidth, janela: raiz.clientWidth };
  });

  expect(medida.conteudo).toBeLessThanOrEqual(medida.janela + 1);
});

test('todos os campos têm nome acessível', async function ({ page }) {
  await page.goto('/');

  const semNome = await page.evaluate(function () {
    const campos = Array.from(document.querySelectorAll('input, select'));
    return campos
      .filter(function (campo) {
        return campo.type !== 'hidden' && campo.labels.length === 0 &&
          !campo.getAttribute('aria-label') && !campo.getAttribute('aria-labelledby');
      })
      .map(function (campo) {
        return campo.id || campo.name || campo.type;
      });
  });

  expect(semNome).toEqual([]);
});

test('a tabela de resultados tem legenda e cabeçalhos com escopo', async function ({ page }) {
  await carregarExemploComPrecos(page);

  await expect(page.locator('#out caption')).toHaveCount(1);
  const escopos = await page.locator('#out thead th').evaluateAll(function (celulas) {
    return celulas.map(function (celula) {
      return celula.getAttribute('scope');
    });
  });

  expect(escopos).toEqual(['col', 'col', 'col', 'col', 'col', 'col', 'col']);
});
