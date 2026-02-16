
/**
 * Simple markdown renderer for PRO Dashboard content.
 * Handles bold, italic, and links with premium styling.
 */
export const renderMarkdown = (text: string, isInline = false) => {
    if (!text) return null;
    const html = text
        .replace(/\*\*\*\*(.*?)\*\*\*\*/g, '<strong>$1</strong>') // Handle quadruple stars
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/_(.*?)_/g, '<em>$1</em>')
        // Special button syntax: [CTA: Button Text](url)
        .replace(/\[CTA:\s*(.*?)\]\s*\((.*?)\)/g, '<a href="$2" target="_blank" class="inline-block mt-4 mb-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-colors no-underline shadow-lg">$1</a>')
        // Standard links
        .replace(/\[(.*?)\]\s*\((.*?)\)/g, '<a href="$2" target="_blank" class="text-indigo-500 hover:text-indigo-600 font-bold underline decoration-2 underline-offset-2 transition-colors">$1</a>')
        .replace(/\n/g, isInline ? ' ' : '<br />');

    if (isInline) {
        return <span dangerouslySetInnerHTML={{ __html: html }} />;
    }
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
};
