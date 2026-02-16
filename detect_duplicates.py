import json
import sys

def detect_duplicates(pairs):
    d = {}
    for k, v in pairs:
        if k in d:
            print(f"DUPLICATE KEY FOUND: {k}")
        d[k] = v
    return d

for arg in sys.argv[1:]:
    print(f"Checking {arg}...")
    with open(arg, 'r') as f:
        try:
            json.load(f, object_pairs_hook=detect_duplicates)
        except Exception as e:
            print(f"ERROR: {e}")
