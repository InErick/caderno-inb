// =====================================================================
// Caderno INB — telas do app (SPA sem framework)
// =====================================================================
(() => {
  const S = { user: null, plan: [], done: new Set(), stats: null, filter: "ALL", query: "", pick: null, mode: "meta", openDays: new Set(), apostilas: new Set() };
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
    Timer.reset();
    Timer.init(user, { toast, confirm: confirmBox, onSaved });
    await refreshData();
    renderShell();
    if (!location.hash) location.hash = "#inicio"; else route();
  }

  async function refreshData() {
    const [p, st, ap] = await Promise.all([Api.progress(), Api.stats(todayKey()), Api.apostilas().catch(() => ({ days: [] }))]);
    S.done = new Set(p.done);
    S.stats = st;
    S.apostilas = new Set(ap.days);
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
    ["inicio", "home", "Início"], ["cronograma", "calendar", "Cronograma"], ["foco", "timer", "Foco"],
    ["estatisticas", "chart", "Estatísticas"], ["perfil", "user", "Perfil"],
  ];

  function renderShell() {
    app.innerHTML = `<div class="shell">
      <nav class="nav">
        <div class="nav-brand"><span class="brand-symbol"><span></span></span>Caderno INB</div>
        <p class="nav-label">SEU ESPAÇO</p>
        ${NAV.map(([id, ic, l]) => `<a href="#${id}" data-r="${id}" class="${id === "foco" ? "focus-tab" : ""}">${Icon(ic, id === "foco" ? 26 : 22)}<span>${l}</span></a>`).join("")}
        <div class="nav-goal" id="navGoal"></div>
      </nav>
      <div class="content">
        <header class="topbar">
          <div class="av">${esc(initials(S.user.name))}</div>
          <div class="who"><b>${esc(S.user.name.split(" ")[0])}</b><span>${ED().nome}</span></div>
          <div class="right">${Icon("clock", 16)}<span id="countTop"></span></div>
        </header>
        <main class="main" id="view"></main>
      </div></div>`;
    const days = Math.ceil((new Date(ED().examISO) - Date.now()) / 864e5);
    document.getElementById("countTop").textContent = days > 0 ? `${days} dias` : "Prova!";
  }

  function route() {
    if (!S.user) return;
    Reader.close();
    const full = (location.hash || "#inicio").slice(1);
    const r = full.startsWith("apostila/") ? "apostila" : full;
    const md = document.getElementById("modal"); md.hidden = true; md.innerHTML = "";
    document.querySelectorAll(".nav a").forEach(a => a.classList.toggle("on", a.dataset.r === (r === "apostila" ? "cronograma" : r)));
    const v = document.getElementById("view");
    if (!v) return;
    const ng = document.getElementById("navGoal");
    if (ng && S.stats) {
      const goal = S.user.dailyGoal * 60 * 7, p = Math.min(100, Math.round((S.stats.week / goal) * 100));
      ng.innerHTML = `<div class="gh">${Icon("target", 16)}<span>Meta semanal</span><b>${p}%</b></div><div class="track"><i style="width:${p}%"></i></div><p>${hm(S.stats.week)} de ${hm(goal)}</p>`;
    }
    if (r === "apostila") return viewApostila(v, full.slice(9));
    ({ inicio: viewHome, cronograma: viewPlan, foco: viewFocus, estatisticas: viewStats, perfil: viewProfile }[r] || viewHome)(v);
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);

  // =================================================================
  // INÍCIO
  // =================================================================
  function ring(pct, color, label, sub) {
    const r = 46, c = 2 * Math.PI * r, p = Math.max(0, Math.min(1, pct));
    return `<div class="ring"><svg width="112" height="112" viewBox="0 0 112 112">
      <circle cx="56" cy="56" r="${r}" fill="none" stroke="#eeede9" stroke-width="10"/>
      <circle cx="56" cy="56" r="${r}" fill="none" stroke="${color}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - p)}"/>
    </svg><div class="val"><div>${label}<small>${sub || ""}</small></div></div></div>`;
  }

  function dayCardBody(d, n = 99) {
    const kws = d.k.slice(0, n).map(s => `<a href="https://www.google.com/search?q=${encodeURIComponent(s)}" target="_blank" rel="noopener">${esc(s)}</a>`).join("");
    return `<div class="kw">${kws}</div><div class="foco-txt">🎯 ${d.f}</div>`;
  }

  function viewHome(v) {
    const t = planToday(), st = S.stats, goal = S.user.dailyGoal * 60;
    const days = Math.ceil((new Date(ED().examISO) - Date.now()) / 864e5);
    const pct = S.done.size / S.plan.length;
    const idx = S.plan.indexOf(t);
    const next = S.plan.slice(idx + 1, idx + 4);
    const done = S.done.has(t.key);
    const studied = st.byDayKey[t.key] || 0;
    const lab = ED().labels;
    const h = new Date().getHours(), hi = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
    const now = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
    v.innerHTML = `
      <section class="welcome"><p class="eyebrow">${esc(now)}</p><h1>${hi}, ${esc(S.user.name.split(" ")[0])}.</h1><p class="sub">Um pouco de progresso todos os dias faz toda a diferença.</p></section>
      <div class="hero">
        <div class="ico">${Icon("trophy", 30)}</div>
        <div><div class="lbl">Faltam para a prova</div><div class="big">${days > 0 ? days : 0} <span style="font-size:18px;font-weight:600">dias</span></div>
        <div class="small" style="opacity:.9">${ED().prova} · portões fecham ${ED().portoes}</div></div>
      </div>

      <div class="section-title">Estudo de hoje <span class="muted small">${DOW[dParts(t.key).dow]}, ${String(dParts(t.key).d).padStart(2, "0")}/${MONTHS[dParts(t.key).m - 1]} · dia ${t.index}/61</span></div>
      <div class="card today-card t-${t.m}">
        <span class="tag">${lab[t.m]}</span><span class="area">${esc(t.a)}</span>
        <div class="ttl">${esc(t.t)}</div>
        ${dayCardBody(t, 5)}
        <div class="day-actions" style="margin-top:14px">
          <button class="btn btn-pink" id="startToday">${Icon("play", 16)} ${Timer.isActive() ? "Voltar ao foco" : "Iniciar foco"}</button>
          ${S.apostilas.has(t.key) ? `<a class="btn btn-ghost ap-btn" href="#apostila/${t.key}">📖 Abrir apostila</a>` : ""}
          <button class="check-btn ${done ? "on" : ""}" id="doneToday"><span class="box">${Icon("check", 12)}</span>${done ? "Concluído" : "Marcar concluído"}</button>
          ${studied ? `<span class="badge-time">${Icon("clock", 14)} ${hm(studied)} estudados</span>` : ""}
        </div>
      </div>

      <div class="rings" style="margin-top:14px">
        <div class="card ring-card"><div class="lbl">Meta de hoje</div>${ring(st.today / goal, "#ef7254", `${mins(st.today)}<span style="font-size:13px">/${S.user.dailyGoal}</span>`, "minutos")}</div>
        <div class="card ring-card"><div class="lbl">Cronograma</div>${ring(pct, "#3f8a72", `${Math.round(pct * 100)}%`, `${S.done.size} de ${S.plan.length} dias`)}</div>
      </div>

      <div class="stats3" style="margin-top:14px">
        <div class="card stat s1"><div class="si">${Icon("fire", 21)}</div><div><span>Sequência atual</span><b>${st.streak} ${st.streak === 1 ? "dia" : "dias"}</b></div></div>
        <div class="card stat s2"><div class="si">${Icon("clock", 21)}</div><div><span>Últimos 7 dias</span><b>${hm(st.week)}</b></div></div>
        <div class="card stat s3"><div class="si">${Icon("trophy", 21)}</div><div><span>Tempo total</span><b>${hm(st.total)}</b></div></div>
      </div>

      ${next.length ? `<div class="section-title">Próximos dias <a href="#cronograma" class="link-btn small" style="text-decoration:none">Ver tudo</a></div>
      <div class="next-list">${next.map(d => { const p = dParts(d.key); return `
        <div class="card next-item t-${d.m}"><div class="date-bubble"><b>${String(p.d).padStart(2, "0")}</b><span>${DOW[p.dow]}</span></div>
        <div><span class="tag">${lab[d.m]}</span><div class="t" style="margin-top:4px">${esc(d.t)}</div></div></div>`; }).join("")}</div>` : ""}`;

    v.querySelector("#startToday").onclick = e => {
      if (Timer.isActive()) return Timer.expand(e.currentTarget);
      Timer.start(t, S.mode, S.user.dailyGoal, e.currentTarget);
    };
    v.querySelector("#doneToday").onclick = () => toggleDone(t.key, () => viewHome(v));
  }

  async function toggleDone(key, rerender) {
    const now = !S.done.has(key);
    now ? S.done.add(key) : S.done.delete(key);
    rerender?.();
    try { await Api.setDone(key, now); if (now) toast("Dia marcado como concluído ✅"); }
    catch (e) { now ? S.done.delete(key) : S.done.add(key); rerender?.(); toast(e.message); }
  }

  // =================================================================
  // CRONOGRAMA
  // =================================================================
  function viewPlan(v) {
    const lab = ED().labels;
    const filters = [["ALL", "Tudo"], ["ESP", lab.ESP], ["POR", lab.POR], ["NOR", lab.NOR], ["ING", lab.ING], ["REV", "Revisões"], ["TODO", "Pendentes"]];
    v.innerHTML = `
      <div class="page-title">Cronograma · ${ED().nome}</div>
      <div class="search">${Icon("search", 20)}<input id="q" placeholder="Buscar assunto (ex.: LINQ, crase, LGPD)…" value="${esc(S.query)}"></div>
      <div class="chips">${filters.map(([k, l]) => `<button class="chip ${S.filter === k ? "on" : ""}" data-f="${k}">${l}</button>`).join("")}</div>
      <div id="days"></div>`;
    const tk = todayKey();
    const draw = () => {
      const q = S.query.trim().toLowerCase();
      let html = "", wk = 0, lastWeek = -1, count = 0;
      S.plan.forEach((d, i) => {
        if (i === 0 || d.dow === 1) wk++;
        const isDone = S.done.has(d.key);
        const f = S.filter;
        const okF = f === "ALL" || (f === "TODO" ? !isDone : f === "REV" ? (d.m === "REV" || d.m === "FIN") : d.m === f);
        const okQ = !q || (d.t + " " + d.a + " " + d.k.join(" ")).toLowerCase().includes(q);
        if (!okF || !okQ) return;
        count++;
        if (wk !== lastWeek) { html += `<div class="week-h">Semana ${wk}</div>`; lastWeek = wk; }
        const p = dParts(d.key), studied = S.stats.byDayKey[d.key] || 0;
        const open = S.openDays.has(d.key) || (d.key === tk && !S.openDays.has("_closed_" + d.key));
        html += `<div class="card day t-${d.m} ${isDone ? "done" : ""} ${d.key === tk ? "is-today" : ""} ${open ? "open" : ""}" data-k="${d.key}" ${d.key === tk ? 'id="hoje"' : ""}>
          <div class="date-bubble"><b>${String(p.d).padStart(2, "0")}</b><span>${MONTHS[p.m - 1]}</span></div>
          <div>
            <div class="day-head" data-toggle style="display:flex;align-items:flex-start;gap:8px">
              <div style="flex:1;min-width:0"><span class="tag">${lab[d.m]}</span><span class="area">${DOW[p.dow]} · dia ${d.index}</span>
              <div class="ttl">${esc(d.t)}</div>
              <div class="meta">${S.apostilas.has(d.key) ? `<span class="badge-time">📖 apostila</span>` : ""}${studied ? `<span class="badge-time">${Icon("clock", 13)} ${hm(studied)}</span>` : ""}${isDone ? `<span class="badge-time" style="color:var(--green)">${Icon("check", 13)} concluído</span>` : ""}</div></div>
              <span class="chev">${Icon("chevron", 20)}</span>
            </div>
            <div class="day-body">${dayCardBody(d)}
              <div class="day-actions">
                ${S.apostilas.has(d.key) ? `<a class="btn btn-ghost btn-sm ap-btn" href="#apostila/${d.key}">📖 Apostila</a>` : ""}
                <button class="btn btn-pink btn-sm" data-study>${Icon("play", 14)} Estudar</button>
                <button class="check-btn ${isDone ? "on" : ""}" data-done><span class="box">${Icon("check", 12)}</span>${isDone ? "Concluído" : "Marcar concluído"}</button>
              </div>
            </div>
          </div></div>`;
      });
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
    v.querySelector("#days").onclick = e => {
      const card = e.target.closest(".day"); if (!card) return;
      const key = card.dataset.k;
      if (e.target.closest("[data-toggle]")) {
        const open = card.classList.toggle("open");
        if (key === tk) open ? S.openDays.delete("_closed_" + key) : S.openDays.add("_closed_" + key);
        else open ? S.openDays.add(key) : S.openDays.delete(key);
      }
      if (e.target.closest("[data-done]")) toggleDone(key, draw);
      if (e.target.closest("[data-study]")) {
        const d = S.plan.find(x => x.key === key);
        if (Timer.isActive()) { Timer.expand(e.target.closest("[data-study]")); return; }
        Timer.start(d, S.mode, S.user.dailyGoal, e.target.closest("[data-study]"));
      }
    };
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
    const modes = [["meta", "Meta do dia", `${S.user.dailyGoal} min`], ["pomodoro", "Pomodoro", "25 min"], ["livre", "Livre", "sem limite"]];
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
    v.querySelector("#topic").onchange = e => S.pick = e.target.value;
    v.querySelector(".mode-pick").onclick = e => {
      const b = e.target.closest("[data-m]"); if (!b) return;
      S.mode = b.dataset.m; v.querySelectorAll(".mode").forEach(x => x.classList.toggle("on", x === b));
    };
    v.querySelector("#autopip")?.addEventListener("change", e => { try { localStorage.setItem("caderno_auto_pip", e.target.checked ? "1" : "0"); } catch {} });
    v.querySelector("#back")?.addEventListener("click", e => Timer.expand(e.currentTarget));
    v.querySelector("#go").onclick = e => {
      if (Timer.isActive()) return Timer.expand(e.currentTarget);
      const d = S.plan.find(x => x.key === S.pick) || null;
      Timer.start(d, S.mode, S.user.dailyGoal, e.currentTarget);
    };
  }

  // =================================================================
  // APOSTILA
  // =================================================================
  function viewApostila(v, day) {
    Reader.open(v, {
      day, edital: S.user.edital, plan: S.plan, labels: ED().labels, toast,
      onBack: () => { history.length > 1 ? history.back() : (location.hash = "#cronograma"); },
      onStudy: el => {
        if (Timer.isActive()) return toast("O cronômetro já está rodando no canto da tela.");
        Timer.start(S.plan.find(x => x.key === day), S.mode, S.user.dailyGoal, el, true);
      },
    });
  }

  async function onSaved(session, secs) {
    try { await refreshData(); } catch {}
    if (!location.hash.startsWith("#apostila/")) route();
    const key = session.dayKey;
    if (key && !S.done.has(key)) {
      modal(`<div style="font-size:42px">🎉</div><h3>Sessão salva!</h3>
        <p class="muted small">${hm(secs)} estudando <b>${esc(session.title)}</b>.<br>Quer marcar esse dia do cronograma como concluído?</p>
        <div class="actions"><button class="btn btn-pink btn-block" data-ok>Marcar como concluído</button><button class="btn btn-ghost btn-block" data-x>Agora não</button></div>`,
        (m, close) => {
          m.querySelector("[data-ok]").onclick = () => { close(); toggleDone(key, route); };
          m.querySelector("[data-x]").onclick = close;
        });
    } else toast(`Sessão salva: ${hm(secs)} ✅`);
  }

  // =================================================================
  // ESTATÍSTICAS
  // =================================================================
  async function viewStats(v) {
    const st = S.stats, lab = ED().labels;
    const max = Math.max(S.user.dailyGoal * 60, ...st.last14.map(x => x.seconds));
    const bySubj = {};
    for (const [k, s] of Object.entries(st.byDayKey)) { const d = S.plan.find(x => x.key === k); if (d) bySubj[d.m] = (bySubj[d.m] || 0) + s; }
    const subjMax = Math.max(1, ...Object.values(bySubj));
    const goalDays = st.last14.filter(x => x.seconds >= S.user.dailyGoal * 60).length;
    v.innerHTML = `
      <div class="page-title">Estatísticas</div>
      <div class="stats3">
        <div class="card stat s1"><div class="si">${Icon("fire", 21)}</div><div><span>Sequência atual</span><b>${st.streak} ${st.streak === 1 ? "dia" : "dias"}</b></div></div>
        <div class="card stat s2"><div class="si">${Icon("clock", 21)}</div><div><span>Tempo total</span><b>${hm(st.total)}</b></div></div>
        <div class="card stat s3"><div class="si">${Icon("timer", 21)}</div><div><span>Sessões concluídas</span><b>${st.sessionsCount}</b></div></div>
      </div>
      <div class="card" style="margin-top:14px">
        <div style="display:flex;justify-content:space-between;align-items:baseline"><b style="font:700 15px var(--head)">Ritmo de estudos</b><span class="muted small">meta batida em ${goalDays} de 14 dias</span></div>
        <div class="bars">${st.last14.map(x => `<div class="b ${x.date === todayKey() ? "today" : ""}"><em>${x.seconds ? mins(x.seconds) + "min" : ""}</em><i style="height:${Math.max(3, (x.seconds / max) * 82)}%"></i></div>`).join("")}</div>
        <div class="bars-x">${st.last14.map(x => { const p = dParts(x.date); return `<span class="${x.date === todayKey() ? "today" : ""}">${p.d}/${p.m}</span>`; }).join("")}</div>
        <div class="muted small" style="margin-top:8px">Minutos de foco por dia · em coral, hoje</div>
      </div>
      <div class="grid-2" style="margin-top:14px">
        <div class="card"><b style="font:700 15px var(--head)">Tempo por matéria</b><div class="subj" style="margin-top:12px">
          ${["ESP", "POR", "NOR", "ING", "REV", "FIN"].map(m => `<div class="subj-row t-${m}"><span class="mark">${lab[m][0]}</span><div class="info"><strong>${lab[m]}</strong><small>${hm(bySubj[m] || 0)}</small><div class="bar"><i style="width:${((bySubj[m] || 0) / subjMax) * 100}%"></i></div></div></div>`).join("")}
        </div></div>
        <div class="card"><b style="font:700 15px var(--head)">Sessões recentes</b><div id="sess"><div class="empty">Carregando…</div></div></div>
      </div>`;
    try {
      const { sessions } = await Api.sessions();
      const box = v.querySelector("#sess");
      if (!box) return;
      box.innerHTML = sessions.length ? sessions.map(s => {
        const d = S.plan.find(x => x.key === s.dayKey), p = dParts(s.localDate);
        const hh = new Date(s.startedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
        return `<div class="sess"><div class="t"><b>${esc(d ? d.t : "Estudo livre")}</b><span class="muted small">${String(p.d).padStart(2, "0")}/${String(p.m).padStart(2, "0")} às ${hh} · ${Timer.MODES[s.mode].label}</span></div>
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
      try { const { user } = await Api.updateMe({ name: fd.name, dailyGoal: +fd.dailyGoal }); S.user = user; renderShell(); route(); toast("Dados salvos."); }
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
