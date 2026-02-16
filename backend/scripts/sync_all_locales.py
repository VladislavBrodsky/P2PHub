import re
import json
import os

base_dir = '/Users/grandmaestro/Documents/P2PHub'

def sync_lang(lang):
    content_path = os.path.join(base_dir, f'backend/scripts/data/blog_content_{lang}.py')
    json_path = os.path.join(base_dir, f'frontend/src/locales/{lang}/marketing.json')
    
    with open(content_path, 'r', encoding='utf-8') as f:
        py_content = f.read()

    articles = {}
    pattern = r'"(\d+)":\s*"""(.*?)"""'
    matches = re.finditer(pattern, py_content, re.DOTALL)

    for match in matches:
        slug = match.group(1)
        text = match.group(2).strip()
        title_match = re.search(r'^#\s+(.*)', text)
        title = title_match.group(1).strip() if title_match else f"Article {slug}"
        
        excerpt = ""
        lines = text.split('\n')
        found_title = False
        for line in lines:
            line = line.strip()
            if not line: continue
            if not found_title:
                if title in line or line.startswith('#'):
                    found_title = True
                    continue
            if found_title and line:
                if not line.startswith('###') and not line.startswith('**'):
                    excerpt = line
                    if len(excerpt) > 200: excerpt = excerpt[:197] + "..."
                    break
        
        if not excerpt:
            clean_text = re.sub(r'#+\s.*', '', text)
            clean_text = clean_text.strip()
            excerpt = clean_text.split('\n')[0].strip()[:150]

        articles[slug] = {"title": title, "excerpt": excerpt}

    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    posts = data.get('blog', {}).get('posts', {})
    for slug, info in articles.items():
        if slug in posts:
            posts[slug]['title'] = info['title']
            posts[slug]['excerpt'] = info['excerpt']
        else:
            posts[slug] = {"title": info['title'], "excerpt": info['excerpt'], "category": "Intelligence Hub"}

    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"Synced {lang}")

sync_lang('en')
sync_lang('ru')
