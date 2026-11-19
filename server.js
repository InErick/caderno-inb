require("./load-env");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const express = require("express");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./db");
const Game = require("./game");
const Plans = require("./public/js/plans.js");

const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === "production";
let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  JWT_SECRET = crypto.randomBytes(32).toString("hex");
  console.warn("⚠️  JWT_SECRET não definido no .env — usando um aleatório (todos serão deslogados ao reiniciar).");
}
const COOKIE = "caderno_token";
const EDITAIS = ["analista", "assistente"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const app = express();
app.set("trust proxy", 1);
app.use(express.json({ limit: "300kb" }));
app.use(cookieParser());
app.use((req, res, next) => {
  res.set({
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "same-origin",
    "X-Frame-Options": "DENY",
  });
  next();
});

// ---------- helpers ----------
const fail = (res, status, error) => res.status(status).json({ error });

function setSession(res, user) {
  const token = jwt.sign({ uid: user.id }, JWT_SECRET, { expiresIn: "30d" });
  res.cookie(COOKIE, token, {
    httpOnly: true, sameSite: "lax", secure: IS_PROD, maxAge: 30 * 24 * 3600 * 1000,
  });
}

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, edital: u.edital, dailyGoal: u.daily_goal, dailyQGoal: u.daily_q_goal ?? 40, createdAt: u.created_at };
}

function auth(req, res, next) {
  try {
    const { uid } = jwt.verify(req.cookies[COOKIE] || "", JWT_SECRET);
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(uid);
    if (!user) return fail(res, 401, "Sessão expirada. Entre novamente.");
    req.user = user;
    next();
  } catch {
    fail(res, 401, "Sessão expirada. Entre novamente.");
  }
}

// Limite simples de tentativas de login (por IP)
const attempts = new Map();
function loginLimiter(req, res, next) {
  const now = Date.now(), ip = req.ip;
  const a = (attempts.get(ip) || []).filter(t => now - t < 15 * 60 * 1000);
  if (a.length >= 10) return fail(res, 429, "Muitas tentativas. Aguarde alguns minutos.");
  a.push(now); attempts.set(ip, a);
  next();
}

// ---------- auth ----------
app.post("/api/auth/register", loginLimiter, (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const edital = String(req.body.edital || "");
  if (name.length < 2 || name.length > 60) return fail(res, 400, "Informe seu nome.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(res, 400, "E-mail inválido.");
  if (password.length < 6) return fail(res, 400, "A senha precisa ter pelo menos 6 caracteres.");
  if (!EDITAIS.includes(edital)) return fail(res, 400, "Escolha um dos cronogramas.");
  if (db.prepare("SELECT 1 FROM users WHERE email = ?").get(email)) return fail(res, 409, "Já existe uma conta com esse e-mail.");

  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare("INSERT INTO users (name, email, password_hash, edital, daily_q_goal) VALUES (?,?,?,?,40)").run(name, email, hash, edital);
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid);
  setSession(res, user);
  res.status(201).json({ user: publicUser(user) });
});

app.post("/api/auth/login", loginLimiter, (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user || !bcrypt.compareSync(String(req.body.password || ""), user.password_hash))
    return fail(res, 401, "E-mail ou senha incorretos.");
  setSession(res, user);
  res.json({ user: publicUser(user) });
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie(COOKIE);
  res.json({ ok: true });
});

// ---------- usuário ----------
app.get("/api/me", auth, (req, res) => res.json({ user: publicUser(req.user) }));

