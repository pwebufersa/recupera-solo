/* Regra de cálculo do RECUPERA-SOLO, sem acesso ao documento.
   A mesma regra da versão de origem, isolada para ser testada pelo Node e
   reaproveitada pela página. */

export const CORRETIVOS = [
  { nome: 'Gesso agrícola (CaSO₄·2H₂O)', pe: 86, c: 1.25, tipo: 'direto', purezaExemplo: 80 },
  { nome: 'Cloreto de cálcio (CaCl₂·2H₂O)', pe: 73, c: 1.10, tipo: 'direto' },
  { nome: 'Enxofre elementar (S)', pe: 16, c: 1.25, tipo: 'acido', purezaExemplo: 95 },
  { nome: 'Ácido sulfúrico (H₂SO₄)', pe: 49, c: 1.10, tipo: 'acido' },
  { nome: 'Sulfato de ferro (FeSO₄·7H₂O)', pe: 139, c: 1.10, tipo: 'acido' },
  { nome: 'Sulfato de alumínio (Al₂(SO₄)₃·18H₂O)', pe: 111, c: 1.10, tipo: 'acido' },
  { nome: 'Calcário (CaCO₃)', pe: 50, c: 1.25, tipo: 'baixa' },
  { nome: 'Resíduo de engenho', pe: 20, c: 1.25, tipo: 'baixa' }
];

export const CAMPOS = ['ph', 'ce', 'ctc', 'na', 'caco3', 'ds', 'h', 'pstf', 'area'];

export const NOMES = {
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

export const ROTULOS_TABELA = [
  'Corretivo', 'Adequação', 'Dose teórica', 'Dose prática',
  'Dose comercial', 'Custo/ha', 'Custo total'
];

export function classificar(pst, ce) {
  const sodico = pst >= 15;
  const salino = ce >= 4;
  if (sodico) {
    return salino ? 'salino-sódico' : 'sódico';
  }
  return salino ? 'salino' : 'não sódico pelos critérios informados';
}

export function adequacao(corretivo, ph, caco3) {
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
export function calcularDoses(dados, selecionados) {
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
