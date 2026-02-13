
import re

def escape_markdown_v1(text: str) -> str:
    """
    Escapes characters for Telegram Markdown V1 (legacy).
    Escapes: '_', '*', '`', '['
    """
    if not text:
        return ""
    # Use re.sub to escape special characters
    # We want to escape these: _ * ` [
    # Note: ] doesn't need escaping in V1, only [ for links.
    return re.sub(r'([_*`\[])', r'\\\1', text)
