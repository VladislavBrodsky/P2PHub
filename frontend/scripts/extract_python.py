import os
import re
import base64
import json

print("🐍 Python Extraction Engine Starting...")

avatars_file = "frontend/src/data/avatars.ts"
output_dir = "frontend/public_safe/cdn/avatars"

if not os.path.exists(output_dir):
    os.makedirs(output_dir, exist_ok=True)

with open(avatars_file, 'r') as f:
    content = f.read()

# Match the entire Record object
match = re.search(r'AVATAR_DATA: Record<string, string> = ({.*?});', content, re.DOTALL)
if not match:
    print("❌ Could not find AVATAR_DATA")
    exit(1)

# Basic JSON-like parsing for the dictionary
# Since it might have trailing commas or weird formatting, we'll do a safe regex extraction
data_str = match.group(1)
assets = {}

# Match keys and values: "avatar_1_842.jpg": "data:image/jpeg;base64,..."
pairs = re.findall(r'"(.*?)"\s*:\s*"(.*?)"', data_str)

new_data = {}
count = 0

for key, val in pairs:
    if not val.startswith('data:'):
        new_data[key] = val
        continue
    
    try:
        header, encoded = val.split(",", 1)
        binary_data = base64.b64decode(encoded)
        
        target_path = os.path.join(output_dir, key)
        with open(target_path, 'wb') as img_file:
            img_file.write(binary_data)
        
        new_data[key] = f"/cdn/avatars/{key}"
        count += 1
        if count % 5 == 0: print(f"✅ Extracted {count} images...")
    except Exception as e:
        print(f"❌ Error processing {key}: {e}")
        new_data[key] = val

print(f"✨ Successfully extracted {count} assets via Python.")

# Update the file
formatted_json = json.dumps(new_data, indent=4)
new_content = f"// Static Asset Paths (Extracted via Python)\nexport const AVATAR_DATA: Record<string, string> = {formatted_json};"

with open(avatars_file, 'w') as f:
    f.write(new_content)

print("💾 Updated frontend/src/data/avatars.ts")
