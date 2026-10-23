/* RECUPERA-SOLO, cálculo e tela no mesmo arquivo, como na versão de origem.
   O arquivo é dividido em oito partes, na ordem em que são usadas:
   1. dados do sistema; 2. regras de cálculo; 3. leitura da tela;
   4. validação; 5. montagem da página; 6. cálculo na tela;
   7. ações dos botões; 8. início.
   Nenhuma biblioteca é necessária. O início só ocorre quando existe documento,
   o que permite carregar o arquivo no Node para os testes. */

// 1. Dados do sistema

const CORRETIVOS = [
  { nome: 'Gesso agrícola (CaSO₄·2H₂O)', pe: 86, c: 1.25, tipo: 'direto', purezaExemplo: 80, precoExemplo: 425 },
  { nome: 'Cloreto de cálcio (CaCl₂·2H₂O)', pe: 73, c: 1.10, tipo: 'direto' },
  { nome: 'Enxofre elementar (S)', pe: 16, c: 1.25, tipo: 'acido', purezaExemplo: 95, precoExemplo: 6200 },
  { nome: 'Ácido sulfúrico (H₂SO₄)', pe: 49, c: 1.10, tipo: 'acido' },
  { nome: 'Sulfato de ferro (FeSO₄·7H₂O)', pe: 139, c: 1.10, tipo: 'acido' },
  { nome: 'Sulfato de alumínio (Al₂(SO₄)₃·18H₂O)', pe: 111, c: 1.10, tipo: 'acido' },
  { nome: 'Calcário (CaCO₃)', pe: 50, c: 1.25, tipo: 'baixa' },
  { nome: 'Resíduo de engenho', pe: 20, c: 1.25, tipo: 'baixa' }
];

const CAMPOS = ['ph', 'ce', 'ctc', 'na', 'caco3', 'ds', 'h', 'pstf', 'area'];

const NOMES = {
  ph: 'pH (H₂O)',
  ce: 'CEes (dS m⁻¹)',
  ctc: 'CTC (cmolc kg⁻¹)',
  na: 'Na⁺ trocável',
  caco3: 'CaCO₃ (%)',
  ds: 'Densidade do solo',
  h: 'Profundidade',
  pstf: 'PST final',
  area: 'Área'
};

const ROTULOS_TABELA = [
  'Corretivo', 'Adequação', 'Dose teórica', 'Dose prática',
  'Dose comercial', 'Custo/ha', 'Custo total'
];

/* Faixas usuais de cada campo, usadas na validação e nas dicas da tela.
   Os limites são de sanidade, não de recomendação agronômica: valores fora
   deles indicam erro de digitação ou de unidade. */
const CAMPOS_ESPEC = {
  ph: { rotulo: 'pH (H₂O)', min: 0, max: 14, decimais: 1, dica: '0 a 14 · ex.: 9,2' },
  ce: { rotulo: 'CEes', min: 0, max: 50, decimais: 1, dica: '0 a 50 dS m⁻¹ · ex.: 2,4' },
  ctc: { rotulo: 'CTC', min: 0.1, max: 100, decimais: 1, dica: '0,1 a 100 cmolc kg⁻¹ · ex.: 8,6' },
  na: { rotulo: 'Na⁺ trocável', min: 0, max: 100, decimais: 1, dica: 'até a CTC · ex.: 7,0' },
  caco3: { rotulo: 'CaCO₃', min: 0, max: 100, decimais: 1, dica: '0 a 100% · ex.: 1,5' },
  ds: { rotulo: 'Densidade do solo', min: 0.1, max: 3, decimais: 2, dica: '0,10 a 3,00 g cm⁻³ · ex.: 1,40' },
  h: { rotulo: 'Profundidade', min: 1, max: 300, decimais: 0, dica: '1 a 300 cm, inteiro · ex.: 60' },
  pstf: { rotulo: 'PST final desejada', min: 0, max: 100, decimais: 1, dica: '0 a 100% · ex.: 10' },
  area: { rotulo: 'Área', min: 0.01, max: 10000, decimais: 2, dica: '0,01 a 10.000 ha · ex.: 1,0' }
};

