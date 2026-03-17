/** Renders inline markdown (bold, italic) to HTML for use in excerpt snippets. */
export function renderExcerpt(text: string): string {
    if (!text) return '';
    return text
        .replace(/\*\*\s*(.*?)\s*\*\*/g, '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>')
        .replace(/__(.*?)__/g, '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>')
        .replace(/_(.*?)_/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>');
}
