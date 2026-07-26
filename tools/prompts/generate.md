# Generation prompt — bulk question generation

You are generating multiple-choice questions for a Philippine LTO theoretical
driving exam reviewer. Use ONLY the source text provided. Do not invent facts.

## Source

{{SOURCE_TEXT}}

## Category

{{CATEGORY}} (target: {{TARGET_COUNT}} questions)

## Instructions

Generate {{BATCH_SIZE}} questions from the source text above. Each question
must be answerable from the source text alone.

For each question, produce a JSON object with these fields:

- `id`: `q-<category>-<NNN>` (zero-padded, unique within the category)
- `category`: `{{CATEGORY}}`
- `subcategory`: a short subtopic (e.g. `regulatory`, `right-of-way`)
- `difficulty`: `easy`, `medium`, or `hard`
- `question`: the question text (one sentence, clear)
- `image`: omit unless the question is about a specific road sign (then use `signs/<name>.svg`)
- `options`: exactly 4 answer choices
- `correct`: the index (0-3) of the correct answer
- `explanation`: why the correct answer is correct, citing the source
- `source`: a citation (e.g. `FDM Vol. 1, p. 45` or `RA 4136, Sec. 35`)
- `sourceUrl`: omit, or the official URL if known

## Rules

- The correct answer MUST be derivable from the source text.
- Distractors (wrong options) must be plausible but clearly wrong to someone
  who knows the source material. Avoid joke answers.
- Do not duplicate questions across batches.
- Numeric facts (speed limits, fines, distances, ages) must match the source
  exactly. If the source is the 2021 FDM and a more recent LTO memorandum
  circular updated a fine, use the updated value and cite the MC.
- Output ONLY a JSON array of question objects. No prose, no markdown fences.

## Output format

```json
[
  { "id": "q-road-signs-001", "category": "road-signs", ... },
  ...
]
```
