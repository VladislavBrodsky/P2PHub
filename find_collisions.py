import json
import glob

all_keys = {}
for f in glob.glob('frontend/src/locales/en/*.json'):
    with open(f, 'r') as fd:
        data = json.load(fd)
        for k in data.keys():
            if k in all_keys:
                all_keys[k].append(f)
            else:
                all_keys[k] = [f]

for k, files in all_keys.items():
    if len(files) > 1:
        print(f"COLLISION on key '{k}': {', '.join(files)}")
