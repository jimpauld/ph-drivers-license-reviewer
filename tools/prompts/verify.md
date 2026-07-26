# Verification prompt — cross-check generated questions

You are verifying multiple-choice questions for a Philippine LTO theoretical
driving exam reviewer. For each question, re-derive the answer from the
source text INDEPENDENTLY, then compare.

## Source

{{SOURCE_TEXT}}

## Questions to verify

{{QUESTIONS_JSON}}

## Instructions

For each question, output a verdict:

- `OK` — the correct answer matches the source text.
- `WRONG` — the marked correct answer does not match the source. State the
  correct answer and cite the source.
- `UNCLEAR` — the source text does not clearly support any answer, or the
  question is ambiguous. Explain.

Pay special attention to:
- Numeric facts (speed limits, fines, distances, ages, displacements)
- Dates and section references
- Distractors that are too close to the correct answer (ambiguous)
- Distractors that are obviously wrong (too easy)

## Output format

A markdown report with one section per question, grouped by verdict:

```
## WRONG

### q-road-signs-003
- Marked correct: B (YIELD)
- Actual correct: A (STOP) — FDM Vol. 1, p. 42
- Reason: ...
```

Do not modify the questions. Only report.