const ESPEC_PUREZA = { rotulo: 'Pureza', min: 0.1, max: 100, decimais: 1, dica: '0,1 a 100%' };
const ESPEC_PRECO = { rotulo: 'Preço', min: 0.01, max: 1000000, decimais: 2, dica: 'R$/t, maior que zero' };

// 2. Regras de cálculo

/** Classifica o solo pela saturação por sódio e pela condutividade elétrica. */
function classificar(pst, ce) {
  const sodico = pst >= 15;
  const salino = ce >= 4;
  if (sodico) {
    return salino ? 'salino-sódico' : 'sódico';
  }
  return salino ? 'salino' : 'não sódico pelos critérios informados';
}

/** Diz se o corretivo é adequado ao pH e à presença de carbonatos. */
function adequacao(corretivo, ph, caco3) {
  if (corretivo.tipo === 'direto') {
    return {
      rotulo: 'Potencialmente adequado',
      ok: true,
      nota: 'Fornece Ca²⁺ diretamente para substituir Na⁺ no complexo de troca.'
    };
  }
  if (corretivo.tipo === 'acido') {
    if (caco3 > 0) {
      return {
        rotulo: 'Adequado com carbonatos',
        ok: true,
        nota: 'A acidez gerada favorece a dissolução de carbonatos e a disponibilização de Ca²⁺.'
      };
    }
    return {
      rotulo: 'Uso com cautela',
      ok: false,
      nota: 'Sem carbonatos alcalino-terrosos, requer avaliação específica devido ao risco de acidificação.'
    };
  }
  if (ph < 7.5 && caco3 <= 0) {
    return {
      rotulo: 'Pode ser considerado',
      ok: true,
      nota: 'Fonte de Ca de baixa solubilidade, mais indicada em condições específicas de pH e ausência de carbonatos.'
    };
  }
  return {
    rotulo: 'Baixa prioridade',
    ok: false,
    nota: 'A baixa solubilidade limita sua eficiência nas condições informadas.'
  };
}

/**
 * Calcula a dose e o custo de cada corretivo selecionado.
 *
 * Exemplo de uso:
 *   calcularDoses({ ph: 9.2, ce: 2.4, ctc: 8.6, na: 7, caco3: 1.5,
 *                   ds: 1.4, h: 60, pstf: 10, area: 1 },
 *                 [{ corretivo: CORRETIVOS[0], pureza: 80, preco: 425 }]);
 */
function calcularDoses(dados, selecionados) {
  const pstInicial = (dados.na / dados.ctc) * 100;
  const delta = Math.max(0, pstInicial - dados.pstf);
  const classe = classificar(pstInicial, dados.ce);
  const linhas = [];
  const candidatos = [];

  selecionados.forEach(function (item) {
    const corretivo = item.corretivo;
    const ajuste = adequacao(corretivo, dados.ph, dados.caco3);
    const doseTeorica = (delta * dados.ctc * corretivo.pe * dados.h * dados.ds) / 100;
    const dosePratica = doseTeorica * corretivo.c;
    const doseComercial = item.pureza > 0 ? dosePratica / (item.pureza / 100) : NaN;
    const custo = Number.isFinite(doseComercial) ? (doseComercial / 1000) * item.preco : NaN;
    const total = Number.isFinite(custo) ? custo * dados.area : NaN;

    if (ajuste.ok && Number.isFinite(custo)) {
      candidatos.push({ nome: corretivo.nome, custo: custo, total: total });
    }

    linhas.push({
      nome: corretivo.nome,
      ajuste: ajuste,
      doseTeorica: doseTeorica,
      dosePratica: dosePratica,
      doseComercial: doseComercial,
      custo: custo,
      total: total
    });
  });

  candidatos.sort(function (a, b) {
    return a.custo - b.custo;
  });

  // A comparação de custo só vale quando todos os corretivos selecionados têm
  // pureza e preço. Com apenas um preço, o escolhido seria sempre ele.
  const comparacaoCompleta = linhas.length > 0 && linhas.every(function (linha) {
    return Number.isFinite(linha.custo);
  });

  return {
    pstInicial: pstInicial,
    delta: delta,
    classe: classe,
    linhas: linhas,
    comparacaoCompleta: comparacaoCompleta,
    melhor: comparacaoCompleta ? (candidatos[0] || null) : null
  };
}

