import re
import json

def aggressive_polish(text):
    # 1. Try to extract from JSON if it looks like a parse error block
    if '"title":' in text or '"content":' in text:
        # Improved regex to handle escaped quotes and newlines
        title_m = re.search(r'"title":\s*"(.*?)"(?:\s*,|\s*\n|\s*\})', text, re.DOTALL)
        excerpt_m = re.search(r'"excerpt":\s*"(.*?)"(?:\s*,|\s*\n|\s*\})', text, re.DOTALL)
        content_m = re.search(r'"content":\s*"(.*?)"(?:\s*,|\s*\n|\s*\})', text, re.DOTALL)
        
        if title_m and content_m:
            title = title_m.group(1).replace('\\n', '\n').replace('\\"', '"').strip()
            excerpt = excerpt_m.group(1).replace('\\n', '\n').replace('\\"', '"').strip() if excerpt_m else ""
            body = content_m.group(1).replace('\\n', '\n').replace('\\"', '"').strip()
            text = f"# {title}\n\n{excerpt}\n\n{body}"
            print("Successfully extracted from JSON block")
        else:
            print("Failed regex match for JSON fields")

    # Clean markers
    markers = ["The Hook:", "The Meat:", "The Turn:", "CTA & Closing:", "Call to Action & Closing:", "The Hook", "The Meat", "The Turn"]
    for m in markers:
        clean_m = m.replace(':', '')
        text = re.sub(rf'\n+(?:\*\*)?{m}(?::)?(?:\*\*)?\s*', f'\n\n**{clean_m}:** ', text)

    # Paragraph re-joining
    paragraphs = [p.strip() for p in text.split('\n') if p.strip()]
    text = '\n\n'.join(paragraphs)
    
    return text.strip()

test_text = """# Viral Article Generated (Parse Error)

Content generated but JSON parsing failed.

{
  "title": "The Legacy Trap",
  "excerpt": "Excerpt here",
  "content": "Content here",
  "cta_text": "CTA"
}"""

print(f"Result:\n{aggressive_polish(test_text)}")
