// =====================================================================
// Modo foco: cronômetro, animação de tela cheia e janela flutuante (PiP)
// =====================================================================
window.Timer = (() => {
  const MODES = {
    meta: { label: "Meta do dia", countdown: true },
    pomodoro: { label: "Pomodoro", countdown: true, minutes: 25 },
    livre: { label: "Cronômetro livre", countdown: false },
  };
  const R = 92, CIRC = 2 * Math.PI * R;

  let user = null, opts = {};
  let st = null;              // estado do cronômetro (persistido no localStorage)
  let tickId = null, pipWin = null, audioCtx = null, expanded = false, finishing = false;
  const $focus = () => document.getElementById("focus");
  const $mini = () => document.getElementById("miniTimer");
  const storeKey = () => `caderno_timer_${user.id}`;
  const pendingKey = () => `caderno_pending_${user.id}`;
  const baseTitle = "Caderno INB";

  // ---------- persistência ----------
  const save = () => { try { st ? localStorage.setItem(storeKey(), JSON.stringify(st)) : localStorage.removeItem(storeKey()); } catch {} };
  const load = () => { try { return JSON.parse(localStorage.getItem(storeKey())); } catch { return null; } };

  const elapsed = () => !st ? 0 : st.elapsedBefore + (st.runningSince ? (Date.now() - st.runningSince) / 1000 : 0);
  const remaining = () => Math.max(0, st.target - elapsed());
  const fmt = s => {
    s = Math.max(0, Math.round(s));
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60, p = n => String(n).padStart(2, "0");
    return h ? `${h}:${p(m)}:${p(x)}` : `${p(m)}:${p(x)}`;
  };
  const localDate = (d = new Date()) => Plans.keyOf(d);

  // ---------- API pública ----------
  function init(u, o) {
    user = u; opts = o || {};
    st = load();
    flushPending();
    try {
      // Chrome pode abrir a janela flutuante sozinho ao trocar de aba (quando suportado)
      navigator.mediaSession?.setActionHandler?.("enterpictureinpicture", () => { if (st) openPip(); });
    } catch {}
    if (st) { buildOverlay(); startTick(); showMini(); }
  }

  function reset() { stopTick(); closePip(); st = null; expanded = false; $focus().hidden = true; $mini().hidden = true; document.title = baseTitle; }

  function isActive() { return !!st; }
  function current() { return st; }

  async function start(topic, mode, goalMin, originEl) {
    if (st) { expand(originEl); return; }
    const target = mode === "pomodoro" ? 25 * 60 : mode === "meta" ? goalMin * 60 : null;
    st = {
      dayKey: topic?.key || null, title: topic?.t || "Estudo livre", m: topic?.m || "REV", area: topic?.a || "",
      mode, target, startedAt: new Date().toISOString(), runningSince: Date.now(), elapsedBefore: 0,
    };
    save();
    unlockAudio();
    if ("Notification" in window && Notification.permission === "default") Notification.requestPermission().catch(() => {});
    buildOverlay();
    startTick();
    expand(originEl);
    if (wantsPip()) openPip();
    else if (isTouch()) document.documentElement.requestFullscreen?.().catch(() => {});
  }

  function pause() { if (!st || !st.runningSince) return; st.elapsedBefore = elapsed(); st.runningSince = null; save(); render(); }
  function resume() { if (!st || st.runningSince) return; st.runningSince = Date.now(); save(); render(); }
  function toggle() { st?.runningSince ? pause() : resume(); }

  async function finish(auto = false) {
    if (!st || finishing) return;
    finishing = true;
    try { await doFinish(auto); } finally { finishing = false; }
  }
  async function doFinish(auto) {
    const secs = Math.round(Math.min(elapsed(), st.target || Infinity));
    const done = { ...st };
    const session = {
      dayKey: done.dayKey, seconds: secs, mode: done.mode, localDate: localDate(new Date(done.startedAt)),
      startedAt: done.startedAt, endedAt: new Date().toISOString(),
    };
    stopTick(); closePip();
    await shrink();
    st = null; save(); $mini().hidden = true; document.title = baseTitle;
    exitFullscreen();
    if (secs < 5) { opts.toast?.("Sessão muito curta, não foi salva."); return; }
    try { await Api.saveSession(session); }
    catch (e) { queuePending(session); opts.toast?.("Sem conexão: a sessão será enviada depois."); }
    if (auto) { beep(); notify("Tempo concluído! 🎉", `${fmt(secs)} de estudo em ${done.title}`); }
    opts.onSaved?.(done, secs);
  }

  async function discard() {
    if (!st || finishing) return;
    stopTick(); closePip(); await shrink();
    st = null; save(); $mini().hidden = true; document.title = baseTitle; exitFullscreen();
    opts.toast?.("Sessão descartada.");
  }

  // ---------- fila offline ----------
  function queuePending(s) { try { const q = JSON.parse(localStorage.getItem(pendingKey()) || "[]"); q.push(s); localStorage.setItem(pendingKey(), JSON.stringify(q)); } catch {} }
  async function flushPending() {
    let q; try { q = JSON.parse(localStorage.getItem(pendingKey()) || "[]"); } catch { return; }
    if (!q.length) return;
    const left = [];
    for (const s of q) { try { await Api.saveSession(s); } catch { left.push(s); } }
    try { localStorage.setItem(pendingKey(), JSON.stringify(left)); } catch {}
  }

  // ---------- overlay ----------
  function buildOverlay() {
    const f = $focus();
    const lab = Plans.EDITAIS[user.edital].labels[st.m] || "Estudo";
    f.className = `focus t-${st.m}`;
    f.innerHTML = `
      <div class="f-top">
        <div class="grp"><button class="f-icon" data-a="min" title="Minimizar (o tempo continua)">${Icon("minimize")}</button></div>
        <div class="grp">
          ${pipSupported() ? `<button class="f-icon" data-a="pip" title="Janela flutuante">${Icon("pip")}</button>` : ""}
          ${document.fullscreenEnabled ? `<button class="f-icon" data-a="fs" title="Tela cheia">${Icon("expand")}</button>` : ""}
        </div>
      </div>
      <div class="f-topic"><span class="eyebrow-f"><i></i>MODO FOCO · ${lab}</span><h2>${st.title}</h2></div>
      <div class="f-ring">
        <svg viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="${R}" fill="none" stroke="#3f4e4a" stroke-width="8"/>
          <circle class="prog" cx="100" cy="100" r="${R}" fill="none" stroke="url(#fg)" stroke-width="8" stroke-linecap="round" stroke-dasharray="${CIRC}" stroke-dashoffset="${CIRC}" style="transition:stroke-dashoffset .4s linear"/>
          <defs><linearGradient id="fg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f27a5d"/><stop offset="1" stop-color="#f7a58b"/></linearGradient></defs>
        </svg>
        <div class="time"><div><b class="tm">00:00</b><span class="sub"></span></div></div>
      </div>
      <div class="f-ctrls">
        <button class="f-btn" data-a="discard" title="Descartar sessão">${Icon("close", 26)}</button>
        <button class="f-btn primary" data-a="toggle" title="Pausar / continuar"></button>
        <button class="f-btn" data-a="finish" title="Finalizar e salvar">${Icon("stop", 24)}</button>
      </div>
      <p class="f-hint">${pipSupported() ? "Use o botão de janela flutuante para ver o cronômetro por cima de qualquer aba ou programa." : "Você pode minimizar: o tempo continua contando."}</p>`;
    f.onclick = e => {
      const a = e.target.closest("[data-a]")?.dataset.a;
      if (a === "toggle") toggle();
      if (a === "finish") finish();
      if (a === "discard") confirmDiscard();
      if (a === "min") minimize();
      if (a === "pip") pipWin ? closePip() : openPip();
      if (a === "fs") document.fullscreenElement ? exitFullscreen() : document.documentElement.requestFullscreen?.().catch(() => {});
    };
    render();
  }

  function confirmDiscard() {
    opts.confirm?.("Descartar sessão?", "O tempo desta sessão não será salvo.", "Descartar", () => discard());
  }

  function rectVars(el) {
    const f = $focus();
    const r = el?.getBoundingClientRect?.();
    if (!r || !r.width) { // sem origem: cresce do centro
      const w = innerWidth, h = innerHeight;
      Object.entries({ t: h / 2 - 40, b: h / 2 - 40, l: w / 2 - 40, r: w / 2 - 40, rad: 40 }).forEach(([k, v]) => f.style.setProperty("--" + k, v + "px"));
      return;
    }
    f.style.setProperty("--t", r.top + "px");
    f.style.setProperty("--l", r.left + "px");
    f.style.setProperty("--r", innerWidth - r.right + "px");
    f.style.setProperty("--b", innerHeight - r.bottom + "px");
    f.style.setProperty("--rad", Math.min(r.width, r.height) / 2 + "px");
  }

  function expand(originEl) {
    const f = $focus();
    $mini().hidden = true;
    f.classList.add("anim-off"); f.classList.remove("ready");
    rectVars(originEl || $mini());
    f.hidden = false;
    void f.offsetWidth; // força o navegador a aplicar o estado inicial
    f.classList.remove("anim-off");
    ["t", "r", "b", "l", "rad"].forEach(k => f.style.setProperty("--" + k, "0px"));
    expanded = true;
    setTimeout(() => f.classList.add("ready"), 60);
    render();
  }

  function shrink() {
    return new Promise(res => {
      const f = $focus();
      if (f.hidden) return res();
      f.classList.remove("ready");
      const target = document.querySelector(".nav a.focus-tab") || null;
      setTimeout(() => {
        rectVars(target);
        setTimeout(() => { f.hidden = true; expanded = false; res(); }, 560);
      }, 120);
    });
  }

  async function minimize() { exitFullscreen(); await shrink(); showMini(); }
  function showMini() { if (!st || expanded) return; const m = $mini(); m.hidden = false; m.onclick = () => expand(m); render(); }

  // ---------- render a cada tick ----------
  function render() {
    if (!st) return;
    const el = elapsed();
    const cd = !!st.target;
    const shown = cd ? remaining() : el;
    const frac = cd ? Math.min(1, el / st.target) : (el % 3600) / 3600;
    const running = !!st.runningSince;
    const sub = `${MODES[st.mode].label} · ${cd ? "restante" : "decorrido"}${running ? "" : " · pausado"}`;

    const f = $focus();
    if (!f.hidden || f.innerHTML) {
      f.querySelector(".tm") && (f.querySelector(".tm").textContent = fmt(shown));
      f.querySelector(".sub") && (f.querySelector(".sub").textContent = sub);
      const p = f.querySelector(".prog"); if (p) p.style.strokeDashoffset = CIRC * (1 - frac);
      const t = f.querySelector('[data-a="toggle"]'); if (t) t.innerHTML = Icon(running ? "pause" : "play", 32);
      f.classList.toggle("paused", !running);
    }
    const m = $mini();
    if (!m.hidden) m.innerHTML = `<span class="dot" style="${running ? "" : "animation:none;background:#facc15"}"></span>${fmt(shown)}`;
    document.title = `${running ? "⏱" : "⏸"} ${fmt(shown)} · ${baseTitle}`;
    renderPip(shown, frac, running, sub);

    if (cd && el >= st.target && running) finish(true);
  }
  function startTick() { stopTick(); tickId = setInterval(render, 500); }
  function stopTick() { clearInterval(tickId); tickId = null; }

  // ---------- janela flutuante (Document Picture-in-Picture, Chrome/Edge desktop) ----------
  const pipSupported = () => "documentPictureInPicture" in window;
  const isTouch = () => matchMedia("(pointer: coarse)").matches;
  const wantsPip = () => {
    if (!pipSupported() || isTouch()) return false;
    try { return localStorage.getItem("caderno_auto_pip") !== "0"; } catch { return true; }
  };

  async function openPip() {
    if (!pipSupported() || pipWin || !st) return;
    try {
      pipWin = await documentPictureInPicture.requestWindow({ width: 300, height: 190 });
    } catch (e) { opts.toast?.("O navegador não deixou abrir a janela flutuante agora."); return; }
    const d = pipWin.document;
    d.title = "Caderno INB";
    const font = d.createElement("link"); font.rel = "stylesheet";
    font.href = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@500;600&family=Manrope:wght@600;700&display=swap"; d.head.append(font);
    const css = d.createElement("style");
    css.textContent = `
      *{box-sizing:border-box}html,body{margin:0;height:100%}
      body{font-family:'DM Sans',system-ui,sans-serif;color:#fff;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:6px;padding:12px;
        background:#202c2a;user-select:none}
      .tp{font-size:12px;color:#afbbb7;text-align:center;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .tm{font-family:Manrope,sans-serif;font-size:46px;font-weight:600;letter-spacing:-1.5px;font-variant-numeric:tabular-nums;line-height:1}
      .bar{width:85%;height:5px;border-radius:4px;background:#3f4e4a;overflow:hidden}
      .bar i{display:block;height:100%;background:#f27a5d;transition:width .4s linear}
      .sb{font-size:11px;color:#81918c}
      .row{display:flex;gap:8px;margin-top:4px}
      button{border:0;border-radius:10px;padding:7px 12px;font:600 12px 'DM Sans',sans-serif;color:#d5ddda;background:#273532;border:1px solid #34433f;cursor:pointer}
      button.main{background:#f17153;border-color:#f17153;color:#fff}
      .paused .tm{animation:b 1.4s infinite}@keyframes b{50%{opacity:.35}}`;
    d.head.append(css);
    d.body.innerHTML = `<div class="tp"></div><div class="tm">00:00</div><div class="bar"><i></i></div><div class="sb"></div>
      <div class="row"><button class="main" data-a="toggle">Pausar</button><button data-a="finish">Finalizar</button></div>`;
    d.body.onclick = e => {
      const a = e.target.closest("[data-a]")?.dataset.a;
      if (a === "toggle") toggle();
      if (a === "finish") finish();
    };
    pipWin.addEventListener("pagehide", () => { pipWin = null; });
    render();
  }
  function renderPip(shown, frac, running, sub) {
    if (!pipWin) return;
    const d = pipWin.document;
    d.body.classList.toggle("paused", !running);
    d.querySelector(".tp").textContent = st.title;
    d.querySelector(".tm").textContent = fmt(shown);
    d.querySelector(".bar i").style.width = (frac * 100).toFixed(1) + "%";
    d.querySelector(".sb").textContent = sub;
    d.querySelector('[data-a="toggle"]').textContent = running ? "Pausar" : "Continuar";
  }
  function closePip() { try { pipWin?.close(); } catch {} pipWin = null; }

  // ---------- extras ----------
  function exitFullscreen() { if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {}); }
  function unlockAudio() { try { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); audioCtx.resume(); } catch {} }
  function beep() {
    try {
      unlockAudio();
      [0, .35, .7].forEach(t => {
        const o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.frequency.value = 880; o.connect(g); g.connect(audioCtx.destination);
        g.gain.setValueAtTime(.0001, audioCtx.currentTime + t);
        g.gain.exponentialRampToValueAtTime(.3, audioCtx.currentTime + t + .02);
        g.gain.exponentialRampToValueAtTime(.0001, audioCtx.currentTime + t + .3);
        o.start(audioCtx.currentTime + t); o.stop(audioCtx.currentTime + t + .32);
      });
    } catch {}
  }
  function notify(title, body) {
    try { if ("Notification" in window && Notification.permission === "granted") new Notification(title, { body, icon: "/img/icon.svg" }); } catch {}
  }

  return { init, reset, start, pause, resume, finish, discard, isActive, current, expand, minimize, pipSupported, fmt, MODES };
})();
