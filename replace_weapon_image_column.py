import re
text = open("/Users/odutko/projects/wiki/client/src/components/DataGrid/EntityDataGrid.tsx").read()
new_block = open("/Users/odutko/projects/wiki/weapon_image_column_with_hover.tsx").read()

pattern = r"(        // Колонка primary зображення для зброї.*?\}\] : \[\]),)"
match = re.search(pattern, text, re.DOTALL)
if match:
    text = text[:match.start()] + new_block.rstrip() + text[match.end():]
    open("/Users/odutko/projects/wiki/client/src/components/DataGrid/EntityDataGrid.tsx", "w").write(text)
    print("replaced")
else:
    print("pattern not found")
