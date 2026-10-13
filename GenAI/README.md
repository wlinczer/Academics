# Project Prototype MVP: Siftr (staff-layer prototype)

Siftr is a knowledge assistant for nonprofit behavioral health organizations; this
prototype is its staff layer, where a clinician asks where a form is or how a
procedure works and gets the current document with its version date.

## How to open

Live: https://wlinczer.github.io/Academics/genai-doc-finder/
(or open `GenAI/doc-finder/index.html` locally)

## What the first working slice does

One flow: type a question, get an answer card with the document title, folder,
version date and a link to the document. It follows the Project Problem Framing
(Oct 2) and uses a fictional 18-document library for "Northshore Family Health",
with no real Josselyn documents or client data. The admin layer, accounts and live
document systems are out of scope.

## AI role and prototype status

| | |
|---|---|
| **Intended future AI role** | Retrieval-augmented generation over a clinician's real document systems (Navex, SharePoint, Clinical Campus). Given a question in the clinician's own words, find the most relevant current document and write a short answer grounded in it, with a link and version date. |
| **Works now** | Question box and answer card; version preference with an older-version note; conflict warning when two current documents match; not-found response that shows the example questions again; empty input handling; title-keyword baseline comparison under each answer. |
| **Simulated or manual** | Language understanding and answer writing. Retrieval uses hand-written synonyms and keyword scoring over a fictional library. Answer text is each document's pre-written summary. No live AI model or API is used. |

## Test results

Run against the live site with Playwright on 2026-10-13, after the Siftr rename.

| Test | Input or action | What happened | Pass/partial/fail |
|---|---|---|---|
| Typical | "Where is the release of information form?" (pass if it links to Authorization to Disclose) | One answer card: Authorization to Disclose, Clinical Forms, version 2025-03-10, current, linking to `library/authorization-to-disclose.html`. Keyword baseline returned nothing. | Pass |
| Challenge | "Is this the current expense reimbursement form?" (pass if it links to the 2025 version and notes the 2019 version) | One card: Expense Reimbursement Form, version 2025-01-15, current, linking to `library/expense-reimbursement-2025.html`, with "An older version exists (2019-07-01). Use the 2025-01-15 version above." Keyword baseline listed the 2019 version first. | Pass |
| Invalid or empty | "Do we have a telehealth consent form?", then an empty submit (pass if it says it cannot find it, invents no link, and empty input shows an inline message with no card) | Telehealth: "I couldn't find a matching document. Try different wording or ask your supervisor.", no answer card, no document link, example questions shown again. Empty: "Type a question first, for example where a form is or how a procedure works.", no card. | Pass |

Additional checks (extra):

- Consent chip ("Which consent form do we use?"): returned Consent for Treatment 2025-02-01 with a note about the 2022-09-01 version. Pass.
- Conflict chip ("How do I handle a client records request?"): showed Medical Records Procedure (2025) and Records Request Procedure (2024) with "These may conflict, confirm with your supervisor." Pass.
- FMLA ("Where is the FMLA leave request form?"): not found, no card, examples shown again. Pass.

## Known limitations

1. **Retrieval is hand-written.** Synonyms and thresholds were tuned on 18 fictional documents, so this tests whether the experience communicates the idea, not whether real retrieval works. Next step: evaluate an embedding or LLM retriever on real clinician questions from the next interview round.
2. **It tests findability, not upkeep.** The prototype checks finding a document and picking the current version, but my Fall Discovery Memo (Oct 11) suggests stale or unowned sources may cause more lost time than findability. Next step: trace a sample of staff time-loss stories to see whether the source was stale or current but hard to find, and build the admin-layer content-owner flow if upkeep dominates.
3. **No saved data, other roles or Teams surface.** There is no view for supervisors or content owners, and the sponsor team's consensus moved toward Teams on Oct 5. Next step: prototype the answer card inside a Teams chat and add an owner view that flags stale documents.

## Run locally

Open `doc-finder/index.html` in a browser. No build step, dependencies or API keys.
To change the library, edit `tools/build-library.js` and run
`node tools/build-library.js` to regenerate the JSON, JS and document pages.

## Deployment

`.github/workflows/pages-genai-doc-finder.yml` publishes only a staged copy of
`GenAI/doc-finder/` to GitHub Pages under `/genai-doc-finder/`.

## Course notes

Course work for GenAI class, Fall 2026.
