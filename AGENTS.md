# AGENTS.md — ph-drivers-license-reviewer

Project-level rules for AI coding agents working in this repo.
These extend (and where they conflict, override) the global `~/.config/opencode/AGENTS.md`.

## Project

PH Driver's License Reviewer — a privacy-first, offline-capable, vanilla HTML/CSS/JS
web app for reviewing for the Philippine LTO theoretical driving exam.

- No backend. No analytics. No accounts. No personal data collection.
- All user state lives in the browser (IndexedDB).
- Static JSON question bank, versioned in-repo.
- Deployed via Cloudflare Pages from this GitHub repo.

## Stack

- Vanilla HTML, CSS, JavaScript (no framework, no build step required).
- IndexedDB for storage; `questions.json` for the question bank.
- PWA: `manifest.webmanifest` + service worker.
- SVG road signs (Wikimedia Commons + AI gap-fill).

## Conventions

- 2-space indent for HTML/CSS/JS; UTF-8; final newline; CRLF is fine on Windows.
- No comments unless explicitly requested.
- Prefer the project's existing patterns over new abstractions.
- Prioritize maintainable, readable code over clever abstractions.

## Verification

- **Tests:** `node --test "tests/**/*.test.js"` (zero-dependency, Node 22+ built-in test runner; on Node 18/20 use `node --test tests/`)
- **Manifest:** `node -e "JSON.parse(require('fs').readFileSync('manifest.webmanifest','utf8'))"`
- **Browser:** open `index.html` and exercise the affected flow (manual for the DOM/UI layer)

There is no lint/typecheck tooling yet. When JS tooling is added, record the
commands here and in the global AGENTS.md format.

## Agent skills

### Issue tracker

Issues live in GitHub Issues (repo `jimpauld/ph-drivers-license-reviewer`). See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
