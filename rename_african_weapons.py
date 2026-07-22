import json
import shutil
from pathlib import Path
import re

# Config
SRC_DIR = Path("/Users/odutko/projects/wiki/african_weapons_flat")
DEST_DIR = Path("/Users/odutko/projects/wiki/african_weapons_renamed")
JSON_FILE = Path("/Users/odutko/projects/wiki/african_weapon_titles.json")

def sanitize_filename(name):
    """Clean weapon name for use as filename"""
    # Remove/replace invalid characters
    name = re.sub(r"[\\/:*?\"\u003c\u003e|]", "", name)
    name = re.sub(r"\s+", "_", name)
    name = name.strip("._")
    # Limit length
    if len(name) > 80:
        name = name[:77] + "..."
    return name

# Load titles
with open(JSON_FILE, "r", encoding="utf-8") as f:
    titles = json.load(f)

# Create destination
DEST_DIR.mkdir(exist_ok=True)

# Process each file
renamed = []
for item in titles:
    old_name = item["file"]
    weapon = item["weapon"]
    
    # Find source file (could be .png or .jpg)
    src_file = None
    for ext in [".png", ".jpg", ".jpeg"]:
        candidate = SRC_DIR / old_name.replace(".png", ext).replace(".jpg", ext)
        if candidate.exists():
            src_file = candidate
            break
    
    if not src_file:
        print(f"⚠️  Not found: {old_name}")
        continue
    
    # Create new name
    new_base = sanitize_filename(weapon)
    new_name = new_base + src_file.suffix.lower()
    dest_file = DEST_DIR / new_name
    
    # Handle duplicates
    counter = 1
    while dest_file.exists():
        new_name = f"{new_base}_{counter}{src_file.suffix.lower()}"
        dest_file = DEST_DIR / new_name
        counter += 1
    
    # Copy file
    shutil.copy2(src_file, dest_file)
    renamed.append({"old": old_name, "new": new_name, "weapon": weapon})
    print(f"✓ {old_name} → {new_name}")

# Save rename log
log_file = DEST_DIR / "_rename_log.json"
with open(log_file, "w", encoding="utf-8") as f:
    json.dump(renamed, f, indent=2, ensure_ascii=False)

print(f"\n✅ Done! {len(renamed)} files renamed.")
print(f"📁 Destination: {DEST_DIR}")
print(f"📝 Log saved to: {log_file}")
