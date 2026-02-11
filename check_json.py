import json
import os

def check_json_files(directory):
    for root, dirs, files in os.walk(directory):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        for file in files:
            if file.endswith('.json'):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r') as f:
                        json.load(f)
                except Exception as e:
                    print(f"Error in {path}: {e}")

check_json_files('.')
