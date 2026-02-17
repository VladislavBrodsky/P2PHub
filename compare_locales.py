import json
import os

def compare_locales(base_path, en_dir, ru_dir):
    en_files = [f for f in os.listdir(os.path.join(base_path, en_dir)) if f.endswith('.json')]
    
    for filename in en_files:
        en_file_path = os.path.join(base_path, en_dir, filename)
        ru_file_path = os.path.join(base_path, ru_dir, filename)
        
        if not os.path.exists(ru_file_path):
            print(f"MISSING FILE: {filename} in ru")
            continue
            
        with open(en_file_path, 'r', encoding='utf-8') as f:
            en_data = json.load(f)
        with open(ru_file_path, 'r', encoding='utf-8') as f:
            ru_data = json.load(f)
            
        def get_keys(data, prefix=''):
            keys = {}
            for k, v in data.items():
                full_key = f"{prefix}.{k}" if prefix else k
                if isinstance(v, dict):
                    keys.update(get_keys(v, full_key))
                elif isinstance(v, list):
                    for i, item in enumerate(v):
                        list_key = f"{full_key}[{i}]"
                        if isinstance(item, dict):
                            keys.update(get_keys(item, list_key))
                        else:
                            keys[list_key] = item
                else:
                    keys[full_key] = v
            return keys

        en_keys = get_keys(en_data)
        ru_keys = get_keys(ru_data)
        
        missing = [k for k in en_keys if k not in ru_keys]
        if missing:
            print(f"\n--- {filename} ---")
            print(f"Missing {len(missing)} keys in RU:")
            for k in missing:
                print(f"  {k}: {en_keys[k]}")

if __name__ == "__main__":
    base_path = "/Users/grandmaestro/Documents/P2PHub/frontend/src/locales"
    compare_locales(base_path, 'en', 'ru')
