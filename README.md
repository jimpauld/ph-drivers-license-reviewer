# PH Driver's License Reviewer

A privacy-first, offline-capable web app for reviewing for the Philippine Land Transportation Office (LTO) theoretical driving exam.

## Principles

- **Privacy-first** — no backend, no analytics, no accounts, no personal data collection
- **Local-first** — all progress stored in the user's browser (IndexedDB)
- **Offline-capable** — installable PWA, works without internet after first load
- **Simple and fast** — vanilla HTML/CSS/JS, no heavy framework
- **Open source** — MIT licensed, community corrections welcome
- **Accurate** — questions derived only from official LTO sources, human-reviewed

## Features

- **Mock exam** — Student Permit (25q/80%), Non-Professional (40 or 60q/75%), Professional (60q/75%), timed with auto-submit
- **Practice by category** — untimed, with explanations and source links
- **Per-category scoring** — see your weak areas
- **Bookmarks** — save questions to review later
- **Exam history** — track your progress over time
- **Resume** — continue an interrupted exam
- **Flag/report** — report inaccurate questions via a pre-filled GitHub issue
- **Light/dark theme** — for comfortable reading
- **Offline** — installable PWA, works without internet after first load
- **Question bank updates** — manual check, user-confirmed

## Exam modes

| Mode | Questions | Passing | Timer |
|---|---|---|---|
| Student Permit | 25 | 80% | 25 min |
| Non-Professional | 40 (or 60) | 75% | 40 (or 60) min |
| Professional | 60 | 75% | 60 min |

## Setup

No build step. Clone and serve the static files:

```sh
git clone https://github.com/jimpauld/ph-drivers-license-reviewer.git
cd ph-drivers-license-reviewer
# serve with any static server, e.g.:
npx serve .
# or open index.html directly in a browser
```

## Usage

1. Open the app in a browser (Chrome/Edge for PWA install).
2. Choose **Mock Exam** (timed, graded) or **Practice by Category** (untimed, with explanations).
3. Answer questions; flag any you think are wrong; bookmark tricky ones.
4. View your **Exam history** and **Bookmarks** from the home screen.
5. **Check for updates** to pull the latest question bank.
6. Install to your home screen for an app-like, offline experience.

## Tech stack

- Vanilla HTML, CSS, JavaScript (no framework, no build step)
- IndexedDB for progress, settings, flags, bookmarks, and the question bank
- Static JSON question bank (versioned, with changelog)
- Inline SVG road signs
- PWA (service worker + web manifest)
- Deployed via Cloudflare Pages

## Development

```sh
# run tests (Node 22+ built-in test runner)
node --test "tests/**/*.test.js"

# validate the manifest
node -e "JSON.parse(require('fs').readFileSync('manifest.webmanifest','utf8'))"
```

Pure logic lives in testable ES modules under `src/` (`quiz-engine.js`,
`exam-session.js`, `practice-session.js`, `report.js`, `version.js`,
`theme.js`, `storage-memory.js`, `storage-idb.js`). The DOM/UI layer is
`src/main.js`.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for how to report incorrect
questions and submit corrections. Question corrections are PRs to
`questions.json` with a changelog entry and a source citation.

## Question sources

Questions are derived only from official, public-domain Philippine
government sources:

- Filipino Driver's Manual (FDM) Vol. 1 & Vol. 2
- Republic Acts (4136, 8750, 10054, 10586, 10913, 11229, 8749)
- LTO memorandum circulars (for updated fines/penalties)

No memory-reconstructed exam questions. See the [changelog](./CHANGELOG.md)
for question bank revisions.

## License

MIT — see [LICENSE](./LICENSE). Question content derived from government
works is in the public domain under Republic Act No. 8293, Section 176.

## Disclaimer

This project is not affiliated with, endorsed by, or connected to the Land
Transportation Office (LTO) of the Philippines. It is an independent study
aid. "LTO" and related marks belong to the Philippine government.