app.patch("/api/me", auth, (req, res) => {
  const u = req.user;
  const name = req.body.name !== undefined ? String(req.body.name).trim() : u.name;
  const edital = req.body.edital !== undefined ? String(req.body.edital) : u.edital;
  const goal = req.body.dailyGoal !== undefined ? parseInt(req.body.dailyGoal, 10) : u.daily_goal;
  if (name.length < 2 || name.length > 60) return fail(res, 400, "Nome inválido.");
  if (!EDITAIS.includes(edital)) return fail(res, 400, "Cronograma inválido.");
  const qGoal = req.body.dailyQGoal !== undefined ? parseInt(req.body.dailyQGoal, 10) : u.daily_q_goal;
  if (!(goal >= 10 && goal <= 600)) return fail(res, 400, "Meta diária deve ficar entre 10 e 600 minutos.");
  if (!(qGoal >= 5 && qGoal <= 200)) return fail(res, 400, "Meta de questões deve ficar entre 5 e 200 por dia.");
  db.prepare("UPDATE users SET name = ?, edital = ?, daily_goal = ?, daily_q_goal = ? WHERE id = ?").run(name, edital, goal, qGoal, u.id);
  res.json({ user: publicUser(db.prepare("SELECT * FROM users WHERE id = ?").get(u.id)) });
});

app.post("/api/me/password", auth, (req, res) => {
  const { current, next: nova } = req.body || {};
  if (!bcrypt.compareSync(String(current || ""), req.user.password_hash)) return fail(res, 400, "Senha atual incorreta.");
  if (String(nova || "").length < 6) return fail(res, 400, "A nova senha precisa ter pelo menos 6 caracteres.");
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(bcrypt.hashSync(String(nova), 10), req.user.id);
  res.json({ ok: true });
});

// ---------- progresso do cronograma ----------
app.get("/api/progress", auth, (req, res) => {
  const rows = db.prepare("SELECT day_key, done_local, late FROM progress WHERE user_id = ? AND edital = ?").all(req.user.id, req.user.edital);
  res.json({ done: rows.map(r => r.day_key), details: Object.fromEntries(rows.map(r => [r.day_key, { late: !!r.late, doneLocal: r.done_local }])) });
});

app.put("/api/progress/:dayKey", auth, (req, res) => {
  const key = req.params.dayKey;
  if (!DATE_RE.test(key)) return fail(res, 400, "Dia inválido.");
  if (req.body.done) {
    const localDate = DATE_RE.test(req.body.localDate || "") ? req.body.localDate : new Date().toISOString().slice(0, 10);
    const late = localDate > key ? 1 : 0;   // concluído depois da data = recuperado de atrasado
    db.prepare("INSERT OR IGNORE INTO progress (user_id, edital, day_key, done_local, late) VALUES (?,?,?,?,?)")
      .run(req.user.id, req.user.edital, key, localDate, late);
  } else {
    db.prepare("DELETE FROM progress WHERE user_id = ? AND edital = ? AND day_key = ?").run(req.user.id, req.user.edital, key);
  }
  res.json({ ok: true });
});

// ---------- painel gamificado (XP, nível, sequência, edital, termômetro, conquistas) ----------
app.get("/api/dashboard", auth, (req, res) => {
  const today = DATE_RE.test(req.query.today || "") ? req.query.today : new Date().toISOString().slice(0, 10);
  res.json(Game.compute(db, req.user, today));
});

// ---------- questões lançadas manualmente ----------
const SOURCES = ["diario", "simulado", "revisao"];
function parseLog(b) {
  const done = parseInt(b.done, 10), correct = parseInt(b.correct, 10);
  if (!Game.MATS.includes(b.materia)) return "Escolha a matéria.";
  if (!(done >= 1 && done <= 500)) return "Informe quantas questões você fez (1 a 500).";
  if (!(correct >= 0 && correct <= done)) return "Os acertos precisam ficar entre 0 e o total de questões.";
  if (!DATE_RE.test(b.localDate || "")) return "Data inválida.";
  return { done, correct, materia: b.materia, localDate: b.localDate,
    dayKey: b.dayKey && DATE_RE.test(b.dayKey) ? b.dayKey : null, source: SOURCES.includes(b.source) ? b.source : "diario" };
}

