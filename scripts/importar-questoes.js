#!/usr/bin/env node
// =====================================================================
// Importa questões da Quest API para os dias de Específicos do cronograma.
//
//   node scripts/importar-questoes.js                 → 7 questões por dia, todos os dias, os 2 editais
//   node scripts/importar-questoes.js --por-dia 20    → completa cada dia até 20 questões
//   node scripts/importar-questoes.js --dias 2026-11-19 --edital analista
//   node scripts/importar-questoes.js --simular       → só mostra o plano e o saldo, sem gastar
//
// Precisa de QUEST_API_KEY no .env. Cada questão com gabarito custa 6 créditos;
// buscas vazias não custam nada. O script para sozinho quando o saldo acaba e
// lembra onde parou cada busca, então rodar de novo nunca paga a mesma questão.
// =====================================================================
require("../load-env");
const db = require("../db");
const Bank = require("../bank");
const Plans = require("../public/js/plans.js");
const MAP = require("../questoes-map");

const API = "https://api.quest.api.br";
const KEY = process.env.QUEST_API_KEY;
const COST = 6;                                   // créditos por questão com gabarito
// FGV primeiro; depois bancas de estilo parecido (múltipla escolha); Cebraspe por último
const BANCAS = ["FGV", "CESGRANRIO", "FCC", "VUNESP", "Instituto AOCP", "IBFC", "FUNDATEC", "IDECAN", "Quadrix", "IADES", "CESPE CEBRASPE"];

// ---------- argumentos ----------
const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(`--${name}`); return i < 0 ? def : (args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : true); };
const PER_DAY = Math.max(1, parseInt(opt("por-dia", "7"), 10));
const EDITAL = opt("edital", "todos");
const DIAS = opt("dias", null) ? String(opt("dias")).split(",") : null;
const RESERVA = parseInt(opt("reserva", "0"), 10);
const SIMULAR = !!opt("simular", false);
const ARQUIVO = opt("arquivo", null);             // testes: importa de um JSON local em vez da API

const sleep = ms => new Promise(r => setTimeout(r, ms));
const log = (...a) => console.log(...a);

async function api(path) {
  for (let tryN = 0; tryN < 5; tryN++) {
    const r = await fetch(API + path, { headers: { "X-API-Key": KEY } });
    if (r.status === 429) { await sleep(8000 * (tryN + 1)); continue; }
    const body = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(`API ${r.status} em ${path}: ${JSON.stringify(body).slice(0, 200)}`);
    return body.data;
  }
  throw new Error("API ocupada demais (429). Tente de novo em alguns minutos.");
}

// ---------- dias a preencher (em ordem de data, os 2 editais intercalados) ----------
function targets() {
  const eds = EDITAL === "todos" ? Object.keys(MAP) : [EDITAL];
  const list = [];
  for (const ed of eds) {
    if (!MAP[ed]) throw new Error(`Edital desconhecido: ${ed}`);
    const plan = new Map(Plans.build(ed).map(d => [d.key, d]));
    for (const [key, fontes] of Object.entries(MAP[ed])) {
      if (DIAS && !DIAS.includes(key)) continue;
      const day = plan.get(key);
      if (!day) { log(`⚠️  ${ed} ${key}: dia não existe no cronograma, pulei.`); continue; }
      list.push({ ed, key, fontes, title: day.t });
    }
  }
  return list.sort((a, b) => a.key.localeCompare(b.key) || a.ed.localeCompare(b.ed));
}

const countDay = (ed, key) => db.prepare("SELECT COUNT(*) n FROM bank_day WHERE edital = ? AND day_key = ?").get(ed, key).n;
const linkStmt = db.prepare("INSERT OR IGNORE INTO bank_day (edital, day_key, question_id, pos) VALUES (?,?,?,?)");

// grava as questões e liga ao dia; devolve quantas entraram no dia
function store(ed, key, items) {
  let added = 0;
  for (const q of items) {
    Bank.saveQuestion(db, q);
    const exists = db.prepare("SELECT 1 FROM bank_questions WHERE id = ?").get(String(q.id));
    if (!exists) continue;                         // sem gabarito válido
    if (linkStmt.run(ed, key, String(q.id), countDay(ed, key)).changes) added++;
  }
  return added;
}

async function main() {
  const days = targets();
  if (ARQUIVO) {
    const items = JSON.parse(require("fs").readFileSync(ARQUIVO, "utf8"));
    for (const t of days) log(`${t.ed} ${t.key}: +${store(t.ed, t.key, items)} questões do arquivo`);
    return;
  }
  if (!KEY) throw new Error("Defina QUEST_API_KEY no arquivo .env");

  const quota = await api("/quota");
  let saldo = quota.unlimited ? Infinity : quota.remaining - RESERVA;
  log(`Saldo: ${quota.remaining} créditos (plano ${quota.planCode}). Meta: ${PER_DAY} questões por dia em ${days.length} dias.`);
  const falta = days.reduce((s, t) => s + Math.max(0, PER_DAY - countDay(t.ed, t.key)), 0);
  log(`Faltam ${falta} questões ≈ ${falta * COST} créditos.${falta * COST > saldo ? " O saldo não cobre tudo: os primeiros dias são preenchidos antes." : ""}`);
  if (SIMULAR) return;

  let gastos = 0, total = 0;
  for (const t of days) {
    let need = PER_DAY - countDay(t.ed, t.key);
    if (need <= 0) continue;
    const start = need;
    for (const banca of BANCAS) {
      for (const fonte of t.fontes) {
        for (const field of ["materia", "assunto"]) {
          if (need <= 0) break;
          const take = Math.min(need, 100, Math.floor(saldo / COST));
          if (take <= 0) { log(`\n💳 Créditos acabaram. Parei em ${t.ed} ${t.key}. Rode de novo depois de recarregar.`); return finish(gastos, total); }
          const params = { banca, [field]: fonte, tem_gabarito: "true", anulada: "false" };
          const qkey = JSON.stringify(params);
          const cur = db.prepare("SELECT cursor, exhausted FROM bank_cursors WHERE qkey = ?").get(qkey);
          if (cur?.exhausted) continue;
          const qs = new URLSearchParams({ ...params, include_gabarito: "true", include_total: "false", per_page: String(take) });
          if (cur?.cursor) qs.set("after_id", cur.cursor);
          const data = await api(`/v2/questoes?${qs}`);
          await sleep(1200);
          const items = data.items || [];
          db.prepare(`INSERT INTO bank_cursors (qkey, cursor, exhausted, updated_at) VALUES (?,?,?,datetime('now'))
            ON CONFLICT(qkey) DO UPDATE SET cursor = excluded.cursor, exhausted = excluded.exhausted, updated_at = excluded.updated_at`)
            .run(qkey, data.next_cursor || cur?.cursor || null, data.has_more ? 0 : 1);
          if (!items.length) continue;
          saldo -= items.length * COST; gastos += items.length * COST;
          const added = store(t.ed, t.key, items);
          need -= added; total += added;
        }
      }
      if (need <= 0) break;
    }
    log(`${need <= 0 ? "✅" : "🟡"} ${t.ed.padEnd(10)} ${t.key}  +${start - Math.max(0, need)}/${start}  ${t.title}`);
  }
  finish(gastos, total);
}

function finish(gastos, total) {
  log(`\nPronto: ${total} questões novas, ~${gastos} créditos gastos.`);
  const n = db.prepare("SELECT COUNT(*) n FROM bank_questions").get().n;
  log(`Banco agora tem ${n} questões.`);
}

main().catch(e => { console.error("❌", e.message); process.exit(1); });
