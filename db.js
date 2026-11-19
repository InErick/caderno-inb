const path = require("path");
const fs = require("fs");
// SQLite embutido no Node (22.13+): sem dependência nativa para compilar na hospedagem.
const { DatabaseSync } = require("node:sqlite");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "data", "caderno.db");
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  email         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT    NOT NULL,
  edital        TEXT    NOT NULL CHECK (edital IN ('analista','assistente')),
  daily_goal    INTEGER NOT NULL DEFAULT 60,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Dias do cronograma marcados como concluídos (separado por edital)
CREATE TABLE IF NOT EXISTS progress (
  user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  edital   TEXT    NOT NULL,
  day_key  TEXT    NOT NULL,
  done_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, edital, day_key)
);

-- Cada sessão de foco cronometrada
CREATE TABLE IF NOT EXISTS sessions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  edital      TEXT    NOT NULL,
  day_key     TEXT,               -- dia do cronograma estudado (pode ser nulo = estudo livre)
  local_date  TEXT    NOT NULL,   -- data local (YYYY-MM-DD) em que a sessão aconteceu
  seconds     INTEGER NOT NULL CHECK (seconds > 0),
  mode        TEXT    NOT NULL,
  started_at  TEXT    NOT NULL,
  ended_at    TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON sessions(user_id, local_date);

-- Marca-texto, notas e "parei aqui" de cada apostila
CREATE TABLE IF NOT EXISTS notes (
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  edital     TEXT    NOT NULL,
  day_key    TEXT    NOT NULL,
  data       TEXT    NOT NULL,
  updated_at TEXT    NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, edital, day_key)
);

-- Questões lançadas manualmente (feitas e acertos), por dia e matéria
CREATE TABLE IF NOT EXISTS question_logs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  edital     TEXT    NOT NULL,
  day_key    TEXT,                 -- dia do cronograma (nulo = avulso)
  local_date TEXT    NOT NULL,     -- data local em que resolveu
  materia    TEXT    NOT NULL CHECK (materia IN ('ESP','POR','NOR','ING')),
  source     TEXT    NOT NULL DEFAULT 'diario' CHECK (source IN ('diario','simulado','revisao')),
  done       INTEGER NOT NULL CHECK (done > 0),
  correct    INTEGER NOT NULL CHECK (correct >= 0 AND correct <= done),
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_qlogs_user ON question_logs(user_id, edital, local_date);

-- Conquistas desbloqueadas (a data fica registrada; XP é calculado)
CREATE TABLE IF NOT EXISTS achievements (
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  edital      TEXT    NOT NULL,
  code        TEXT    NOT NULL,
  unlocked_at TEXT    NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, edital, code)
);
`);

// ---------- migrações de colunas (idempotentes) ----------
function addColumn(table, col, ddl) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name);
  if (!cols.includes(col)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${ddl}`);
}
addColumn("progress", "done_local", "TEXT");                       // data local em que o dia foi concluído
addColumn("progress", "late", "INTEGER NOT NULL DEFAULT 0");       // 1 = recuperado depois da data

module.exports = db;
