/* RECUPERA-SOLO, comportamento da página.
   A regra de cálculo está em calc.js. Aqui ficam a leitura dos campos, a
   validação, as mensagens em linha e a montagem da tabela. */

import {
  CORRETIVOS,
  CAMPOS,
  NOMES,
  ROTULOS_TABELA,
  adequacao,
  calcularDoses
} from './calc.js';

function porId(id) {
  return document.getElementById(id);
}

function numero(id) {
  const campo = porId(id);
  if (!campo) {
    return NaN;
  }
  const texto = campo.value.trim().replace(',', '.');
  return texto === '' ? NaN : Number(texto);
}

function formatar(valor, casas) {
  return Number(valor).toLocaleString('pt-BR', {
    minimumFractionDigits: casas === undefined ? 2 : casas,
    maximumFractionDigits: casas === undefined ? 2 : casas
  });
}

function dinheiro(valor) {
  return 'R$ ' + formatar(valor, 2);
}

function montarCorretivos() {
  const grade = porId('amendGrid');
  grade.innerHTML = CORRETIVOS.map(function (corretivo, indice) {
    return '<article class="corretivo">' +
      '<div class="corretivo-topo">' +
      '<input id="use' + indice + '" type="checkbox" aria-describedby="dados' + indice + '">' +
      '<div><label for="use' + indice + '"><h3>' + corretivo.nome + '</h3></label>' +
      '<small id="dados' + indice + '">PE = ' + corretivo.pe + ' · C = ' +
      String(corretivo.c).replace('.', ',') + '</small></div>' +
      '</div>' +
      '<div class="dupla">' +
      '<label for="purity' + indice + '">Pureza (%)' +
      '<input id="purity' + indice + '" type="number" inputmode="decimal" step="0.1" placeholder="Informe"></label>' +
      '<label for="price' + indice + '">Preço (R$/t)' +
      '<input id="price' + indice + '" type="number" inputmode="decimal" step="0.01" placeholder="Informe"></label>' +
      '</div></article>';
  }).join('');
}

function limparErros() {
  document.querySelectorAll('.erro-campo').forEach(function (marca) {
    marca.remove();
  });
  document.querySelectorAll('[aria-invalid="true"]').forEach(function (campo) {
    campo.removeAttribute('aria-invalid');
  });
  const resumo = porId('legenda-erros');
  resumo.classList.add('oculto');
  resumo.innerHTML = '';
}

function registrarErro(campo, mensagem, mensagens) {
  campo.setAttribute('aria-invalid', 'true');
  const marca = document.createElement('span');
  marca.className = 'erro-campo';
  marca.id = campo.id + '-erro';
  marca.textContent = mensagem;
  campo.insertAdjacentElement('afterend', marca);
  mensagens.push({ campo: campo, mensagem: mensagem });
}

function validar() {
  limparErros();
  const mensagens = [];
  CAMPOS.forEach(function (id) {
    const campo = porId(id);
    if (!Number.isFinite(numero(id))) {
      registrarErro(campo, 'Informe ' + NOMES[id] + '.', mensagens);
    }
  });

  const limites = { ph: [0, 14], ce: [0, 50], pstf: [0, 100] };
  Object.keys(limites).forEach(function (id) {
    const campo = porId(id);
    if (campo.hasAttribute('aria-invalid')) {
      return;
    }
    const valor = numero(id);
    if (valor < limites[id][0] || valor > limites[id][1]) {
      registrarErro(campo, NOMES[id] + ' deve ficar entre ' + limites[id][0] +
        ' e ' + limites[id][1] + '.', mensagens);
    }
  });

  ['ctc', 'ds', 'h', 'area'].forEach(function (id) {
    const campo = porId(id);
    if (!campo.hasAttribute('aria-invalid') && numero(id) <= 0) {
      registrarErro(campo, NOMES[id] + ' deve ser maior que zero.', mensagens);
    }
  });

  if (!porId('na').hasAttribute('aria-invalid') &&
      !porId('ctc').hasAttribute('aria-invalid') &&
      numero('na') > numero('ctc')) {
    registrarErro(porId('na'), 'O Na⁺ trocável não pode ser maior que a CTC.', mensagens);
  }

  const selecionados = CORRETIVOS.filter(function (_, indice) {
    return porId('use' + indice).checked;
  });
  if (selecionados.length === 0) {
    registrarErro(porId('amendGrid'), 'Selecione pelo menos um corretivo.', mensagens);
  }

  CORRETIVOS.forEach(function (_, indice) {
    if (!porId('use' + indice).checked) {
      return;
    }
    const pureza = numero('purity' + indice);
    const preco = numero('price' + indice);
    if (Number.isFinite(pureza) && (pureza <= 0 || pureza > 100)) {
      registrarErro(porId('purity' + indice), 'A pureza deve ficar entre 0 e 100.', mensagens);
    }
    if (Number.isFinite(preco) && preco <= 0) {
      registrarErro(porId('price' + indice), 'O preço deve ser maior que zero.', mensagens);
    }
  });

  if (mensagens.length > 0) {
    mostrarResumo(mensagens);
    return false;
  }
  return true;
}

