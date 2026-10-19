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

  return {
    pstInicial: pstInicial,
    delta: delta,
    classe: classe,
    linhas: linhas,
    melhor: candidatos[0] || null
  };
}

// 3. Leitura da tela

/** Devolve o elemento da página com o identificador informado. */
function elemento(id) {
  return document.getElementById(id);
}

/** Lê um campo numérico, aceitando vírgula como separador decimal. */
function valorDoCampo(id) {
  const campo = elemento(id);
  if (!campo) {
    return NaN;
  }
  const texto = campo.value.trim().replace(',', '.');
  return texto === '' ? NaN : Number(texto);
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
  });
  const resumo = elemento('legenda-erros');
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

function mostrarResumoDeErros(mensagens) {
  const resumo = elemento('legenda-erros');
  resumo.innerHTML = '<strong>' + (mensagens.length === 1
    ? 'Um campo precisa de atenção.'
    : mensagens.length + ' campos precisam de atenção.') + '</strong><ul>' +
    mensagens.map(function (item) {
      return '<li><a href="#' + item.campo.id + '">' + item.mensagem + '</a></li>';
    }).join('') + '</ul>';
  resumo.classList.remove('oculto');
  mensagens[0].campo.focus();
}

/** Confere todos os campos e devolve falso quando há erro. */
function validar() {
  limparErros();
  const mensagens = [];
  CAMPOS.forEach(function (id) {
    const campo = elemento(id);
    if (!Number.isFinite(valorDoCampo(id))) {
      registrarErro(campo, 'Informe ' + NOMES[id] + '.', mensagens);
    }
  });

  const limites = { ph: [0, 14], ce: [0, 50], pstf: [0, 100] };
  Object.keys(limites).forEach(function (id) {
    const campo = elemento(id);
    if (campo.hasAttribute('aria-invalid')) {
      return;
    }
    const valor = valorDoCampo(id);
    if (valor < limites[id][0] || valor > limites[id][1]) {
      registrarErro(campo, NOMES[id] + ' deve ficar entre ' + limites[id][0] +
        ' e ' + limites[id][1] + '.', mensagens);
    }
  });

  ['ctc', 'ds', 'h', 'area'].forEach(function (id) {
    const campo = elemento(id);
    if (!campo.hasAttribute('aria-invalid') && valorDoCampo(id) <= 0) {
      registrarErro(campo, NOMES[id] + ' deve ser maior que zero.', mensagens);
    }
  });

  if (!elemento('na').hasAttribute('aria-invalid') &&
      !elemento('ctc').hasAttribute('aria-invalid') &&
      valorDoCampo('na') > valorDoCampo('ctc')) {
    registrarErro(elemento('na'), 'O Na⁺ trocável não pode ser maior que a CTC.', mensagens);
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
    const pureza = valorDoCampo('purity' + indice);
    const preco = valorDoCampo('price' + indice);
    if (Number.isFinite(pureza) && (pureza <= 0 || pureza > 100)) {
      registrarErro(elemento('purity' + indice), 'A pureza deve ficar entre 0 e 100.', mensagens);
    }
    if (Number.isFinite(preco) && preco <= 0) {
      registrarErro(elemento('price' + indice), 'O preço deve ser maior que zero.', mensagens);
    }
  });

  if (mensagens.length > 0) {
    mostrarResumoDeErros(mensagens);
    return false;
  }
  return true;
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
      '<label for="purity' + indice + '">Pureza (%)' +
      '<input id="purity' + indice + '" type="number" inputmode="decimal" step="0.1" placeholder="Informe"></label>' +
      '<label for="price' + indice + '">Preço (R$/t)' +
      '<input id="price' + indice + '" type="number" inputmode="decimal" step="0.01" placeholder="Informe"></label>' +
      '</div></article>';
  }).join('');
}

// 6. Cálculo na tela

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

  elemento('best').innerHTML = melhor
    ? '<strong>Menor custo entre as alternativas tecnicamente adequadas:</strong> ' +
      melhor.nome + ', <b>' + formatarDinheiro(melhor.custo) + '/ha</b> (' +
      formatarDinheiro(melhor.total) + ' para ' + formatarNumero(dados.area) + ' ha).'
    : 'Informe pureza e preço dos corretivos selecionados para realizar a comparação econômica.';

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
  limparErros();
}

function definirModo(botao, texto) {
  elemento('exampleMode').setAttribute('aria-pressed', String(botao === 'exemplo'));
  elemento('customMode').setAttribute('aria-pressed', String(botao === 'outro'));
  elemento('modeNote').innerHTML = texto;
}

function carregarExemplo() {
  limparCampos();
  const valores = { ph: 9.2, ce: 2.4, ctc: 8.6, na: 7, caco3: 1.5, ds: 1.4, h: 60, pstf: 10, area: 1 };
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
  definirModo('exemplo', '<b>Modo exemplo:</b> dados do exercício carregados. ');
}

function novaAnalise() {
  limparCampos();
  definirModo('outro', '<b>Nova análise:</b> informe seus dados e selecione um ou mais ' +
    'corretivos. Pureza e preço são editáveis.');
}

// 8. Início

function iniciarPagina() {
  montarCorretivos();
  elemento('exampleMode').addEventListener('click', carregarExemplo);
  elemento('customMode').addEventListener('click', novaAnalise);
  elemento('calc').addEventListener('click', calcular);
  elemento('clear').addEventListener('click', function () {
    limparCampos();
    definirModo('', 'Nenhum modo selecionado.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* A API abaixo serve aos testes de cálculo e ao console do navegador. */
globalThis.RecuperaSolo = {
  CORRETIVOS: CORRETIVOS,
  CAMPOS: CAMPOS,
  NOMES: NOMES,
  ROTULOS_TABELA: ROTULOS_TABELA,
  classificar: classificar,
  adequacao: adequacao,
  calcularDoses: calcularDoses
};

if (typeof document !== 'undefined') {
  iniciarPagina();
}
