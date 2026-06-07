import json
import os

parent_log_path = "/Users/grandmaestro/.gemini/antigravity/brain/4cda3594-ae4e-43d0-8ce6-3e99078c80cc/.system_generated/logs/transcript.jsonl"
output_path = "/Users/grandmaestro/Developer/P2PHub/scratch/parent_messages.md"

if not os.path.exists(parent_log_path):
    print("Parent log not found")
    exit(1)

with open(parent_log_path, "r", encoding="utf-8") as f, open(output_path, "w", encoding="utf-8") as out:
    out.write("# Messages Received by Parent\n\n")
    
    for line in f:
        if not line.strip():
            continue
        try:
            step = json.loads(line)
            step_type = step.get("type")
            source = step.get("source")
            content = step.get("content")
            
            # Print everything that looks like an incoming message from an agent
            if "message" in str(step).lower() or "recipient" in str(step).lower():
                out.write(f"### Step {step.get('step_index')} (Type: {step_type}, Source: {source})\n\n")
                if content:
                    out.write(content)
                    out.write("\n\n")
                
                # Check tool calls
                tool_calls = step.get("tool_calls", [])
                for tc in tool_calls:
                    if tc.get("name") == "send_message":
                        out.write(f"Tool Call send_message: {json.dumps(tc.get('args'))}\n\n")
                
                # Check if there is a 'messages' or similar field
                for k, v in step.items():
                    if k not in ["content", "thinking", "tool_calls"] and ("msg" in k or "message" in k):
                        out.write(f"Field {k}: {v}\n\n")
                        
                out.write("---\n\n")
        except Exception as e:
            pass
                
print(f"Extracted parent messages to {output_path}")
