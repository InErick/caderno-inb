// =====================================================================
// Banco de questões (importadas da Quest API para o SQLite do servidor).
// - sanitize(): limpa o HTML das questões por lista de permissões
// - saveQuestion(): grava uma questão da API no formato local
// As questões NUNCA vão para o repositório (ele é público): ficam só no banco.
// =====================================================================

const ALLOWED = new Set(["p", "br", "b", "strong", "i", "em", "u", "s", "sub", "sup", "ul", "ol", "li",
  "table", "thead", "tbody", "tr", "td", "th", "span", "div", "pre", "code", "blockquote", "img"]);
const IMG_HOST = /^https:\/\/media\.quest\.api\.br\/[\w\-./%]+$/;
const escHtml = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const attr = (a, name) => { const m = a.match(new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i")); return m ? (m[2] ?? m[3]) : null; };

// Reconstrói cada tag com só os atributos seguros; o resto do texto tem < e > escapados.
function sanitize(html) {
  if (!html) return "";
  const keep = [];
  let s = String(html)
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|iframe|object|embed|noscript|template)\b[\s\S]*?<\/\1\s*>/gi, "")
    // texto branco usado como espaçador ("-" invisível no original)
    .replace(/<span[^>]*color:\s*(rgb\(\s*255,\s*255,\s*255\s*\)|#fff(fff)?\b|white)[^>]*>[^<]*<\/span>/gi, "")
    // botões internos do editor de listas
    .replace(/<span[^>]*class="ql-ui"[^>]*>\s*<\/span>/gi, "");
  s = s.replace(/<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b([^<>]*)>/g, (all, close, tag, rest) => {
    tag = tag.toLowerCase();
    if (!ALLOWED.has(tag)) return "";
    let out;
    if (close) out = tag === "img" || tag === "br" ? "" : `</${tag}>`;
    else if (tag === "img") {
      const src = attr(rest, "src");
      out = src && IMG_HOST.test(src) ? `<img src="${escHtml(src)}" alt="" loading="lazy">` : "";
    } else if (tag === "span" && /ql-formula/.test(attr(rest, "class") || "")) {
      // fórmula do editor (LaTeX): guarda o código; o app converte para texto (\quad sozinho = só espaço)
      const tex = attr(rest, "data-value") || "";
      out = /^(\s|\\quad|\\qquad|\\[,;: !])*$/.test(tex) ? "<span hidden>" : `<code class="formula">${escHtml(tex)}</code><span hidden>`;
    } else {
      const cls = (attr(rest, "class") || "").split(/\s+/).filter(c => /^ql-(font-monospace|indent-\d|align-(center|right|justify))$/.test(c));
      const st = attr(rest, "style") || "";
      const ind = st.match(/text-indent:\s*(\d+(?:\.\d+)?)em/i);
      const al = st.match(/text-align:\s*(center|right)/i);
      const style = [ind && `text-indent:${Math.min(+ind[1], 10)}em`, al && `text-align:${al[1].toLowerCase()}`].filter(Boolean).join(";");
      const span = (tag === "td" || tag === "th") ? ["colspan", "rowspan"].map(n => { const v = attr(rest, n); return v && /^\d{1,2}$/.test(v) && v !== "1" ? ` ${n}="${v}"` : ""; }).join("") : "";
      // célula com fundo colorido (cabeçalho) → destaque neutro; lista com marcadores do editor → li.b
      const bg = (st.match(/background-color:\s*([^;"]+)/i) || [])[1] || "";
      if ((tag === "td" || tag === "th") && bg && !/^(rgb\(\s*255,\s*255,\s*255\s*\)|#fff(fff)?|white|transparent)$/i.test(bg.trim())) cls.push("hl");
      if (tag === "li" && attr(rest, "data-list") === "bullet") cls.push("b");
      out = `<${tag}${cls.length ? ` class="${cls.join(" ")}"` : ""}${style ? ` style="${style}"` : ""}${span}>`;
    }
    keep.push(out);
    return `\u0000${keep.length - 1}\u0000`;
  });
  s = s.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => keep[+i]);
}

// Grava (ou ignora, se já existe) uma questão no formato da API v2
// Nível da prova pelo nome do cargo (para questões importadas antes de guardarmos o nível da API)
const SUP_RE = /n[íi]vel superior|analista|auditor|perit[oa]|especialista|engenheir|advogad|procurador|delegad|juiz|promotor|defensor|consultor|gestor|professor|m[ée]dic[oa]|contador|economista|administrador|arquivista|bibliotec|psic[óo]log|enfermeir|farmac|odont|nutricion|fisioter|assistente social|tecnologista|pesquisador|inspetor|fiscal|supervisor|controlador|oficial de chancelaria|diplomata|oficial de justi|estat[íi]stic|ci[êe]ntista|desenvolvedor|arquiteto|bacharel/i;
const MED_RE = /n[íi]vel m[ée]dio|t[ée]cnic[oa]|assistente|auxiliar|agente|escritur[áa]rio|soldado|oficial administrativo|atendente|recepcion|operador|motorista|guarda|vigilante|digitador|secret[áa]ri[oa]|escrevente|almoxarife|praticante|aprendiz|monitor/i;
function nivelDoCargo(cargo) {
  const c = String(cargo || "");
  if (/n[íi]vel superior/i.test(c)) return "Superior";
  if (/n[íi]vel m[ée]dio/i.test(c)) return "Médio";
  if (/assistente social|analista t[ée]cnico|t[ée]cnico de n[íi]vel superior|t[ée]cnico superior/i.test(c)) return "Superior";
  const sup = SUP_RE.test(c), med = MED_RE.test(c);
  return sup && !med ? "Superior" : med && !sup ? "Médio" : null;
}
// nível vindo da API (todas as provas da questão do mesmo nível); se não der, pelo cargo
function nivelDaQuestao(q) {
  const ns = [...new Set((q.provas || []).map(p => p.nivel_escolaridade).filter(Boolean))];
  return ns.length === 1 ? ns[0] : nivelDoCargo((q.provas || [])[0]?.cargo);
}

function saveQuestion(db, q) {
  const prova = (q.provas || [])[0] || {};
  const alts = (q.alternativas || []).map(a => ({
    letra: String(a.letra || "").toUpperCase().slice(0, 2),
    texto: sanitize(a.texto) + (a.imagens || []).filter(u => IMG_HOST.test(u)).map(u => `<img src="${escHtml(u)}" alt="" loading="lazy">`).join(""),
  })).filter(a => a.letra);
  const gab = String(q.gabarito || "").trim().toUpperCase();
  if (!gab || !alts.length || !alts.some(a => a.letra === gab)) return false;
  // imagens soltas (anexos) que não aparecem no enunciado vão no fim dele
  let enun = sanitize(q.enunciado);
  for (const u of q.anexos || []) if (IMG_HOST.test(u) && !enun.includes(u) && !alts.some(a => a.texto.includes(u))) enun += `<p><img src="${escHtml(u)}" alt="" loading="lazy"></p>`;
  const info = db.prepare(`INSERT OR IGNORE INTO bank_questions
    (id, enunciado, alternativas, gabarito, textos, tipo, banca, orgao, cargo, ano, materia, assunto, nivel)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(String(q.id), enun, JSON.stringify(alts), gab,
    JSON.stringify((q.textos_associados || []).map(sanitize)), q.tipo || "", prova.banca || "", prova.orgao || "",
    prova.cargo || "", String(prova.ano || ""), q.classificacao?.materia || "", q.classificacao?.assunto || "", nivelDaQuestao(q));
  return info.changes > 0;
}

module.exports = { sanitize, saveQuestion, nivelDoCargo };
