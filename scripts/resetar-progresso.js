#!/usr/bin/env node
// =====================================================================
// Zera o progresso de UM usuário (mantém a conta, a senha e as configurações).
// Apaga: dias concluídos, tempo estudado, anotações/marcações das apostilas,
// questões lançadas, conquistas, respostas do banco, tentativas e metas batidas.
// As questões do banco não são apagadas (são compartilhadas).
//
//   node scripts/resetar-progresso.js --email erick@exemplo.com            → só mostra o que seria apagado
//   node scripts/resetar-progresso.js --email erick@exemplo.com --aplicar  → faz backup e apaga
//   node scripts/resetar-progresso.js --listar                             → lista os usuários
// =====================================================================
require("../load-env");
const path = require("path");
const db = require("../db");

const args = process.argv.slice(2);
const opt = n => { const i = args.indexOf(`--${n}`); return i < 0 ? null : args[i + 1]; };

if (args.includes("--listar") || !opt("email")) {
  for (const u of db.prepare("SELECT id, name, email, edital, created_at FROM users ORDER BY id").all())
    console.log(`#${u.id}  ${u.name.padEnd(22)} ${u.email.padEnd(32)} ${u.edital}`);
  if (!opt("email")) console.log("\nUse: node scripts/resetar-progresso.js --email <email> [--aplicar]");
  process.exit(0);
}

const user = db.prepare("SELECT id, name, email, edital FROM users WHERE email = ?").get(opt("email"));
if (!user) { console.error(`Nenhum usuário com o e-mail ${opt("email")}.`); process.exit(1); }

const TABLES = ["progress", "sessions", "notes", "question_logs", "achievements", "bank_answers", "bank_attempts", "meta_days"];
const has = t => db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(t);
console.log(`Usuário: #${user.id} ${user.name} <${user.email}> (${user.edital})`);
let total = 0;
for (const t of TABLES.filter(has)) {
  const n = db.prepare(`SELECT COUNT(*) n FROM ${t} WHERE user_id = ?`).get(user.id).n;
  total += n;
  console.log(`  ${t.padEnd(14)} ${n} registro(s)`);
}

if (!args.includes("--aplicar")) {
  console.log(`\nNada foi apagado. Para zerar: acrescente --aplicar`);
  process.exit(0);
}

const dir = path.dirname(process.env.DB_PATH || path.join(__dirname, "..", "data", "caderno.db"));
const bak = path.join(dir, `backup-antes-reset-${user.id}-${new Date().toISOString().slice(0, 10)}.db`);
try { require("fs").unlinkSync(bak); } catch {}
db.exec(`VACUUM INTO '${bak.replace(/'/g, "''")}'`);
console.log(`\nBackup: ${bak}`);

db.exec("BEGIN");
try {
  for (const t of TABLES.filter(has)) db.prepare(`DELETE FROM ${t} WHERE user_id = ?`).run(user.id);
  db.exec("COMMIT");
} catch (e) { db.exec("ROLLBACK"); throw e; }
console.log(`Pronto: ${total} registro(s) apagados. ${user.name} começa do zero.`);
