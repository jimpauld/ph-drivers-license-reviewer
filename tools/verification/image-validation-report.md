# Image Validation Report — Road Sign SVGs

**Date:** 2026-07-26
**Validator:** `@image-analyzer`
**FDM source:** `tools/fdm-images/vol1-road-signs/page-*.png` rendered from FDM Vol. 1, pp. 65–92

## SVGs Validated

| SVG | FDM Reference | Initial Verdict | Final Verdict | Fixes Applied |
|---|---|---|---|---|
| `signs/stop.svg` | p. 66 | PASS | PASS | — |
| `signs/yield.svg` | p. 66 | FAIL | PASS | Inverted triangle to point down; added "GIVE WAY" text |
| `signs/no-entry.svg` | p. 68 | FAIL (wrong page) | PASS | Removed white stroke ring; validated against correct page |
| `signs/warning-triangle.svg` | p. 75 | FAIL | PASS | Removed generic "!" symbol; kept as generic red triangle template |
| `signs/informational.svg` | p. 82 | FAIL | PASS | Changed to square shape, dark blue (#1a3a8a), proper "i" pictogram |

## Notes

- The FDM uses **red-bordered upward triangles** for warning signs, not yellow diamonds.
- `signs/warning-diamond.svg` was renamed to `signs/warning-triangle.svg` to match the FDM style.
- Only 6 road-sign questions now reference images; all reference an existing, validated SVG.

## Questions Using Images

- `q-road-signs-002` — STOP sign (`signs/stop.svg`)
- `q-road-signs-003` — STOP sign (`signs/stop.svg`)
- `q-road-signs-004` — GIVE WAY sign (`signs/yield.svg`)
- `q-road-signs-010` — NO ENTRY sign (`signs/no-entry.svg`)
- `q-road-signs-061` — generic warning sign (`signs/warning-triangle.svg`)
- `q-road-signs-117` — service/informational sign (`signs/informational.svg`)
