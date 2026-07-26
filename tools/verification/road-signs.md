# Verification Report: road-signs

## Summary

- Total questions reviewed: 300
- OK: 300
- WRONG: 0
- UNCLEAR: 0
- Source chunks: `tools/fdm-chunks/vol1/03-road-signs.txt` (FDM Vol. 1 pp. 65–92), `tools/fdm-chunks/vol1/04-pavement-markings.txt` (FDM Vol. 1 pp. 93–104)

## Notes

Initial verification found two issues that were fixed:

1. `q-road-signs-108` asked about a "SHARP CURVE" sign; the FDM only lists a "SHARP TURN" sign on p. 73. The question was rewritten to ask about the "DOUBLE SHARP TURN" sign.
2. `q-road-signs-176`, `q-road-signs-295`, and `q-road-signs-296` made inferences about the unillustrated "Roadwork Signs" section (p. 92). They were rewritten to reference the documented supplementary sign "Additional sign on roadworks ahead" (p. 79).
3. `q-road-signs-277` originally omitted the primary "One-Way / Two-Way" hazard-marker categories; it was reworded to ask for the primary categories explicitly.

Image references were pruned to only the SVG files that already exist in `signs/`:
- `signs/stop.svg` (q-road-signs-002, q-road-signs-003)
- `signs/no-entry.svg` (q-road-signs-010)

All other road-sign questions are text-only.

All 300 questions are now source-derivable.

## WRONG

None.

## UNCLEAR

None.

## Numeric / Source Cross-Checks

- STOP sign no-parking zone: 6 m
- Fire hydrant: no waiting within 4 m
- Traffic lights ahead no-parking / no-stopping zone: 6 m
- Vertical clearances: 5.20 m and 4.80 m
- Expressway toll exit sign distance: 200 m
- Motorcycle signal distance: 100 m
- Asian Highway route marker: AH26
- Pavement speed limit: 60 KPH

All verified against the source text.
