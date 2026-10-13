// Doc Finder: rule-based simulation of a future AI retrieval system.
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
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  function renderChips(target) {
    target.replaceChildren();
    for (const ex of EXAMPLES) {
      const b = el("button", "chip", ex);
      b.type = "button";
      b.addEventListener("click", () => { $("q").value = ex; ask(); });
      target.appendChild(b);
    }
  }

  function card({ doc, older }) {
    const c = el("article", "card");
    c.appendChild(el("p", "answer", doc.summary));
    const h = el("h3");
    const a = el("a", null, doc.title);
    a.href = doc.link;
    h.appendChild(a);
    c.appendChild(h);
    c.appendChild(el("p", "meta-line", `${doc.folder} · Version ${doc.version_date} · ${doc.status}`));
    for (const o of older) {
      c.appendChild(el("p", "note", `An older version exists (${o.version_date}). Use the ${doc.version_date} version above.`));
    }
    return c;
  }

  function ask() {
    const out = $("results");
    const question = $("q").value;
    out.replaceChildren();
    if (!question.trim()) {
      out.appendChild(el("p", "hint", "Type a question first, for example where a form is or how a procedure works."));
      return;
    }
    const r = retrieve(question, lib);
    if (r.kind === "none") {
      out.appendChild(el("p", "miss", "I couldn't find a matching document. Try different wording or ask your supervisor."));
      out.appendChild(el("p", "hint", "Or try one of these:"));
      const chips = el("div", "chips");
      renderChips(chips);
      out.appendChild(chips);
    } else {
      if (r.conflict) out.appendChild(el("p", "warn", "These may conflict, confirm with your supervisor."));
      r.results.forEach((x) => out.appendChild(card(x)));
    }
    out.appendChild(el("p", "baseline", `Plain keyword search (title words only) would have returned: ${keywordLine(keywordSearch(question, lib))}`));
  }

  renderChips($("examples"));
  $("ask-form").addEventListener("submit", (e) => { e.preventDefault(); ask(); });
}