// 3. Leitura da tela

/** Devolve o elemento da página com o identificador informado. */
function elemento(id) {
  return document.getElementById(id);
}

/** Converte texto em número, aceitando vírgula ou ponto como decimal.
 *  Devolve NaN quando há letra, sinal negativo, mais de um separador ou
 *  separador sem dígitos dos dois lados. */
function normalizarNumero(texto) {
  if (typeof texto !== 'string') {
    return NaN;
  }
  const limpo = texto.trim().replace(/\s+/g, '');
  if (limpo === '' || limpo === '-' || limpo === '+' || limpo === ',' || limpo === '.') {
    return NaN;
  }
  const partes = /^(\d+)(?:[.,](\d+))?$/.exec(limpo);
  if (!partes) {
    return NaN;
  }
  return partes[2] === undefined ? Number(partes[1]) : Number(partes[1] + '.' + partes[2]);
}

/** Conta as casas decimais digitadas, para conferir a precisão do campo. */
function casasDecimais(texto) {
  const partes = String(texto).trim().replace(/\s+/g, '').split(/[.,]/);
  return partes.length === 2 ? partes[1].length : 0;
}

/** Lê um campo numérico, aceitando vírgula como separador decimal. */
function valorDoCampo(id) {
  const campo = elemento(id);
  if (!campo) {
    return NaN;
  }
  return normalizarNumero(campo.value);
}

function formatarNumero(valor, casas) {
  const quantidade = casas === undefined ? 2 : casas;
  return Number(valor).toLocaleString('pt-BR', {
    minimumFractionDigits: quantidade,
    maximumFractionDigits: quantidade
  });
}

function formatarDinheiro(valor) {
  return 'R$ ' + formatarNumero(valor, 2);
}

// 4. Validação dos campos

function limparErros() {
  document.querySelectorAll('.erro-campo').forEach(function (marca) {
    marca.remove();
  });
  document.querySelectorAll('[aria-invalid="true"]').forEach(function (campo) {
    campo.removeAttribute('aria-invalid');
    campo.removeAttribute('aria-errormessage');
  });
  const resumo = elemento('legenda-erros');
  resumo.classList.add('oculto');
  resumo.innerHTML = '';
}

/** Mostra a mensagem de um campo e registra no resumo. */
function registrarErro(campo, mensagem, mensagens) {
  const lista = mensagens || [];
  campo.setAttribute('aria-invalid', 'true');
  campo.setAttribute('aria-errormessage', campo.id + '-erro');
  const marca = document.createElement('span');
  marca.className = 'erro-campo';
  marca.id = campo.id + '-erro';
  marca.textContent = mensagem;
  const caixa = campo.closest('.campo-caixa');
  (caixa || campo).insertAdjacentElement('afterend', marca);
  lista.push({ campo: campo, mensagem: mensagem });
  return lista;
}

/** Remove a mensagem de um campo assim que ele é corrigido. */
function limparErroDoCampo(campo) {
  campo.removeAttribute('aria-invalid');
  campo.removeAttribute('aria-errormessage');
  const marca = document.getElementById(campo.id + '-erro');
  if (marca) {
    marca.remove();
  }
  const resumo = elemento('legenda-erros');
  if (resumo) {
    resumo.classList.add('oculto');
    resumo.innerHTML = '';
  }
}

/** Texto padrão de faixa, usado na validação e na digitação. */
function mensagemFaixa(espec) {
  return espec.rotulo + ' deve ficar entre ' + formatarNumero(espec.min, espec.decimais) +
    ' e ' + formatarNumero(espec.max, espec.decimais) + '.';
}

