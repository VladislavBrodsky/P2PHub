import json

with open('frontend/src/locales/ru/pro.json', 'r') as f:
    data = json.load(f)

new_data = {}
new_data["pro_dashboard"] = data.get("pro_dashboard", {})

keys_to_move_to_setup = ["tg_sync_multi"]
keys_to_move_to_pro_dashboard = ["publish", "notifications", "tools", "academy"]

# Ensure setup is properly structured
if "setup" not in new_data["pro_dashboard"]:
    new_data["pro_dashboard"]["setup"] = {}

for k in keys_to_move_to_setup:
    if k in data:
        new_data["pro_dashboard"]["setup"][k] = data.pop(k)

# Move others to pro_dashboard if they are top level
for k in keys_to_move_to_pro_dashboard:
    if k in data:
        new_data["pro_dashboard"][k] = data.pop(k)

# Keep the rest top-level
for k, v in data.items():
    if k != "pro_dashboard":
        new_data[k] = v

with open('frontend/src/locales/ru/pro.json', 'w') as f:
    json.dump(new_data, f, indent=2, ensure_ascii=False)

print("ru/pro.json fixed!")
