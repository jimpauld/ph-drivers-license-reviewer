# Changelog

All notable changes to the question bank are documented here.
The app shows the current bank version in its footer.

## [2.0.0] - 2026-07-26

### Added
- Full T10 question bank with 1,200 multiple-choice questions across 10
  categories:
  road-signs (300), traffic-rules (200), speed-limits (120),
  defensive-driving (120), licensing (100), vehicle-equipment (80),
  penalties (120), republic-acts (80), vehicle-registration (50),
  expressway (30).
- Source-derived content from FDM Vol. 1 & Vol. 2 (2nd Edition, 2021).
- Every question cites its FDM page or RA section.
- Road-sign SVGs validated against FDM illustrations with image-analyzer.
- Pipeline tooling under `tools/` for extraction, generation, verification,
  assembly, and validation.

### Changed
- Replaced the 20-question sample bank with the full generated bank.
- Road-sign SVGs aligned with FDM style: yield sign inverted, no-entry
  sign without white border ring, warning triangle as red-bordered triangle.

### Notes
- Penalties are based on the 2021 FDM; cross-check 2024–2026 LTO
  memorandum circulars before relying on fine amounts for enforcement.

## [1.0.0] - 2026-07-25

### Added
- Initial question bank with 20 sample questions across 9 categories:
  road-signs, traffic-rules, speed-limits, defensive-driving, licensing,
  vehicle-equipment, penalties, republic-acts, expressway.
- Each question includes an explanation and a source citation.
- Road-sign questions include inline SVG images.

### Notes
- Questions are derived from official Philippine government sources
  (Filipino Driver's Manual Vol. 1 & Vol. 2, Republic Acts) under
  RA 8293 Section 176 (public domain).
- This is a sample bank; the full ~1,200-question bank will be generated
  in a later release (see issue #11).
