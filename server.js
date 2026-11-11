require("./load-env");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const express = require("express");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./db");

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
  return { id: u.id, name: u.name, email: u.email, edital: u.edital, dailyGoal: u.daily_goal, createdAt: u.created_at };
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
  const info = db.prepare("INSERT INTO users (name, email, password_hash, edital) VALUES (?,?,?,?)").run(name, email, hash, edital);
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
  if (!(goal >= 10 && goal <= 600)) return fail(res, 400, "Meta diária deve ficar entre 10 e 600 minutos.");
  db.prepare("UPDATE users SET name = ?, edital = ?, daily_goal = ? WHERE id = ?").run(name, edital, goal, u.id);
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
  const rows = db.prepare("SELECT day_key FROM progress WHERE user_id = ? AND edital = ?").all(req.user.id, req.user.edital);
  res.json({ done: rows.map(r => r.day_key) });
});

app.put("/api/progress/:dayKey", auth, (req, res) => {
  const key = req.params.dayKey;
  if (!DATE_RE.test(key)) return fail(res, 400, "Dia inválido.");
  if (req.body.done) {
    db.prepare("INSERT OR IGNORE INTO progress (user_id, edital, day_key) VALUES (?,?,?)").run(req.user.id, req.user.edital, key);
  } else {
    db.prepare("DELETE FROM progress WHERE user_id = ? AND edital = ? AND day_key = ?").run(req.user.id, req.user.edital, key);
  }
  res.json({ ok: true });
});

// ---------- sessões de foco ----------
app.post("/api/sessions", auth, (req, res) => {
  const b = req.body || {};
  const seconds = Math.round(Number(b.seconds));
  const dayKey = b.dayKey && DATE_RE.test(b.dayKey) ? b.dayKey : null;
  const localDate = String(b.localDate || "");
  const mode = ["meta", "pomodoro", "livre"].includes(b.mode) ? b.mode : "livre";
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
