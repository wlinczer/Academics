// Siftr staff-layer prototype: rule-based simulation of a future AI retrieval system.
// Everything an answer says comes from a document's `summary` field.

const STOPWORDS = new Set(
  ("a an the is are was were be been am i me my we our you your it this that these those " +
    "where what which who whom when why how do does did can could should would will shall may might must " +
    "of in on at to for from by with about into over under and or but if so than then there here " +
    "form forms find get need use using used have has had current latest newest please any some " +
    "handle locate look looking up").split(" ")
);

const MIN_SCORE = 2;       // best match must reach this score
const MIN_COVERAGE = 0.75; // share of meaningful question words the match must explain
const CONFLICT_RATIO = 0.8; // a second current doc this close to the top is flagged

function words(text) {
  return String(text).toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
}

function stem(w) {
  if (w.length > 4 && w.endsWith("ies")) return w.slice(0, -3) + "y";
  if (w.length > 5 && w.endsWith("ing")) return w.slice(0, -3);
  if (w.length > 4 && w.endsWith("ed")) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1);
  return w;
}

function tokens(text) {
  return words(text).filter((w) => !STOPWORDS.has(w)).map(stem);
}

function containsSeq(hay, needle) {
  for (let i = 0; i + needle.length <= hay.length; i++) {
    if (needle.every((t, j) => hay[i + j] === t)) return true;
  }
  return false;
}

function scoreDoc(doc, q) {
  const title = new Set(tokens(doc.title));
  const syn = new Set(doc.synonyms.flatMap(tokens));
  const sum = new Set(tokens(doc.summary));
  let score = 0, matched = 0;
  for (const t of q) {
    if (title.has(t)) { score += 3; matched++; }
    else if (syn.has(t)) { score += 2; matched++; }
    else if (sum.has(t)) { score += 1; matched++; }
  }
  for (const s of doc.synonyms) {
    const st = tokens(s);
    if (st.length >= 2 && containsSeq(q, st)) score += 3;
  }
  return { score, coverage: q.length ? matched / q.length : 0 };
}

// All versions linked to a doc through `supersedes`, newest first.
function family(doc, lib) {
  const fam = new Set([doc]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const d of lib) {
      if (fam.has(d)) continue;
      if ([...fam].some((f) => f.supersedes === d.id || d.supersedes === f.id)) { fam.add(d); grew = true; }
    }
  }
  return [...fam].sort((a, b) => b.version_date.localeCompare(a.version_date));
}

function newestCurrent(fam) {
  return fam.find((d) => d.status === "current") || fam[0];
}

function retrieve(question, lib) {
  const q = tokens(question);
  if (!q.length) return { kind: "none" };
  const ranked = lib
    .map((doc) => ({ doc, ...scoreDoc(doc, q) }))
    .filter((r) => r.score >= MIN_SCORE && r.coverage >= MIN_COVERAGE)
    // prefer status=current on equal scores
    .sort((a, b) => b.score - a.score || (a.doc.status === "current" ? -1 : 1));
  if (!ranked.length) return { kind: "none" };

  const topFam = family(ranked[0].doc, lib);
  const primary = newestCurrent(topFam);
  const older = topFam.filter((d) => d !== primary && d.status === "superseded");
  const results = [{ doc: primary, older }];

  const rivals = ranked.filter(
    (r) => r.doc.status === "current" && !topFam.includes(r.doc) &&
      r.coverage === 1 && r.score >= ranked[0].score * CONFLICT_RATIO
  );
  if (rivals.length) {
    const rf = family(rivals[0].doc, lib);
    results.push({ doc: newestCurrent(rf), older: rf.filter((d) => d.status === "superseded") });
  }
  return { kind: "found", results, conflict: results.length > 1 };
}

// Fair baseline: exact title words only, same stopwords, no stemming, no synonyms.
function keywordSearch(question, lib) {
  const q = words(question).filter((w) => !STOPWORDS.has(w));
  let best = 0, hits = [];
  for (const doc of lib) {
    const t = new Set(words(doc.title));
    const n = q.filter((w) => t.has(w)).length;
    if (n > best) { best = n; hits = [doc]; }
    else if (n === best && n > 0) hits.push(doc);
  }
  return hits;
}

function keywordLine(hits) {
  if (!hits.length) return "nothing";
  const label = (d) => `${d.title} (${d.version_date})`;
  return hits.length === 1 ? label(hits[0]) : `${label(hits[0])} and ${hits.length - 1} other match${hits.length > 2 ? "es" : ""}`;
}

if (typeof module !== "undefined") {
  module.exports = { tokens, retrieve, keywordSearch, keywordLine };
}

