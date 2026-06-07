import os
import re
import base64

# Define paths
base_dir = "/Users/grandmaestro/Developer/P2PHub"
src_file = os.path.join(base_dir, "frontend/src/data/authorAvatars.ts")
dest_dir = os.path.join(base_dir, "frontend/public/images/avatars")

# Create destination directory if it doesn't exist
os.makedirs(dest_dir, exist_ok=True)

# Read source file
print(f"Reading from {src_file}...")
with open(src_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Regex to find: "key": "data:image/png;base64,..." or 'key': 'data:image/png;base64,...'
pattern = re.compile(r'["\']([^"\']+)["\']\s*:\s*["\']data:image/png;base64,([^"\']+)["\']')

matches = pattern.findall(content)
print(f"Found {len(matches)} avatars.")

new_mapping = {}

for key, b64_str in matches:
    img_data = base64.b64decode(b64_str)
    img_filename = f"{key}.png"
    img_path = os.path.join(dest_dir, img_filename)
    
    print(f"Saving {img_filename} to {img_path}...")
    with open(img_path, 'wb') as img_file:
        img_file.write(img_data)
        
    # Relative path from public root
    new_mapping[key] = f"/images/avatars/{img_filename}"

# Generate new authorAvatars.ts content
new_content = 'export const authorAvatars: Record<string, string> = {\n'
for key, path in new_mapping.items():
    new_content += f'    "{key}": "{path}",\n'
new_content += '};\n'

print(f"Writing updated authorAvatars.ts to {src_file}...")
with open(src_file, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Extraction completed successfully!")
