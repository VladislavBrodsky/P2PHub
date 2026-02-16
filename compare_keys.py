import json
import os

def check_keys(en_data, ru_data, path=""):
    missing_in_en = []
    if isinstance(ru_data, dict):
        for key in ru_data:
            current_path = f"{path}.{key}" if path else key
            if key not in en_data:
                missing_in_en.append(current_path)
            elif isinstance(ru_data[key], (dict, list)):
                missing_in_en.extend(check_keys(en_data.get(key, {}), ru_data[key], current_path))
    elif isinstance(ru_data, list):
        for i, item in enumerate(ru_data):
            current_path = f"{path}[{i}]"
            if i >= len(en_data):
                missing_in_en.append(current_path)
            elif isinstance(item, (dict, list)):
                missing_in_en.extend(check_keys(en_data[i], item, current_path))
    return missing_in_en

locales = ['common.json', 'dashboard.json', 'marketing.json', 'other.json', 'pro.json', 'social.json', 'academy.json', 'cards.json']

for locale in locales:
    en_path = f"frontend/src/locales/en/{locale}"
    ru_path = f"frontend/src/locales/ru/{locale}"
    
    if not os.path.exists(en_path) or not os.path.exists(ru_path):
        print(f"File missing: {locale}")
        continue
        
    with open(en_path, 'r') as f_en, open(ru_path, 'r') as f_ru:
        en_data = json.load(f_en)
        ru_data = json.load(f_ru)
        
    missing = check_keys(en_data, ru_data)
    if missing:
        print(f"\nMissing keys in EN {locale}:")
        for m in missing:
            print(f"  {m}")
