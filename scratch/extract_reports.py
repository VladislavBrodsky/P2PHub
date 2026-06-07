import json
import os

subagents = {
    "api_audit_report": "63ac20b9-4a66-44ea-a374-e0f1c1028f08",
    "frontend_audit_report": "905d3719-7aed-4ded-9acc-8aed4d17dd18",
    "db_audit_report": "ea1c3fe8-a4f3-4d78-9484-a6abc9800cf4"
}

for filename, conv_id in subagents.items():
    output_path = f"/Users/grandmaestro/Developer/P2PHub/scratch/{filename}.md"
    log_path = f"/Users/grandmaestro/.gemini/antigravity/brain/{conv_id}/.system_generated/logs/transcript.jsonl"
    
    if not os.path.exists(log_path):
        print(f"Log not found for {filename}")
        continue
        
    msg_content = ""
    last_planner_response = ""
    
    with open(log_path, "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            try:
                step = json.loads(line)
                if step.get("source") == "MODEL":
                    if step.get("type") == "PLANNER_RESPONSE":
                        content = step.get("content")
                        if content:
                            last_planner_response = content
                        
                        tool_calls = step.get("tool_calls", [])
                        for tc in tool_calls:
                            if tc.get("name") == "send_message":
                                msg_args = tc.get("args", {})
                                if isinstance(msg_args, str):
                                    try:
                                        msg_args = json.loads(msg_args)
                                    except:
                                        pass
                                val = msg_args.get("Message")
                                if val:
                                    msg_content = val
            except Exception as e:
                pass
                
    content_to_write = msg_content if msg_content else last_planner_response
    # Unescape the JSON-escaped string
    try:
        # Since it was stored as a JSON string literal inside the python dict,
        # it might have escaped newlines. Let's make sure it is written properly.
        # If it starts and ends with quotes, load it as json to unescape.
        if (content_to_write.startswith('"') and content_to_write.endswith('"')) or \
           (content_to_write.startswith("'") and content_to_write.endswith("'")):
            content_to_write = json.loads(f'[{content_to_write}]')[0]
    except:
        pass
        
    with open(output_path, "w", encoding="utf-8") as out:
        out.write(content_to_write)
    print(f"Written {output_path}")
