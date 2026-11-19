// =====================================================================
// Caderno INB — telas do app (SPA sem framework)
// =====================================================================
(() => {
  const S = { user: null, plan: [], legacy: [], done: new Set(), details: {}, stats: null, g: null, filter: "ALL", query: "", pick: null, mode: "dia", openDays: new Set(), apostilas: new Set(), planView: "lista", calMonth: null, todayLogs: [], bank: {}, unlocked: new Set(), due: 0, inReview: 0, qFilter: "ALL" };
  const MATS = ["ESP", "POR", "NOR", "ING"];
  const pct = (a, b) => b ? Math.round((a / b) * 100) : 0;
  const findDay = k => S.plan.find(x => x.key === k) || S.legacy.find(x => x.key === k);
  const app = document.getElementById("app");
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const todayKey = () => Plans.keyOf(new Date());
  const DOW = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const ED = () => Plans.EDITAIS[S.user.edital];
  const mins = s => Math.round((s || 0) / 60);
  const hm = s => { if (s > 0 && s < 60) return `${Math.round(s)}s`; const m = mins(s); return m >= 60 ? `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}` : `${m} min`; };
  const dParts = key => { const [y, m, d] = key.split("-").map(Number); return { d, m, y, dow: new Date(y, m - 1, d).getDay() }; };
  const initials = n => n.split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0].toUpperCase()).join("");

  // ---------- toast / modal ----------
  let toastT;
  function toast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2600);
  }
  function modal(html, bind) {
    const m = document.getElementById("modal");
    m.innerHTML = `<div class="card">${html}</div>`; m.hidden = false;
    const close = () => { m.hidden = true; m.innerHTML = ""; };
    m.onclick = e => { if (e.target === m) close(); };
    bind?.(m, close);
    return close;
  }
  function confirmBox(title, text, okLabel, onOk) {
    modal(`<h3>${esc(title)}</h3><p class="muted small">${esc(text)}</p>
      <div class="actions"><button class="btn btn-pink btn-block" data-ok>${esc(okLabel)}</button><button class="btn btn-ghost btn-block" data-x>Cancelar</button></div>`,
      (m, close) => { m.querySelector("[data-ok]").onclick = () => { close(); onOk(); }; m.querySelector("[data-x]").onclick = close; });
  }

  // ---------- boot ----------
  async function boot() {
    app.innerHTML = `<div class="loading">Carregando…</div>`;
    try {
      const { user } = await Api.me();
      await enter(user);
    } catch { renderAuth("start"); }
  }

  async function enter(user) {
    S.user = user;
    S.plan = Plans.build(user.edital);
    S.legacy = Plans.legacy(user.edital);
    Timer.reset();
    Timer.init(user, { toast, confirm: confirmBox, onSaved });
    await refreshData();
    renderShell();
    if (!location.hash) location.hash = "#inicio"; else route();
  }

  async function refreshData() {
    const tk = todayKey();
    const [p, st, ap, g, ql, bk] = await Promise.all([Api.progress(), Api.stats(tk), Api.apostilas().catch(() => ({ days: [] })),
      Api.dashboard(tk), Api.questions(tk, tk).catch(() => ({ logs: [] })), Api.bank(tk).catch(() => ({ days: {}, unlocked: [] }))]);
    S.bank = bk.days || {}; S.unlocked = new Set(bk.unlocked || []); S.due = bk.due || 0; S.inReview = bk.inReview || 0;
    S.done = new Set(p.done);
    S.details = p.details || {};
    S.stats = st;
    S.apostilas = new Set(ap.days);
    S.g = g;
    S.todayLogs = ql.logs;
    if (g.newAchievements?.length) setTimeout(() => showAchievements(g.newAchievements), 400);
  }

  // atualização leve depois de responder uma questão (XP, meta e contadores do banco)
  async function refreshGame() {
    const tk = todayKey();
    const [g, bk] = await Promise.all([Api.dashboard(tk), Api.bank(tk).catch(() => null)]);
    S.g = g;
    if (bk) { S.bank = bk.days || {}; S.unlocked = new Set(bk.unlocked || []); S.due = bk.due || 0; S.inReview = bk.inReview || 0; }
    if (g.newAchievements?.length) setTimeout(() => showAchievements(g.newAchievements), 400);
  }

  function planToday() {
    const k = todayKey(), P = S.plan;
    return P.find(d => d.key === k) || (k < P[0].key ? P[0] : P[P.length - 1]);
  }

  // =================================================================
  // AUTENTICAÇÃO
  // =================================================================
  const LOGO = `<span class="brand-symbol xl"><span></span></span>`;

  function renderAuth(screen) {
    document.body.style.background = "";
    if (screen === "start") {
      app.innerHTML = `<div class="auth"><div class="phone">
        <div class="brand">${LOGO}<h1>Caderno INB</h1><p>Seu cronograma de estudos para o concurso INB 2026, com cronômetro de foco.</p></div>
        <div class="auth-start">
          <button class="btn btn-pink btn-block" data-go="register">Começar</button>
          <button class="btn btn-ghost btn-block" data-go="login">Já tenho conta</button>
        </div></div></div>`;
    } else if (screen === "login") {
      app.innerHTML = `<div class="auth"><div class="phone">
        <button class="auth-back" data-go="start" aria-label="Voltar">${Icon("chevron", 22, "")}</button>
        <div class="avatar-lg">${Icon("user", 40)}</div>
        <form id="f">
          <div class="field"><label>E-mail</label><input name="email" type="email" autocomplete="email" required></div>
          <div class="field"><label>Senha</label><input name="password" type="password" autocomplete="current-password" required></div>
          <div class="form-error" id="err"></div>
          <button class="btn btn-purple btn-block">Entrar</button>
        </form>
        <div class="auth-switch">Ainda não tem conta? <button class="link-btn" data-go="register">Criar conta</button></div>
      </div></div>`;
      bindForm(async fd => (await Api.login(fd.email, fd.password)).user);
    } else {
      app.innerHTML = `<div class="auth"><div class="phone">
        <button class="auth-back" data-go="start" aria-label="Voltar">${Icon("chevron", 22, "")}</button>
        <div class="avatar-lg">${Icon("user", 40)}</div>
        <form id="f">
          <div class="field"><label>Nome</label><input name="name" autocomplete="name" required maxlength="60"></div>
          <div class="field"><label>E-mail</label><input name="email" type="email" autocomplete="email" required></div>
          <div class="field"><label>Senha (mín. 6 caracteres)</label><input name="password" type="password" autocomplete="new-password" minlength="6" required></div>
          <div class="field"><label>Qual cronograma você vai seguir?</label></div>
          <div class="edital-pick">${editalCards(null)}</div>
          <input type="hidden" name="edital">
          <div class="form-error" id="err"></div>
          <button class="btn btn-purple btn-block">Criar conta</button>
        </form>
        <div class="auth-switch">Já tem conta? <button class="link-btn" data-go="login">Entrar</button></div>
      </div></div>`;
      bindEditalPick(app, v => app.querySelector('[name="edital"]').value = v);
      bindForm(async fd => {
        if (!fd.edital) throw new Error("Escolha um dos cronogramas.");
        return (await Api.register(fd)).user;
      });
    }
    app.querySelectorAll("[data-go]").forEach(b => b.onclick = () => renderAuth(b.dataset.go));
    app.querySelector(".auth-back svg")?.setAttribute("style", "transform:rotate(180deg)");
  }

  function editalCards(sel) {
    return Object.values(Plans.EDITAIS).map((e, i) => `
      <button type="button" class="edital-card ${i ? "purple" : "blue"} ${sel === e.id ? "sel" : ""}" data-ed="${e.id}">
        <div class="ico">${Icon(i ? "book" : "cap", 26)}</div>
        <div><b>${e.nome}</b><span>${e.nivel} · prova ${e.prova.split("·")[1].trim()}</span></div>
        <div class="tick">${Icon("check", 14)}</div>
      </button>`).join("");
  }
  function bindEditalPick(root, onPick) {
    root.querySelectorAll("[data-ed]").forEach(b => b.onclick = () => {
      root.querySelectorAll("[data-ed]").forEach(x => x.classList.toggle("sel", x === b));
      onPick(b.dataset.ed);
    });
  }
  function bindForm(submit) {
    const f = document.getElementById("f"), err = document.getElementById("err");
    f.onsubmit = async e => {
      e.preventDefault();
      const btn = f.querySelector("button.btn"); btn.disabled = true; err.textContent = "";
      try { await enter(await submit(Object.fromEntries(new FormData(f)))); }
      catch (x) { err.textContent = x.message; btn.disabled = false; }
    };
  }

  // =================================================================
  // SHELL + ROTAS
  // =================================================================
  const NAV = [
    ["inicio", "home", "Hoje"], ["cronograma", "calendar", "Cronograma"], ["foco", "timer", "Foco"],
    ["questoes", "edit", "Questões"], ["estatisticas", "chart", "Desempenho"], ["perfil", "user", "Perfil"],
  ];
  const daysLeft = () => Math.max(0, Math.ceil((new Date(ED().examISO) - Date.now()) / 864e5));

  function renderShell() {
    app.innerHTML = `<div class="shell">
      <nav class="nav">
        <div class="nav-brand"><span class="brand-symbol"><span></span></span>Caderno INB</div>
        <p class="nav-label">SEU ESPAÇO</p>
        ${NAV.map(([id, ic, l]) => `<a href="#${id}" data-r="${id}" class="${id === "foco" ? "focus-tab" : ""} nav-${id}">${Icon(ic, id === "foco" ? 26 : 22)}<span>${l}</span></a>`).join("")}
        <div class="nav-goal" id="navGoal"></div>
      </nav>
      <div class="content">
        <header class="topbar">
          <a class="av" href="#perfil" title="Perfil">${esc(initials(S.user.name))}</a>
          <div class="who"><b>${esc(S.user.name.split(" ")[0])}</b><span>${ED().nome}</span></div>
          <div class="top-chips" id="topChips"></div>
        </header>
        <main class="main" id="view"></main>
      </div></div>`;
    updateTopbar();
  }

  // contagem regressiva, nível e sequência ficam sempre visíveis no topo
  function updateTopbar() {
    const el = document.getElementById("topChips"); if (!el || !S.g) return;
    const d = daysLeft();
    el.innerHTML = `
      <a class="tchip fire ${S.g.streak ? "" : "off"}" href="#conquistas" title="Sequência de dias">🔥 <b>${S.g.streak}</b></a>
      <a class="tchip lvl" href="#conquistas" title="${esc(S.g.level.name)} · ${S.g.xp.total} XP">Nv <b>${S.g.level.n}</b></a>
      <span class="tchip days" title="Dias até a prova">${Icon("clock", 14)}<b>${d > 0 ? d : "Prova!"}</b>${d > 0 ? `<span class="hide-xs"> dias</span>` : ""}</span>`;
    drawNavGoal();
  }

  function drawNavGoal() {
    const ng = document.getElementById("navGoal");
    if (ng && S.g) {
      const c = S.g.coverage.total, p = pct(c.done, c.all), lv = S.g.level;
      const lp = Math.min(100, Math.round(((S.g.xp.total - lv.floor) / (lv.next - lv.floor)) * 100));
      ng.innerHTML = `<div class="gh">${Icon("trophy", 16)}<span>${esc(lv.name)}</span><b>Nv ${lv.n}</b></div><div class="track"><i style="width:${lp}%"></i></div><p>${S.g.xp.total} XP · faltam ${lv.next - S.g.xp.total} para o próximo nível</p>
        <div class="gh" style="margin-top:12px">${Icon("target", 16)}<span>Edital coberto</span><b>${p}%</b></div><div class="track"><i style="width:${p}%;background:#5fb596"></i></div>`;
    }
  }

  function route() {
    if (!S.user) return;
    Reader.close();
    const full = (location.hash || "#inicio").slice(1);
    const r = full.startsWith("apostila/") ? "apostila" : full.startsWith("questoes/") ? "quiz" : full.startsWith("banco/") ? "assunto" : full.startsWith("treino") ? "treino" : full;
    const md = document.getElementById("modal"); md.hidden = true; md.innerHTML = "";
    const navOf = { quiz: "inicio", assunto: "questoes", treino: "questoes", erros: "questoes", apostila: "cronograma", atrasados: "cronograma", conquistas: "estatisticas" };
    document.querySelectorAll(".nav a").forEach(a => a.classList.toggle("on", a.dataset.r === (navOf[r] || r)));
    const v = document.getElementById("view");
    if (!v) return;
    v.onclick = null;
    updateTopbar();
    if (r === "apostila") return viewApostila(v, full.slice(9));
    if (["quiz", "assunto", "treino", "erros"].includes(r)) {
      window.scrollTo(0, 0);
      const src = r === "quiz" ? { kind: "day", key: full.slice(9) } : r === "assunto" ? { kind: "assunto", key: full.slice(6) }
        : r === "treino" ? { kind: "treino", materia: full.split("/")[1] || null } : { kind: "erros" };
      return viewQuiz(v, src);
    }
    ({ inicio: viewHome, questoes: viewQuestions, cronograma: viewPlan, foco: viewFocus, estatisticas: viewStats, perfil: viewProfile, conquistas: viewAchievements, atrasados: viewLate }[r] || viewHome)(v);
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);

  // =================================================================
  // PEÇAS REUTILIZADAS
  // =================================================================
  function ring(p, color, label, sub) {
    const r = 46, c = 2 * Math.PI * r, x = Math.max(0, Math.min(1, p));
    return `<div class="ring"><svg width="112" height="112" viewBox="0 0 112 112">
      <circle cx="56" cy="56" r="${r}" fill="none" stroke="#eeede9" stroke-width="10"/>
      <circle cx="56" cy="56" r="${r}" fill="none" stroke="${color}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - x)}"/>
    </svg><div class="val"><div>${label}<small>${sub || ""}</small></div></div></div>`;
  }

  const searchUrl = (d, s) => d.yt ? `https://www.youtube.com/results?search_query=${encodeURIComponent(s)}` : `https://www.google.com/search?q=${encodeURIComponent(s)}`;
  function dayCardBody(d, n = 99) {
    const subs = d.sub?.length ? `<ul class="sub-list">${d.sub.map(x => `<li>${esc(x.n)}</li>`).join("")}</ul>` : "";
    const kws = d.k.slice(0, n).map(s => `<a href="${searchUrl(d, s)}" target="_blank" rel="noopener">${d.yt ? "▶ " : ""}${esc(s)}</a>`).join("");
    return `${subs}${d.yt ? `<div class="kw-h">Buscar videoaula no YouTube</div>` : ""}<div class="kw ${d.yt ? "yt" : ""}">${kws}</div><div class="foco-txt">🎯 ${d.f}</div>`;
  }
  const phaseTxt = d => (d.phases || []).map(p => `${p.min} min ${p.label.toLowerCase()}`).join(" + ");

  // situação de um dia do cronograma
  function dayStatus(d) {
    if (d.legacy) return S.done.has(d.key) ? "done" : "old";
    const det = S.details[d.key], tk = todayKey();
    if (det) return det.late ? "recovered" : "done";
    if (d.key < tk) return "late";
    return d.key === tk ? "today" : "future";
  }
  const STATUS_TXT = { done: "concluído", recovered: "recuperado", late: "atrasado", today: "hoje", future: "", old: "" };

  function levelBar(g) {
    const lv = g.level, p = Math.min(100, Math.round(((g.xp.total - lv.floor) / (lv.next - lv.floor)) * 100));
    return `<div class="lvl-row"><span class="lvl-badge">${lv.n}</span><div class="lvl-info"><div><b>${esc(lv.name)}</b><span class="muted small">${g.xp.total} XP · faltam ${lv.next - g.xp.total}</span></div>
      <div class="xpbar"><i style="width:${p}%"></i></div></div></div>`;
  }

  // =================================================================
  // HOJE
  // =================================================================

  function viewHome(v) {
    const t = planToday(), g = S.g, st = S.stats, goal = S.user.dailyGoal * 60, lab = ED().labels, tk = todayKey();
    const idx = S.plan.indexOf(t), next = S.plan.slice(idx + 1, idx + 4);
    const status = dayStatus(t), isDone = status === "done" || status === "recovered";
    const studied = st.byDayKey[t.key] || 0;
    const cov = g.coverage.total;
    const h = new Date().getHours(), hi = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
    const now = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
    const p = dParts(t.key), notToday = t.key !== tk;
    const qd = g.questions.byDate[tk] || { done: 0, correct: 0 };
    const bk = S.bank[t.key];
    const xpGain = t.key < tk ? g.xp.rules.late : g.xp.rules.day;

    v.innerHTML = `
      <section class="welcome"><p class="eyebrow">${esc(now)}</p><h1>${hi}, ${esc(S.user.name.split(" ")[0])}.</h1><p class="sub">Um dia de cada vez. Hoje vale ${g.xp.rules.day} XP.</p></section>
      <div class="game-strip">
        <div class="card gs-level">${levelBar(g)}</div>
        <a class="card gs-fire ${g.streak ? "" : "off"}" href="#conquistas"><span class="flame">🔥</span><div><b>${g.streak}</b><span>${g.streak === 1 ? "dia seguido" : "dias seguidos"}</span></div></a>
        <div class="card gs-days"><span class="lbl">Faltam</span><b>${daysLeft()}</b><span>dias para a prova</span></div>
      </div>
      ${g.late.length ? `<a class="late-banner" href="#atrasados">${Icon("clock", 18)}<span>Você tem <b>${g.late.length} ${g.late.length === 1 ? "dia atrasado" : "dias atrasados"}</b>. Recupere e ganhe ${g.xp.rules.late} XP por dia.</span>${Icon("chevron", 18)}</a>` : ""}

      <div class="section-title">${notToday ? (tk < t.key ? "Primeiro dia do cronograma" : "Último dia do cronograma") : "Tarefa de hoje"} <span class="muted small">${DOW[p.dow]}, ${String(p.d).padStart(2, "0")}/${MONTHS[p.m - 1]} · dia ${t.index}/${S.plan.length}</span></div>
      <div class="card today-card t-${t.m}">
        <span class="tag">${lab[t.m]}</span><span class="area">${esc(t.a)}</span>
        <div class="ttl">${esc(t.t)}</div>
        ${dayCardBody(t, 4)}
        <div class="phase-row">${(t.phases || []).map((ph, i) => `<span class="phase"><b>${ph.min} min</b>${esc(ph.label)}</span>${i < t.phases.length - 1 ? `<span class="ph-arrow">→</span>` : ""}`).join("")}</div>
        <div class="day-actions" style="margin-top:12px">
          <button class="btn btn-pink" id="startToday">${Icon("play", 16)} ${Timer.isActive() ? "Voltar ao foco" : "Começar cronômetro"}</button>
          ${bk ? `<a class="btn btn-ghost" href="#questoes/${t.key}">📝 Questões <span class="muted">${bk.answered}/${bk.n}</span></a>` : ""}
          ${S.apostilas.has(t.key) ? `<a class="btn btn-ghost ap-btn" href="#apostila/${t.key}">📖 Apostila</a>` : ""}
          ${studied ? `<span class="badge-time">${Icon("clock", 14)} ${hm(studied)} estudados</span>` : ""}
        </div>
        <div class="done-row">
          ${isDone ? `<div class="done-ok">${Icon("check", 18)} Dia concluído${status === "recovered" ? " (recuperado)" : ""}<button class="link-btn small" id="undoToday">desfazer</button></div>`
            : `<button class="btn btn-dark btn-block" id="doneToday">${Icon("check", 18)} Concluir dia <span class="xp-pill">+${xpGain} XP</span></button>`}
        </div>
      </div>

      <div class="section-title">Questões do dia <span class="muted small">meta ${Math.min(g.meta.today, g.meta.goal)}/${g.meta.goal}${g.meta.met ? " ✅" : ""}${qd.done ? ` · ${pct(qd.correct, qd.done)}% de acerto` : ""} · <a href="#questoes">abrir aba Questões →</a></span></div>
      ${bk?.n ? bankBlock(t, bk) : ""}
      <div class="card" id="qCard">${bk?.n ? `<details class="q-manual"><summary>Lançar questões feitas fora do app</summary>${questionForm(t)}</details>` : questionForm(t)}</div>

      <div class="rings" style="margin-top:14px">
        <div class="card ring-card"><div class="lbl">Edital coberto</div>${ring(cov.all ? cov.done / cov.all : 0, "#3f8a72", `${pct(cov.done, cov.all)}%`, `${cov.done} de ${cov.all} tópicos`)}</div>
        <div class="card ring-card"><div class="lbl">Foco hoje</div>${ring(st.today / goal, "#ef7254", `${mins(st.today)}<span style="font-size:13px">/${S.user.dailyGoal}</span>`, "minutos")}</div>
      </div>

      ${next.length ? `<div class="section-title">Próximos dias <a href="#cronograma" class="link-btn small" style="text-decoration:none">Ver tudo</a></div>
      <div class="next-list">${next.map(d => { const q = dParts(d.key); return `
        <div class="card next-item t-${d.m}"><div class="date-bubble"><b>${String(q.d).padStart(2, "0")}</b><span>${DOW[q.dow]}</span></div>
        <div><span class="tag">${lab[d.m]}</span><div class="t" style="margin-top:4px">${esc(d.t)}</div></div></div>`; }).join("")}</div>` : ""}`;

    v.querySelector("#startToday").onclick = e => {
      if (Timer.isActive()) return Timer.expand(e.currentTarget);
      Timer.start(t, "dia", S.user.dailyGoal, e.currentTarget);
    };
    v.querySelector("#doneToday")?.addEventListener("click", () => completeDay(t.key, true));
    v.querySelector("#undoToday")?.addEventListener("click", () => completeDay(t.key, false));
    bindQuestionForm(v.querySelector("#qCard"), t, () => viewHome(v));
  }

  // ---------- lançamento de questões ----------
  function questionForm(t) {
    const lab = ED().labels, sim = t.kind === "SIM";
    const def = MATS.includes(t.m) ? t.m : "ESP";
    const rows = sim ? MATS : [null];
    const logs = S.todayLogs;
    return `<form class="q-form" id="qf">
        ${sim ? `<p class="muted small" style="margin:0 0 8px">Dia de simulado: lance os acertos de cada matéria.</p>` : ""}
        ${rows.map(m => `<div class="q-row">
          ${m ? `<span class="q-mat t-${m}"><span class="tag">${lab[m]}</span></span><input type="hidden" name="materia" value="${m}">`
              : `<select name="materia" aria-label="Matéria">${MATS.map(x => `<option value="${x}" ${x === def ? "selected" : ""}>${lab[x]}</option>`).join("")}</select>`}
          <label class="q-num"><span>Fiz</span><input name="done" type="number" min="${sim ? 0 : 1}" max="500" inputmode="numeric" ${sim ? "" : "required"} placeholder="0"></label>
          <label class="q-num"><span>Acertei</span><input name="correct" type="number" min="0" max="500" inputmode="numeric" ${sim ? "" : "required"} placeholder="0"></label>
        </div>`).join("")}
        <button class="btn btn-pink btn-sm">Lançar questões</button>
      </form>
      ${logs.length ? `<div class="q-logs">${logs.map(l => `<div class="q-log t-${l.materia}"><span class="tag">${lab[l.materia]}</span><span>${l.correct}/${l.done} · <b>${pct(l.correct, l.done)}%</b>${l.source === "simulado" ? " · simulado" : ""}</span><button class="icon-btn" data-delq="${l.id}" title="Apagar lançamento">${Icon("trash", 16)}</button></div>`).join("")}</div>` : ""}`;
  }

  function bindQuestionForm(box, t, rerender) {
    if (!box) return;
    const f = box.querySelector("#qf"), sim = t.kind === "SIM";
    f.onsubmit = async e => {
      e.preventDefault();
      const mats = [...f.querySelectorAll('[name="materia"]')].map(x => x.value);
      const dones = [...f.querySelectorAll('[name="done"]')].map(x => +x.value || 0);
      const cors = [...f.querySelectorAll('[name="correct"]')].map(x => +x.value || 0);
      const items = mats.map((m, i) => ({ materia: m, done: dones[i], correct: cors[i] })).filter(x => x.done > 0);
      if (!items.length) return toast("Informe quantas questões você fez.");
      const bad = items.find(x => x.correct > x.done);
      if (bad) return toast("Os acertos não podem passar do total de questões.");
      const before = S.g;
      try {
        for (const it of items) await Api.addQuestions({ ...it, dayKey: t.key, localDate: todayKey(), source: sim ? "simulado" : "diario" });
        await refreshData(); rerender(); updateTopbar();
        const gained = S.g.xp.total - before.xp.total;
        toast(`Questões lançadas · +${gained} XP`);
        checkLevelUp(before, S.g);
      } catch (x) { toast(x.message); }
    };
    box.onclick = e => {
      const b = e.target.closest("[data-delq]"); if (!b) return;
      confirmBox("Apagar lançamento?", "Essas questões saem do seu desempenho e o XP delas é descontado.", "Apagar", async () => {
        try { await Api.deleteQuestions(b.dataset.delq); await refreshData(); rerender(); updateTopbar(); toast("Lançamento apagado."); } catch (x) { toast(x.message); }
      });
    };
  }

  // ---------- banco de questões ----------
  function bankBlock(t, bk) {
    const left = bk.n - bk.answered, p = pct(bk.answered, bk.n);
    return `<a class="card bank-cta t-${t.m}" href="#questoes/${t.key}">
      <div class="bank-ic">📝</div>
      <div class="bank-txt"><b>${left ? `Resolver ${left} ${left === 1 ? "questão" : "questões"} de prova sobre o tema` : "Questões do dia resolvidas"}</b>
        <span>${bk.answered ? `${bk.answered}/${bk.n} respondidas · ${bk.correct} ${bk.correct === 1 ? "acerto" : "acertos"} (${pct(bk.correct, bk.answered)}%)` : `${bk.n} questões de concursos anteriores · correção na hora`}</span>
        <div class="xpbar"><i style="width:${p}%"></i></div></div>
      <span class="btn btn-pink btn-sm">${left ? (bk.answered ? "Continuar" : "Começar") : "Revisar"}</span></a>`;
  }

  // fórmulas LaTeX simples das questões → texto legível (\quad, \neq, \frac{a}{b}, x^{2}…)
  const TEX = { quad: " ", qquad: "  ", neq: "≠", ne: "≠", leq: "≤", le: "≤", geq: "≥", ge: "≥", lt: "<", gt: ">",
    times: "×", cdot: "·", div: "÷", pm: "±", ldots: "…", cdots: "…", dots: "…", infty: "∞", approx: "≈", equiv: "≡",
    rightarrow: "→", to: "→", leftarrow: "←", Rightarrow: "⇒", Leftrightarrow: "⇔", leftrightarrow: "↔", land: "∧", wedge: "∧", lor: "∨", vee: "∨",
    neg: "¬", lnot: "¬", oplus: "⊕", in: "∈", notin: "∉", subset: "⊂", subseteq: "⊆", cup: "∪", cap: "∩", emptyset: "∅", forall: "∀", exists: "∃",
    alpha: "α", beta: "β", gamma: "γ", delta: "δ", Delta: "Δ", pi: "π", sigma: "σ", Sigma: "Σ", theta: "θ", lambda: "λ", mu: "μ", sum: "Σ", prod: "∏",
    degree: "°", circ: "°", percent: "%", left: "", right: "", displaystyle: "", mathrm: "", text: "", textbf: "", mathbf: "" };
  const SUP = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "+": "⁺", "-": "⁻", "n": "ⁿ" };
  function texToText(t) {
    let s = String(t);
    for (let i = 0; i < 4; i++) s = s.replace(/\\frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, "($1)/($2)").replace(/\\sqrt\s*\{([^{}]*)\}/g, "√($1)");
    s = s.replace(/\\([a-zA-Z]+)/g, (m, w) => w in TEX ? TEX[w] : m)
      .replace(/\\([,;:! ])/g, " ").replace(/\\([{}%&$#_])/g, "$1").replace(/\\\\/g, " ")
      .replace(/\^\{([^{}]*)\}|\^(\w)/g, (m, a, b) => { const x = a ?? b; return [...x].every(c => SUP[c]) ? [...x].map(c => SUP[c]).join("") : `^(${x})`; })
      .replace(/_\{([^{}]*)\}|_(\w)/g, (m, a, b) => a ?? b)
      .replace(/[{}]/g, "");
    return s.replace(/[ \t]{2,}/g, " ").trim();
  }

  // ---------- arrumação visual das questões (roda na exibição; vale também para as já importadas) ----------
  const CODE_RE = /^\s*(SELECT|FROM|WHERE|GROUP BY|HAVING|ORDER BY|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|INNER JOIN|LEFT JOIN|RIGHT JOIN|JOIN|UNION|VALUES|SET|BEGIN|END;?|DECLARE|using|namespace|class|interface|public|private|protected|internal|static|void|int|string|bool|var|let|const|function|return|if\s*\(|else|for\s*\(|foreach|while\s*\(|do\b|switch|case\b|try|catch|finally|throw|import|from\s+\w+\s+import|def |print\(|console\.|Console\.|System\.|#include|<\/?[a-z][\w-]*[\s>]|[{}]|\/\/|\w+\s*\(.*\)\s*;)|[;{}]\s*$/;
  const blankP = p => !p.textContent.replace(/[\s  ]/g, "") && !p.querySelector("img, table, code:not(:empty)");
  function tidyQuestion(root) {
    root.querySelectorAll("code.formula").forEach(el => {
      const t = texToText(el.textContent);
      if (!t.replace(/[\s ]/g, "")) el.remove(); else { el.textContent = t; el.classList.add("fx"); }
    });
    root.querySelectorAll(".q-html").forEach(box => {
      // espaçador "-" em texto branco (a cor some na limpeza)
      box.querySelectorAll("p").forEach(p => { if (/^\s*[-–.]\s*$/.test(p.textContent) && !p.querySelector("img")) p.remove(); });
      // código: sequência de parágrafos com cara de código vira um bloco monoespaçado
      const kids = [...box.children];
      for (let i = 0; i < kids.length; i++) {
        const isCand = el => el && el.tagName === "P" && (blankP(el) || CODE_RE.test(el.textContent) || /text-indent/.test(el.getAttribute("style") || "") || el.querySelector(".ql-font-monospace"));
        if (!isCand(kids[i]) || blankP(kids[i])) continue;
        let j = i; while (j + 1 < kids.length && isCand(kids[j + 1])) j++;
        while (j > i && blankP(kids[j])) j--;
        const run = kids.slice(i, j + 1), code = run.filter(p => !blankP(p) && (CODE_RE.test(p.textContent) || p.querySelector(".ql-font-monospace")));
        if (code.length >= 2 && code.length >= run.filter(p => !blankP(p)).length * 0.5) {
          const pre = document.createElement("pre"); pre.className = "qcode";
          pre.textContent = run.map(p => { const ind = parseFloat((p.getAttribute("style") || "").match(/text-indent:\s*([\d.]+)em/)?.[1] || 0); return " ".repeat(Math.round(ind * 2)) + p.textContent.replace(/ /g, " ").replace(/\s+$/, ""); }).join("\n");
          run[0].before(pre); run.forEach(p => p.remove());
        }
        i = j;
      }
      // itens "I –", "II.", "a)" ganham recuo
      box.querySelectorAll(":scope > p").forEach(p => { if (/^\s*((I{1,3}|IV|VI{0,3}|IX|X)\s*[.–—\-)]|[a-e]\))\s/.test(p.textContent)) p.classList.add("item"); });
      // parágrafos vazios: sem sobra no começo/fim e no máximo um espaço entre blocos
      let prevBlank = true;
      for (const p of [...box.querySelectorAll(":scope > p")]) {
        if (blankP(p)) { if (prevBlank) p.remove(); else { p.className = "gap"; p.innerHTML = ""; prevBlank = true; } } else prevBlank = false;
      }
      const last = box.lastElementChild; if (last?.classList.contains("gap")) last.remove();
      // tabelas centralizadas e roláveis no celular
      box.querySelectorAll("table").forEach(t => { if (!t.parentElement.classList.contains("tbl")) { const w = document.createElement("div"); w.className = "tbl"; t.before(w); w.append(t); } });
    });
    // título do texto de apoio ("Texto 1 – ...")
    root.querySelectorAll(".qz-texto .q-html > p:first-child").forEach(p => { if (/^\s*(Texto|Text)\s*\d*\s*[–—:-]/i.test(p.textContent) || p.textContent.length < 120 && !/[.!?]\s*$/.test(p.textContent)) p.classList.add("tt"); });
  }

  // src = { kind: "day", key } (aula: 20 questões) | { kind: "assunto", key } (banco inteiro do tema)
  //     | { kind: "treino", materia? } | { kind: "erros" }
  async function viewQuiz(v, src) {
    const isDay = src.kind === "day" || src.kind === "assunto", day = isDay ? findDay(src.key) : null, lab = ED().labels;
    const back = src.kind === "day" ? "#inicio" : "#questoes";
    v.innerHTML = `<div class="loading">Carregando questões…</div>`;
    let qs;
    const mg = src.materia && S.g.meta.byM[src.materia];
    const nTreino = src.materia ? Math.max(10, mg ? mg.goal - mg.done : 10) : S.user.dailyQGoal;
    const load = async () => (isDay ? await Api.bankDay(src.key, src.kind === "assunto") : await Api.bankSession(src.kind, todayKey(), nTreino, src.materia)).questions;
    try { qs = await load(); } catch (x) { v.innerHTML = `<div class="card empty">${esc(x.message)}</div>`; return; }
    const emptyMsg = { day: "Esta aula ainda não tem questões importadas.", assunto: "Este tema ainda não tem questões importadas.", treino: (src.materia ? `Nenhuma questão nova de ${esc(lab[src.materia])} nas aulas concluídas. 🎉` : "Nenhuma questão nova nas aulas concluídas. 🎉") + "<br>Conclua mais aulas no cronograma para liberar novos conteúdos.", erros: "Nenhuma questão para revisar hoje. ✅" };
    if (!qs.length) { v.innerHTML = `<div class="card empty" style="text-align:center;padding:32px">${emptyMsg[src.kind]}<br><br><a class="btn btn-ghost" href="${back}">Voltar</a></div>`; return; }
    let idx = isDay ? Math.max(0, qs.findIndex(q => !q.answer)) : 0, pick = null, retry = false;
    if (isDay && qs.every(q => q.answer)) idx = qs.length;
    const fresh = q => src.kind === "erros" ? q._done : q.answer;   // na revisão, a resposta antiga não conta
    const title = isDay ? `<span class="tag">${esc(lab[day?.m] || "")}</span> <b>${esc(day?.t || src.key)}</b>`
      : src.kind === "treino" ? (src.materia ? `<span class="tag">${esc(lab[src.materia])}</span> <b>🎯 Treino</b>` : `<b>🎯 Treino misto</b>`) : `<b>🔁 Revisão de erros</b>`;

    const draw = () => {
      const done = qs.filter(fresh), right = done.filter(q => src.kind === "erros" ? q.answer.correct : q.answer.firstCorrect).length;
      const mt = S.g.meta;
      const head = `<div class="qz-top"><a href="${back}" class="link-btn">← ${back === "#inicio" ? "Hoje" : "Questões"}</a>
        <div class="qz-title t-${day?.m || src.materia || "ESP"}">${title}${src.kind === "assunto" ? ` <span class="muted small">· banco do tema</span>` : ""}</div>
        <div class="qz-score">${done.length}/${qs.length} respondidas · <b>${right} ${right === 1 ? "acerto" : "acertos"}</b> · meta de hoje ${Math.min(mt.today, mt.goal)}/${mt.goal}${mt.met ? " ✅" : ""}</div>
        <div class="qz-dots">${qs.map((q, i) => `<button data-go="${i}" class="${i === idx ? "cur " : ""}${fresh(q) ? ((src.kind === "erros" ? q.answer.correct : q.answer.firstCorrect) ? "ok" : "bad") : ""}" aria-label="Questão ${i + 1}">${i + 1}</button>`).join("")}
          <button data-go="${qs.length}" class="end ${idx === qs.length ? "cur" : ""}" aria-label="Resumo">${Icon("trophy", 14)}</button></div></div>`;

      if (idx >= qs.length) {
        const p = pct(right, done.length), isDone = isDay && S.done.has(src.key);
        const left = qs.findIndex(q => !fresh(q));
        v.innerHTML = `${head}<div class="card qz-end">
          <div style="font-size:44px">${!done.length ? "📝" : p >= 70 ? "🏆" : p >= 50 ? "💪" : "📚"}</div>
          <h2>${done.length ? `${right} de ${done.length} (${p}%)` : "Nenhuma respondida ainda"}</h2>
          <p class="muted">${left >= 0 ? `Faltam ${qs.length - done.length} questões.` : src.kind === "erros" ? "Cada acerto empurra a questão para mais longe; os erros voltam amanhã." : p >= 70 ? "Mandou bem! Esse tema está no caminho certo." : "Os erros foram para o caderno de erros e voltam para revisão amanhã."}</p>
          <div class="actions">${left >= 0 ? `<button class="btn btn-pink" data-go="${left}">Continuar</button>` : ""}
            ${src.kind === "treino" && left < 0 ? `<button class="btn btn-pink" id="qzMore">Mais um treino</button>` : ""}
            ${src.kind === "day" && S.bank[src.key]?.pool?.n > S.bank[src.key]?.n ? `<span class="muted small" style="flex-basis:100%">Concluindo a aula, as outras ${S.bank[src.key].pool.n - S.bank[src.key].n} questões do tema vão para a aba Questões.</span>` : ""}
            ${src.kind === "day" && day && !day.legacy && !isDone ? `<button class="btn btn-dark" id="qzDone">${Icon("check", 16)} Concluir dia</button>` : ""}
            <a class="btn btn-ghost" href="${back}">Voltar</a></div></div>`;
        v.querySelector("#qzDone")?.addEventListener("click", () => completeDay(src.key, true, draw));
        v.querySelector("#qzMore")?.addEventListener("click", () => viewQuiz(v, src));
        return;
      }

      const q = qs[idx], a = retry || !fresh(q) ? null : q.answer;
      const qday = !isDay || src.kind === "assunto" ? findDay(q.dayKey) : null;
      const meta = [q.banca, q.orgao, q.ano].filter(Boolean).join(" · ");
      const revTxt = r => r.graduated ? "🎓 Dominada! Saiu do caderno de erros." : r.review ? (r.correct ? `🔁 Volta para revisão em ${REVIEW_DAYS[r.review.step]} dias.` : "🔁 Foi para o caderno de erros: volta amanhã.") : "";
      v.innerHTML = `${head}<article class="card qz">
        ${q.recall ? `<div class="qz-recall">🔁 Para relembrar: você acertou esta questão há algum tempo</div>` : ""}
        <div class="qz-meta"><b>Questão ${idx + 1}</b><span>${esc(meta)}</span>${qday ? `<span class="qz-topic t-${qday.m}"><span class="tag">${esc(lab[qday.m])}</span> ${esc(qday.t)}</span>` : ""}${q.cargo ? `<span class="qz-cargo">${esc(q.cargo)}</span>` : ""}</div>
        ${q.textos.filter(Boolean).map((tx, ti) => `<details class="qz-texto" ${S.textoOpen === false ? "" : "open"}><summary>📄 ${q.textos.filter(Boolean).length > 1 ? `Texto de apoio ${ti + 1}` : "Texto de apoio"}</summary><div class="q-html">${tx}</div></details>`).join("")}
        <div class="q-html qz-enun">${q.enunciado}</div>
        <div class="qz-alts">${q.alternativas.map(al => {
          const cls = a ? (al.letra === a.gabarito ? "right" : al.letra === a.chosen ? "wrong" : "dim") : al.letra === pick ? "sel" : "";
          return `<button class="qz-alt ${cls}" data-pick="${esc(al.letra)}" ${a ? "disabled" : ""}><span class="lt">${esc(al.letra)}</span><span class="q-html">${al.texto}</span></button>`; }).join("")}</div>
        ${a ? `<div class="qz-res ${a.correct ? "ok" : "bad"}">${a.correct ? `✅ Acertou!` : `❌ Não foi dessa vez. Gabarito: <b>${esc(a.gabarito)}</b>`}
            ${q._r ? `<div class="small" style="margin-top:4px">${revTxt(q._r)}</div>` : ""}
            ${a.attempts > 1 && src.kind !== "erros" ? `<div class="muted small">Para o desempenho vale a 1ª tentativa (${a.firstCorrect ? "acerto" : "erro"}).</div>` : ""}</div>
          <div class="qz-actions">${src.kind === "erros" ? "<span></span>" : `<button class="btn btn-ghost btn-sm" id="qzRetry">Refazer</button>`}<button class="btn btn-pink" id="qzNext">${idx === qs.length - 1 ? "Ver resultado" : "Próxima"} →</button></div>`
        : `<div class="qz-actions"><button class="btn btn-ghost btn-sm" id="qzSkip">Pular</button><button class="btn btn-pink" id="qzSend" ${pick ? "" : "disabled"}>Responder</button></div>`}
      </article>`;
      tidyQuestion(v.querySelector("article.qz"));

      v.querySelector("#qzSend")?.addEventListener("click", send);
      v.querySelector("#qzSkip")?.addEventListener("click", () => go(idx + 1));
      v.querySelector("#qzNext")?.addEventListener("click", () => go(idx + 1));
      v.querySelector("#qzRetry")?.addEventListener("click", () => { retry = true; pick = null; draw(); });
    };

    const go = i => { idx = Math.max(0, Math.min(qs.length, i)); pick = null; retry = false; draw(); window.scrollTo({ top: 0, behavior: "smooth" }); };

    async function send() {
      if (!pick) return;
      const q = qs[idx], before = S.g;
      const btn = v.querySelector("#qzSend"); if (btn) btn.disabled = true;
      try {
        const r = await Api.bankAnswer({ questionId: q.id, chosen: pick, localDate: todayKey(), mode: src.kind });
        const prev = q.answer;
        q.answer = { chosen: pick, correct: r.correct, gabarito: r.gabarito, firstCorrect: prev ? prev.firstCorrect : r.correct, attempts: (prev?.attempts || 0) + 1 };
        q._done = true; q._r = r;
        retry = false; pick = null;
        await refreshGame(); updateTopbar(); draw();
        const gained = S.g.xp.total - before.xp.total;
        if (S.g.meta.met && !before.meta.met) toast(`🎯 Meta do dia batida! +${gained} XP`);
        else if (gained > 0) toast(`+${gained} XP`);
        checkLevelUp(before, S.g);
      } catch (x) { toast(x.message); if (btn) btn.disabled = false; }
    }

    v.onclick = e => {
      const g = e.target.closest("[data-go]"); if (g) return go(+g.dataset.go);
      const p = e.target.closest("[data-pick]"); if (p && !p.disabled) { pick = p.dataset.pick; draw(); }
    };
    draw();
  }
  const REVIEW_DAYS = [1, 3, 7];

  // lembra se o texto de apoio está aberto ou fechado entre as questões
  document.addEventListener("toggle", e => { if (e.target.classList?.contains("qz-texto")) S.textoOpen = e.target.open; }, true);

  // atalhos no modo questões: letras escolhem, Enter responde / avança
  document.addEventListener("keydown", e => {
    if (!/^#(questoes\/|banco\/|treino|erros)/.test(location.hash) || e.target.matches("input, textarea, select") || e.metaKey || e.ctrlKey) return;
    const k = e.key.toUpperCase();
    const alt = document.querySelector(`.qz-alt[data-pick="${k}"]:not([disabled])`);
    if (alt) { alt.click(); return; }
    if (e.key === "Enter") (document.querySelector("#qzSend:not([disabled])") || document.querySelector("#qzNext"))?.click();
  });

  // =================================================================
  // QUESTÕES (meta diária, treino, caderno de erros e assuntos)
  // =================================================================
  const isOpen = k => S.unlocked.has(k);
  function viewQuestions(v) {
    const lab = ED().labels, g = S.g, mt = g.meta;
    const days = S.plan.filter(d => S.bank[d.key]);
    const openDays = days.filter(d => isOpen(d.key));
    const poolOf = d => S.bank[d.key].pool || S.bank[d.key];
    const total = openDays.reduce((s, d) => s + poolOf(d).n, 0);
    const openBy = m => openDays.filter(d => d.m === m);
    const f = S.qFilter || "ALL";
    const mats = MATS.filter(m => openBy(m).length);
    const list = openDays.filter(d => f === "ALL" || d.m === f);
    const locked = days.filter(d => !isOpen(d.key) && (f === "ALL" || d.m === f));
    v.innerHTML = `
      <div class="page-title">Questões</div>
      <div class="qs-hero">
        <div class="card ring-card">${ring(mt.goal ? mt.today / mt.goal : 0, mt.met ? "#3f8a72" : "#ef7254", `${Math.min(mt.today, 999)}<span style="font-size:13px">/${mt.goal}</span>`, mt.met ? "batida ✅" : "meta de hoje")}
          <p class="muted small" style="margin:6px 0 0;text-align:center">${mt.streak > 1 ? `🔥 ${mt.streak} dias seguidos batendo a meta` : mt.met ? "Meta batida hoje 🎉" : `Bater a meta vale +${g.xp.rules.meta} XP`}</p></div>
        <div class="card qs-meta">
          <div class="qs-meta-h"><b>Meta de hoje por matéria</b><span class="muted small">dividida pelo peso no edital · <a href="#perfil">ajustar total</a></span></div>
          ${Object.values(mt.byM).some(x => x.goal < x.full) ? `<p class="muted small" style="margin:-4px 0 0">* limitada às questões liberadas: conclua mais aulas para a meta cheia.</p>` : ""}
          ${Object.entries(mt.byM).map(([m, x]) => { const has = openBy(m).length, ok = x.done >= x.goal; return `
          <div class="qs-mrow t-${m}"><span class="tag">${esc(lab[m])}</span>
            <div class="xpbar"><i style="width:${Math.min(100, pct(x.done, x.goal))}%;${ok ? "background:#3f8a72" : ""}"></i></div>
            <span class="qs-mn" title="${x.goal < x.full ? `Meta cheia seria ${x.full}; limitada ao que está liberado` : ""}">${Math.min(x.done, 999)}/${x.goal}${ok ? " ✅" : x.goal < x.full ? "*" : ""}</span>
            ${has ? `<a class="btn btn-sm ${ok ? "btn-ghost" : "btn-pink"}" href="#treino/${m}">Treinar</a>` : `<span class="muted small qs-nolock">conclua uma aula</span>`}</div>`; }).join("")}
        </div>
      </div>
      <div class="qs-actions2">
        <a class="card qs-act ${openDays.length ? "" : "off"}" href="#treino"><span class="qs-ic">🎯</span><div><b>Treino misto</b><span>${openDays.length ? `${S.user.dailyQGoal} questões de tudo que você já estudou, com mais peso no que você erra` : "Conclua aulas no cronograma para liberar"}</span></div>${Icon("chevron", 18)}</a>
        <a class="card qs-act ${S.due ? "" : "off"}" href="#erros"><span class="qs-ic">🔁</span><div><b>Caderno de erros</b><span>${S.due ? `${S.due} ${S.due === 1 ? "questão para revisar" : "questões para revisar"} hoje` : S.inReview ? `${S.inReview} em revisão · nada para hoje` : "Os erros voltam aqui em 1, 3 e 7 dias"}</span></div>${Icon("chevron", 18)}</a>
      </div>
      <div class="section-title">Conteúdos liberados <span class="muted small">${openDays.length} ${openDays.length === 1 ? "aula concluída" : "aulas concluídas"} · ${total} questões</span></div>
      ${openDays.length ? `<div class="chips" id="qFilt">${[["ALL", "Todos"], ...mats.map(m => [m, lab[m]])].map(([k, l]) => `<button class="chip ${f === k ? "on" : ""}" data-f="${k}">${esc(l)}</button>`).join("")}</div>
      <div class="qs-list">${list.map(qsRow).join("")}</div>`
      : `<div class="card empty" style="padding:28px">📚 Os conteúdos entram aqui quando você <b>conclui a aula</b> no cronograma.<br>Cada aula tem 20 questões dentro dela; o resto do banco do tema fica aqui para treinar e revisar.</div>`}
      ${locked.length ? `<details class="qs-locked"><summary>🔒 Ainda não liberados (${locked.length})</summary>
        <div class="qs-list">${locked.map(qsRow).join("")}</div></details>` : ""}`;
    const qf = v.querySelector("#qFilt");
    if (qf) qf.onclick = e => { const b = e.target.closest("[data-f]"); if (!b) return; S.qFilter = b.dataset.f; viewQuestions(v); };
  }
  function qsRow(d) {
    const lab = ED().labels, b = S.bank[d.key].pool || S.bank[d.key], open = isOpen(d.key), p = dParts(d.key);
    const acc = b.answered ? pct(b.correct, b.answered) : null;
    return `<${open ? `a href="#banco/${d.key}"` : "div"} class="card qs-row t-${d.m} ${open ? "" : "locked"}">
      <div class="date-bubble"><b>${String(p.d).padStart(2, "0")}</b><span>${MONTHS[p.m - 1]}</span></div>
      <div class="qs-info"><span class="tag">${esc(lab[d.m])}</span><div class="t">${esc(d.t)}</div>
        ${open ? `<div class="qs-prog"><div class="xpbar"><i style="width:${pct(b.answered, b.n)}%"></i></div><span>${b.answered}/${b.n}${acc !== null ? ` · <b class="${acc >= 70 ? "ok" : acc < 50 ? "bad" : ""}">${acc}%</b>` : ""}</span></div>`
          : `<div class="muted small">Conclua a aula de ${String(p.d).padStart(2, "0")}/${MONTHS[p.m - 1]} para liberar · ${b.n} questões</div>`}</div>
      ${open ? Icon("chevron", 18) : ""}</${open ? "a" : "div"}>`;
  }

  // ---------- concluir / recuperar dia ----------
  async function completeDay(key, done, rerender) {
    const before = S.g;
    try {
      await Api.setDone(key, done, todayKey());
      await refreshData();
      rerender ? rerender() : route();
      updateTopbar();
      if (!done) return toast("Dia desmarcado.");
      const gained = S.g.xp.total - before.xp.total;
      const det = S.details[key];
      celebrate(gained, det?.late, before, S.g, key);
    } catch (e) { toast(e.message); }
  }

  function celebrate(gained, late, before, after, key) {
    const up = after.level.n > before.level.n;
    const pool = S.bank[key]?.pool, left = pool ? pool.n - pool.answered : 0;
    modal(`<div class="celebrate"><div class="big-emoji">${up ? "🏆" : late ? "💪" : "🎉"}</div>
      <h3>${late ? "Dia recuperado!" : "Dia concluído!"}</h3>
      <div class="xp-gain">+${gained} XP</div>
      ${up ? `<p class="lvl-up">Subiu para o nível <b>${after.level.n} · ${esc(after.level.name)}</b></p>` : ""}
      <p class="muted small">${after.streak ? `🔥 Sequência de ${after.streak} ${after.streak === 1 ? "dia" : "dias"}.` : ""} ${late ? "Recuperar dá XP, mas não refaz a sequência." : ""}</p>
      ${left ? `<p class="unlock-note">📝 <b>${left} questões</b> deste tema liberadas na aba Questões.</p>` : ""}</div>
      <div class="actions">${left ? `<a class="btn btn-ghost btn-block" href="#banco/${key}" data-x>Treinar este tema</a>` : ""}<button class="btn btn-pink btn-block" data-x>Continuar</button></div>`,
      (m, close) => m.querySelectorAll("[data-x]").forEach(b => b.addEventListener("click", close)));
  }
  function checkLevelUp(before, after) {
    if (after.level.n > before.level.n) setTimeout(() => toast(`🏆 Nível ${after.level.n}: ${after.level.name}!`), 1200);
  }
  function showAchievements(list) {
    const m = document.getElementById("modal"); if (!m.hidden) { setTimeout(() => showAchievements(list), 1500); return; }
    modal(`<div class="celebrate"><div class="big-emoji">${list[0].icon}</div><h3>${list.length > 1 ? "Novas conquistas!" : "Nova conquista!"}</h3>
      ${list.map(a => `<div class="ach-new"><b>${a.icon} ${esc(a.title)}</b><span class="muted small">${esc(a.desc)}</span></div>`).join("")}
      <div class="xp-gain">+${list.length * S.g.xp.rules.achievement} XP</div></div>
      <div class="actions"><a class="btn btn-ghost btn-block" href="#conquistas" data-x>Ver conquistas</a><button class="btn btn-pink btn-block" data-x>Continuar</button></div>`,
      (mm, close) => mm.querySelectorAll("[data-x]").forEach(b => b.addEventListener("click", close)));
  }

  // =================================================================
  // CRONOGRAMA (lista + calendário)
  // =================================================================
  function dayItem(d, tk, lab) {
    const p = dParts(d.key), studied = S.stats.byDayKey[d.key] || 0, status = dayStatus(d);
    const isDone = status === "done" || status === "recovered";
    const open = S.openDays.has(d.key) || (d.key === tk && !S.openDays.has("_closed_" + d.key));
    const q = S.g.questions.byDay[d.key];
    const doneBtn = d.legacy ? "" : isDone
      ? `<button class="check-btn on" data-undo><span class="box">${Icon("check", 12)}</span>${status === "recovered" ? "Recuperado" : "Concluído"}</button>`
      : `<button class="check-btn" data-done><span class="box">${Icon("check", 12)}</span>${status === "late" ? `Recuperar (+${S.g.xp.rules.late} XP)` : `Concluir dia (+${S.g.xp.rules.day} XP)`}</button>`;
    return `<div class="card day t-${d.m} ${isDone ? "done" : ""} st-${status} ${d.key === tk ? "is-today" : ""} ${open ? "open" : ""}" data-k="${d.key}" ${d.key === tk ? 'id="hoje"' : ""}>
      <div class="date-bubble"><b>${String(p.d).padStart(2, "0")}</b><span>${MONTHS[p.m - 1]}</span></div>
      <div>
        <div class="day-head" data-toggle style="display:flex;align-items:flex-start;gap:8px">
          <div style="flex:1;min-width:0"><span class="tag">${lab[d.m]}</span><span class="area">${DOW[p.dow]}${d.legacy ? "" : ` · dia ${d.index}`}</span>
          <div class="ttl">${esc(d.t)}</div>
          <div class="meta">${STATUS_TXT[status] ? `<span class="st-pill st-${status}">${STATUS_TXT[status]}</span>` : ""}${S.apostilas.has(d.key) ? `<span class="badge-time">📖 apostila</span>` : ""}${studied ? `<span class="badge-time">${Icon("clock", 13)} ${hm(studied)}</span>` : ""}${q && !S.bank[d.key]?.n ? `<span class="badge-time">✏️ ${q.correct}/${q.done}</span>` : ""}${S.bank[d.key]?.n ? `<span class="badge-time">📝 ${S.bank[d.key].answered}/${S.bank[d.key].n} questões</span>` : ""}</div></div>
          <span class="chev">${Icon("chevron", 20)}</span>
        </div>
        <div class="day-body">${dayCardBody(d)}
          <div class="day-actions">
            ${S.apostilas.has(d.key) ? `<a class="btn btn-ghost btn-sm ap-btn" href="#apostila/${d.key}">📖 Apostila</a>` : ""}
            ${d.legacy ? "" : `<button class="btn btn-pink btn-sm" data-study>${Icon("play", 14)} Estudar</button>`}
            ${S.bank[d.key]?.n ? `<a class="btn btn-ghost btn-sm" href="#questoes/${d.key}">📝 Questões</a>` : ""}
            ${doneBtn}
          </div>
        </div>
      </div></div>`;
  }

  function bindDayActions(box, rerender) {
    box.onclick = e => {
      const card = e.target.closest(".day"); if (!card) return;
      const key = card.dataset.k, tk = todayKey();
      if (e.target.closest("[data-toggle]")) {
        const open = card.classList.toggle("open");
        if (key === tk) open ? S.openDays.delete("_closed_" + key) : S.openDays.add("_closed_" + key);
        else open ? S.openDays.add(key) : S.openDays.delete(key);
      }
      if (e.target.closest("[data-done]")) completeDay(key, true, rerender);
      if (e.target.closest("[data-undo]")) completeDay(key, false, rerender);
      const sb = e.target.closest("[data-study]");
      if (sb) {
        if (Timer.isActive()) { Timer.expand(sb); return; }
        Timer.start(findDay(key), "dia", S.user.dailyGoal, sb);
      }
    };
  }

  function viewPlan(v) {
    const lab = ED().labels;
    const filters = [["ALL", "Tudo"], ["ESP", lab.ESP], ["POR", lab.POR], ["NOR", lab.NOR], ["ING", lab.ING], ["REV", "Revisões e reta final"], ["TODO", "Pendentes"], ["LATE", "Atrasados"]];
    v.innerHTML = `
      <div class="page-title">Cronograma · ${ED().nome}</div>
      <div class="seg" id="seg"><button class="${S.planView === "lista" ? "on" : ""}" data-v="lista">Lista</button><button class="${S.planView === "cal" ? "on" : ""}" data-v="cal">Calendário</button></div>
      <div id="pv"></div>`;
    const pv = v.querySelector("#pv");
    v.querySelector("#seg").onclick = e => {
      const b = e.target.closest("[data-v]"); if (!b) return;
      S.planView = b.dataset.v; viewPlan(v);
    };
    if (S.planView === "cal") return drawCalendar(pv);

    pv.innerHTML = `
      ${S.g.late.length ? `<a class="late-banner" href="#atrasados" style="margin-bottom:12px">${Icon("clock", 18)}<span><b>${S.g.late.length} ${S.g.late.length === 1 ? "dia atrasado" : "dias atrasados"}</b> para recuperar.</span>${Icon("chevron", 18)}</a>` : ""}
      <div class="search">${Icon("search", 20)}<input id="q" placeholder="Buscar assunto (ex.: LINQ, crase, LGPD)…" value="${esc(S.query)}"></div>
      <div class="chips">${filters.map(([k, l]) => `<button class="chip ${S.filter === k ? "on" : ""}" data-f="${k}">${l}</button>`).join("")}</div>
      <div id="days"></div>`;
    const tk = todayKey();
    const draw = () => {
      const q = S.query.trim().toLowerCase();
      let html = "", lastWeek = null, count = 0;
      const match = d => {
        const st = dayStatus(d), f = S.filter;
        const okF = f === "ALL" || (f === "TODO" ? !S.done.has(d.key) && !d.legacy : f === "LATE" ? st === "late" : f === "REV" ? (d.m === "REV" || d.m === "FIN" || d.rev) : d.m === f);
        const okQ = !q || (d.t + " " + d.a + " " + d.k.join(" ") + " " + (d.sub || []).map(x => x.n).join(" ")).toLowerCase().includes(q);
        return okF && okQ;
      };
      S.plan.forEach(d => {
        if (!match(d)) return;
        count++;
        if (d.week !== lastWeek) {
          const ks = S.plan.filter(x => x.week === d.week), a = dParts(ks[0].key), b = dParts(ks[ks.length - 1].key);
          html += `<div class="week-h">${d.kind ? "Reta final" : `Semana ${d.week + 1}`} · ${a.d}/${a.m} a ${b.d}/${b.m}</div>`; lastWeek = d.week;
        }
        html += dayItem(d, tk, lab);
      });
      const leg = S.legacy.filter(match);
      if (leg.length) {
        html += `<details class="legacy"><summary>Fase anterior · ${leg.length} dias (10 a 18/11) · fora do XP e do % do edital</summary>${leg.map(d => dayItem(d, tk, lab)).join("")}</details>`;
        count += leg.length;
      }
      const box = v.querySelector("#days");
      box.innerHTML = count ? html : `<div class="card empty">Nada encontrado.</div>`;
    };
    draw();
    setTimeout(() => document.getElementById("hoje")?.scrollIntoView({ block: "center" }), 50);
    v.querySelector("#q").oninput = e => { S.query = e.target.value; draw(); };
    v.querySelector(".chips").onclick = e => {
      const b = e.target.closest("[data-f]"); if (!b) return;
      S.filter = b.dataset.f; v.querySelectorAll(".chip").forEach(c => c.classList.toggle("on", c === b)); draw();
    };
    bindDayActions(v.querySelector("#days"), draw);
  }

  function drawCalendar(box) {
    const lab = ED().labels, tk = todayKey();
    const first = dParts(S.plan[0].key), last = dParts(S.plan[S.plan.length - 1].key), t = dParts(tk);
    const months = [];
    for (let y = first.y, m = first.m; y < last.y || (y === last.y && m <= last.m); m === 12 ? (y++, m = 1) : m++) months.push([y, m]);
    if (!S.calMonth) S.calMonth = months.find(([y, m]) => y === t.y && m === t.m) || months[0];
    const i = months.findIndex(([y, m]) => y === S.calMonth[0] && m === S.calMonth[1]);
    const [y, m] = months[Math.max(0, i)];
    const byKey = Object.fromEntries(S.plan.map(d => [d.key, d]));
    const startDow = new Date(y, m - 1, 1).getDay(), nDays = new Date(y, m, 0).getDate();
    const MONTH_FULL = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
    let cells = "";
    for (let k = 0; k < startDow; k++) cells += `<div class="cal-cell empty"></div>`;
    for (let d = 1; d <= nDays; d++) {
      const key = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`, day = byKey[key];
      if (!day) { cells += `<div class="cal-cell out"><span class="n">${d}</span></div>`; continue; }
      const st = dayStatus(day);
      cells += `<button class="cal-cell st-${st} t-${day.m}" data-k="${key}" title="${esc(day.t)}"><span class="n">${d}</span><span class="cm">${lab[day.m].slice(0, 3)}</span>${st === "done" || st === "recovered" ? `<span class="ok">${Icon("check", 12)}</span>` : ""}</button>`;
    }
    const counts = { done: 0, recovered: 0, late: 0 };
    S.plan.forEach(d => { const s = dayStatus(d); if (counts[s] !== undefined) counts[s]++; });
    box.innerHTML = `<div class="card cal">
      <div class="cal-head"><button class="icon-btn" data-mv="-1" ${i <= 0 ? "disabled" : ""} aria-label="Mês anterior">${Icon("chevron", 20, "flip")}</button>
        <b>${MONTH_FULL[m - 1][0].toUpperCase() + MONTH_FULL[m - 1].slice(1)} de ${y}</b>
        <button class="icon-btn" data-mv="1" ${i >= months.length - 1 ? "disabled" : ""} aria-label="Próximo mês">${Icon("chevron", 20)}</button></div>
      <div class="cal-grid">${DOW.map(x => `<div class="cal-dow">${x}</div>`).join("")}${cells}</div>
      <div class="cal-legend"><span><i class="lg done"></i>Concluído (${counts.done})</span><span><i class="lg recovered"></i>Recuperado (${counts.recovered})</span><span><i class="lg late"></i>Atrasado (${counts.late})</span><span><i class="lg today"></i>Hoje</span><span><i class="lg future"></i>Futuro</span></div>
    </div>`;
    box.querySelectorAll("[data-mv]").forEach(b => b.onclick = () => { S.calMonth = months[i + +b.dataset.mv]; drawCalendar(box); });
    box.querySelector(".cal-grid").onclick = e => {
      const c = e.target.closest("[data-k]"); if (!c) return;
      openDayModal(byKey[c.dataset.k], () => drawCalendar(box));
    };
  }

  function openDayModal(d, rerender) {
    const lab = ED().labels, st = dayStatus(d), p = dParts(d.key), isDone = st === "done" || st === "recovered";
    modal(`<div class="day-modal t-${d.m}" style="text-align:left">
        <span class="tag">${lab[d.m]}</span><span class="area">${DOW[p.dow]}, ${p.d}/${p.m}${STATUS_TXT[st] ? ` · ${STATUS_TXT[st]}` : ""}</span>
        <div class="ttl">${esc(d.t)}</div>${dayCardBody(d, 3)}</div>
      <div class="actions">
        ${isDone ? `<button class="btn btn-ghost btn-block" data-a="undo">Desmarcar dia</button>` : `<button class="btn btn-dark btn-block" data-a="done">${Icon("check", 16)} ${st === "late" ? `Recuperar (+${S.g.xp.rules.late} XP)` : `Concluir dia (+${S.g.xp.rules.day} XP)`}</button>`}
        <button class="btn btn-pink btn-block" data-a="study">${Icon("play", 16)} Estudar agora</button>
        ${S.apostilas.has(d.key) ? `<a class="btn btn-ghost btn-block" href="#apostila/${d.key}">📖 Abrir apostila</a>` : ""}
        <button class="btn btn-ghost btn-block" data-a="x">Fechar</button>
      </div>`, (m, close) => {
      m.querySelector(".actions").onclick = e => {
        const a = e.target.closest("[data-a]")?.dataset.a; if (!a) return;
        close();
        if (a === "done") completeDay(d.key, true, rerender);
        if (a === "undo") completeDay(d.key, false, rerender);
        if (a === "study") Timer.isActive() ? Timer.expand(e.target) : Timer.start(d, "dia", S.user.dailyGoal, e.target);
      };
    });
  }

  // =================================================================
  // ATRASADOS
  // =================================================================
  function viewLate(v) {
    const lab = ED().labels, tk = todayKey();
    const list = S.plan.filter(d => S.g.late.includes(d.key));
    v.innerHTML = `
      <div class="page-title">Atrasados</div>
      <p class="muted small" style="margin:-8px 0 16px">Dia perdido não some: estude e recupere quando puder. Cada dia recuperado vale ${S.g.xp.rules.late} XP (no prazo valeria ${S.g.xp.rules.day}). Recuperar não refaz a sequência 🔥.</p>
      <div id="days">${list.length ? list.map(d => dayItem(d, tk, lab)).join("") : `<div class="card empty">🎉 Nenhum dia atrasado. Você está em dia com o cronograma.</div>`}</div>`;
    bindDayActions(v.querySelector("#days"), () => viewLate(v));
  }

  // =================================================================
  // FOCO
  // =================================================================
  function viewFocus(v) {
    const t = planToday();
    if (!S.pick) S.pick = t.key;
    const cur = Timer.current();
    const showPipToggle = Timer.pipSupported() && !matchMedia("(pointer: coarse)").matches;
    let autoPip = true; try { autoPip = localStorage.getItem("caderno_auto_pip") !== "0"; } catch {}
    const pd = S.plan.find(x => x.key === S.pick);
    const modes = [["dia", "Dia do cronograma", pd ? pd.phases.map(x => x.min).join(" + ") + " min" : "40 + 20 min"], ["meta", "Meta do dia", `${S.user.dailyGoal} min`], ["pomodoro", "Pomodoro", "25 min"], ["livre", "Livre", "sem limite"]];
    v.innerHTML = `
      <div class="page-title">Modo foco</div>
      ${cur ? `<div class="card" style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
          <div style="flex:1"><b>Sessão em andamento</b><div class="muted small">${esc(cur.title)}</div></div>
          <button class="btn btn-pink btn-sm" id="back">${Icon("expand", 14)} Abrir</button></div>` : ""}
      <div class="card focus-setup">
        <div class="field" style="text-align:left"><label>O que você vai estudar?</label></div>
        <select class="topic-select" id="topic">
          ${S.plan.map(d => { const p = dParts(d.key); return `<option value="${d.key}" ${d.key === S.pick ? "selected" : ""}>${String(p.d).padStart(2, "0")}/${String(p.m).padStart(2, "0")} · ${ED().labels[d.m]} — ${esc(d.t)}${d.key === todayKey() ? " (hoje)" : ""}</option>`; }).join("")}
          <option value="" ${S.pick === "" ? "selected" : ""}>Estudo livre (sem tema do cronograma)</option>
        </select>
        <div class="mode-pick">${modes.map(([k, l, s]) => `<button class="mode ${S.mode === k ? "on" : ""}" data-m="${k}"><b>${l}</b><span>${s}</span></button>`).join("")}</div>
        <button class="start-circle" id="go"><div class="inner">${Icon("play", 40)}<b>${cur ? "ABRIR" : "INICIAR"}</b></div></button>
        <p class="muted small">Ao iniciar, a tela de foco cresce e ocupa a tela inteira.${showPipToggle ? " No computador, uma janela flutuante mostra o tempo mesmo fora desta aba." : ""}</p>
        ${showPipToggle ? `<div class="toggle-row"><span>Abrir janela flutuante ao iniciar</span><label class="switch"><input type="checkbox" id="autopip" ${autoPip ? "checked" : ""}><i></i></label></div>` : ""}
      </div>`;
    v.querySelector("#topic").onchange = e => { S.pick = e.target.value; viewFocus(v); };
    v.querySelector(".mode-pick").onclick = e => {
      const b = e.target.closest("[data-m]"); if (!b) return;
      S.mode = b.dataset.m; v.querySelectorAll(".mode").forEach(x => x.classList.toggle("on", x === b));
    };
    v.querySelector("#autopip")?.addEventListener("change", e => { try { localStorage.setItem("caderno_auto_pip", e.target.checked ? "1" : "0"); } catch {} });
    v.querySelector("#back")?.addEventListener("click", e => Timer.expand(e.currentTarget));
    v.querySelector("#go").onclick = e => {
      if (Timer.isActive()) return Timer.expand(e.currentTarget);
      const d = S.plan.find(x => x.key === S.pick) || null;
      Timer.start(d, d ? S.mode : (S.mode === "dia" ? "livre" : S.mode), S.user.dailyGoal, e.currentTarget);
    };
  }

  // =================================================================
  // APOSTILA
  // =================================================================
  function viewApostila(v, day) {
    Reader.open(v, {
      day, edital: S.user.edital, plan: S.plan.concat(S.legacy), labels: ED().labels, toast,
      onBack: () => { history.length > 1 ? history.back() : (location.hash = "#cronograma"); },
      onStudy: el => {
        if (Timer.isActive()) return toast("O cronômetro já está rodando no canto da tela.");
        const d = findDay(day);
        Timer.start(d, d && !d.legacy ? "dia" : "livre", S.user.dailyGoal, el, true);
      },
    });
  }

  async function onSaved(session, secs) {
    try { await refreshData(); } catch {}
    if (!location.hash.startsWith("#apostila/")) route();
    const key = session.dayKey;
    if (key && !S.done.has(key) && S.plan.some(x => x.key === key)) {
      modal(`<div style="font-size:42px">🎉</div><h3>Sessão salva!</h3>
        <p class="muted small">${hm(secs)} estudando <b>${esc(session.title)}</b>.<br>Lance as questões que fez e marque o dia como concluído.</p>
        <div class="actions"><button class="btn btn-pink btn-block" data-ok>Concluir dia</button><button class="btn btn-ghost btn-block" data-x>Agora não</button></div>`,
        (m, close) => {
          m.querySelector("[data-ok]").onclick = () => { close(); completeDay(key, true); };
          m.querySelector("[data-x]").onclick = close;
        });
    } else toast(`Sessão salva: ${hm(secs)} ✅`);
  }

  // =================================================================
  // DESEMPENHO
  // =================================================================
  const fmtPts = x => (Math.round(x * 10) / 10).toString().replace(".", ",");

  function meter(value, max, cut, cls = "") {
    const w = Math.max(0, Math.min(100, (value / max) * 100));
    return `<div class="meter ${cls}"><i class="${value >= cut ? "ok" : "bad"}" style="width:${w}%"></i><span class="cut" style="left:${(cut / max) * 100}%"><em>mín. ${cut}</em></span></div>`;
  }

  function thermoCard(g) {
    const th = g.thermo, lab = ED().labels;
    const known = MATS.filter(m => th.est[m] !== null);
    const pass = !th.partial && !th.alerts.length;
    const head = !known.length
      ? `<div class="empty" style="padding:14px 0">Lance pelo menos ${th.minQ} questões de cada matéria para o termômetro estimar sua nota.</div>`
      : `<div class="thermo-top"><div class="big-score">${fmtPts(th.total)}<small>/ ${th.totalMax} pts</small></div>
          <span class="st-pill ${th.alerts.length ? "st-late" : pass ? "st-done" : "st-today"}">${th.alerts.length ? "Abaixo do mínimo" : pass ? "Acima dos mínimos" : "Estimativa parcial"}</span></div>
         <div class="mlabel"><span>Total</span><span>${fmtPts(th.total)} / ${th.totalMax}</span></div>${meter(th.total, th.totalMax, th.minTotal)}
         ${th.est.ESP !== null ? `<div class="mlabel" style="margin-top:16px"><span>${lab.ESP}</span><span>${fmtPts(th.est.ESP)} / ${th.max.ESP}</span></div>${meter(th.est.ESP, th.max.ESP, th.minEsp)}` : ""}`;
    return `<div class="card thermo">
      <b class="card-h">🌡️ Termômetro de aprovação</b>
      <p class="muted small" style="margin:4px 0 14px">Seu % de acerto em cada matéria aplicado aos pontos da prova. Matéria com menos de ${th.minQ} questões fica de fora.</p>
      ${head}
      ${th.alerts.length ? `<div class="alerts">${th.alerts.map(a => `<div class="alert">⚠️ ${esc(a.text)}</div>`).join("")}</div>` : ""}
      <div class="thermo-mats">${MATS.map(m => {
        const q = g.questions.byM[m];
        return `<div class="tm-row t-${m}"><span class="tag">${lab[m]}</span><span class="muted small">${q.done ? `${pct(q.correct, q.done)}% · ${q.done} q` : "sem questões"}</span><b>${th.est[m] === null ? `<span class="muted small">faltam ${Math.max(0, th.minQ - q.done)} q</span>` : `${fmtPts(th.est[m])}<small>/${th.max[m]}</small>`}</b></div>`;
      }).join("")}</div>
    </div>`;
  }

  async function viewStats(v) {
    const st = S.stats, lab = ED().labels, g = S.g, tk = todayKey();
    const max = Math.max(S.user.dailyGoal * 60, ...st.last14.map(x => x.seconds));
    const bySubj = {};
    for (const [k, s] of Object.entries(st.byDayKey)) { const d = findDay(k); if (d) bySubj[d.m] = (bySubj[d.m] || 0) + s; }
    const subjMax = Math.max(1, ...Object.values(bySubj));
    const goalDays = st.last14.filter(x => x.seconds >= S.user.dailyGoal * 60).length;
    const cov = g.coverage, qt = g.questions.total;
    const last14 = []; for (let i = 13; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); last14.push(Plans.keyOf(d)); }

    v.innerHTML = `
      <div class="page-title">Desempenho</div>
      <div class="stats3">
        <div class="card stat s1"><div class="si">${Icon("fire", 21)}</div><div><span>Sequência · recorde ${g.bestStreak}</span><b>${g.streak} ${g.streak === 1 ? "dia" : "dias"}</b></div></div>
        <div class="card stat s2"><div class="si">${Icon("target", 21)}</div><div><span>Acerto acumulado</span><b>${qt.done ? pct(qt.correct, qt.done) + "%" : "—"} <small class="muted" style="font-size:12px">${qt.correct}/${qt.done}</small></b></div></div>
        <a class="card stat s3" href="#conquistas" style="text-decoration:none"><div class="si">${Icon("trophy", 21)}</div><div><span>Nível ${g.level.n} · ${esc(g.level.name)}</span><b>${g.xp.total} XP</b></div></a>
      </div>

      <div class="grid-2" style="margin-top:14px">
        ${thermoCard(g)}
        <div class="card">
          <b class="card-h">📚 Progresso do edital</b>
          <div class="cov-total"><b>${pct(cov.total.done, cov.total.all)}%</b><span class="muted small">${cov.total.done} de ${cov.total.all} tópicos cobertos</span></div>
          <div class="xpbar big"><i style="width:${pct(cov.total.done, cov.total.all)}%"></i></div>
          <div class="subj" style="margin-top:16px">${MATS.map(m => { const c = cov.byM[m]; return `<div class="subj-row t-${m}"><span class="mark">${lab[m][0]}</span><div class="info"><strong>${lab[m]}</strong><small>${pct(c.done, c.all)}% · ${c.done}/${c.all}</small><div class="bar"><i style="width:${pct(c.done, c.all)}%"></i></div></div></div>`; }).join("")}</div>
        </div>
      </div>

      <div class="grid-2" style="margin-top:14px">
        <div class="card">
          <b class="card-h">✏️ Acerto por matéria</b>
          <div class="tablewrap"><table class="tbl-q"><thead><tr><th>Matéria</th><th>Feitas</th><th>Acertos</th><th>%</th></tr></thead><tbody>
            ${MATS.map(m => { const q = g.questions.byM[m]; return `<tr class="t-${m}"><td><span class="tag">${lab[m]}</span></td><td>${q.done}</td><td>${q.correct}</td><td><b>${q.done ? pct(q.correct, q.done) + "%" : "—"}</b></td></tr>`; }).join("")}
            <tr class="tot"><td>Total</td><td>${qt.done}</td><td>${qt.correct}</td><td><b>${qt.done ? pct(qt.correct, qt.done) + "%" : "—"}</b></td></tr>
          </tbody></table></div>
        </div>
        <div class="card">
          <b class="card-h">📈 Acerto por dia</b>
          <div class="bars">${last14.map(k => { const q = g.questions.byDate[k]; const p = q ? pct(q.correct, q.done) : 0; return `<div class="b ${k === tk ? "today" : ""}"><em>${q ? p + "%" : ""}</em><i style="height:${q ? Math.max(4, p * .82) : 3}%;${q ? "" : "opacity:.4"}"></i></div>`; }).join("")}</div>
          <div class="bars-x">${last14.map(k => { const p = dParts(k); return `<span class="${k === tk ? "today" : ""}">${p.d}/${p.m}</span>`; }).join("")}</div>
          <div class="muted small" style="margin-top:8px">% de acerto nos últimos 14 dias</div>
        </div>
      </div>

      ${g.worst.length ? `<div class="card" style="margin-top:14px"><b class="card-h">🧭 Piores assuntos (para revisar)</b>
        <div style="margin-top:8px">${g.worst.map(w => { const d = findDay(w.key); return `<div class="sess"><div class="t"><b>${esc(d.t)}</b><span class="muted small">${lab[d.m]} · ${w.correct}/${w.done} acertos</span></div><b style="color:${w.pct < .6 ? "var(--coral)" : "var(--green)"}">${Math.round(w.pct * 100)}%</b></div>`; }).join("")}</div></div>` : ""}

      <div class="section-title">Tempo de foco</div>
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap"><b style="font:700 15px var(--head)">Ritmo de estudos</b><span class="muted small">total ${hm(st.total)} · meta batida em ${goalDays} de 14 dias</span></div>
        <div class="bars">${st.last14.map(x => `<div class="b ${x.date === tk ? "today" : ""}"><em>${x.seconds ? mins(x.seconds) + "min" : ""}</em><i style="height:${Math.max(3, (x.seconds / max) * 82)}%"></i></div>`).join("")}</div>
        <div class="bars-x">${st.last14.map(x => { const p = dParts(x.date); return `<span class="${x.date === tk ? "today" : ""}">${p.d}/${p.m}</span>`; }).join("")}</div>
      </div>
      <div class="grid-2" style="margin-top:14px">
        <div class="card"><b style="font:700 15px var(--head)">Tempo por matéria</b><div class="subj" style="margin-top:12px">
          ${["ESP", "POR", "NOR", "ING", "REV", "FIN"].filter(m => lab[m]).map(m => `<div class="subj-row t-${m}"><span class="mark">${lab[m][0]}</span><div class="info"><strong>${lab[m]}</strong><small>${hm(bySubj[m] || 0)}</small><div class="bar"><i style="width:${((bySubj[m] || 0) / subjMax) * 100}%"></i></div></div></div>`).join("")}
        </div></div>
        <div class="card"><b style="font:700 15px var(--head)">Sessões recentes</b><div id="sess"><div class="empty">Carregando…</div></div></div>
      </div>`;
    try {
      const { sessions } = await Api.sessions();
      const box = v.querySelector("#sess");
      if (!box) return;
      box.innerHTML = sessions.length ? sessions.map(s => {
        const d = findDay(s.dayKey), p = dParts(s.localDate);
        const hh = new Date(s.startedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
        return `<div class="sess"><div class="t"><b>${esc(d ? d.t : "Estudo livre")}</b><span class="muted small">${String(p.d).padStart(2, "0")}/${String(p.m).padStart(2, "0")} às ${hh} · ${(Timer.MODES[s.mode] || Timer.MODES.livre).label}</span></div>
          <b>${hm(s.seconds)}</b><button class="icon-btn" data-del="${s.id}" title="Apagar sessão">${Icon("trash", 18)}</button></div>`;
      }).join("") : `<div class="empty">Nenhuma sessão ainda. Inicie o modo foco!</div>`;
      box.onclick = e => {
        const b = e.target.closest("[data-del]"); if (!b) return;
        confirmBox("Apagar sessão?", "O tempo dessa sessão sai das suas estatísticas.", "Apagar", async () => {
          try { await Api.deleteSession(b.dataset.del); await refreshData(); route(); toast("Sessão apagada."); } catch (x) { toast(x.message); }
        });
      };
    } catch (x) { toast(x.message); }
  }

  // =================================================================
  // CONQUISTAS
  // =================================================================
  function viewAchievements(v) {
    const g = S.g, r = g.xp.rules, got = g.achievements.filter(a => a.unlockedAt).length;
    const fmtD = s => { const d = new Date(s.replace(" ", "T") + "Z"); return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }); };
    v.innerHTML = `
      <div class="page-title">Conquistas</div>
      <div class="grid-2">
        <div class="card">${levelBar(g)}
          <div class="xp-split">
            <div><b>${g.xp.days}</b><span>dias</span></div><div><b>${g.xp.questions}</b><span>questões</span></div><div><b>${g.xp.achievements}</b><span>conquistas</span></div>
          </div></div>
        <div class="card fire-card ${g.streak ? "" : "off"}"><span class="flame">🔥</span><div><b>${g.streak} ${g.streak === 1 ? "dia seguido" : "dias seguidos"}</b><span class="muted small">Recorde: ${g.bestStreak}. A sequência conta os dias concluídos no próprio dia.</span></div></div>
      </div>
      <div class="section-title">Medalhas <span class="muted small">${got} de ${g.achievements.length}</span></div>
      <div class="ach-grid">${g.achievements.map(a => `<div class="card ach ${a.unlockedAt ? "on" : ""}"><span class="ai">${a.icon}</span><b>${esc(a.title)}</b><span class="muted small">${esc(a.desc)}</span>${a.unlockedAt ? `<span class="st-pill st-done">desbloqueada ${fmtD(a.unlockedAt)}</span>` : `<span class="st-pill">+${r.achievement} XP</span>`}</div>`).join("")}</div>
      <div class="card" style="margin-top:16px"><b class="card-h">Como ganhar XP</b>
        <ul class="rules"><li>Dia concluído no próprio dia: <b>+${r.day} XP</b></li><li>Dia atrasado recuperado: <b>+${r.late} XP</b></li><li>Cada questão acertada: <b>+${r.correct} XP</b></li><li>Cada conquista: <b>+${r.achievement} XP</b></li></ul>
        <p class="muted small" style="margin:6px 0 0">Níveis: Estagiário → Júnior I → Júnior II → Pleno I → Pleno II → Sênior → Tech Lead → Arquiteto → Aprovado. Cada nível pede 100 XP a mais que o anterior.</p></div>`;
  }

  // =================================================================
  // PERFIL
  // =================================================================
  function viewProfile(v) {
    const u = S.user;
    v.innerHTML = `
      <div class="page-title">Perfil</div>
      <div class="card profile-head"><div class="avatar-lg">${esc(initials(u.name))}</div><b style="font-size:18px">${esc(u.name)}</b><div class="muted small">${esc(u.email)}</div></div>
      <div class="grid-2" style="margin-top:14px">
        <div class="card">
          <b>Seus dados</b>
          <form id="pf" style="margin-top:12px">
            <div class="field"><label>Nome</label><input name="name" value="${esc(u.name)}" maxlength="60" required></div>
            <div class="field"><label>Meta diária de estudo</label><select name="dailyGoal">${[30, 45, 60, 90, 120, 180].map(m => `<option value="${m}" ${m === u.dailyGoal ? "selected" : ""}>${m} minutos</option>`).join("")}</select></div>
            <div class="field"><label>Meta diária de questões (total, dividido entre as matérias pelo peso)</label><select name="dailyQGoal">${[20, 30, 40, 50, 60, 80, 100, 120, 150].map(m => `<option value="${m}" ${m === u.dailyQGoal ? "selected" : ""}>${m} questões por dia</option>`).join("")}</select></div>
            <button class="btn btn-purple btn-block">Salvar</button>
          </form>
        </div>
        <div class="card">
          <b>Cronograma</b>
          <p class="muted small" style="margin:4px 0 10px">O progresso e o tempo de cada cronograma ficam salvos separadamente — dá para trocar e voltar.</p>
          <div class="edital-pick">${editalCards(u.edital)}</div>
        </div>
        <div class="card">
          <b>Alterar senha</b>
          <form id="pw" style="margin-top:12px">
            <div class="field"><label>Senha atual</label><input name="current" type="password" autocomplete="current-password" required></div>
            <div class="field"><label>Nova senha</label><input name="next" type="password" autocomplete="new-password" minlength="6" required></div>
            <button class="btn btn-ghost btn-block">Alterar senha</button>
          </form>
        </div>
        <div class="card">
          <div class="list-row" style="padding-top:0"><span style="flex:1">Sair da conta</span><button class="btn btn-ghost btn-sm" id="out">${Icon("logout", 16)} Sair</button></div>
          <p class="muted small" style="margin:8px 0 0">Conteúdo baseado no Edital nº 01/2026 da INB (banca FGV). Datas sujeitas a alteração — confira sempre a página do concurso na FGV.</p>
        </div>
      </div>`;
    v.querySelector("#pf").onsubmit = async e => {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(e.target));
      try { const { user } = await Api.updateMe({ name: fd.name, dailyGoal: +fd.dailyGoal, dailyQGoal: +fd.dailyQGoal }); S.user = user; await refreshData(); renderShell(); route(); toast("Dados salvos."); }
      catch (x) { toast(x.message); }
    };
    v.querySelector("#pw").onsubmit = async e => {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(e.target));
      try { await Api.changePassword(fd.current, fd.next); e.target.reset(); toast("Senha alterada."); } catch (x) { toast(x.message); }
    };
    v.querySelectorAll("[data-ed]").forEach(b => b.onclick = () => {
      const ed = b.dataset.ed; if (ed === u.edital) return;
      if (Timer.isActive()) return toast("Finalize a sessão de foco antes de trocar de cronograma.");
      confirmBox("Trocar de cronograma?", `Você vai passar a seguir o cronograma de ${Plans.EDITAIS[ed].nome}. Seu progresso atual continua salvo.`, "Trocar", async () => {
        try { const { user } = await Api.updateMe({ edital: ed }); S.pick = null; await enter(user); location.hash = "#inicio"; toast("Cronograma trocado."); }
        catch (x) { toast(x.message); }
      });
    });
    v.querySelector("#out").onclick = () => {
      const go = async () => { if (Timer.isActive()) await Timer.discard(); Timer.reset(); await Api.logout().catch(() => {}); S.user = null; history.replaceState(null, "", "/"); renderAuth("start"); };
      Timer.isActive() ? confirmBox("Sair agora?", "Há uma sessão de foco em andamento que será descartada.", "Sair", go) : go();
    };
  }

  boot();
})();
