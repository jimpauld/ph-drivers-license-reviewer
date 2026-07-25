# Contributing

Thanks for helping improve the PH Driver's License Reviewer! This is a
privacy-first, open-source study aid for the Philippine LTO theoretical
driving exam.

## Reporting an incorrect question

The easiest way to report a wrong question is to use the **Flag this
question** button inside the app. It opens a pre-filled GitHub issue with
the question details and your feedback.

If you prefer to report manually:

1. Note the **Question ID** shown in the app (e.g. `q-001`).
2. Open an issue using the **Incorrect question** template.
3. Include the question ID, what's wrong, and the correct answer with a
   source citation (Filipino Driver's Manual page or Republic Act section).

## Submitting a question correction

Question corrections are changes to `questions.json` at the repo root.

1. Fork the repo and create a branch.
2. Edit `questions.json` — keep the existing schema (id, category,
   subcategory, difficulty, question, options, correct, explanation,
   source, optional sourceUrl, optional image).
3. Bump the `version` field and add a `CHANGELOG.md` entry.
4. Open a pull request describing the correction and citing the source.

## Question sources

Questions must be derived only from official, public-domain Philippine
government sources:

- Filipino Driver's Manual (FDM) Vol. 1 & Vol. 2
- Republic Acts (4136, 8750, 10054, 10586, 10913, 11229, 8749)
- LTO memorandum circulars (for updated fines/penalties)

Do not submit memory-reconstructed exam questions. Cite the source for
every question or correction.

## Code contributions

The app is vanilla HTML/CSS/JS with no build step.

- Run tests: `node --test "tests/**/*.test.js"`
- Validate the manifest: `node -e "JSON.parse(require('fs').readFileSync('manifest.webmanifest','utf8'))"`
- Keep pure logic in testable modules under `src/`; keep DOM rendering
  thin.

## License

By contributing, you agree your contributions are licensed under the MIT
License. Question content derived from government works is in the public
domain under RA 8293 Section 176.
