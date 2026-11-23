#!/usr/bin/env node
// =====================================================================
// Migração única (23/11/2026): o cronograma do Analista recomeçou em 23/11.
// Move as questões de cada aula do Analista da data antiga para a data nova,
// mantendo as mesmas 20 questões da aula e a ordem do banco do tema.
// Aulas unidas (Normas 6+7, Inglês 3+4): as questões da segunda vão para o fim da primeira.
// Não gasta créditos. Só mexe no edital "analista".
//
//   node scripts/migrar-analista-23-11.js            → só mostra o que mudaria
//   node scripts/migrar-analista-23-11.js --aplicar  → faz backup e aplica
// =====================================================================
require("../load-env");
const path = require("path");
const db = require("../db");

// data antiga → data nova
const MAP = {
  "2026-11-19": "2026-11-23",
  "2026-11-21": "2026-11-24",
  "2026-11-23": "2026-11-26",
  "2026-11-24": "2026-11-28",
  "2026-11-26": "2026-11-30",
  "2026-11-28": "2026-12-01",
  "2026-11-30": "2026-12-03",
  "2026-12-01": "2026-12-05",
  "2026-12-03": "2026-12-07",
  "2026-12-05": "2026-12-08",
  "2026-12-07": "2026-12-10",
  "2026-12-08": "2026-12-12",
  "2026-12-10": "2026-12-14",
  "2026-12-12": "2026-12-15",
  "2026-12-14": "2026-12-17",
  "2026-12-15": "2026-12-19",
  "2026-12-17": "2026-12-21",
  "2026-12-19": "2026-12-22",
  "2026-12-21": "2026-12-24",
  "2026-12-22": "2026-12-26",
  "2026-12-24": "2026-12-28",
  "2026-12-26": "2026-12-29",
  "2026-12-28": "2026-12-31",
  "2026-12-29": "2027-01-02",
  "2026-12-31": "2027-01-04",
  "2027-01-02": "2027-01-05",
  "2026-11-25": "2026-11-25",
  "2026-11-29": "2026-12-02",
  "2026-12-02": "2026-12-06",
  "2026-12-09": "2026-12-09",
  "2026-12-13": "2026-12-16",
  "2026-12-16": "2026-12-20",
  "2026-12-23": "2026-12-23",
  "2026-12-27": "2026-12-30",
  "2026-12-30": "2027-01-03",
  "2027-01-06": "2027-01-06",
  "2026-11-20": "2026-11-27",
  "2026-11-27": "2026-12-04",
  "2026-12-04": "2026-12-11",
  "2026-12-11": "2026-12-18",
  "2026-12-18": "2026-12-25",
  "2026-12-25": "2027-01-01",
  "2027-01-01": "2027-01-01",
  "2026-11-22": "2026-11-29",
  "2026-12-06": "2026-12-13",
  "2026-12-20": "2026-12-27",
  "2027-01-03": "2026-12-27",
};

const APLICAR = process.argv.includes("--aplicar");
const ED = "analista";
const rows = db.prepare("SELECT question_id, day_key, pos FROM bank_day WHERE edital = ? ORDER BY day_key, pos").all(ED);
if (!rows.some(r => r.day_key === "2026-11-19") && rows.some(r => r.day_key === "2026-11-23")) {
  console.log("Parece que a migração já foi aplicada (não há questões do Analista em 19/11). Nada a fazer.");
  process.exit(0);
}
const plan = new Map();          // nova data → [question_id] em ordem
const fora = [];
for (const r of rows) {
  const novo = MAP[r.day_key];
  if (!novo) { fora.push(r); continue; }
  if (!plan.has(novo)) plan.set(novo, []);
  plan.get(novo).push(r.question_id);
}
// a ordem de inserção já segue a data antiga; nas aulas unidas a mais antiga vem primeiro
console.log(`Analista: ${rows.length} questões ligadas; ${rows.length - fora.length} vão mudar de data${fora.length ? `; ${fora.length} ficam onde estão (datas fora do mapa)` : ""}.`);
for (const [k, ids] of [...plan].sort()) console.log(`  ${k}  ${String(ids.length).padStart(4)} questões`);
if (!APLICAR) { console.log("\nNada foi alterado. Para aplicar: node scripts/migrar-analista-23-11.js --aplicar"); process.exit(0); }

const dir = path.dirname(process.env.DB_PATH || path.join(__dirname, "..", "data", "caderno.db"));
const bak = path.join(dir, `backup-antes-migrar-analista-${new Date().toISOString().slice(0, 10)}.db`);
try { require("fs").unlinkSync(bak); } catch {}
db.exec(`VACUUM INTO '${bak.replace(/'/g, "''")}'`);
console.log(`\nBackup: ${bak}`);

db.exec("BEGIN");
try {
  const upd = db.prepare("UPDATE bank_day SET day_key = ?, pos = ? WHERE edital = ? AND question_id = ?");
  const ans = db.prepare("UPDATE bank_answers SET day_key = ? WHERE edital = ? AND question_id = ?");
  for (const [k, ids] of plan) ids.forEach((id, i) => { upd.run(k, i, ED, id); ans.run(k, ED, id); });
  db.exec("COMMIT");
} catch (e) { db.exec("ROLLBACK"); throw e; }
console.log("Pronto! As questões do Analista agora seguem o cronograma que começa em 23/11.");
