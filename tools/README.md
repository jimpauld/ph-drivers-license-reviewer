# T10 — Question Bank Generation Pipeline

Generates the full ~1,200-question `questions.json` from official Philippine
government sources using opencode AI agents.

## Prerequisites

- The Filipino Driver's Manual (FDM) Vol. 1 & Vol. 2 PDFs, placed in
  `tools/fdm-pdfs/` (see `tools/fdm-sources.md` for where to get them).
  This folder is gitignored — the PDFs are not committed.
- opencode with the recommended models available:
  - `opencode-go/deepseek-v4-pro` — bulk question generation
  - `opencode-go/kimi-k2.7-code` — verification / cross-check
  - `opencode-go/glm-5.2` — PDF chunk structuring (or use the `/pdf` skill)

## Pipeline

### 1. Parse the PDFs

Use the `/pdf` skill to extract text from the local FDM PDFs:

```
/pdf — extract text from tools/fdm-pdfs/FDM-Vol-1.pdf and tools/fdm-pdfs/FDM-Vol-2.pdf,
       chunk by section
```

Save chunks to `tools/fdm-chunks/vol1/*.txt` and `tools/fdm-chunks/vol2/*.txt`
(also gitignored).

### 2. Generate questions (bulk)

For each chunk, run a generation agent with the prompt in
`tools/prompts/generate.md`. Use `opencode-go/deepseek-v4-pro`.

Target allocation (1,200 questions):

| Category | Count | Source |
|---|---|---|
| road-signs | 300 | FDM Vol. 1 |
| traffic-rules | 200 | FDM Vol. 1 |
| speed-limits | 120 | FDM Vol. 1 |
| defensive-driving | 120 | FDM Vol. 1 |
| licensing | 100 | FDM Vol. 1 |
| vehicle-equipment | 80 | FDM Vol. 1 |
| penalties | 120 | FDM Vol. 2 + recent MCs |
| republic-acts | 80 | FDM Vol. 2 |
| vehicle-registration | 50 | FDM Vol. 2 |
| expressway | 30 | FDM Vol. 1 |

Output: `tools/generated/<category>.json` — each file an array of question
objects matching the schema in `tools/schema.json`.

### 3. Verify (cross-check)

Run a verification agent with `tools/prompts/verify.md` using
`opencode-go/kimi-k2.7-code`. It re-derives the answer from the source text
and flags disagreements. Output: `tools/verification-report.md`.

### 4. Human review

Focus on (per the grilling decision):
- Fine amounts and penalties (cross-check with 2024-2026 LTO MCs)
- Dates and section references
- Numeric thresholds (speed limits, distances, displacements)
- Distractor quality (plausible but clearly wrong)

### 5. Assemble + validate

```sh
node tools/assemble.js          # merges generated/*.json into questions.json
node tools/validate.js          # validates against the schema
node --test "tests/**/*.test.js"  # confirm the bank loads through the engine
```

Bump `version` in `questions.json` and add a `CHANGELOG.md` entry.

## Notes

- Do NOT use memory-reconstructed exam questions. Only official-source-derived
  content.
- Every question must cite its source (FDM page or RA section).
- The app's `loadBank()` prefers the IndexedDB-stored bank; users get the new
  bank via the in-app "Check for updates" action.