/** Avisa enquanto se digita, sem interromper valor ainda incompleto. */
function conferirAoVivo(campo, espec) {
  const texto = campo.value.trim();
  if (texto === '') {
    limparErroDoCampo(campo);
    return;
  }

  const valor = normalizarNumero(texto);
  if (!Number.isFinite(valor)) {
    return;
  }

  if (casasDecimais(texto) > espec.decimais) {
    if (!campo.hasAttribute('aria-invalid')) {
      registrarErro(campo, espec.rotulo + ': no máximo ' + espec.decimais +
        (espec.decimais === 1 ? ' casa decimal.' : ' casas decimais.'), []);
    }
    return;
  }

  if (valor < espec.min || valor > espec.max) {
    if (!campo.hasAttribute('aria-invalid')) {
      registrarErro(campo, mensagemFaixa(espec), []);
    }
    return;
  }

  limparErroDoCampo(campo);
}

/** Confere um campo contra a especificação e devolve verdadeiro quando passa. */
function conferirCampo(campo, espec, mensagens) {
  const texto = campo.value.trim();

  if (texto === '') {
    registrarErro(campo, 'Informe ' + espec.rotulo + '.', mensagens);
    return false;
  }

  const valor = normalizarNumero(texto);
  if (!Number.isFinite(valor)) {
    registrarErro(campo, espec.rotulo + ': use apenas números, com vírgula para os decimais.', mensagens);
    return false;
  }

  if (casasDecimais(texto) > espec.decimais) {
    registrarErro(campo, espec.rotulo + ': no máximo ' + espec.decimais +
      (espec.decimais === 1 ? ' casa decimal.' : ' casas decimais.'), mensagens);
    return false;
  }

  if (valor < espec.min || valor > espec.max) {
    registrarErro(campo, mensagemFaixa(espec), mensagens);
    return false;
  }

  return true;
}

/** Confere todos os campos e devolve falso quando há erro. */
function validar() {
  limparErros();
  const mensagens = [];

  CAMPOS.forEach(function (id) {
    conferirCampo(elemento(id), CAMPOS_ESPEC[id], mensagens);
  });

  if (mensagens.length === 0) {
    const na = valorDoCampo('na');
    const ctc = valorDoCampo('ctc');
    if (na > ctc) {
      registrarErro(elemento('na'), 'O Na⁺ trocável não pode ser maior que a CTC (' +
        formatarNumero(ctc, 1) + ').', mensagens);
    }
  }

  const escolhidos = CORRETIVOS.filter(function (_, indice) {
    return elemento('use' + indice).checked;
  });
  if (escolhidos.length === 0) {
    registrarErro(elemento('amendGrid'), 'Selecione pelo menos um corretivo.', mensagens);
  }

  CORRETIVOS.forEach(function (_, indice) {
    if (!elemento('use' + indice).checked) {
      return;
    }
    conferirCampo(elemento('purity' + indice), ESPEC_PUREZA, mensagens);
    const preco = elemento('price' + indice);
    if (preco.value.trim() !== '') {
      conferirCampo(preco, ESPEC_PRECO, mensagens);
    }
  });

  if (mensagens.length > 0) {
    mostrarResumoDeErros(mensagens);
    return false;
  }
  return true;
}

