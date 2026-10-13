# Generative AI + Algorithmic Systems (ESTM 60244)

## Project Prototype MVP: Doc Finder

**Live prototype:** https://wlinczer.github.io/Academics/genai-doc-finder/
**Source:** [`doc-finder/`](doc-finder/)

Doc Finder is a Wizard-of-Oz prototype for my Josselyn capstone. A clinician at a
behavioral health nonprofit types where a form is or how a procedure works. They get
a short answer, a link to the current document, and its version date. It surfaces
documents only. It never fills or submits forms.

The organization ("Northshore Family Health") and all 18 documents are fictional.
No real Josselyn documents or client data are used.

### Assumption being tested

Clinicians' wording doesn't match document titles ("release of information" vs.
"Authorization to Disclose"), and they need the *current* version without the tool
inventing anything. Each answer shows what plain title-keyword search would have
returned, for comparison.

### How it works

- `library.json` holds the fictional documents (title, folder, version date,
  status, synonyms, summary, link). `library.js` is the same data, so the page also
  works when opened directly from disk.
- `app.js` scores each document by overlap between the question's words and the
  document's title (weight 3), synonyms (weight 2) and summary (weight 1), with
  lowercasing, punctuation stripping, stopword removal and simple stemming. Whole
  synonym phrases get a bonus.
- A match must explain at least 75% of the meaningful words in the question.
  Otherwise the tool says it couldn't find a document instead of guessing. This is
  why "telehealth consent" doesn't return the general Consent for Treatment form.
- Superseded versions are never the answer. When an older version exists, the card
  says so with its date.
- If a second current document scores close to the top match, both are shown with
  "These may conflict, confirm with your supervisor."
- The answer text is the document's `summary` field, verbatim. Nothing else.
- Baseline: "Plain keyword search (title words only)" uses the same lowercasing,
  punctuation stripping and stopwords, and matches exact title words. No synonyms,
  summaries or stemming.

### Try it

| Question | Expected behavior |
|---|---|
| Where is the release of information form? | Authorization to Disclose (keyword search: nothing) |
| Is this the current expense reimbursement form? | 2025 version, notes the 2019 version |
| Which consent form do we use? | 2025 Consent for Treatment, notes the 2022 version |
| How do I handle a client records request? | Two current procedures, conflict warning |
| Do we have a telehealth consent form? | Not found, example questions shown again |
| Where is the FMLA leave request form? | Not found |
| (empty) | Inline prompt, no answer card |

### Run locally

Open `doc-finder/index.html` in a browser. No build step, dependencies or API keys.
To change the library, edit `tools/build-library.js` and run
`node tools/build-library.js` to regenerate the JSON, JS and document pages.

### Deployment

`.github/workflows/pages-genai-doc-finder.yml` publishes only a staged copy of
`GenAI/doc-finder/` to GitHub Pages under `/genai-doc-finder/`.

### Known limitations

- **The synonyms are hand-written.** This demo tests whether the experience
  communicates the idea (plain-language question in, current document out, honest
  "not found"). It does not test whether real retrieval would work on Josselyn's
  actual documents and staff wording. A real system would need an AI model or
  embeddings, plus evaluation on real queries.
- The thresholds were tuned on 18 documents and a handful of test questions. They
  would not carry over to a real library.
- No live AI model, accounts, database or analytics.

## Course notes

Course work for GenAI class, Fall 2026.
