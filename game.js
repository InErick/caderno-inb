// =====================================================================
// Gamificação e desempenho: XP, níveis, sequência, cobertura do edital,
// termômetro de aprovação, atrasados e conquistas.
// Tudo é calculado a partir de `progress` e `question_logs`, então nunca
// fica dessincronizado. Só a data de desbloqueio das conquistas é gravada.
// =====================================================================
const Plans = require("./public/js/plans.js");

const MATS = ["ESP", "POR", "NOR", "ING"];
const XP = { day: 50, late: 30, correct: 3, achievement: 100 };
const LEVELS = ["Estagiário", "Júnior I", "Júnior II", "Pleno I", "Pleno II", "Sênior", "Tech Lead", "Arquiteto", "Aprovado"];

// XP acumulado para chegar ao nível n (1 = 0, 2 = 100, 3 = 300, 4 = 600, ...)
const cum = n => 50 * n * (n - 1);
function levelInfo(xp) {
  let n = 1;
  while (xp >= cum(n + 1)) n++;
  const name = n <= LEVELS.length ? LEVELS[n - 1] : `${LEVELS[LEVELS.length - 1]} ${"★".repeat(Math.min(5, n - LEVELS.length))}`;
  return { n, name, floor: cum(n), next: cum(n + 1) };
}

function achievementDefs(labels) {
  return [
    { code: "primeiro_dia", icon: "🚀", title: "Primeiro passo", desc: "Concluir o primeiro dia do cronograma" },
    { code: "fogo_7", icon: "🔥", title: "Em chamas", desc: "7 dias seguidos concluídos no dia certo" },
    { code: "fogo_21", icon: "🌋", title: "Fogo que não apaga", desc: "21 dias seguidos concluídos no dia certo" },
    { code: "semana_perfeita", icon: "📅", title: "Semana perfeita", desc: "Todos os dias de uma semana concluídos no prazo" },
    { code: "q100", icon: "💯", title: "Centena", desc: "100 questões resolvidas" },
    { code: "q500", icon: "🏃", title: "Maratonista", desc: "500 questões resolvidas" },
    { code: "mira_esp", icon: "🎯", title: "Mira afiada", desc: `70% de acerto em ${labels.ESP} (com 50 questões ou mais)` },
    ...MATS.map(m => ({ code: `cob_${m}`, icon: "📚", title: `${labels[m]} 100%`, desc: `Todos os tópicos de ${labels[m]} cobertos` })),
    { code: "simulado", icon: "📝", title: "Primeiro simulado", desc: "Fazer o primeiro simulado" },
    { code: "em_dia", icon: "✅", title: "Em dia", desc: "14 dias concluídos e nenhum atrasado" },
  ];
}

