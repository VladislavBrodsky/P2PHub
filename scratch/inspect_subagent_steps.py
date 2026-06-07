import json
import os

parent_log_path = "/Users/grandmaestro/.gemini/antigravity/brain/4cda3594-ae4e-43d0-8ce6-3e99078c80cc/.system_generated/logs/transcript.jsonl"

subagents = [
    "63ac20b9-4a66-44ea-a374-e0f1c1028f08",
    "905d3719-7aed-4ded-9acc-8aed4d17dd18",
    "ea1c3fe8-a4f3-4d78-9484-a6abc9800cf4"
]

with open(parent_log_path, "r", encoding="utf-8") as f:
    for line in f:
        if any(sub_id in line for sub_id in subagents):
            try:
                step = json.loads(line)
                step_index = step.get("step_index")
                step_type = step.get("type")
                source = step.get("source")
                print(f"Step {step_index} | Type: {step_type} | Source: {source}")
                
                # Check if there's any field with the message content
                for k, v in step.items():
                    if isinstance(v, str) and len(v) > 200:
                        # Print start and end of long strings to check for truncation
                        print(f"  Field '{k}': {v[:100]} ... {v[-100:]} (len: {len(v)})")
            except:
                pass
