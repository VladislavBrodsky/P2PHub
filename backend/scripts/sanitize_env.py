import json
import os

env_path = "/Users/grandmaestro/Documents/P2PHub/backend/.env"

with open(env_path, 'r') as f:
    lines = f.readlines()

new_lines = []
json_collecting = False
json_buffer = []

for line in lines:
    stripped = line.strip()
    if stripped.startswith("GOOGLE_SERVICE_ACCOUNT_JSON={"):
        json_collecting = True
        json_buffer.append("{")
    elif json_collecting:
        json_buffer.append(stripped)
        if stripped == "}":
            json_collecting = False
            full_json = "".join(json_buffer)
            # Validate it's proper JSON
            try:
                # Remove possible trailing commas or whitespace if any
                parsed = json.loads(full_json)
                single_line_json = json.dumps(parsed)
                new_lines.append(f"GOOGLE_SERVICE_ACCOUNT_JSON='{single_line_json}'\n")
            except:
                new_lines.append(f"GOOGLE_SERVICE_ACCOUNT_JSON='{full_json}'\n")
            json_buffer = []
    else:
        new_lines.append(line)

with open(env_path, 'w') as f:
    f.writelines(new_lines)

print("✅ Sanitized .env JSON")
