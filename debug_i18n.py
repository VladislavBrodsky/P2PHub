import json
import os

def load_json(path):
    with open(path, 'r') as f:
        return json.load(f)

base_path = '/Users/grandmaestro/Documents/P2PHub/frontend/src/locales/en/'
files = ['common.json', 'dashboard.json', 'marketing.json', 'academy.json', 'pro.json', 'social.json', 'cards.json', 'other.json']

merged = {}
for f in files:
    content = load_json(os.path.join(base_path, f))
    merged.update(content)

print("Root keys:", merged.keys())
if 'academy' in merged:
    print("Academy keys:", merged['academy'].keys())
else:
    print("Academy key NOT found at root!")
