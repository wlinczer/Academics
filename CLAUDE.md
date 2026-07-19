# CLAUDE.md

Context and instructions for Claude Code when working in this repository.

## About This Repo

Will Linczer's **academic** projects — coursework, research, and study material.
Sibling to `personal` (experiments/hobby) and `professional` (career work). Keep
the boundary clean: academic work belongs here.

## General Conventions

- Each course or project lives in its own subfolder with its own README
- Use the language/stack best suited to the task — no enforced stack
- Prefer clear, readable code over clever code
- Cite sources and keep academic-integrity expectations in mind for coursework
- Commit messages follow `type: short description` (e.g. `feat:`, `fix:`, `docs:`)

## What Claude Should Do

- Ask clarifying questions before starting large tasks
- Prefer editing existing files over creating new ones unless clearly needed
- Keep responses focused — avoid boilerplate or over-engineering

## Cross-Repo Notes

The three repos (`personal`, `professional`, `academics`) are siblings under
`_Repositories`. They share cross-cutting knowledge through an append-only log in
each repo at `docs/cross-repo-notes.md`.

**At the start of a session, if the work touches conventions, tooling, or setup:**
scan the sibling repos' logs for entries addressed to this repo —
`../personal/docs/cross-repo-notes.md` and `../professional/docs/cross-repo-notes.md`
(reading a sibling folder may prompt for permission; that's expected). Surface any
unresolved entry tagged `→ academics` to Will.

**When you notice something worth another repo knowing** — a convention worth
copying, a tooling fix, a setup gotcha, an improvement to make to their README or
CLAUDE.md — append an entry to *this* repo's `docs/cross-repo-notes.md` tagged with
the target repo. Do not edit another repo's files directly; propose via the log and
let Will (or that repo's Claude) act on it.

See [`docs/cross-repo-notes.md`](docs/cross-repo-notes.md) for the format.
