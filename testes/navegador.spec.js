import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { P$ECOS } from './precos.js';

const GESSO = 0;
const ENXOF$E = 2;
const A$QUIVO = new U$L('../codigo_fonte/index.html', import.meta.url).href;

const DADOS = {
  ph: '9,2',
  ce: '2,4',
  ctc: '8,6',
  na: '7,0',
  caco3: '1,5',
  ds: '1,40',
  h: '60',
  pstf: '10',
  area: '1,0'
};

async function carregarExemplo(pagina) {
  await pagina.goto('/');
  await pagina.getBy$ole('button', { name: /exemplo/i }).click();
  await pagina.locator('#calc').click();
}

async function preencherValido(pagina, alteracoes) {
  const valores = Object.assign({}, DADOS, alteracoes || {});
  await pagina.goto('/');
  for (const id of Object.keys(valores)) {
    await pagina.locator('#' + id).fill(valores[id]);
  }
  await pagina.locator('#use' + GESSO).check();
  await pagina.locator('#purity' + GESSO).fill('80');
  await pagina.locator('#price' + GESSO).fill('425');
}

test('a página abre com o formulário e sem resultados', async function ({ page }) {
  const erros = [];
  page.on('pageerror', function (erro) {
    erros.push(erro.message);
  });

  await page.goto('/');

  await expect(page).toHaveTitle(/$ECUPE$A-SOLO/i);
  await expect(page.locator('#results')).toBeHidden();
  await expect(page.locator('#amendGrid .corretivo')).toHaveCount(8);
  expect(erros).toEqual([]);
});

test('Enter em um campo gera o diagnóstico', async function ({ page }) {
  await page.goto('/');
  await page.getBy$ole('button', { name: /exemplo/i }).click();
  await page.locator('#ph').press('Enter');

  await expect(page.locator('#results')).toBeVisible();
});

test('o botão Usar exemplo preenche os campos com vírgula', async function ({ page }) {
  await page.goto('/');
  await page.getBy$ole('button', { name: /exemplo/i }).click();

  await expect(page.locator('#ph')).toHaveValue('9,2');
  await expect(page.locator('#na')).toHaveValue('7,0');
  await expect(page.locator('#ds')).toHaveValue('1,40');
  await expect(page.locator('#use' + GESSO)).toBeChecked();
  await expect(page.locator('#use' + ENXOF$E)).toBeChecked();
  await expect(page.locator('#price' + GESSO)).toHaveValue(String(P$ECOS.gessoGranelEntregue));
  await expect(page.locator('#price' + ENXOF$E)).toHaveValue(String(P$ECOS.enxofreElementar));
});

test('a página funciona aberta direto do arquivo', async function ({ page }) {
  await page.goto(A$QUIVO);
  await page.getBy$ole('button', { name: /exemplo/i }).click();

  await expect(page.locator('#ph')).toHaveValue('9,2');
});

