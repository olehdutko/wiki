#!/usr/bin/env python3
"""OCR weapon description images → name + description."""
import os, sys, re, json
from pathlib import Path
from PIL import Image
import pytesseract

TESSERACT_LANG = "eng"

WEAPON_NAME_PATTERNS = [
    re.compile(r"^(.+?)\n", re.MULTILINE),
    re.compile(r"[Nn]ame\s*[:\-]\s*(.+)", re.I),
    re.compile(r"^[A-Z][A-Z\s\-]{2,}\n", re.M),
]

def clean_text(raw):
    lines = [ln.strip() for ln in raw.splitlines() if ln.strip()]
    return "\n".join(lines)

def extract_name(text, original_filename):
    for pat in WEAPON_NAME_PATTERNS:
        m = pat.search(text)
        if m:
            name = m.group(1).strip().rstrip(",.;:")
            if len(name) > 2:
                return name
    first = text.split("\n")[0].strip().rstrip(",.;:") if text else ""
    if len(first) > 2:
        return first
    return Path(original_filename).stem

def sanitize_filename(name):
    safe = re.sub(r'[^\w\s\-]', '', name).strip()
    safe = re.sub(r'\s+', '_', safe)
    return safe[:80]

def process_folder(image_dir):
    src = Path(image_dir)
    out_dir = src / f"digitized_{src.name}"
    out_dir.mkdir(exist_ok=True)
    renamed_dir = out_dir / "renamed_images"
    renamed_dir.mkdir(exist_ok=True)

    manifest_path = out_dir / "weapon_manifest.md"
    manifest = ["# Weapon Digitization Manifest\n"]
    records = []

    images = sorted(src.glob("*.jpg")) + sorted(src.glob("*.jpeg")) + sorted(src.glob("*.png"))

    for img_path in images:
        print(f"Processing {img_path.name} ...")
        try:
            img = Image.open(img_path)
            raw_text = pytesseract.image_to_string(img, lang=TESSERACT_LANG)
            text = clean_text(raw_text)
            name = extract_name(text, img_path.name)
            safe_name = sanitize_filename(name)
            ext = img_path.suffix
            new_filename = f"{safe_name}{ext}"
            new_path = renamed_dir / new_filename

            counter = 1
            while new_path.exists():
                new_filename = f"{safe_name}_{counter}{ext}"
                new_path = renamed_dir / new_filename
                counter += 1

            with open(img_path, "rb") as fsrc, open(new_path, "wb") as fdst:
                fdst.write(fsrc.read())

            manifest.append(f"## {name}")
            manifest.append(f"- **New filename:** `{new_filename}`")
            manifest.append(f"- **Original:** `{img_path.name}`")
            manifest.append(f"- **Description (OCR):**\n```\n{text}\n```\n")

            records.append({
                "name": name,
                "description": text,
                "new_filename": new_filename,
                "original": img_path.name,
                "image_path": str(new_path.relative_to(out_dir))
            })
        except Exception as e:
            print(f"ERROR on {img_path.name}: {e}")
            manifest.append(f"## ERROR: {img_path.name}")
            manifest.append(f"```\n{e}\n```\n")

    with open(manifest_path, "w", encoding="utf-8") as f:
        f.write("\n".join(manifest))

    json_path = out_dir / "weapon_records.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)

    print(f"Done. Output: {out_dir}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 ocr_process.py <image_folder>")
        sys.exit(1)
    process_folder(sys.argv[1])