app.post("/api/questions", auth, (req, res) => {
  const v = parseLog(req.body || {});
  if (typeof v === "string") return fail(res, 400, v);
  const info = db.prepare(`INSERT INTO question_logs (user_id, edital, day_key, local_date, materia, source, done, correct)
    VALUES (?,?,?,?,?,?,?,?)`).run(req.user.id, req.user.edital, v.dayKey, v.localDate, v.materia, v.source, v.done, v.correct);
  res.status(201).json({ id: info.lastInsertRowid });
});

app.get("/api/questions", auth, (req, res) => {
  const from = DATE_RE.test(req.query.from || "") ? req.query.from : "0000-01-01";
  const to = DATE_RE.test(req.query.to || "") ? req.query.to : "9999-12-31";
  const rows = db.prepare(`SELECT id, day_key AS dayKey, local_date AS localDate, materia, source, done, correct, created_at AS createdAt
    FROM question_logs WHERE user_id = ? AND edital = ? AND local_date BETWEEN ? AND ? ORDER BY local_date DESC, id DESC`)
    .all(req.user.id, req.user.edital, from, to);
  res.json({ logs: rows });
});

app.patch("/api/questions/:id", auth, (req, res) => {
  const cur = db.prepare("SELECT * FROM question_logs WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
  if (!cur) return fail(res, 404, "Lançamento não encontrado.");
  const v = parseLog({ materia: cur.materia, localDate: cur.local_date, dayKey: cur.day_key, source: cur.source, done: cur.done, correct: cur.correct, ...req.body });
  if (typeof v === "string") return fail(res, 400, v);
  db.prepare("UPDATE question_logs SET materia = ?, done = ?, correct = ?, source = ?, day_key = ?, local_date = ? WHERE id = ?")
    .run(v.materia, v.done, v.correct, v.source, v.dayKey, v.localDate, cur.id);
  res.json({ ok: true });
});

app.delete("/api/questions/:id", auth, (req, res) => {
  db.prepare("DELETE FROM question_logs WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// ---------- banco de questões (resolver no app, com correção automática) ----------
const planCache = {};
const planOf = ed => (planCache[ed] ||= Plans.build(ed));
const dayMap = {};
const planDay = (ed, key) => (dayMap[ed] ||= new Map([...Plans.build(ed), ...Plans.legacy(ed)].map(d => [d.key, d]))).get(key);
const addDaysISO = (k, n) => { const d = new Date(k + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const todayOf = req => DATE_RE.test(req.query.today || req.body?.localDate || "") ? (req.query.today || req.body.localDate) : new Date().toISOString().slice(0, 10);
const REVIEW = [1, 3, 7];   // caderno de erros: volta em 1, 3 e 7 dias; 3 acertos seguidos e sai

const LESSON = 20;   // questões que aparecem na própria aula; o resto do banco do tema vai para a aba Questões

// conteúdo liberado na aba Questões = aulas concluídas no cronograma
function unlockedKeys(user) {
  return new Set(db.prepare("SELECT day_key FROM progress WHERE user_id = ? AND edital = ?").all(user.id, user.edital).map(r => r.day_key));
}

function toClient(r, withAnswer = true) {
  return {
    id: r.id, dayKey: r.day_key, enunciado: r.enunciado, alternativas: JSON.parse(r.alternativas), textos: JSON.parse(r.textos),
    tipo: r.tipo, banca: r.banca, orgao: r.orgao, cargo: r.cargo, ano: r.ano,
    answer: withAnswer && r.chosen ? { chosen: r.chosen, correct: !!r.last_correct, firstCorrect: !!r.first_correct, attempts: r.attempts, gabarito: r.gabarito } : null,
    review: r.review_step != null ? { step: r.review_step, due: r.review_due } : null,
  };
}
const Q_SELECT = `SELECT q.*, d.day_key, a.chosen, a.correct AS last_correct, a.first_correct, a.attempts, a.review_step, a.review_due, a.updated_at AS answered_at
  FROM bank_day d JOIN bank_questions q ON q.id = d.question_id
  LEFT JOIN bank_answers a ON a.question_id = q.id AND a.user_id = ? AND a.edital = d.edital`;

// resumo: questões por dia, desbloqueados, revisões pendentes e meta de hoje
app.get("/api/bank", auth, (req, res) => {
  const ed = req.user.edital, uid = req.user.id, today = todayOf(req);
  const rows = db.prepare(`SELECT d.day_key, COUNT(*) n, COUNT(a.question_id) answered, COALESCE(SUM(a.first_correct),0) correct,
      SUM(d.pos < ${LESSON}) ln, SUM(d.pos < ${LESSON} AND a.question_id IS NOT NULL) la, COALESCE(SUM(CASE WHEN d.pos < ${LESSON} THEN a.first_correct END),0) lc
    FROM bank_day d LEFT JOIN bank_answers a ON a.question_id = d.question_id AND a.user_id = ? AND a.edital = d.edital
    WHERE d.edital = ? GROUP BY d.day_key`).all(uid, ed);
  const due = db.prepare("SELECT COUNT(*) n FROM bank_answers WHERE user_id = ? AND edital = ? AND review_due IS NOT NULL AND review_due <= ?").get(uid, ed, today).n;
  const inReview = db.prepare("SELECT COUNT(*) n FROM bank_answers WHERE user_id = ? AND edital = ? AND review_step IS NOT NULL").get(uid, ed).n;
  res.json({
    days: Object.fromEntries(rows.map(r => [r.day_key, { n: r.ln, answered: r.la, correct: r.lc, pool: { n: r.n, answered: r.answered, correct: r.correct } }])),
    unlocked: [...unlockedKeys(req.user)],
    due, inReview,
  });
});

// questões de um assunto (dia); o gabarito só vem nas que o usuário já respondeu
app.get("/api/bank/day/:dayKey", auth, (req, res) => {
  const key = req.params.dayKey;
  if (!DATE_RE.test(key)) return fail(res, 400, "Dia inválido.");
  // na aula: as 20 primeiras; na aba Questões (scope=all, só para aula concluída): o banco inteiro do tema
  const all = req.query.scope === "all" && unlockedKeys(req.user).has(key);
  const rows = db.prepare(`${Q_SELECT} WHERE d.edital = ? AND d.day_key = ? ${all ? "" : `AND d.pos < ${LESSON}`} ORDER BY ${all ? "a.question_id IS NOT NULL," : ""} d.pos, q.id`).all(req.user.id, req.user.edital, key);
  res.json({ questions: rows.map(r => toClient(r)) });
});

// sessões montadas pelo servidor: treino do dia (inéditas) ou revisão de erros
app.get("/api/bank/session", auth, (req, res) => {
  const ed = req.user.edital, uid = req.user.id, today = todayOf(req);
  const n = Math.min(50, Math.max(3, parseInt(req.query.n, 10) || 20));
  if (req.query.mode === "erros") {
    const rows = db.prepare(`${Q_SELECT} WHERE d.edital = ? AND a.review_due IS NOT NULL AND a.review_due <= ? ORDER BY a.review_due, random() LIMIT ?`).all(uid, ed, today, n);
    return res.json({ questions: rows.map(r => toClient(r, false)) });
  }
  // extras: revisão livre de questões já respondidas (mais peso nas erradas e nas vistas há mais tempo; nada de hoje)
  if (req.query.mode === "extra") {
    const now = Date.parse(today + "T12:00:00Z");
    const mat = Game.MATS.includes(req.query.materia) ? req.query.materia : null;
    const rows = db.prepare(`${Q_SELECT} WHERE d.edital = ? AND a.question_id IS NOT NULL AND date(a.updated_at) < ?`).all(uid, ed, today)
      .filter(r => !mat || planDay(ed, r.day_key)?.m === mat)
      .map(r => {
        const age = Math.max(0, (now - Date.parse(String(r.answered_at).replace(" ", "T") + "Z")) / 864e5);
        const w = 1 + (r.last_correct ? 0 : 3) + (r.first_correct ? 0 : 1) + Math.min(age, 21) / 7;
        return { r, k: Math.random() ** (1 / w) };
      })
      .sort((a, b) => b.k - a.k).slice(0, n).map(x => ({ ...toClient(x.r, false), extra: true, wasWrong: !x.r.last_correct }));
    return res.json({ questions: rows });
  }
  // treino: ~60% das aulas concluídas mais recentes, o resto sorteado entre as liberadas (pesando as de pior acerto)
  const open = unlockedKeys(req.user);
  const mat = Game.MATS.includes(req.query.materia) ? req.query.materia : null;
  const cand = db.prepare(`${Q_SELECT} WHERE d.edital = ? AND a.question_id IS NULL ORDER BY d.pos`).all(uid, ed)
    .filter(r => open.has(r.day_key) && (!mat || planDay(ed, r.day_key)?.m === mat));
  const acc = Object.fromEntries(db.prepare("SELECT day_key, AVG(first_correct) acc FROM bank_answers WHERE user_id = ? AND edital = ? GROUP BY day_key").all(uid, ed).map(r => [r.day_key, r.acc]));
  // ~10% para relembrar: questões acertadas há 7+ dias (as vistas há mais tempo primeiro), fora do caderno de erros
  const recallN = n >= 5 ? Math.max(1, Math.round(n * 0.1)) : 0;
  const recall = !recallN ? [] : db.prepare(`${Q_SELECT} WHERE d.edital = ? AND a.correct = 1 AND a.review_step IS NULL
      AND a.updated_at <= datetime('now', '-7 days') ORDER BY a.updated_at`).all(uid, ed)
    .filter(r => open.has(r.day_key) && (!mat || planDay(ed, r.day_key)?.m === mat)).slice(0, recallN);
  const nNew = n - recall.length;
  const byDay = new Map();
  for (const r of cand) { if (!byDay.has(r.day_key)) byDay.set(r.day_key, []); byDay.get(r.day_key).push(r); }
  const recent = [...byDay.keys()].sort().reverse().slice(0, 3);
  const pick = [], used = new Set();
  const recentGoal = Math.round(nNew * 0.6);
  for (let i = 0; pick.length < recentGoal; i++) {
    let any = false;
    for (const k of recent) { const r = byDay.get(k)[i]; if (r && pick.length < recentGoal) { pick.push(r); used.add(r.id); any = true; } }
    if (!any) break;
  }
  const rest = cand.filter(r => !used.has(r.id))
    .map(r => ({ r, k: Math.random() ** (1 / (1 + 2 * (1 - (acc[r.day_key] ?? 0.5)))) }))
    .sort((a, b) => b.k - a.k).slice(0, nNew - pick.length).map(x => x.r);
  const all = [...pick, ...rest, ...recall];
  for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; }
  const rec = new Set(recall.map(r => r.id));
  res.json({ questions: all.map(r => rec.has(r.id) ? { ...toClient(r, false), recall: true } : toClient(r)) });
});

// responde uma questão: corrige, grava, atualiza o caderno de erros e devolve o gabarito
app.post("/api/bank/answer", auth, (req, res) => {
  const b = req.body || {}, ed = req.user.edital, uid = req.user.id, qid = String(b.questionId || "");
  const link = db.prepare("SELECT d.day_key, q.gabarito, q.alternativas FROM bank_day d JOIN bank_questions q ON q.id = d.question_id WHERE d.edital = ? AND d.question_id = ?").get(ed, qid);
  if (!link) return fail(res, 404, "Questão não encontrada.");
  const chosen = String(b.chosen || "").toUpperCase();
  if (!JSON.parse(link.alternativas).some(a => a.letra === chosen)) return fail(res, 400, "Escolha uma alternativa.");
  const localDate = todayOf(req);
  const correct = chosen === link.gabarito ? 1 : 0;
  const mode = ["dia", "treino", "erros", "extra"].includes(b.mode) ? b.mode : "dia";
  const day = planDay(ed, link.day_key);
  const materia = Game.MATS.includes(day?.m) ? day.m : "ESP";
  const prev = db.prepare("SELECT first_correct, review_step, review_due FROM bank_answers WHERE user_id = ? AND edital = ? AND question_id = ?").get(uid, ed, qid);

  // caderno de erros: errou → volta amanhã; acerto só avança a etapa se a revisão já venceu
  // (refazer logo depois de ver o gabarito não conta como revisão)
  let step = null, due = null, graduated = false;
  if (!correct) { step = 0; due = addDaysISO(localDate, REVIEW[0]); }
  else if (prev && prev.review_step != null) {
    if (prev.review_due && localDate < prev.review_due) { step = prev.review_step; due = prev.review_due; }
    else {
      step = prev.review_step + 1;
      if (step >= REVIEW.length) { step = null; graduated = true; } else due = addDaysISO(localDate, REVIEW[step]);
    }
  }
  if (prev) {
    db.prepare(`UPDATE bank_answers SET chosen = ?, correct = ?, attempts = attempts + 1, review_step = ?, review_due = ?, updated_at = datetime('now')
      WHERE user_id = ? AND edital = ? AND question_id = ?`).run(chosen, correct, step, due, uid, ed, qid);
  } else {
    db.prepare(`INSERT INTO bank_answers (user_id, edital, question_id, day_key, local_date, materia, first_correct, chosen, correct, review_step, review_due)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(uid, ed, qid, link.day_key, localDate, materia, correct, chosen, correct, step, due);
  }
  db.prepare("INSERT INTO bank_attempts (user_id, edital, question_id, local_date, correct, mode, materia) VALUES (?,?,?,?,?,?,?)").run(uid, ed, qid, localDate, correct, mode, materia);
  res.json({ correct: !!correct, gabarito: link.gabarito, first: !prev, review: step != null ? { step, due } : null, graduated });
});

// ---------- sessões de foco ----------
app.post("/api/sessions", auth, (req, res) => {
  const b = req.body || {};
  const seconds = Math.round(Number(b.seconds));
  const dayKey = b.dayKey && DATE_RE.test(b.dayKey) ? b.dayKey : null;
  const localDate = String(b.localDate || "");
  const mode = ["meta", "pomodoro", "livre", "teoria", "questoes"].includes(b.mode) ? b.mode : "livre";
  if (!(seconds >= 5 && seconds <= 12 * 3600)) return fail(res, 400, "Duração inválida.");
  if (!DATE_RE.test(localDate)) return fail(res, 400, "Data inválida.");
  const startedAt = new Date(b.startedAt), endedAt = new Date(b.endedAt);
  if (isNaN(startedAt) || isNaN(endedAt)) return fail(res, 400, "Horários inválidos.");

  const info = db.prepare(`INSERT INTO sessions (user_id, edital, day_key, local_date, seconds, mode, started_at, ended_at)
    VALUES (?,?,?,?,?,?,?,?)`).run(req.user.id, req.user.edital, dayKey, localDate, seconds, mode, startedAt.toISOString(), endedAt.toISOString());
  res.status(201).json({ id: info.lastInsertRowid });
});

app.get("/api/sessions", auth, (req, res) => {
  const rows = db.prepare(`SELECT id, day_key AS dayKey, local_date AS localDate, seconds, mode, started_at AS startedAt, ended_at AS endedAt
    FROM sessions WHERE user_id = ? AND edital = ? ORDER BY started_at DESC LIMIT 50`).all(req.user.id, req.user.edital);
  res.json({ sessions: rows });
});

app.delete("/api/sessions/:id", auth, (req, res) => {
  db.prepare("DELETE FROM sessions WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// ---------- estatísticas ----------
function addDays(dateStr, n) {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

app.get("/api/stats", auth, (req, res) => {
  const today = DATE_RE.test(req.query.today || "") ? req.query.today : new Date().toISOString().slice(0, 10);
  const uid = req.user.id, ed = req.user.edital;

  const byDate = Object.fromEntries(db.prepare(
    "SELECT local_date, SUM(seconds) s FROM sessions WHERE user_id = ? AND edital = ? GROUP BY local_date"
  ).all(uid, ed).map(r => [r.local_date, r.s]));

  const byDayKey = Object.fromEntries(db.prepare(
    "SELECT day_key, SUM(seconds) s FROM sessions WHERE user_id = ? AND edital = ? AND day_key IS NOT NULL GROUP BY day_key"
  ).all(uid, ed).map(r => [r.day_key, r.s]));

  const last14 = [];
  for (let i = 13; i >= 0; i--) { const d = addDays(today, -i); last14.push({ date: d, seconds: byDate[d] || 0 }); }

  let week = 0; for (let i = 0; i < 7; i++) week += byDate[addDays(today, -i)] || 0;
  const total = Object.values(byDate).reduce((a, b) => a + b, 0);

  // sequência: dias seguidos com estudo (hoje conta se já estudou; senão começa de ontem)
  let streak = 0, d = byDate[today] ? today : addDays(today, -1);
  while (byDate[d]) { streak++; d = addDays(d, -1); }

  const sessionsCount = db.prepare("SELECT COUNT(*) c FROM sessions WHERE user_id = ? AND edital = ?").get(uid, ed).c;
  res.json({ today: byDate[today] || 0, week, total, streak, sessionsCount, last14, byDayKey });
});

// ---------- apostilas ----------
const APOSTILAS_DIR = path.join(__dirname, "public", "apostilas");

app.get("/api/apostilas", auth, (req, res) => {
  let files = [];
  try { files = fs.readdirSync(path.join(APOSTILAS_DIR, req.user.edital)); } catch {}
  res.json({ days: files.filter(f => /^\d{4}-\d{2}-\d{2}\.html$/.test(f)).map(f => f.slice(0, 10)).sort() });
});

app.get("/api/notes/:dayKey", auth, (req, res) => {
  if (!DATE_RE.test(req.params.dayKey)) return fail(res, 400, "Dia inválido.");
  const row = db.prepare("SELECT data, updated_at FROM notes WHERE user_id = ? AND edital = ? AND day_key = ?")
    .get(req.user.id, req.user.edital, req.params.dayKey);
  const data = row ? JSON.parse(row.data) : { highlights: [], bookmark: null };
  res.json({ ...data, updatedAt: row?.updated_at || null });
});

app.put("/api/notes/:dayKey", auth, (req, res) => {
  if (!DATE_RE.test(req.params.dayKey)) return fail(res, 400, "Dia inválido.");
  const hl = Array.isArray(req.body.highlights) ? req.body.highlights.slice(0, 2000) : [];
  const clean = hl.map(h => ({
    id: String(h.id || "").slice(0, 40), b: Math.max(0, parseInt(h.b, 10) || 0),
    s: Math.max(0, parseInt(h.s, 10) || 0), e: Math.max(0, parseInt(h.e, 10) || 0),
    c: ["y", "g", "p", "b"].includes(h.c) ? h.c : "y",
    note: String(h.note || "").slice(0, 2000), text: String(h.text || "").slice(0, 400),
  })).filter(h => h.id && h.e > h.s);
  const bm = req.body.bookmark;
  const bookmark = bm && Number.isInteger(bm.b) ? { b: bm.b, at: String(bm.at || "").slice(0, 40) } : null;
  db.prepare(`INSERT INTO notes (user_id, edital, day_key, data, updated_at) VALUES (?,?,?,?,datetime('now'))
    ON CONFLICT(user_id, edital, day_key) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`)
    .run(req.user.id, req.user.edital, req.params.dayKey, JSON.stringify({ highlights: clean, bookmark }));
  res.json({ ok: true });
});

// ---------- front-end ----------
app.use(express.static(path.join(__dirname, "public"), { extensions: ["html"] }));
app.use("/api", (req, res) => fail(res, 404, "Rota não encontrada."));
app.get(/^\/(?!api\/).*/, (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.listen(PORT, () => console.log(`Caderno INB rodando em http://localhost:${PORT}`));