const addDays = (key, n) => { const d = new Date(key + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

function compute(db, user, today) {
  const uid = user.id, ed = user.edital, cfg = Plans.EDITAIS[ed], labels = cfg.labels;
  const plan = Plans.build(ed);
  const byKey = new Map(plan.map(d => [d.key, d]));

  // ---------- dias concluídos ----------
  const done = {};
  for (const r of db.prepare("SELECT day_key, done_local, late FROM progress WHERE user_id = ? AND edital = ?").all(uid, ed)) {
    if (byKey.has(r.day_key)) done[r.day_key] = { late: !!r.late, doneLocal: r.done_local };
  }
  const onTime = k => done[k] && !done[k].late;
  const doneCount = Object.keys(done).length;

  // sequência: dias seguidos concluídos no prazo (hoje conta se já concluiu)
  let streak = 0, d = onTime(today) ? today : addDays(today, -1);
  while (byKey.has(d) && onTime(d)) { streak++; d = addDays(d, -1); }
  let best = 0, run = 0;
  for (const day of plan) { if (day.key > today && !done[day.key]) break; run = onTime(day.key) ? run + 1 : 0; best = Math.max(best, run); }

  const late = plan.filter(x => x.key < today && !done[x.key]).map(x => x.key);

  // ---------- cobertura do edital ----------
  const topicsOf = day => day.sub.map(s => s.id);
  const cov = Object.fromEntries(MATS.map(m => [m, { done: 0, all: 0 }]));
  for (const day of plan) {
    const t = topicsOf(day).length; if (!t || !cov[day.m]) continue;
    cov[day.m].all += t; if (done[day.key]) cov[day.m].done += t;
  }
  const covTotal = MATS.reduce((a, m) => ({ done: a.done + cov[m].done, all: a.all + cov[m].all }), { done: 0, all: 0 });

  // ---------- questões ----------
  const logs = db.prepare("SELECT day_key, local_date, materia, source, done, correct FROM question_logs WHERE user_id = ? AND edital = ?").all(uid, ed);
  const qByM = Object.fromEntries(MATS.map(m => [m, { done: 0, correct: 0 }]));
  const qByDate = {}, qByDay = {};
  let qDone = 0, qCorrect = 0, hasSim = false;
  for (const l of logs) {
    qByM[l.materia].done += l.done; qByM[l.materia].correct += l.correct;
    qDone += l.done; qCorrect += l.correct;
    (qByDate[l.local_date] ||= { done: 0, correct: 0 }); qByDate[l.local_date].done += l.done; qByDate[l.local_date].correct += l.correct;
    if (l.day_key) { (qByDay[l.day_key] ||= { done: 0, correct: 0 }); qByDay[l.day_key].done += l.done; qByDay[l.day_key].correct += l.correct; }
    if (l.source === "simulado") hasSim = true;
  }
  if (plan.some(x => x.kind === "SIM" && done[x.key])) hasSim = true;

  // ---------- termômetro de aprovação ----------
  const MIN_Q = 10;
  const est = {}; let estTotal = 0, partial = false;
  for (const m of MATS) {
    const q = qByM[m];
    if (q.done >= MIN_Q) { est[m] = (q.correct / q.done) * cfg.pontos[m]; estTotal += est[m]; }
    else { est[m] = null; partial = true; }
  }
  const alerts = [];
  if (est.ESP !== null && est.ESP < cfg.minEsp) alerts.push({ type: "esp", text: `${labels.ESP} abaixo do mínimo de ${cfg.minEsp} pontos` });
  if (!partial && estTotal < cfg.minTotal) alerts.push({ type: "total", text: `Total abaixo do mínimo de ${cfg.minTotal} pontos` });
  for (const m of MATS) if (qByM[m].done > 0 && qByM[m].correct === 0) alerts.push({ type: "zero", text: `Nenhum acerto em ${labels[m]} até agora: risco de zerar a matéria` });

  // piores dias (para a revisão): menor % de acerto com pelo menos 3 questões
  const worst = Object.entries(qByDay).filter(([k, q]) => q.done >= 3 && byKey.has(k))
    .map(([k, q]) => ({ key: k, done: q.done, correct: q.correct, pct: q.correct / q.done }))
    .sort((a, b) => a.pct - b.pct).slice(0, 6);

  // ---------- semanas perfeitas ----------
  const weeks = {};
  for (const day of plan) { (weeks[day.week] ||= []).push(day.key); }
  const perfectWeek = Object.values(weeks).some(ks => ks.length >= 7 && ks.every(onTime));

  // ---------- conquistas ----------
  const defs = achievementDefs(labels);
  const cond = {
    primeiro_dia: doneCount >= 1,
    fogo_7: best >= 7,
    fogo_21: best >= 21,
    semana_perfeita: perfectWeek,
    q100: qDone >= 100,
    q500: qDone >= 500,
    mira_esp: qByM.ESP.done >= 50 && qByM.ESP.correct / qByM.ESP.done >= 0.7,
    simulado: hasSim,
    em_dia: doneCount >= 14 && late.length === 0,
  };
  for (const m of MATS) cond[`cob_${m}`] = cov[m].all > 0 && cov[m].done === cov[m].all;

  const ins = db.prepare("INSERT OR IGNORE INTO achievements (user_id, edital, code) VALUES (?,?,?)");
  const fresh = [];
  for (const a of defs) if (cond[a.code] && ins.run(uid, ed, a.code).changes) fresh.push(a.code);
  const unlocked = Object.fromEntries(db.prepare("SELECT code, unlocked_at FROM achievements WHERE user_id = ? AND edital = ?").all(uid, ed).map(r => [r.code, r.unlocked_at]));
  const achievements = defs.map(a => ({ ...a, unlockedAt: unlocked[a.code] || null }));

  // ---------- XP ----------
  const xpDays = Object.values(done).reduce((s, x) => s + (x.late ? XP.late : XP.day), 0);
  const xpQ = qCorrect * XP.correct;
  const xpA = achievements.filter(a => a.unlockedAt).length * XP.achievement;
  const xp = xpDays + xpQ + xpA;

  return {
    today,
    xp: { total: xp, days: xpDays, questions: xpQ, achievements: xpA, rules: XP },
    level: levelInfo(xp),
    streak, bestStreak: best,
    done, late,
    coverage: { total: covTotal, byM: cov },
    questions: { total: { done: qDone, correct: qCorrect }, byM: qByM, byDate: qByDate, byDay: qByDay },
    thermo: { est, total: estTotal, partial, minQ: MIN_Q, alerts, max: cfg.pontos, minEsp: cfg.minEsp, minTotal: cfg.minTotal, totalMax: cfg.totalMax },
    worst,
    achievements,
    newAchievements: achievements.filter(a => fresh.includes(a.code)),
  };
}

module.exports = { compute, XP, MATS };
