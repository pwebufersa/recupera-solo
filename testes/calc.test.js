import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

import { PRECOS } from './precos.js';

/* O site usa um arquivo único, sem módulos, para abrir também por file://.
   O teste carrega esse arquivo em um contexto do Node e usa a API exposta. */

const codigo = fs.readFileSync(new URL('../script.js', import.meta.url), 'utf8');
const contexto = vm.createContext({});
vm.runInContext(codigo, contexto, { filename: 'script.js' });

const { CORRETIVOS, adequacao, calcularDoses, classificar } = contexto.RecuperaSolo;

const DADOS_DO_EXERCICIO = {
  ph: 9.2, ce: 2.4, ctc: 8.6, na: 7, caco3: 1.5, ds: 1.4, h: 60, pstf: 10, area: 1
};

function corretivo(nome) {
  return CORRETIVOS.find(function (item) {
    return item.nome.startsWith(nome);
  });
}

function gesso(pureza, preco) {
  return { corretivo: corretivo('Gesso'), pureza: pureza, preco: preco };
}

function enxofre(pureza, preco) {
  return { corretivo: corretivo('Enxofre'), pureza: pureza, preco: preco };
}

function calcario(pureza, preco) {
  return { corretivo: corretivo('Calcário'), pureza: pureza, preco: preco };
}

function proximo(valor, esperado, tolerancia) {
  const margem = tolerancia === undefined ? 0.01 : tolerancia;
  assert.ok(
    Math.abs(valor - esperado) <= margem,
    'esperado ' + esperado + ' com margem ' + margem + ', obtido ' + valor
  );
}

test('o arquivo único não inicia a tela sem documento', function () {
  assert.equal(typeof contexto.RecuperaSolo.calcularDoses, 'function');
  assert.equal(typeof contexto.document, 'undefined');
});

test('os preços do exemplo são os preços pesquisados', function () {
  assert.equal(corretivo('Gesso').precoExemplo, PRECOS.gessoGranelEntregue);
  assert.equal(corretivo('Enxofre').precoExemplo, PRECOS.enxofreElementar);
});

test('a PST inicial é a razão entre o sódio e a CTC', function () {
  const resultado = calcularDoses(DADOS_DO_EXERCICIO, []);

  proximo(resultado.pstInicial, 81.3953, 0.001);
  proximo(resultado.delta, 71.3953, 0.001);
  assert.equal(resultado.classe, 'sódico');
});

test('com preços de mercado o gesso custa menos da metade do enxofre', function () {
  const resultado = calcularDoses(DADOS_DO_EXERCICIO, [
    gesso(80, PRECOS.gessoGranelEntregue),
    enxofre(95, PRECOS.enxofreElementar)
  ]);

  const linhaDoGesso = resultado.linhas[0];
  const linhaDoEnxofre = resultado.linhas[1];
  proximo(linhaDoGesso.custo, 29454.73);
  proximo(linhaDoEnxofre.custo, 67320.25);
  assert.equal(resultado.melhor.nome, linhaDoGesso.nome);
  assert.ok(linhaDoEnxofre.custo > linhaDoGesso.custo * 2);
});

test('o calcário aparece na tabela e fica fora da comparação por baixa prioridade', function () {
  const resultado = calcularDoses(DADOS_DO_EXERCICIO, [
    gesso(80, PRECOS.gessoGranelEntregue),
    calcario(100, PRECOS.calcarioDolomitico)
  ]);

  const linhaDoCalcario = resultado.linhas[1];
  assert.equal(linhaDoCalcario.ajuste.ok, false);
  assert.equal(linhaDoCalcario.ajuste.rotulo, 'Baixa prioridade');
  proximo(linhaDoCalcario.custo, 8767.92);
  assert.equal(resultado.melhor.nome, resultado.linhas[0].nome);
});

test('o custo total acompanha a área informada', function () {
  const resultado = calcularDoses({ ...DADOS_DO_EXERCICIO, area: 5 }, [
    gesso(80, PRECOS.gessoGranelEntregue)
  ]);

  const linha = resultado.linhas[0];
  proximo(linha.total, linha.custo * 5);
});

test('sem preço, a dose é calculada e o custo fica indefinido', function () {
  const resultado = calcularDoses(DADOS_DO_EXERCICIO, [gesso(80, NaN)]);

  const linha = resultado.linhas[0];
  assert.ok(linha.doseComercial > 0);
  assert.ok(Number.isNaN(linha.custo));
  assert.ok(Number.isNaN(linha.total));
  assert.equal(resultado.melhor, null);
});

test('pureza zero impede a dose comercial', function () {
  const resultado = calcularDoses(DADOS_DO_EXERCICIO, [gesso(0, PRECOS.gessoGranelEntregue)]);

  const linha = resultado.linhas[0];
  assert.ok(Number.isNaN(linha.doseComercial));
  assert.ok(Number.isNaN(linha.custo));
});

test('meta já atingida zera a dose', function () {
  const resultado = calcularDoses({ ...DADOS_DO_EXERCICIO, pstf: 90 }, [
    gesso(80, PRECOS.gessoGranelEntregue)
  ]);

  assert.equal(resultado.delta, 0);
  assert.equal(resultado.linhas[0].doseTeorica, 0);
  assert.equal(resultado.linhas[0].custo, 0);
});

test('a classificação combina sodicidade e salinidade', function () {
  assert.equal(classificar(20, 5), 'salino-sódico');
  assert.equal(classificar(20, 1), 'sódico');
  assert.equal(classificar(5, 5), 'salino');
  assert.equal(classificar(5, 1), 'não sódico pelos critérios informados');
});

test('a adequação depende do tipo, do pH e dos carbonatos', function () {
  assert.equal(adequacao(corretivo('Gesso'), 9.2, 0).ok, true);
  assert.equal(adequacao(corretivo('Enxofre'), 9.2, 1.5).rotulo, 'Adequado com carbonatos');
  assert.equal(adequacao(corretivo('Enxofre'), 9.2, 0).ok, false);
  assert.equal(adequacao(corretivo('Calcário'), 6.5, 0).ok, true);
  assert.equal(adequacao(corretivo('Calcário'), 8.0, 0).ok, false);
});
