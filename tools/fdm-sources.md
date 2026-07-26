# FDM source PDFs

The Filipino Driver's Manual (FDM) is published by the Land Transportation
Office (LTO) and is available as a free PDF on https://lto.gov.ph.

## Where to put them

Place the downloaded PDFs in `tools/fdm-pdfs/` (gitignored — they are not
committed to the repo). Suggested filenames:

- `tools/fdm-pdfs/FDM-Vol-1.pdf`
- `tools/fdm-pdfs/FDM-Vol-2.pdf`

The `/pdf` skill and the generation pipeline read from this location.

## Where to download them (if not already downloaded)

- **FDM Vol. 1** (2nd Edition, 2021, ~200 pages): licensing, road signs,
  driving fundamentals, road courtesy, safety, rights and duties.
  - Search https://lto.gov.ph for "Filipino Driver's Manual Volume 1"
  - Likely URL pattern: `https://lto.gov.ph/wp-content/uploads/2023/10/FDM-Vol.-1-2nd-Edition.pdf`

- **FDM Vol. 2** (2nd Edition, 2021, ~93 pages): motor vehicle registration,
  land transportation laws (Republic Acts), fines and penalties.
  - Search https://lto.gov.ph for "Filipino Driver's Manual Volume 2"
  - Likely URL pattern: `https://lto.gov.ph/wp-content/uploads/2023/10/FDM-Vol.-2-2nd-Edition.pdf`

## LTMS portal

The LTMS e-learning portal (https://portal.lto.gov.ph/ords/f?p=ELEARNING:HOME)
mirrors the same content but requires login. The PDFs above are public.

## Legal status

Both volumes are Philippine government works. Under RA 8293 Section 176,
they are not protected by copyright. The "All rights reserved" notice in the
PDFs is legally ineffective for government works. Free non-commercial use
does not require LTO approval.

## Freshness caveat

The 2nd Edition is dated 2021. Some fine amounts and enforcement procedures
have been updated by 2024-2026 LTO memorandum circulars. When generating
penalty questions, cross-check the current fine amounts against recent MCs.
