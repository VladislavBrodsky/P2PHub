import json

def get_keys(data, prefix=''):
    keys = set()
    if isinstance(data, dict):
        for k, v in data.items():
            new_prefix = f"{prefix}.{k}" if prefix else k
            keys.add(new_prefix)
            keys.update(get_keys(v, new_prefix))
    elif isinstance(data, list):
        for i, v in enumerate(data):
            new_prefix = f"{prefix}[{i}]"
            keys.add(new_prefix)
            keys.update(get_keys(v, new_prefix))
    return keys

with open('/Users/grandmaestro/Documents/P2PHub/frontend/src/locales/en.json', 'r') as f:
    en = json.load(f)
with open('/Users/grandmaestro/Documents/P2PHub/frontend/src/locales/ru.json', 'r') as f:
    ru = json.load(f)

en_keys = get_keys(en)
ru_keys = get_keys(ru)

missing_in_ru = en_keys - ru_keys
missing_in_en = ru_keys - en_keys

print(f"Missing in RU: {sorted(list(missing_in_ru))}")
print(f"Missing in EN: {sorted(list(missing_in_en))}")
