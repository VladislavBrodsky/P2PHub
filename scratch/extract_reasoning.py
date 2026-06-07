import json
import os

subagents = {
    "api_audit": "63ac20b9-4a66-44ea-a374-e0f1c1028f08",
    "frontend_audit": "905d3719-7aed-4ded-9acc-8aed4d17dd18",
    "db_audit": "ea1c3fe8-a4f3-4d78-9484-a6abc9800cf4"
}

output_path = "/Users/grandmaestro/Developer/P2PHub/scratch/subagent_reasoning.md"

with open(output_path, "w", encoding="utf-8") as out:
    out.write("# Subagent Thinking and Responses\n\n")
    
    for name, conv_id in subagents.items():
        out.write(f"\n# {name} ({conv_id})\n\n")
        log_path = f"/Users/grandmaestro/.gemini/antigravity/brain/{conv_id}/.system_generated/logs/transcript.jsonl"
        
        if not os.path.exists(log_path):
            out.write(f"*Log not found: {log_path}*\n")
            continue
            
        with open(log_path, "r", encoding="utf-8") as f:
            step_num = 0
            for line in f:
                if not line.strip():
                    continue
                try:
                    step = json.loads(line)
                    if step.get("source") == "MODEL" and step.get("type") == "PLANNER_RESPONSE":
                        step_index = step.get("step_index", step_num)
                        content = step.get("content")
                        thinking = step.get("thinking")
                        
                        if thinking or content:
                            out.write(f"### Step {step_index}\n\n")
                            if thinking:
                                out.write("#### Thinking:\n")
                                out.write(thinking)
                                out.write("\n\n")
                            if content:
                                out.write("#### Content:\n")
                                out.write(content)
                                out.write("\n\n")
                    step_num += 1
                except:
                    pass

print(f"Extracted reasoning to {output_path}")
