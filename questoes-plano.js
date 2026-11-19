// =====================================================================
// Dias do cronograma que recebem questões + meta de questões de cada dia.
// Usado pelo importador (scripts/importar-questoes.js) e pelo remapeamento
// (scripts/remapear-questoes.js).
// =====================================================================
const Plans = require("./public/js/plans.js");
const MAP = require("./questoes-map");

// meta de questões por dia, por matéria (ING no Assistente = Raciocínio lógico).
// Inglês/RLM têm 4 aulas, por isso cada uma recebe mais questões.
const TARGET = {
  analista: { ESP: 60, POR: 150, NOR: 100, ING: 140 },
  assistente: { ESP: 60, POR: 150, NOR: 100, ING: 210 },
};

function dias(ed) {
  if (!MAP[ed]) throw new Error(`Edital desconhecido: ${ed}`);
  const plan = new Map(Plans.build(ed).map(d => [d.key, d]));
  return Object.entries(MAP[ed]).map(([key, v]) => {
    const day = plan.get(key), o = Array.isArray(v) ? { f: v } : v;
    if (!day) return null;
    return { ed, key, fontes: o.f, alvo: o.alvo || TARGET[ed][day.m] || 60, m: day.m, title: day.t };
  }).filter(Boolean).sort((a, b) => a.key.localeCompare(b.key));
}

module.exports = { TARGET, dias, EDITAIS: Object.keys(MAP) };