function mostrarResumo(mensagens) {
  const resumo = porId('legenda-erros');
  resumo.innerHTML = '<strong>' + (mensagens.length === 1
    ? 'Um campo precisa de atenção.'
    : mensagens.length + ' campos precisam de atenção.') + '</strong><ul>' +
    mensagens.map(function (item) {
      return '<li><a href="#' + item.campo.id + '">' + item.mensagem + '</a></li>';
    }).join('') + '</ul>';
  resumo.classList.remove('oculto');
  mensagens[0].campo.focus();
}

function dadosDoFormulario() {
  return {
    ph: numero('ph'),
    ce: numero('ce'),
    ctc: numero('ctc'),
    na: numero('na'),
    caco3: numero('caco3'),
    ds: numero('ds'),
    h: numero('h'),
    pstf: numero('pstf'),
    area: numero('area')
  };
}

function selecionados() {
  const escolhidos = [];
  CORRETIVOS.forEach(function (corretivo, indice) {
    if (!porId('use' + indice).checked) {
      return;
    }
    escolhidos.push({
      corretivo: corretivo,
      pureza: numero('purity' + indice),
      preco: numero('price' + indice)
    });
  });
  return escolhidos;
}

function calcular() {
  if (!validar()) {
    return;
  }

  const dados = dadosDoFormulario();
  const resultado = calcularDoses(dados, selecionados());

  porId('diagnosis').innerHTML =
    '<div class="metrica"><b>' + formatar(resultado.pstInicial) + '%</b>' +
    '<span>PST inicial calculada</span></div>' +
    '<p><b>Classificação:</b> ' + resultado.classe + '.</p>' +
    '<p><b>Meta:</b> PST ' + formatar(dados.pstf) + '% na camada de ' +
    formatar(dados.h, 0) + ' cm.</p>';

  const corpo = porId('out').querySelector('tbody');
  corpo.innerHTML = '';
  resultado.linhas.forEach(function (linha) {
    const celulas = [
      '<b>' + linha.nome + '</b>',
      '<span class="' + (linha.ajuste.ok ? 'bom' : 'atencao') + '">' + linha.ajuste.rotulo + '</span>',
      formatar(linha.doseTeorica) + ' kg/ha',
      formatar(linha.dosePratica) + ' kg/ha',
      Number.isFinite(linha.doseComercial) ? formatar(linha.doseComercial) + ' kg/ha' : 'Informe a pureza',
      Number.isFinite(linha.custo) ? dinheiro(linha.custo) : 'Informe o preço',
      Number.isFinite(linha.total) ? dinheiro(linha.total) : 'Sem valor'
    ];
    corpo.insertAdjacentHTML('beforeend', '<tr>' + celulas.map(function (celula, coluna) {
      return '<td data-rotulo="' + ROTULOS_TABELA[coluna] + '">' + celula + '</td>';
    }).join('') + '</tr>');
  });

  const melhor = resultado.melhor;

  porId('best').innerHTML = melhor
    ? '<strong>Menor custo entre as alternativas tecnicamente adequadas:</strong> ' +
      melhor.nome + ', <b>' + dinheiro(melhor.custo) + '/ha</b> (' +
      dinheiro(melhor.total) + ' para ' + formatar(dados.area) + ' ha).'
    : 'Informe pureza e preço dos corretivos selecionados para realizar a comparação econômica.';

  porId('recommendation').innerHTML = selecionados().map(function (item) {
    return '<p><b>' + item.corretivo.nome + ':</b> ' +
      adequacao(item.corretivo, dados.ph, dados.caco3).nota + '</p>';
  }).join('');

  const escolhido = melhor ? melhor.nome : 'o corretivo tecnicamente selecionado';
  porId('procedure').innerHTML = '<ol>' +
    '<li>Confirmar a análise do solo, a profundidade efetiva e a condição de drenagem.</li>' +
    '<li>Aplicar <b>' + escolhido + '</b> conforme a dose comercial calculada e a forma tecnicamente recomendada.</li>' +
    '<li>Promover a substituição do Na⁺ trocável por Ca²⁺.</li>' +
    '<li>Realizar lixiviação do Na⁺ deslocado com água adequada.</li>' +
    '<li>Garantir drenagem para retirada da solução salina da zona radicular.</li>' +
    '<li>Monitorar PST, CEes, pH e propriedades físicas do solo.</li>' +
    '</ol>';

  const resultados = porId('results');
  resultados.classList.remove('oculto');
  const titulo = porId('titulo-resultados');
  titulo.setAttribute('tabindex', '-1');
  titulo.focus({ preventScroll: true });
  resultados.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function limparCampos() {
  CAMPOS.forEach(function (id) {
    porId(id).value = '';
  });
  ['texture', 'drain', 'water'].forEach(function (id) {
    porId(id).selectedIndex = 0;
  });
  CORRETIVOS.forEach(function (_, indice) {
    porId('purity' + indice).value = '';
    porId('price' + indice).value = '';
    porId('use' + indice).checked = false;
  });
  porId('results').classList.add('oculto');
  limparErros();
}

function definirModo(botao, texto) {
  porId('exampleMode').setAttribute('aria-pressed', String(botao === 'exemplo'));
  porId('customMode').setAttribute('aria-pressed', String(botao === 'outro'));
  porId('modeNote').innerHTML = texto;
}

function carregarExemplo() {
  limparCampos();
  const valores = { ph: 9.2, ce: 2.4, ctc: 8.6, na: 7, caco3: 1.5, ds: 1.4, h: 60, pstf: 10, area: 1 };
  Object.keys(valores).forEach(function (id) {
    porId(id).value = valores[id];
  });
  porId('texture').value = 'Média';
  porId('drain').value = 'Adequada';
  porId('water').value = 'Baixa salinidade';
  CORRETIVOS.forEach(function (corretivo, indice) {
    if (corretivo.purezaExemplo === undefined) {
      return;
    }
    porId('purity' + indice).value = corretivo.purezaExemplo;
    porId('use' + indice).checked = true;
  });
  definirModo('exemplo', '<b>Modo exemplo:</b> dados do exercício carregados. ' +
    'Gesso e enxofre estão selecionados; informe apenas os preços de mercado (R$/t).');
}

function novaAnalise() {
  limparCampos();
  definirModo('outro', '<b>Nova análise:</b> informe seus dados e selecione um ou mais ' +
    'corretivos. Pureza e preço são editáveis.');
}

montarCorretivos();
porId('exampleMode').addEventListener('click', carregarExemplo);
porId('customMode').addEventListener('click', novaAnalise);
porId('calc').addEventListener('click', calcular);
porId('clear').addEventListener('click', function () {
  limparCampos();
  definirModo('', 'Nenhum modo selecionado.');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