function mostrarResumoDeErros(mensagens) {
  const resumo = elemento('legenda-erros');
  resumo.innerHTML = '<strong>' + (mensagens.length === 1
    ? 'Um campo precisa de atenção.'
    : mensagens.length + ' campos precisam de atenção.') + '</strong><ul>' +
    mensagens.map(function (item) {
      return '<li><a href="#' + item.campo.id + '">' + item.mensagem + '</a></li>';
    }).join('') + '</ul>';
  resumo.classList.remove('oculto');
  mensagens[0].campo.focus({ preventScroll: true });
  mensagens[0].campo.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/** Confere todos os campos e devolve falso quando há erro. */
// 4b. Digitação e colagem nos campos numéricos

const CARACTERES_INVALIDOS = /[^0-9.,]/;

/** Impede letras e símbolos, limpa colagem e apaga o erro ao corrigir. */
function prepararCampoNumerico(campo, espec) {
  if (!campo) {
    return;
  }

  campo.addEventListener('beforeinput', function (evento) {
    if (evento.data && CARACTERES_INVALIDOS.test(evento.data)) {
      evento.preventDefault();
    }
  });

  campo.addEventListener('paste', function (evento) {
    const area = evento.clipboardData || window.clipboardData;
    if (!area) {
      return;
    }
    const bruto = area.getData('text').trim();
    if (bruto === '' || /^\d+([.,]\d+)?$/.test(bruto)) {
      return;
    }
    evento.preventDefault();
    registrarErro(campo, 'Cole apenas números, sem letras nem sinais.', []);
  });

  campo.addEventListener('input', function () {
    if (espec) {
      conferirAoVivo(campo, espec);
    } else {
      limparErroDoCampo(campo);
    }
  });

  campo.addEventListener('blur', function () {
    if (espec && campo.value.trim() !== '') {
      conferirAoVivo(campo, espec);
    }
  });
}

// 5. Montagem da página

/** Cria um cartão para cada corretivo, com pureza e preço. */
function montarCorretivos() {
  const grade = elemento('amendGrid');
  grade.innerHTML = CORRETIVOS.map(function (corretivo, indice) {
    return '<article class="corretivo">' +
      '<div class="corretivo-topo">' +
      '<input id="use' + indice + '" type="checkbox" aria-describedby="dados' + indice + '">' +
      '<div><label for="use' + indice + '"><h3>' + corretivo.nome + '</h3></label>' +
      '<small id="dados' + indice + '">PE = ' + corretivo.pe + ' · C = ' +
      String(corretivo.c).replace('.', ',') + '</small></div>' +
      '</div>' +
      '<div class="dupla">' +
      '<div class="campo"><div class="campo-caixa">' +
      '<svg class="campo-icone" aria-hidden="true" focusable="false"><use href="#i-pureza"/></svg>' +
      '<input id="purity' + indice + '" type="text" inputmode="decimal" autocomplete="off" ' +
      'placeholder=" " aria-describedby="pureza-dica' + indice + '">' +
      '<label for="purity' + indice + '">Pureza (%)</label></div>' +
      '<small class="dica" id="pureza-dica' + indice + '">' + ESPEC_PUREZA.dica + '</small></div>' +
      '<div class="campo"><div class="campo-caixa">' +
      '<svg class="campo-icone" aria-hidden="true" focusable="false"><use href="#i-preco"/></svg>' +
      '<input id="price' + indice + '" type="text" inputmode="decimal" autocomplete="off" ' +
      'placeholder=" " aria-describedby="preco-dica' + indice + '">' +
      '<label for="price' + indice + '">Preço (R$/t)</label></div>' +
      '<small class="dica" id="preco-dica' + indice + '">' + ESPEC_PRECO.dica + '</small></div>' +
      '</div></article>';
  }).join('');
}

// 6. Cálculo na tela

let ultimoCalculo = null;

function dadosDoFormulario() {
  return {
    ph: valorDoCampo('ph'),
    ce: valorDoCampo('ce'),
    ctc: valorDoCampo('ctc'),
    na: valorDoCampo('na'),
    caco3: valorDoCampo('caco3'),
    ds: valorDoCampo('ds'),
    h: valorDoCampo('h'),
    pstf: valorDoCampo('pstf'),
    area: valorDoCampo('area')
  };
}

/** Reúne os corretivos marcados, com a pureza e o preço informados. */
function corretivosSelecionados() {
  const escolhidos = [];
  CORRETIVOS.forEach(function (corretivo, indice) {
    if (!elemento('use' + indice).checked) {
      return;
    }
    escolhidos.push({
      corretivo: corretivo,
      pureza: valorDoCampo('purity' + indice),
      preco: valorDoCampo('price' + indice)
    });
  });
  return escolhidos;
}

/** Calcula, desenha o diagnóstico, a tabela, a recomendação e o procedimento. */
function calcular() {
  if (!validar()) {
    return;
  }

  const dados = dadosDoFormulario();
  const resultado = calcularDoses(dados, corretivosSelecionados());

  elemento('diagnosis').innerHTML =
    '<div class="metrica"><b>' + formatarNumero(resultado.pstInicial) + '%</b>' +
    '<span>PST inicial calculada</span></div>' +
    '<p><b>Classificação:</b> ' + resultado.classe + '.</p>' +
    '<p><b>Meta:</b> PST ' + formatarNumero(dados.pstf) + '% na camada de ' +
    formatarNumero(dados.h, 0) + ' cm.</p>';

  const corpo = elemento('out').querySelector('tbody');
  corpo.innerHTML = '';
  resultado.linhas.forEach(function (linha) {
    const celulas = [
      '<b>' + linha.nome + '</b>',
      '<span class="' + (linha.ajuste.ok ? 'bom' : 'atencao') + '">' + linha.ajuste.rotulo + '</span>',
      formatarNumero(linha.doseTeorica) + ' kg/ha',
      formatarNumero(linha.dosePratica) + ' kg/ha',
      Number.isFinite(linha.doseComercial) ? formatarNumero(linha.doseComercial) + ' kg/ha' : 'Informe a pureza',
      Number.isFinite(linha.custo) ? formatarDinheiro(linha.custo) : 'Informe o preço',
      Number.isFinite(linha.total) ? formatarDinheiro(linha.total) : 'Sem valor'
    ];
    corpo.insertAdjacentHTML('beforeend', '<tr>' + celulas.map(function (celula, coluna) {
      return '<td data-rotulo="' + ROTULOS_TABELA[coluna] + '">' + celula + '</td>';
    }).join('') + '</tr>');
  });

  const melhor = resultado.melhor;

  if (melhor) {
    elemento('best').innerHTML =
      '<strong>Menor custo entre as alternativas tecnicamente adequadas:</strong> ' +
      melhor.nome + ', <b>' + formatarDinheiro(melhor.custo) + '/ha</b> (' +
      formatarDinheiro(melhor.total) + ' para ' + formatarNumero(dados.area) + ' ha).';
  } else if (!resultado.comparacaoCompleta) {
    elemento('best').innerHTML = resultado.linhas.length > 1
      ? 'Para comparar custos, informe a pureza e o preço de todos os corretivos selecionados.'
      : 'Informe a pureza e o preço do corretivo selecionado para calcular o custo.';
  } else {
    elemento('best').innerHTML =
      'Nenhum dos corretivos selecionados foi classificado como tecnicamente adequado.';
  }

  elemento('recommendation').innerHTML = corretivosSelecionados().map(function (item) {
    return '<p><b>' + item.corretivo.nome + ':</b> ' +
      adequacao(item.corretivo, dados.ph, dados.caco3).nota + '</p>';
  }).join('');

  const escolhido = melhor ? melhor.nome : 'o corretivo tecnicamente selecionado';
  elemento('procedure').innerHTML = '<ol>' +
    '<li>Confirmar a análise do solo, a profundidade efetiva e a condição de drenagem.</li>' +
    '<li>Aplicar <b>' + escolhido + '</b> conforme a dose comercial calculada e a forma tecnicamente recomendada.</li>' +
    '<li>Promover a substituição do Na⁺ trocável por Ca²⁺.</li>' +
    '<li>Realizar lixiviação do Na⁺ deslocado com água adequada.</li>' +
    '<li>Garantir drenagem para retirada da solução salina da zona radicular.</li>' +
    '<li>Monitorar PST, CEes, pH e propriedades físicas do solo.</li>' +
    '</ol>';

  const resultados = elemento('results');
  resultados.classList.remove('oculto');
  const titulo = elemento('titulo-resultados');
  titulo.setAttribute('tabindex', '-1');
  titulo.focus({ preventScroll: true });
  resultados.scrollIntoView({ behavior: 'smooth', block: 'start' });

  ultimoCalculo = { dados: dados, resultado: resultado };
  const melhorTexto = resultado.melhor
    ? ' Menor custo: ' + resultado.melhor.nome + ', ' +
      formatarDinheiro(resultado.melhor.custo) + ' por hectare.'
    : '';
  anunciar('Diagnóstico gerado. PST inicial de ' +
    formatarNumero(resultado.pstInicial) + '%.' + melhorTexto);
  elemento('ir-resultados').hidden = false;
}

// 7. Ações dos botões

function limparCampos() {
  CAMPOS.forEach(function (id) {
    elemento(id).value = '';
  });
  ['texture', 'drain', 'water'].forEach(function (id) {
    elemento(id).selectedIndex = 0;
  });
  CORRETIVOS.forEach(function (_, indice) {
    elemento('purity' + indice).value = '';
    elemento('price' + indice).value = '';
    elemento('use' + indice).checked = false;
  });
  elemento('results').classList.add('oculto');
  ultimoCalculo = null;
  const atalho = elemento('ir-resultados');
  if (atalho) {
    atalho.hidden = true;
  }
  limparErros();
}

function definirModo(botao, texto) {
  elemento('exampleMode').setAttribute('aria-pressed', String(botao === 'exemplo'));
  elemento('customMode').setAttribute('aria-pressed', String(botao === 'outro'));
  elemento('modeNote').innerHTML = texto;
}

function carregarExemplo() {
  limparCampos();
  const valores = { ph: '9,2', ce: '2,4', ctc: '8,6', na: '7,0', caco3: '1,5', ds: '1,40', h: '60', pstf: '10', area: '1,0' };
  Object.keys(valores).forEach(function (id) {
    elemento(id).value = valores[id];
  });
  elemento('texture').value = 'Média';
  elemento('drain').value = 'Adequada';
  elemento('water').value = 'Baixa salinidade';
  CORRETIVOS.forEach(function (corretivo, indice) {
    if (corretivo.purezaExemplo === undefined) {
      return;
    }
    elemento('purity' + indice).value = corretivo.purezaExemplo;
    elemento('price' + indice).value = corretivo.precoExemplo;
    elemento('use' + indice).checked = true;
  });
  definirModo('exemplo', '<b>Modo exemplo:</b> dados de exemplo carregados. ');
}

function novaAnalise() {
  limparCampos();
  definirModo('outro', '<b>Nova análise:</b> informe seus dados e selecione um ou mais ' +
    'corretivos. Pureza e preço são editáveis.');
}


// 7b. Limpeza com confirmação, compartilhamento e anúncio

/** Anuncia uma mensagem curta na região viva da página. */
function anunciar(texto) {
  const alvo = elemento('anuncio');
  if (alvo) {
    alvo.textContent = texto;
  }
}

/** Diz se há dados suficientes para justificar a confirmação de limpeza. */
function temDados() {
  const campos = CAMPOS.some(function (id) {
    return elemento(id).value.trim() !== '';
  });
  const corretivos = CORRETIVOS.some(function (_, indice) {
    return elemento('use' + indice).checked;
  });
  return campos || corretivos;
}

function confirmarLimpeza() {
  limparCampos();
  definirModo('', 'Nenhum modo selecionado.');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/** Pede confirmação antes de apagar uma análise preenchida. */
function pedirLimpeza() {
  if (!temDados()) {
    confirmarLimpeza();
    return;
  }

  const dialogo = elemento('dialogo-limpeza');
  if (dialogo && typeof dialogo.showModal === 'function') {
    dialogo.showModal();
    return;
  }

  if (window.confirm('Limpar os dados preenchidos?')) {
    confirmarLimpeza();
  }
}

/** Resume o último cálculo em texto próprio para compartilhamento. */
function resumoCompartilhavel() {
  if (!ultimoCalculo) {
    return '';
  }

  const dados = ultimoCalculo.dados;
  const resultado = ultimoCalculo.resultado;
  const linhas = [
    'RECUPERA-SOLO',
    'PST inicial: ' + formatarNumero(resultado.pstInicial) + '% (' + resultado.classe + ')',
    'Meta: PST ' + formatarNumero(dados.pstf) + '% em ' + formatarNumero(dados.h, 0) + ' cm'
  ];

  if (resultado.melhor) {
    linhas.push('Menor custo: ' + resultado.melhor.nome + ', ' +
      formatarDinheiro(resultado.melhor.custo) + '/ha (' +
      formatarDinheiro(resultado.melhor.total) + ' para ' +
      formatarNumero(dados.area) + ' ha).');
  }

  return linhas.join(String.fromCharCode(10));
}

/** Compartilha pelo aplicativo nativo, pela Web Share API ou pela área de transferência. */
async function compartilharResumo() {
  const texto = resumoCompartilhavel();
  if (texto === '') {
    return;
  }

  const cap = window.Capacitor;
  try {
    if (cap && cap.Plugins && cap.Plugins.Share) {
      await cap.Plugins.Share.share({
        title: 'RECUPERA-SOLO',
        text: texto,
        dialogTitle: 'Compartilhar resumo'
      });
      return;
    }
    if (navigator.share) {
      await navigator.share({ title: 'RECUPERA-SOLO', text: texto });
      return;
    }
    await navigator.clipboard.writeText(texto);
    anunciar('Resumo copiado para a área de transferência.');
  } catch (erro) {
    anunciar('Não foi possível compartilhar o resumo.');
  }
}

/** Desenha a onda de toque dos botões, quando o movimento é permitido. */
function prepararOndas() {
  const semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');

  document.addEventListener('pointerdown', function (evento) {
    if (semMovimento.matches || !(evento.target instanceof Element)) {
      return;
    }
    const botao = evento.target.closest('button');
    if (!botao) {
      return;
    }
    const caixa = botao.getBoundingClientRect();
    const tamanho = Math.max(caixa.width, caixa.height) * 2;
    const onda = document.createElement('span');
    onda.className = 'onda';
    onda.style.width = tamanho + 'px';
    onda.style.height = tamanho + 'px';
    onda.style.left = (evento.clientX - caixa.left - tamanho / 2) + 'px';
    onda.style.top = (evento.clientY - caixa.top - tamanho / 2) + 'px';
    botao.appendChild(onda);
    onda.addEventListener('animationend', function () {
      onda.remove();
    });
  });
}

/** Ajusta a barra de status quando a página roda dentro do APK. */
async function prepararAplicativo() {
  const cap = window.Capacitor;
  if (!cap || typeof cap.isNativePlatform !== 'function' || !cap.isNativePlatform()) {
    return;
  }

  try {
    if (cap.Plugins.StatusBar) {
      await cap.Plugins.StatusBar.setStyle({ style: 'DARK' });
      await cap.Plugins.StatusBar.setBackgroundColor({ color: '#f3f7f5' });
    }
  } catch (erro) {}
}

// 8. Início

function iniciarPagina() {
  montarCorretivos();
  CAMPOS.forEach(function (id) {
    prepararCampoNumerico(elemento(id), CAMPOS_ESPEC[id]);
  });
  CORRETIVOS.forEach(function (_, indice) {
    prepararCampoNumerico(elemento('purity' + indice), ESPEC_PUREZA);
    prepararCampoNumerico(elemento('price' + indice), ESPEC_PRECO);
  });
  elemento('exampleMode').addEventListener('click', carregarExemplo);
  elemento('customMode').addEventListener('click', novaAnalise);
  elemento('formulario').addEventListener('submit', function (evento) {
    evento.preventDefault();
    calcular();
  });
  elemento('clear').addEventListener('click', pedirLimpeza);
  elemento('cancelar-limpeza').addEventListener('click', function () {
    elemento('dialogo-limpeza').close();
  });
  elemento('confirmar-limpeza').addEventListener('click', function () {
    elemento('dialogo-limpeza').close();
    confirmarLimpeza();
  });
  elemento('dialogo-limpeza').addEventListener('click', function (evento) {
    if (evento.target === this) {
      this.close();
    }
  });
  elemento('share').addEventListener('click', compartilharResumo);
  prepararOndas();
  prepararAplicativo();
}

/* A API abaixo serve aos testes de cálculo e ao console do navegador. */
globalThis.RecuperaSolo = {
  CORRETIVOS: CORRETIVOS,
  CAMPOS: CAMPOS,
  NOMES: NOMES,
  ROTULOS_TABELA: ROTULOS_TABELA,
  CAMPOS_ESPEC: CAMPOS_ESPEC,
  ESPEC_PUREZA: ESPEC_PUREZA,
  ESPEC_PRECO: ESPEC_PRECO,
  normalizarNumero: normalizarNumero,
  casasDecimais: casasDecimais,
  classificar: classificar,
  adequacao: adequacao,
  calcularDoses: calcularDoses
};

if (typeof document !== 'undefined') {
  iniciarPagina();
}