// ---------- UI ----------
if (typeof document !== "undefined") {
  const EXAMPLES = [
    "Where is the release of information form?",
    "Is this the current expense reimbursement form?",
    "Which consent form do we use?",
    "How do I handle a client records request?",
  ];
  const lib = window.LIBRARY;
  const $ = (id) => document.getElementById(id);
  const thread = $("thread"), emptyState = $("empty"), input = $("q"), hint = $("hint");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const FOLDER_ICON =
    '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2.5h8.5A1.5 1.5 0 0 1 21 9v8.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z"/></svg>';
  let busy = false, hintTimer;

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  function chipList() {
    const wrap = el("div", "chips");
    for (const ex of EXAMPLES) {
      const b = el("button", "chip", ex);
      b.type = "button";
      b.addEventListener("click", () => send(ex));
      wrap.appendChild(b);
    }
    return wrap;
  }

  function scrollDown() {
    thread.parentElement.scrollTo({ top: thread.parentElement.scrollHeight, behavior: reduceMotion.matches ? "auto" : "smooth" });
  }

  function botRow() {
    const row = el("div", "msg bot");
    const avatar = el("span", "avatar");
    avatar.setAttribute("aria-hidden", "true");
    avatar.appendChild($("mark").content.cloneNode(true));
    row.appendChild(avatar);
    const body = el("div", "bot-body");
    row.appendChild(body);
    return { row, body };
  }

  function docCard({ doc, older }) {
    const c = el("article", "doc-card");
    const folder = el("p", "doc-folder");
    folder.innerHTML = FOLDER_ICON;
    folder.appendChild(document.createTextNode(doc.folder));
    c.appendChild(folder);
    c.appendChild(el("h3", "doc-title", doc.title));
    const meta = el("p", "doc-meta");
    meta.appendChild(document.createTextNode(`Version ${doc.version_date} `));
    meta.appendChild(el("span", `pill ${doc.status === "current" ? "pill-current" : "pill-older"}`, doc.status === "current" ? "Current" : "Older version"));
    c.appendChild(meta);
    const a = el("a", "open-doc", "Open document");
    a.href = doc.link;
    c.appendChild(a);
    const frag = document.createDocumentFragment();
    frag.appendChild(c);
    for (const o of older) {
      frag.appendChild(el("p", "note", `An older version exists (${o.version_date}). Use the ${doc.version_date} version above.`));
    }
    return frag;
  }

  function compare(question) {
    const d = el("details", "compare");
    d.appendChild(el("summary", null, "Compare with keyword search"));
    d.appendChild(el("p", "baseline", `Plain keyword search (title words only) would have returned: ${keywordLine(keywordSearch(question, lib))}`));
    return d;
  }

  function reply(question, body) {
    const r = retrieve(question, lib);
    if (r.kind === "none") {
      body.appendChild(el("p", "bubble", "I couldn't find a matching document. Try different wording or ask your supervisor."));
      body.appendChild(el("p", "chips-label", "Or try one of these:"));
      body.appendChild(chipList());
    } else {
      if (r.conflict) body.appendChild(el("p", "warn", "These may conflict, confirm with your supervisor."));
      for (const x of r.results) {
        body.appendChild(el("p", "bubble", x.doc.summary));
        body.appendChild(docCard(x));
      }
    }
    body.appendChild(compare(question));
  }

  function showHint(text) {
    hint.textContent = text;
    hint.classList.add("show");
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => hint.classList.remove("show"), 3000);
  }

  // Messages sent while a reply is in progress wait here and are answered in order.
  const queue = [];
  let chatId = 0;

  function send(text) {
    if (!text.trim()) { showHint("Type a question first"); input.focus(); return; }
    emptyState.hidden = true;
    const user = el("div", "msg user");
    user.appendChild(el("p", "bubble", text));
    thread.appendChild(user);
    input.value = "";
    autosize();
    scrollDown();
    queue.push({ text, user });
    pump();
  }

  function pump() {
    if (busy || !queue.length) return;
    const { text, user } = queue.shift();
    const id = chatId;
    const { row, body } = botRow();
    const finish = () => {
      if (id !== chatId) return; // chat was cleared while typing
      reply(text, body);
      busy = false;
      scrollDown();
      pump();
    };
    busy = true;
    if (reduceMotion.matches) {
      user.after(row);
      finish();
      return;
    }
    const dots = el("div", "typing");
    dots.setAttribute("aria-label", "Siftr is typing");
    dots.append(el("span"), el("span"), el("span"));
    body.appendChild(dots);
    user.after(row);
    scrollDown();
    setTimeout(() => { dots.remove(); row.classList.add("reveal"); finish(); }, 600 + Math.random() * 300);
  }

  function autosize() {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 160) + "px";
  }

  $("empty-chips").appendChild(chipList());
  $("composer").addEventListener("submit", (e) => { e.preventDefault(); send(input.value); });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(input.value); }
  });
  input.addEventListener("input", autosize);
  $("new-chat").addEventListener("click", () => {
    chatId++;
    queue.length = 0;
    thread.replaceChildren();
    emptyState.hidden = false;
    busy = false;
    input.value = "";
    autosize();
    input.focus();
  });
  const details = $("details-toggle");
  details.addEventListener("click", () => {
    const open = details.getAttribute("aria-expanded") !== "true";
    details.setAttribute("aria-expanded", String(open));
    $("disclosure-full").hidden = !open;
  });
}
