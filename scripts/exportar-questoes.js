#!/usr/bin/env node
// =====================================================================
// Exporta as questões das aulas para um arquivo de texto (para preparar as apostilas).
// O arquivo é só para uso pessoal: NÃO suba para o GitHub (o repositório é público).
//
//   node scripts/exportar-questoes.js --de 2026-11-19 --ate 2026-11-25 > questoes-semana1.txt
//
// Opções: --edital analista|assistente (padrão: os dois) · --max 30 (questões por aula;
// as 20 da aula vêm primeiro, depois as do banco do tema)
// =====================================================================
require("../load-env");
const db = require("../db");
const Plans = require("../public/js/plans.js");

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i < 0 ? d : args[i + 1]; };
const DE = opt("de", "2026-11-19"), ATE = opt("ate", "2026-11-25");
const EDS = opt("edital", null) ? [opt("edital")] : ["analista", "assistente"];
const MAX = parseInt(opt("max", "30"), 10);

const ent = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", nbsp: " " };
const txt = h => String(h || "")
  .replace(/<code class="formula">([\s\S]*?)<\/code>/g, " [$1] ")
  .replace(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi, (m, c) => c.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() + " | ")
  .replace(/<\/(p|li|tr|div|h\d)>|<br\s*\/?>/gi, "\n").replace(/<\/t[dh]>/gi, " | ")
  .replace(/<img[^>]*>/gi, "[imagem]").replace(/<[^>]+>/g, "")
  .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (_, e) => ent[e])
  .replace(/[ \t ]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();

const out = [];
const seen = new Set();
for (const ed of EDS) {
  const lab = Plans.EDITAIS[ed].labels;
  for (const d of Plans.build(ed).filter(x => x.key >= DE && x.key <= ATE)) {
    out.push(`\n${"=".repeat(78)}\n${ed.toUpperCase()} · ${d.key} · ${lab[d.m]}${d.a ? " · " + d.a : ""}\n${d.t}`);
    if (d.sub.length) out.push(`Subtópicos: ${d.sub.map(s => s.n).join(" ; ")}`);
    const all = db.prepare(`SELECT q.*, d.pos FROM bank_day d JOIN bank_questions q ON q.id = d.question_id
      WHERE d.edital = ? AND d.day_key = ? ORDER BY d.pos`).all(ed, d.key);
    if (!all.length) { out.push("(sem questões)"); continue; }
    // distribuição de assuntos no banco inteiro do tema
    const dist = {};
    for (const q of all) { const k = [q.materia, q.assunto].filter(Boolean).join(" > "); dist[k] = (dist[k] || 0) + 1; }
    out.push(`Banco do tema: ${all.length} questões · ` + Object.entries(dist).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, n]) => `${k} (${n})`).join(" · "));
    for (const q of all.slice(0, MAX)) {
      if (seen.has(q.id)) { out.push(`\n#${q.id} (já listada acima)`); continue; }
      seen.add(q.id);
      const alts = JSON.parse(q.alternativas).map(a => `${a.letra}) ${txt(a.texto).replace(/\n/g, " ")}`).join("\n");
      const textos = JSON.parse(q.textos).map(t => txt(t)).filter(Boolean).map(t => t.length > 900 ? t.slice(0, 900) + " […]" : t);
      out.push(`\n#${q.id} ${q.pos < 20 ? "[AULA]" : "[banco]"} ${[q.banca, q.orgao, q.ano].filter(Boolean).join(" · ")} · ${q.cargo || ""}`);
      if (textos.length) out.push(`TEXTO: ${textos.join("\n---\n")}`);
      out.push(txt(q.enunciado));
      out.push(alts);
      out.push(`Gabarito: ${q.gabarito}`);
    }
  }
}
console.log(out.join("\n"));
