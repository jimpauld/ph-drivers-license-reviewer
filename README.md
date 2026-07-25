# PH Driver's License Reviewer

A privacy-first, offline-capable web app for reviewing for the Philippine Land Transportation Office (LTO) theoretical driving exam.

## Principles

- **Privacy-first** — no backend, no analytics, no accounts, no personal data collection
- **Local-first** — all progress stored in the user's browser (IndexedDB)
- **Offline-capable** — installable PWA, works without internet after first load
- **Simple and fast** — vanilla HTML/CSS/JS, no heavy framework
- **Open source** — MIT licensed, community corrections welcome
- **Accurate** — questions derived only from official LTO sources, human-reviewed

## Exam modes

| Mode | Questions | Passing | Timer |
|---|---|---|---|
| Student Permit | 25 | 80% | 25 min |
| Non-Professional | 40 (or 60) | 75% | 40 (or 60) min |
| Professional | 60 | 75% | 60 min |

## Question bank

- 1,200 questions generated from the official Filipino Driver's Manual (Vol. 1 & Vol. 2) and Philippine Republic Acts, supplemented with recent LTO memorandum circulars for updated fines.
- Each question includes an explanation and a source citation.
- Report inaccurate questions via the in-app flag button (opens a pre-filled GitHub issue).

## Tech stack

- Vanilla HTML, CSS, JavaScript
- IndexedDB for progress, settings, and flags
- Static JSON question bank (versioned)
- SVG road signs (Wikimedia Commons + AI gap-fill)
- PWA (service worker + web manifest)
- Deployed via Cloudflare Pages

## License

MIT — see [LICENSE](./LICENSE).

## Disclaimer

This project is not affiliated with, endorsed by, or connected to the Land Transportation Office (LTO) of the Philippines. It is an independent study aid. "LTO" and related marks belong to the Philippine government. Question content is derived from public-domain government works under Republic Act No. 8293, Section 176.