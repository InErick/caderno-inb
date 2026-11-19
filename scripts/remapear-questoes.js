#!/usr/bin/env node
// =====================================================================
// Redistribui as questões que JÁ ESTÃO no banco pelos dias do cronograma
// atual (depois de mudar o cronograma ou o questoes-map.js). Não gasta créditos.
//
//   node scripts/remapear-questoes.js            → só mostra o que mudaria
//   node scripts/remapear-questoes.js --aplicar  → faz backup do banco e aplica
//
// Regras:
// - cada dia recebe as questões cujo matéria/assunto bate com o mapa do dia, até a meta
//   (questoes-plano.js), em ordem de data; quem já estava no dia tem prioridade, FGV primeiro
// - questões que alguém já respondeu nunca saem do banco do edital: vão para o dia do tema
//   delas (mesmo passando da meta) e o histórico de respostas acompanha
// - o que faltar para a meta o importador completa: npm run importar
// =====================================================================
require("../load-env");
const path = require("path");
const db = require("../db");
const Plano = require("../questoes-plano");

const APLICAR = process.argv.includes("--aplicar");
const log = (...a) => console.log(...a);

const all = db.prepare("SELECT id, materia, assunto, banca FROM bank_questions").all();
const byName = new Map();
for (const q of all) for (const n of new Set([q.materia, q.assunto])) { if (!n) continue; if (!byName.has(n)) byName.set(n, []); byName.get(n).push(q); }

const plan = {};
let totalFalta = 0;
for (const ed of Plano.EDITAIS) {
  const days = Plano.dias(ed);
  const dayOf = new Map(days.map(d => [d.key, d]));
  const old = new Map(db.prepare("SELECT question_id, day_key, pos FROM bank_day WHERE edital = ?").all(ed).map(r => [r.question_id, r]));
  const answered = new Set(db.prepare("SELECT DISTINCT question_id FROM bank_answers WHERE edital = ?").all(ed).map(r => r.question_id));
  const assigned = new Map(), perDay = new Map(days.map(d => [d.key, []]));

  for (const d of days) {
    const seen = new Set(), cand = [];
    for (const f of d.fontes) for (const q of byName.get(f) || []) if (!seen.has(q.id) && !assigned.has(q.id)) { seen.add(q.id); cand.push(q); }
    const o = q => old.get(q.id);
    cand.sort((a, b) =>
      ((o(a)?.day_key === d.key ? 0 : 1) - (o(b)?.day_key === d.key ? 0 : 1)) ||
      ((o(a) ? 0 : 1) - (o(b) ? 0 : 1)) ||
      ((a.banca === "FGV" ? 0 : 1) - (b.banca === "FGV" ? 0 : 1)) ||
      ((o(a)?.pos ?? 1e9) - (o(b)?.pos ?? 1e9)) || a.id.localeCompare(b.id));
    for (const q of cand) { if (perDay.get(d.key).length >= d.alvo) break; assigned.set(q.id, d.key); perDay.get(d.key).push(q.id); }
  }
  // respondidas que ficaram de fora: dia do tema delas (sem limite) ou o dia antigo, se ainda existir
  let kept = 0;
  const qById = new Map(all.map(q => [q.id, q]));
  for (const qid of answered) {
    if (assigned.has(qid) || !old.has(qid)) continue;
    const q = qById.get(qid);
    const d = days.find(x => q && x.fontes.some(f => f === q.materia || f === q.assunto)) || dayOf.get(old.get(qid).day_key);
    if (d) { assigned.set(qid, d.key); perDay.get(d.key).push(qid); kept++; }
  }

  const oldCount = {}; for (const r of old.values()) oldCount[r.day_key] = (oldCount[r.day_key] || 0) + 1;
  const dropped = [...old.keys()].filter(id => !assigned.has(id)).length;
  const moved = [...assigned].filter(([id, k]) => old.has(id) && old.get(id).day_key !== k).length;
  const added = [...assigned.keys()].filter(id => !old.has(id)).length;
  log(`\n== ${ed} ==  ${old.size} → ${assigned.size} questões ligadas · ${moved} mudaram de dia · ${added} reaproveitadas de outro edital/tema · ${dropped} saíram${kept ? ` · ${kept} respondidas mantidas` : ""}`);
  log("  Dia         Matéria  antes  depois  meta  falta");
  let falta = 0;
  for (const d of days) {
    const n = perDay.get(d.key).length, f = Math.max(0, d.alvo - n); falta += f;
    const flag = (oldCount[d.key] || 0) !== n ? "*" : " ";
    log(`  ${d.key}  ${d.m.padEnd(7)} ${String(oldCount[d.key] || 0).padStart(6)}  ${String(n).padStart(6)}${flag} ${String(d.alvo).padStart(5)}  ${f ? String(f).padStart(5) : "    -"}   ${d.title.slice(0, 60)}`);
  }
  log(`  Faltam ${falta} questões para todas as metas (≈ ${falta * 6} créditos, antes do reaproveitamento entre os editais).`);
  totalFalta += falta;
  plan[ed] = { days, perDay, assigned, old };
}

if (!APLICAR) {
  log(`\nNada foi alterado. Para aplicar: node scripts/remapear-questoes.js --aplicar`);
  process.exit(0);
}

// backup antes de mexer
const bak = path.join(path.dirname(process.env.DB_PATH || path.join(__dirname, "..", "data", "caderno.db")), `backup-antes-remapear-${new Date().toISOString().slice(0, 10)}.db`);
try { require("fs").unlinkSync(bak); } catch {}
db.exec(`VACUUM INTO '${bak.replace(/'/g, "''")}'`);
log(`\nBackup: ${bak}`);

const MAT = new Map();
for (const ed of Plano.EDITAIS) for (const d of plan[ed].days) MAT.set(ed + d.key, d.m);
db.exec("BEGIN");
try {
  for (const ed of Plano.EDITAIS) {
    const { perDay } = plan[ed];
    db.prepare("DELETE FROM bank_day WHERE edital = ?").run(ed);
    const ins = db.prepare("INSERT INTO bank_day (edital, day_key, question_id, pos) VALUES (?,?,?,?)");
    const upd = db.prepare("UPDATE bank_answers SET day_key = ?, materia = ? WHERE edital = ? AND question_id = ?");
    for (const [key, ids] of perDay) ids.forEach((id, i) => { ins.run(ed, key, id, i); upd.run(key, MAT.get(ed + key), ed, id); });
  }
  db.exec("COMMIT");
} catch (e) { db.exec("ROLLBACK"); throw e; }
log("Pronto! Agora complete o que falta: npm run importar -- --simular  (e depois sem --simular)");
