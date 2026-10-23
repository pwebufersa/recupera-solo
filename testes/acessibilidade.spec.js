import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('a página inicial não tem violações de acessibilidade', async function ({ page }) {
  await page.goto('/');
  const analise = await new AxeBuilder({ page }).analyze();
  expect(analise.violations).toEqual([]);
});

test('os resultados não introduzem violações de acessibilidade', async function ({ page }) {
  await page.goto('/');
  await page.getByRole('button', { name: /exemplo/i }).click();
  await page.locator('#calc').click();
  const analise = await new AxeBuilder({ page }).analyze();
  expect(analise.violations).toEqual([]);
});
