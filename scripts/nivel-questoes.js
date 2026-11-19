#!/usr/bin/env node
// =====================================================================
// Nível das questões (Médio × Superior) e separação por cronograma.
//
//   node scripts/nivel-questoes.js             → classifica e mostra quantas há de cada nível
//   node scripts/nivel-questoes.js --separar   → tira do Analista as de nível médio e do
//                                                Assistente as de nível superior
//
// Analista de Sistemas = prova de nível superior; Assistente Administrativo = nível médio.
// Questões antigas (importadas sem o nível) são classificadas pelo cargo da prova; as que
// não dá para saber ficam como "?" e continuam nos dois. Questões que alguém já respondeu
// nunca são tiradas (para não apagar histórico). Não gasta créditos.
// =====================================================================
require("../load-env");
const db = require("../db");
const { nivelDoCargo } = require("../bank");
const Plans = require("../public/js/plans.js");

const WANT = { analista: "Superior", assistente: "Médio" };
const LESSON = 20;
const SEPARAR = process.argv.includes("--separar");
const log = (...a) => console.log(...a);

// 1) classifica pelo cargo as que ainda não têm nível
const sem = db.prepare("SELECT id, cargo FROM bank_questions WHERE nivel IS NULL").all();
const upd = db.prepare("UPDATE bank_questions SET nivel = ? WHERE id = ?");
let cls = 0;
for (const r of sem) { const n = nivelDoCargo(r.cargo); if (n) { upd.run(n, r.id); cls++; } }
if (sem.length) log(`Classificadas pelo cargo: ${cls} de ${sem.length} (as outras ficam como "?").\n`);

function report(title) {
  log(`== ${title} ==`);
  const tot = db.prepare("SELECT COALESCE(nivel,'?') n, COUNT(*) c FROM bank_questions GROUP BY 1 ORDER BY 1").all();
  log("Banco inteiro:", tot.map(r => `${r.n}: ${r.c}`).join(" · "));
  for (const ed of Object.keys(WANT)) {
    const labels = Plans.EDITAIS[ed].labels, plan = new Map(Plans.build(ed).map(d => [d.key, d]));
    const rows = db.prepare(`SELECT d.day_key, COALESCE(q.nivel,'?') n, COUNT(*) c FROM bank_day d JOIN bank_questions q ON q.id = d.question_id
      WHERE d.edital = ? GROUP BY d.day_key, 2`).all(ed);
    const byM = {};
    for (const r of rows) { const m = plan.get(r.day_key)?.m || "?"; (byM[m] ||= { "Médio": 0, Superior: 0, "?": 0 })[r.n] += r.c; }
    log(`\n${Plans.EDITAIS[ed].nome} (quer nível ${WANT[ed].toLowerCase()}):`);
    log("  Matéria".padEnd(22), "Médio".padStart(7), "Superior".padStart(9), "?".padStart(6), "Total".padStart(7));
    let t = { "Médio": 0, Superior: 0, "?": 0 };
    for (const [m, x] of Object.entries(byM)) { log(("  " + (labels[m] || m)).padEnd(22), String(x["Médio"]).padStart(7), String(x.Superior).padStart(9), String(x["?"]).padStart(6), String(x["Médio"] + x.Superior + x["?"]).padStart(7)); for (const k in t) t[k] += x[k]; }
    log("  TOTAL".padEnd(22), String(t["Médio"]).padStart(7), String(t.Superior).padStart(9), String(t["?"]).padStart(6), String(t["Médio"] + t.Superior + t["?"]).padStart(7));
  }
  log("");
}

report("Antes");
if (!SEPARAR) { log('Para separar, rode de novo com --separar.'); process.exit(0); }

// 2) tira de cada cronograma as questões do outro nível que ninguém respondeu
for (const [ed, want] of Object.entries(WANT)) {
  const info = db.prepare(`DELETE FROM bank_day WHERE edital = ? AND question_id IN (
      SELECT q.id FROM bank_questions q WHERE q.nivel IS NOT NULL AND q.nivel <> ?
      AND NOT EXISTS (SELECT 1 FROM bank_answers a WHERE a.question_id = q.id AND a.edital = ?))`).run(ed, want, ed);
  log(`${Plans.EDITAIS[ed].nome}: ${info.changes} questões de outro nível retiradas.`);
  // renumera as posições para cada aula continuar com as 20 primeiras preenchidas
  const days = db.prepare("SELECT DISTINCT day_key FROM bank_day WHERE edital = ?").all(ed).map(r => r.day_key);
  const setPos = db.prepare("UPDATE bank_day SET pos = ? WHERE edital = ? AND question_id = ?");
  for (const k of days) db.prepare("SELECT question_id FROM bank_day WHERE edital = ? AND day_key = ? ORDER BY pos, question_id").all(ed, k).forEach((r, i) => setPos.run(i, ed, r.question_id));
  const short = days.map(k => [k, db.prepare("SELECT COUNT(*) c FROM bank_day WHERE edital = ? AND day_key = ?").get(ed, k).c]).filter(([, c]) => c < LESSON);
  if (short.length) log(`  ${short.length} aulas ficaram com menos de ${LESSON} questões: ${short.slice(0, 12).map(([k, c]) => `${k.slice(8)}/${k.slice(5, 7)} (${c})`).join(", ")}${short.length > 12 ? ` e mais ${short.length - 12}` : ""}`);
}
log("");
report("Depois");
log("Para completar com questões do nível certo: npm run importar -- --simular  (depois sem --simular)");
