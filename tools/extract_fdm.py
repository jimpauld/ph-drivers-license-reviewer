import pdfplumber
import os
import json
import re

BASE = os.path.dirname(os.path.abspath(__file__))
PDF_DIR = os.path.join(BASE, "fdm-pdfs")
CHUNKS_DIR = os.path.join(BASE, "fdm-chunks")

VOL1_PATH = os.path.join(PDF_DIR, "FDM-Vol.-1-2nd-Edition.pdf")
VOL2_PATH = os.path.join(PDF_DIR, "FDM-vol.-2-2nd-Edition.pdf")

# Manual mapping from PDF exploration
# Vol 1 structure (200 pages):
#   pg 8-37:    Ch I - Licensing (permits, classification, qualifications, procedures, fees)
#   pg 38-64:   Ch I - Driver's Ed / Course Content
#   pg 65-92:   Road Traffic Signs (incl. expressway signs section)
#   pg 93-104:  Pavement Markings
#   pg 105-111: Getting Ready: Checking Motor Vehicle and Documents
#   pg 112-134: Getting Ready: Before Starting and Driving on the Road
#   pg 135-140: Driving: Proactive Vehicle Maintenance
#   pg 141-147: Road Courtesy: Attitude and Behavior
#   pg 148-154: Road Safety: Emergencies and Road Hazards
#   pg 155-162: Rights, Duties, Responsibilities, Common Traffic Violations
#   pg 163-165: Conductor's License
#   pg 166-200: Reviewer

VOL1_CHUNKS = [
    ("vol1", "01-licensing-permits",       8, 37,   "Licensing: Permits, Licenses, Classification, Qualifications, Procedures, Fees"),
    ("vol1", "02-licensing-driver-ed",     38, 64,   "Licensing: Driver's Education and Course Content"),
    ("vol1", "03-road-signs",              65, 92,   "Road Traffic Signs"),
    ("vol1", "04-pavement-markings",       93, 104,  "Pavement Markings"),
    ("vol1", "05-vehicle-checks",          105, 111, "Getting Ready: Checking Motor Vehicle and Documents"),
    ("vol1", "06-pre-driving",             112, 134, "Getting Ready: Before Starting and Driving on the Road"),
    ("vol1", "07-vehicle-maintenance",     135, 140, "Driving: Proactive Vehicle Maintenance"),
    ("vol1", "08-road-courtesy",           141, 147, "Road Courtesy: Attitude and Behavior"),
    ("vol1", "09-emergencies-hazards",     148, 154, "Road Safety: Emergencies and Road Hazards"),
    ("vol1", "10-rights-duties",           155, 162, "Rights, Duties and Responsibilities of Drivers"),
    ("vol1", "11-reviewer",                166, 200, "Reviewer (Practice Questions)"),
]

# Vol 2 structure (93 pages):
#   pg 5-27:  Ch I - Motor Vehicle Registration
#   pg 28-70: Ch II - Land Transportation Related Laws (RAs)
#   pg 71-93: Ch III - Fines and Penalties

VOL2_CHUNKS = [
    ("vol2", "01-motor-vehicle-registration", 5,  27,  "Motor Vehicle Registration"),
    ("vol2", "02-republic-acts",              28, 70,  "Land Transportation Related Laws (Republic Acts)"),
    ("vol2", "03-fines-penalties",            71, 93,  "Fines and Penalties for Violations"),
]


def extract_all_text(pdf_path):
    pages = {}
    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages):
            text = page.extract_text()
            if text:
                pages[i + 1] = text
    return pages


def save_chunk(chunk_dir, slug, title, pages, start, end):
    os.makedirs(chunk_dir, exist_ok=True)
    out_path = os.path.join(chunk_dir, f"{slug}.txt")

    lines = [f"# {title}\n"]
    lines.append(f"Source: FDM 2nd Edition (2021)\n")
    lines.append(f"PDF pages: {start}-{end}\n")
    lines.append("=" * 60 + "\n")

    total_chars = 0
    for pg in range(start, end + 1):
        if pg in pages:
            text = pages[pg]
            lines.append(f"\n--- Page {pg} ---\n")
            lines.append(text)
            total_chars += len(text)

    with open(out_path, "w", encoding="utf-8") as f:
        f.write("".join(lines))

    print(f"  {slug}: pages {start}-{end} ({total_chars:,} chars) -> {out_path}")
    return {"slug": slug, "title": title, "start": start, "end": end, "chars": total_chars, "path": out_path}


def main():
    print("Extracting FDM Vol. 1...")
    vol1_pages = extract_all_text(VOL1_PATH)
    print(f"  {len(vol1_pages)} pages with text")

    vol1_saved = []
    for _, slug, start, end, title in VOL1_CHUNKS:
        chunk = save_chunk(os.path.join(CHUNKS_DIR, "vol1"), slug, title, vol1_pages, start, end)
        vol1_saved.append(chunk)

    print("\nExtracting FDM Vol. 2...")
    vol2_pages = extract_all_text(VOL2_PATH)
    print(f"  {len(vol2_pages)} pages with text")

    vol2_saved = []
    for _, slug, start, end, title in VOL2_CHUNKS:
        chunk = save_chunk(os.path.join(CHUNKS_DIR, "vol2"), slug, title, vol2_pages, start, end)
        vol2_saved.append(chunk)

    manifest = {"vol1": vol1_saved, "vol2": vol2_saved}
    manifest_path = os.path.join(CHUNKS_DIR, "manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    print(f"\nManifest saved to {manifest_path}")

    total_chars = sum(c["chars"] for c in vol1_saved + vol2_saved)
    print(f"Total: {total_chars:,} characters across {len(vol1_saved) + len(vol2_saved)} chunks")


if __name__ == "__main__":
    main()