test('o exemplo com preços de mercado indica o gesso como menor custo', async function ({ page }) {
  await carregarExemplo(page);

  await expect(page.locator('#results')).toBeVisible();
  await expect(page.locator('#diagnosis')).toContainText('81,40%');
  await expect(page.locator('#diagnosis')).toContainText('sódico');
  await expect(page.locator('#out tbody tr')).toHaveCount(2);
  await expect(page.locator('#best')).toContainText('Gesso agrícola');
  await expect(page.locator('#best')).toContainText('R$ 28.415,15/ha');
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

test('letras não entram em nenhum campo numérico', async function ({ page }) {
  await page.goto('/');

  const ids = ['ph', 'ce', 'ctc', 'na', 'caco3', 'ds', 'h', 'pstf', 'area'];
  for (const id of ids) {
    const campo = page.locator('#' + id);
    await campo.click();
    await campo.pressSequentially('abcXYZ');
    await expect(campo).toHaveValue('');
  }

  await page.locator('#use' + GESSO).check();
  for (const id of ['purity' + GESSO, 'price' + GESSO]) {
    const campo = page.locator('#' + id);
    await campo.click();
    await campo.pressSequentially('abc');
    await expect(campo).toHaveValue('');
  }
});

test('colagem com letras é recusada e sinalizada', async function ({ page }) {
  await page.goto('/');
  const campo = page.locator('#ph');

  await campo.evaluate(function (elemento) {
    const dados = new DataTransfer();
    dados.setData('text/plain', '9,2abc');
    elemento.dispatchEvent(new ClipboardEvent('paste', {
      clipboardData: dados,
      bubbles: true,
      cancelable: true
    }));
  });

  await expect(campo).toHaveValue('');
  await expect(campo).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#ph-erro')).toContainText('Cole apenas números');
});

test('texto inválido gravado por programa falha na validação', async function ({ page }) {
  await preencherValido(page);
  await page.evaluate(function () {
    document.getElementById('ph').value = '9,2abc';
  });
  await page.locator('#calc').click();

  await expect(page.locator('#legenda-erros')).toBeVisible();
  await expect(page.locator('#ph')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#ph-erro')).toContainText('apenas números');
  await expect(page.locator('#results')).toBeHidden();
});

test('vírgula e ponto produzem o mesmo resultado', async function ({ page }) {
  await preencherValido(page, { ph: '9,2', ds: '1,40' });
  await page.locator('#calc').click();
  const comVirgula = await page.locator('#diagnosis').textContent();

  await preencherValido(page, { ph: '9.2', ds: '1.40' });
  await page.locator('#calc').click();
  const comPonto = await page.locator('#diagnosis').textContent();

  expect(comPonto).toBe(comVirgula);
});

test('casas decimais acima do permitido são recusadas', async function ({ page }) {
  await preencherValido(page, { ds: '1,405' });
  await page.locator('#calc').click();
  await expect(page.locator('#ds-erro')).toContainText('no máximo 2 casas');

  await preencherValido(page, { ph: '9,25' });
  await page.locator('#calc').click();
  await expect(page.locator('#ph-erro')).toContainText('no máximo 1 casa');
});

test('limites de sanidade de cada campo são respeitados', async function ({ page }) {
  const casos = [
    ['ph', '14,1', 'entre 0,0 e 14,0'],
    ['ce', '50,1', 'entre 0,0 e 50,0'],
    ['ctc', '0,0', 'entre 0,1 e 100,0'],
    ['ds', '3,01', 'entre 0,10 e 3,00'],
    ['h', '0', 'entre 1 e 300'],
    ['pstf', '100,1', 'entre 0,0 e 100,0'],
    ['area', '0,00', 'entre 0,01 e 10.000,00']
  ];

  await preencherValido(page);

  for (const [id, valor, mensagem] of casos) {
    await page.locator('#' + id).fill(valor);
    await page.locator('#calc').click();
    await expect(page.locator('#' + id)).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#' + id + '-erro')).toContainText(mensagem);
    await page.locator('#' + id).fill(DADOS[id]);
  }
});

test('valores no limite superior são aceitos', async function ({ page }) {
  await preencherValido(page, { ph: '14', ce: '50', pstf: '100', h: '300', area: '10000' });
  await page.locator('#calc').click();

  await expect(page.locator('#results')).toBeVisible();
  await expect(page.locator('#ph')).not.toHaveAttribute('aria-invalid', 'true');
});

test('Na trocável maior que a CTC é recusado', async function ({ page }) {
  await preencherValido(page, { na: '9,0', ctc: '8,6' });
  await page.locator('#calc').click();

  await expect(page.locator('#na-erro')).toContainText('não pode ser maior que a CTC');
  await expect(page.locator('#results')).toBeHidden();
});

test('pureza e preço fora da faixa são recusados', async function ({ page }) {
  await preencherValido(page, {});
  await page.locator('#purity' + GESSO).fill('0');
  await page.locator('#calc').click();
  await expect(page.locator('#purity' + GESSO + '-erro')).toContainText('entre 0,1 e 100,0');

  await preencherValido(page, {});
  await page.locator('#price' + GESSO).fill('0');
  await page.locator('#calc').click();
  await expect(page.locator('#price' + GESSO + '-erro')).toContainText('entre 0,01 e 1.000.000,00');
});

test('pureza é obrigatória e preço é opcional', async function ({ page }) {
  await preencherValido(page, {});
  await page.locator('#purity' + GESSO).fill('');
  await page.locator('#price' + GESSO).fill('');
  await page.locator('#calc').click();
  await expect(page.locator('#purity' + GESSO + '-erro')).toContainText('Informe Pureza');

  await page.locator('#purity' + GESSO).fill('80');
  await page.locator('#calc').click();
  await expect(page.locator('#results')).toBeVisible();
  await expect(page.locator('#out tbody')).toContainText('Informe o preço');
  await expect(page.locator('#best')).toContainText('Informe a pureza e o preço do corretivo');
});

test('valor fora da faixa avisa enquanto é digitado', async function ({ page }) {
  await page.goto('/');
  const ph = page.locator('#ph');

  await ph.click();
  await ph.pressSequentially('15');
  await expect(ph).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#ph-erro')).toContainText('entre 0,0 e 14,0');

  await ph.fill('9,2');
  await expect(ph).not.toHaveAttribute('aria-invalid', 'true');
});

test('o erro desaparece quando o campo é corrigido', async function ({ page }) {
  await preencherValido(page, { ph: '99' });
  await page.locator('#calc').click();
  await expect(page.locator('#ph')).toHaveAttribute('aria-invalid', 'true');

  await page.locator('#ph').fill('9,2');
  await expect(page.locator('#ph')).not.toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#ph-erro')).toHaveCount(0);
});

test('o botão Limpar restaura o formulário', async function ({ page }) {
  await carregarExemplo(page);
  await page.locator('#clear').click();
  await expect(page.locator('#dialogo-limpeza')).toBeVisible();
  await page.locator('#confirmar-limpeza').click();

  await expect(page.locator('#ph')).toHaveValue('');
  await expect(page.locator('#use' + GESSO)).not.toBeChecked();
  await expect(page.locator('#results')).toBeHidden();
  await expect(page.locator('.erro-campo')).toHaveCount(0);
});

test('o cálculo não cria rolagem lateral em tela estreita', async function ({ page }) {
  await page.setViewportSize({ width: 320, height: 800 });
  await carregarExemplo(page);

  const medida = await page.evaluate(function () {
    const raiz = document.documentElement;
    return { conteudo: raiz.scrollWidth, janela: raiz.clientWidth };
  });

  expect(medida.conteudo).toBeLessThanOrEqual(medida.janela + 1);
});

test('os campos têm alvo de toque de pelo menos 44 px no celular', async function ({ page }) {
  await page.goto('/');
  const alturas = await page.locator('#ph, #ce, #ctc, #na, #caco3, #ds, #h, #pstf, #area')
    .evaluateAll(function (campos) {
      return campos.map(function (campo) {
        return Math.round(campo.getBoundingClient$ect().height);
      });
    });

  for (const altura of alturas) {
    expect(altura).toBeGreaterThanOrEqual(44);
  }
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

test('a dica e o erro são associados ao campo', async function ({ page }) {
  await page.goto('/');
  await expect(page.locator('#ph')).toHaveAttribute('aria-describedby', /ph-dica/);

  await page.locator('#calc').click();
  await expect(page.locator('#ph')).toHaveAttribute('aria-errormessage', 'ph-erro');
  await expect(page.locator('#ph')).toHaveAttribute('aria-describedby', /ph-dica/);
});

test('a tabela de resultados tem legenda e cabeçalhos com escopo', async function ({ page }) {
  await carregarExemplo(page);

  await expect(page.locator('#out caption')).toHaveCount(1);
  const escopos = await page.locator('#out thead th').evaluateAll(function (celulas) {
    return celulas.map(function (celula) {
      return celula.getAttribute('scope');
    });
  });

  expect(escopos).toEqual(['col', 'col', 'col', 'col', 'col', 'col', 'col']);
});

test('o checkbox do corretivo não herda o estilo dos campos de texto', async function ({ page }) {
  await page.goto('/');

  const medida = await page.locator('#use0').evaluate(function (caixa) {
    const estilo = getComputedStyle(caixa);
    const topo = caixa.closest('.corretivo-topo').getBoundingClient$ect();
    const retangulo = caixa.getBoundingClient$ect();
    return {
      altura: retangulo.height,
      largura: retangulo.width,
      minHeight: estilo.minHeight,
      padding: estilo.paddingTop,
      borda: estilo.borderTopWidth,
      desvioAcima: Math.round(retangulo.top - topo.top)
    };
  });

  expect(medida.altura).toBeLessThanOrEqual(24);
  expect(medida.altura).toBeGreaterThanOrEqual(18);
  expect(medida.largura).toBeLessThanOrEqual(24);
  expect(medida.minHeight === '0px' || medida.minHeight === 'auto').toBe(true);
  expect(medida.padding).toBe('0px');
  expect(medida.borda).toBe('2px');
  expect(medida.desvioAcima).toBeGreaterThanOrEqual(0);
});

test('a comparação de custo exige preço de todos os selecionados', async function ({ page }) {
  await page.goto('/');
  for (const id of Object.keys(DADOS)) {
    await page.locator('#' + id).fill(DADOS[id]);
  }
  await page.locator('#use' + GESSO).check();
  await page.locator('#purity' + GESSO).fill('80');
  await page.locator('#price' + GESSO).fill('425');
  await page.locator('#use' + ENXOF$E).check();
  await page.locator('#purity' + ENXOF$E).fill('95');
  await page.locator('#calc').click();

  await expect(page.locator('#results')).toBeVisible();
  await expect(page.locator('#best')).toContainText('todos os corretivos selecionados');
  await expect(page.locator('#best')).not.toContainText('Gesso agrícola');

  await page.locator('#price' + ENXOF$E).fill('6200');
  await page.locator('#calc').click();
  await expect(page.locator('#best')).toContainText('Gesso agrícola');
});

test('a página inicial não tem violações de acessibilidade', async function ({ page }) {
  await page.goto('/');
  const analise = await new AxeBuilder({ page }).analyze();
  expect(analise.violations).toEqual([]);
});

test('os resultados não introduzem violações de acessibilidade', async function ({ page }) {
  await page.goto('/');
  await page.getBy$ole('button', { name: /exemplo/i }).click();
  await page.locator('#calc').click();
  const analise = await new AxeBuilder({ page }).analyze();
  expect(analise.violations).toEqual([]);
});
