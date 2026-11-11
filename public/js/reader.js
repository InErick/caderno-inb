// =====================================================================
// Leitor de apostilas: marca-texto (4 cores), notas, "parei aqui" e PDF
// As marcações são guardadas por bloco de texto + posição (início/fim),
// então continuam no lugar certo no celular, no PC e na impressão.
// =====================================================================
window.Reader = (() => {
  const BLOCK_SEL = "h2, h3, h4, p, li, td, th, figcaption, .q-stem, .alt, .gab-body p, .gab-body li";
  const COLORS = { y: "Amarelo", g: "Verde", p: "Rosa", b: "Azul" };
  let st = null; // { day, edital, data, art, saveT, toast }

  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const uid = () => Math.random().toString(36).slice(2, 10);

  // ---------- blocos ----------
  function indexBlocks(art) {
    const all = [...art.querySelectorAll(BLOCK_SEL)];
    const leaves = all.filter(el => !all.some(o => o !== el && el.contains(o)));
    leaves.forEach((el, i) => el.dataset.b = i);
    return leaves;
  }
  const blockOf = n => (n.nodeType === 1 ? n : n.parentElement)?.closest("[data-b]");
  function offsetIn(block, node, off) {
    const r = document.createRange();
    r.setStart(block, 0);
    try { r.setEnd(node, off); } catch { return 0; }
    return r.toString().length;
  }

  // ---------- desenhar marcações ----------
  function clearMarks() {
    st.art.querySelectorAll("mark.hl").forEach(m => { m.replaceWith(...m.childNodes); });
    st.art.querySelectorAll(".hl-note").forEach(n => n.remove());
    st.art.normalize();
  }
  function wrap(block, s, e, h) {
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
    let pos = 0, n, todo = [];
    while ((n = walker.nextNode())) {
      const len = n.nodeValue.length, a = Math.max(s, pos), b = Math.min(e, pos + len);
      if (a < b) todo.push([n, a - pos, b - pos]);
      pos += len;
      if (pos >= e) break;
    }
    let last = null;
    for (const [node, a, b] of todo) {
      let t = node;
      if (a > 0) t = t.splitText(a);
      if (b - a < t.nodeValue.length) t.splitText(b - a);
      const m = document.createElement("mark");
      m.className = `hl hl-${h.c}${h.note ? " has-note" : ""}`;
      m.dataset.id = h.id;
      t.replaceWith(m); m.append(t);
      last = m;
    }
    if (last && h.note && h.b === h._lastB) {
      const ic = document.createElement("button");
      ic.className = "hl-note"; ic.dataset.id = h.id; ic.title = "Ver nota"; ic.textContent = "✎";
      last.after(ic);
    }
  }
  // se a apostila foi atualizada, reencontra cada marcação pelo texto marcado
  function reanchor() {
    let changed = false;
    const blocks = [...st.art.querySelectorAll("[data-b]")];
    st.data.highlights = st.data.highlights.filter(h => {
      const bl = st.art.querySelector(`[data-b="${h.b}"]`);
      if (bl && bl.textContent.slice(h.s, h.e) === h.text) return true;
      for (const cand of blocks) {
        const i = h.text ? cand.textContent.indexOf(h.text) : -1;
        if (i >= 0) { h.b = +cand.dataset.b; h.s = i; h.e = i + h.text.length; changed = true; return true; }
      }
      changed = true; return false; // trecho não existe mais
    });
    if (changed) save();
  }

  function paint() {
    clearMarks();
    const groups = {};
    for (const h of st.data.highlights) (groups[h.gid || h.id] ||= []).push(h);
    for (const segs of Object.values(groups)) {
      const lastB = Math.max(...segs.map(x => x.b));
      for (const h of segs) {
        const block = st.art.querySelector(`[data-b="${h.b}"]`);
        if (block) wrap(block, h.s, h.e, { ...h, _lastB: lastB });
      }
    }
    // marcador "parei aqui"
    st.art.querySelectorAll(".bm-here").forEach(el => el.classList.remove("bm-here"));
    const bm = st.data.bookmark && st.art.querySelector(`[data-b="${st.data.bookmark.b}"]`);
    if (bm) bm.classList.add("bm-here");
    renderList();
  }

  // ---------- salvar ----------
  function save(msg) {
    clearTimeout(st.saveT);
    const s = st;
    s.dirty = true;
    s.status.textContent = "Salvando…";
    s.saveT = setTimeout(async () => {
      try {
        // grava cada segmento com o mesmo id de grupo; o servidor guarda segmento a segmento
        const highlights = s.data.highlights.map(h => ({ ...h, id: h.id }));
        await Api.saveNotes(s.day, { highlights, bookmark: s.data.bookmark });
        s.dirty = false;
        s.status.textContent = "Salvo ✓";
        if (msg) s.toast(msg);
      } catch (e) { s.status.textContent = "Não salvo"; s.toast(e.message); }
    }, 500);
  }

  // ---------- criar marcação a partir da seleção ----------
  function selectionSegments() {
    const sel = getSelection();
    if (!sel.rangeCount || sel.isCollapsed) return null;
    const r = sel.getRangeAt(0);
    if (!st.art.contains(r.commonAncestorContainer)) return null;
    const startB = blockOf(r.startContainer), endB = blockOf(r.endContainer);
    if (!startB || !endB) return null;
    const blocks = [...st.art.querySelectorAll("[data-b]")];
    const i0 = blocks.indexOf(startB), i1 = blocks.indexOf(endB);
    const segs = [];
    for (let i = i0; i <= i1; i++) {
      const bl = blocks[i], len = bl.textContent.length;
      const s = i === i0 ? offsetIn(bl, r.startContainer, r.startOffset) : 0;
      const e = i === i1 ? offsetIn(bl, r.endContainer, r.endOffset) : len;
      if (e > s && bl.textContent.slice(s, e).trim()) segs.push({ b: +bl.dataset.b, s, e, text: bl.textContent.slice(s, e).slice(0, 400) });
    }
    return segs.length ? { segs, rect: r.getBoundingClientRect() } : null;
  }
  function addHighlight(c, note = "") {
    const got = selectionSegments();
    if (!got) return;
    const gid = uid();
    got.segs.forEach((sg, i) => st.data.highlights.push({ id: gid + (i ? "-" + i : ""), gid, ...sg, c, note: i === got.segs.length - 1 ? note : "" }));
    getSelection().removeAllRanges();
    hidePop();
    paint(); save();
    return gid;
  }
  const groupOf = id => { const h = st.data.highlights.find(x => x.id === id); return h ? (h.gid || h.id) : null; };
  const segsOf = gid => st.data.highlights.filter(x => (x.gid || x.id) === gid);

  // ---------- popover ----------
  function showPop(rect, html, bind) {
    const p = st.pop;
    p.innerHTML = html; p.hidden = false; st.popY = scrollY;
    const w = p.offsetWidth, h = p.offsetHeight;
    let x = rect.left + rect.width / 2 - w / 2, y = rect.top - h - 10;
    if (y < 70) y = rect.bottom + 10;
    x = Math.max(8, Math.min(innerWidth - w - 8, x));
    p.style.left = x + "px"; p.style.top = y + "px";
    bind?.(p);
  }
  function hidePop() { if (st?.pop) st.pop.hidden = true; }

  function colorBtns() {
    return Object.entries(COLORS).map(([k, n]) => `<button class="sw sw-${k}" data-c="${k}" title="${n}"></button>`).join("");
  }
  function onSelectionEnd() {
    setTimeout(() => {
      const got = selectionSegments();
      if (!got) return;
      showPop(got.rect, `<div class="pop-row">${colorBtns()}<button class="pop-btn" data-note>✎ Nota</button></div>`, p => {
        p.querySelectorAll("[data-c]").forEach(b => b.onmousedown = b.ontouchstart = e => { e.preventDefault(); addHighlight(b.dataset.c, ""); st.lastColor = b.dataset.c; });
        p.querySelector("[data-note]").onmousedown = p.querySelector("[data-note]").ontouchstart = e => {
          e.preventDefault();
          const gid = addHighlight(st.lastColor || "y", "");
          if (gid) editNote(gid);
        };
      });
    }, 10);
  }
  function editNote(gid) {
    const segs = segsOf(gid); if (!segs.length) return;
    const last = segs[segs.length - 1];
    const el = st.art.querySelector(`mark.hl[data-id="${last.id}"]`);
    const rect = el ? el.getBoundingClientRect() : { left: innerWidth / 2, width: 0, top: 200, bottom: 200 };
    const quote = segs.map(s => s.text).join(" ").slice(0, 140);
    showPop(rect, `<div class="pop-note"><div class="pq">“${esc(quote)}${quote.length >= 140 ? "…" : ""}”</div>
      <textarea placeholder="Escreva sua nota…" maxlength="2000">${esc(last.note || "")}</textarea>
      <div class="pop-row">${colorBtns()}<span style="flex:1"></span><button class="pop-btn danger" data-del>Apagar</button><button class="pop-btn primary" data-ok>Salvar</button></div></div>`, p => {
      const ta = p.querySelector("textarea"); ta.focus({ preventScroll: true });
      p.querySelectorAll("[data-c]").forEach(b => b.onclick = () => { segs.forEach(s => s.c = b.dataset.c); paint(); save(); });
      p.querySelector("[data-ok]").onclick = () => { segs.forEach(s => s.note = ""); last.note = ta.value.trim(); hidePop(); paint(); save(last.note ? "Nota salva" : ""); };
      p.querySelector("[data-del]").onclick = () => { st.data.highlights = st.data.highlights.filter(x => (x.gid || x.id) !== gid); hidePop(); paint(); save("Marcação apagada"); };
    });
  }

  // ---------- lista de marcações ----------
  function renderList() {
    const box = st.list;
    const groups = {};
    for (const h of st.data.highlights) (groups[h.gid || h.id] ||= []).push(h);
    const arr = Object.entries(groups).sort((a, b) => a[1][0].b - b[1][0].b || a[1][0].s - b[1][0].s);
    st.countEl.textContent = arr.length;
    box.innerHTML = arr.length ? arr.map(([gid, segs]) => {
      const note = segs.map(s => s.note).filter(Boolean).join(" ");
      return `<button class="ml-item" data-gid="${gid}"><span class="dot hl-${segs[0].c}"></span><span><span class="ml-q">${esc(segs.map(s => s.text).join(" ").slice(0, 160))}</span>${note ? `<span class="ml-n">✎ ${esc(note)}</span>` : ""}</span></button>`;
    }).join("") : `<p class="muted small" style="margin:6px 2px">Selecione um trecho do texto para marcar. Suas marcações aparecem aqui.</p>`;
    box.onclick = e => {
      const it = e.target.closest("[data-gid]"); if (!it) return;
      const first = segsOf(it.dataset.gid)[0];
      const el = st.art.querySelector(`mark.hl[data-id="${first.id}"]`);
      if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); el.classList.add("flash"); setTimeout(() => el.classList.remove("flash"), 1400); }
      st.panel.classList.remove("open");
    };
  }

  // ---------- parei aqui ----------
  function topBlock() {
    const lim = (document.querySelector(".rd-bar")?.getBoundingClientRect().bottom || 80) + 8;
    const blocks = st.art.querySelectorAll("[data-b]");
    for (const b of blocks) { const r = b.getBoundingClientRect(); if (r.bottom > lim + 4) return b; }
    return blocks[0];
  }
  function setBookmark() {
    const b = topBlock(); if (!b) return;
    st.data.bookmark = { b: +b.dataset.b, at: new Date().toISOString() };
    paint(); save("Marcado: você parou aqui 🔖");
  }
  function goBookmark(smooth = true) {
    const el = st.data.bookmark && st.art.querySelector(`[data-b="${st.data.bookmark.b}"]`);
    if (!el) return false;
    const y = el.getBoundingClientRect().top + scrollY - ((document.querySelector(".rd-bar")?.offsetHeight || 60) + 90);
    scrollTo({ top: y, behavior: smooth ? "smooth" : "auto" });
    return true;
  }

  // ---------- PDF ----------
  function printPdf() {
    const opened = [...st.art.querySelectorAll("details:not([open])")];
    opened.forEach(d => d.open = true);
    document.body.classList.add("printing-apostila");
    const done = () => { opened.forEach(d => d.open = false); document.body.classList.remove("printing-apostila"); removeEventListener("afterprint", done); };
    addEventListener("afterprint", done);
    setTimeout(() => { try { print(); } catch { done(); } }, 50);
  }

  // ---------- abrir ----------
  async function open(view, { day, edital, plan, labels, toast, onBack, onStudy }) {
    close();
    view.innerHTML = `<div class="loading">Carregando apostila…</div>`;
    const d = plan.find(x => x.key === day);
    let html, notes;
    try { [html, notes] = await Promise.all([Api.apostilaHtml(edital, day), Api.notes(day)]); }
    catch (e) {
      view.innerHTML = `<div class="card empty">${esc(e.message)}<br><br><button class="btn btn-ghost btn-sm" id="bk">Voltar</button></div>`;
      view.querySelector("#bk").onclick = onBack; return;
    }
    const [y, m, dd] = day.split("-");
    view.innerHTML = `
      <div class="rd-bar">
        <button class="icon-btn" id="rdBack" title="Voltar">${Icon("chevron", 20, "flip")}</button>
        <div class="rd-title"><span class="tag t-${d.m}">${labels[d.m]}</span><b>${esc(d.t)}</b></div>
        <span class="rd-status muted small" id="rdStatus"></span>
        <button class="rd-tool" id="rdMark" title="Marcar onde parei">🔖<span>Parei aqui</span></button>
        <button class="rd-tool" id="rdList" title="Minhas marcações">${Icon("book", 18)}<span>Marcações</span><em id="rdCount">0</em></button>
        <button class="rd-tool" id="rdPdf" title="Baixar PDF">${Icon("link", 18)}<span>PDF</span></button>
        <button class="rd-tool primary" id="rdStudy" title="Iniciar foco com este tema">${Icon("play", 16)}<span>Foco</span></button>
        <button class="rd-tool" id="rdFull" title="Modo leitura (tela cheia)">${Icon("expand", 18)}<span>Tela cheia</span></button>
      </div>
      <div class="rd-float" id="rdFloat">
        <button class="rd-fbtn" id="rdFMark" title="Marcar onde parei">🔖</button>
        <button class="rd-fbtn" id="rdFList" title="Minhas marcações">${Icon("book", 18)}</button>
        <button class="rd-fbtn" id="rdExit" title="Sair da tela cheia">${Icon("close", 18)}</button>
      </div>
      <div class="rd-wrap">
        <div class="rd-resume" id="rdResume" hidden></div>
        <article class="apostila t-${d.m}" id="rdArt">
          <div class="ap-print-head">Caderno INB · ${dd}/${m}/${y} · ${labels[d.m]}</div>
          ${html}
        </article>
      </div>
      <aside class="rd-panel" id="rdPanel"><div class="rd-panel-h"><b>Minhas marcações</b><button class="icon-btn" id="rdClose">${Icon("close", 18)}</button></div><div id="rdItems"></div></aside>
      <div class="rd-pop" id="rdPop" hidden></div>`;
    st = {
      day, edital, toast, data: { highlights: notes.highlights || [], bookmark: notes.bookmark || null },
      art: view.querySelector("#rdArt"), pop: view.querySelector("#rdPop"), list: view.querySelector("#rdItems"),
      panel: view.querySelector("#rdPanel"), status: view.querySelector("#rdStatus"), countEl: view.querySelector("#rdCount"),
    };
    // agrupa segmentos vindos do servidor (id "abc-1" pertence ao grupo "abc")
    st.data.highlights.forEach(h => { h.gid = h.id.split("-")[0]; });
    indexBlocks(st.art);
    clearMarks();
    reanchor();
    if (st.data.bookmark && !st.art.querySelector(`[data-b="${st.data.bookmark.b}"]`)) st.data.bookmark = null;
    paint();

    view.querySelector("#rdBack").onclick = onBack;
    view.querySelector("#rdMark").onclick = setBookmark;
    view.querySelector("#rdList").onclick = () => st.panel.classList.toggle("open");
    view.querySelector("#rdClose").onclick = () => st.panel.classList.remove("open");
    view.querySelector("#rdPdf").onclick = printPdf;
    view.querySelector("#rdStudy").onclick = e => onStudy(e.currentTarget);
    view.querySelector("#rdFull").onclick = () => setReading(true);
    view.querySelector("#rdExit").onclick = () => setReading(false);
    view.querySelector("#rdFMark").onclick = setBookmark;
    view.querySelector("#rdFList").onclick = () => st.panel.classList.toggle("open");
    st.onFs = () => { if (!document.fullscreenElement && st?.fsByUs) { st.fsByUs = false; setReading(false); } };
    document.addEventListener("fullscreenchange", st.onFs);

    st.art.addEventListener("mouseup", onSelectionEnd);
    st.art.addEventListener("touchend", onSelectionEnd);
    st.art.addEventListener("click", e => {
      const m = e.target.closest("mark.hl, .hl-note");
      if (m && getSelection().isCollapsed) { e.preventDefault(); editNote(groupOf(m.dataset.id)); }
    });
    st.onDoc = e => { if (!e.target.isConnected) return; if (st && !st.pop.hidden && !st.pop.contains(e.target) && !e.target.closest("mark.hl, .hl-note")) hidePop(); };
    document.addEventListener("mousedown", st.onDoc);
    st.lastY = scrollY;
    st.onScroll = () => {
      if (!st) return;
      if (Math.abs(scrollY - (st.popY || 0)) > 40 && !st.pop.contains(document.activeElement)) hidePop();
      const dy = scrollY - st.lastY;
      if (Math.abs(dy) > 6) { document.body.classList.toggle("rd-scrolled", dy > 0 && scrollY > 120); st.lastY = scrollY; }
    };
    addEventListener("scroll", st.onScroll, { passive: true });

    if (st.data.bookmark) {
      const r = view.querySelector("#rdResume");
      const when = new Date(st.data.bookmark.at);
      r.hidden = false;
      r.innerHTML = `🔖 Você parou aqui ${isNaN(when) ? "" : "em " + when.toLocaleDateString("pt-BR") + " às " + when.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}. <button class="link-btn" id="rdGo">Continuar de onde parei →</button>`;
      r.querySelector("#rdGo").onclick = () => { goBookmark(); r.hidden = true; };
    }
    scrollTo(0, 0);
  }
  // modo leitura: esconde menus e barras; tenta tela cheia do navegador (onde o aparelho permite)
  function setReading(on) {
    if (!st) return;
    const keep = topBlock();
    document.body.classList.toggle("reading", on);
    if (on && document.fullscreenEnabled && !document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().then(() => { if (st) st.fsByUs = true; }).catch(() => {});
    }
    if (!on && document.fullscreenElement && st.fsByUs) { st.fsByUs = false; document.exitFullscreen?.().catch(() => {}); }
    requestAnimationFrame(() => keep?.scrollIntoView({ block: "start" }));
  }

  function close() {
    if (!st) return;
    document.body.classList.remove("reading", "rd-scrolled");
    document.removeEventListener("fullscreenchange", st.onFs);
    if (st.fsByUs && document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    document.removeEventListener("mousedown", st.onDoc);
    removeEventListener("scroll", st.onScroll);
    clearTimeout(st.saveT);
    if (st.dirty) Api.saveNotes(st.day, { highlights: st.data.highlights, bookmark: st.data.bookmark }).catch(() => {});
    st = null;
  }

  return { open, close };
})();
