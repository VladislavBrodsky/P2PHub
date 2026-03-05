/**
 * Enhanced markdown renderer for PRO Dashboard content.
 * Handles headers, bold, italic, links, and paragraphs with consistent styling.
 */
import React from 'react';

export const sanitizeAIGeneratedText = (text: string) => {
    if (!text) return '';
    return text
        .replace(/\\n/g, '\n') // Handle literal \n
        .replace(/\n\s*\n/g, '\n\n') // Normalize double newlines
        .trim();
};

export const renderMarkdown = (text: string, isInline = false) => {
    if (!text) return null;

    const sanitizedText = sanitizeAIGeneratedText(text);

    // Inline mode: just return a span with minimal processing
    if (isInline) {
        const html = processMarkdown(sanitizedText).replace(/\n/g, ' ');
        return <span dangerouslySetInnerHTML={{ __html: html }} />;
    }

    // Full mode: Split into blocks for proper paragraph/header handling
    const rawBlocks = sanitizedText.trim().split(/\n\n+/);

    return (
        <div className="space-y-4 text-[13px] text-slate-600 dark:text-slate-400">
            {rawBlocks.map((block, index) => {
                const trimmed = block.trim();
                if (!trimmed) return null;

                // Callouts (GitHub style: > [!IMPORTAT])
                if (trimmed.startsWith('> [!')) {
                    const typeMatch = trimmed.match(/> \[!(IMPORTANT|WARNING|TIP|NOTE|CAUTION)\]/i);
                    const type = typeMatch ? typeMatch[1].toUpperCase() : 'NOTE';
                    const content = trimmed.replace(/> \[!(.*?)\]\n?/i, '').replace(/^>\s*/gm, '').trim();

                    const colors: any = {
                        IMPORTANT: 'border-indigo-500 bg-indigo-500/5 text-indigo-700 dark:text-indigo-300',
                        WARNING: 'border-amber-500 bg-amber-500/5 text-amber-700 dark:text-amber-300',
                        TIP: 'border-emerald-500 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300',
                        NOTE: 'border-blue-500 bg-blue-500/5 text-blue-700 dark:text-blue-300',
                        CAUTION: 'border-rose-500 bg-rose-500/5 text-rose-700 dark:text-rose-300'
                    };

                    const style = colors[type] || colors.NOTE;

                    return (
                        <div key={`callout-${index}`} className={`p-4 rounded-xl border-l-4 ${style} space-y-2 my-4`}>
                            <div className="flex items-center gap-2 font-bold uppercase tracking-widest text-[10px]">
                                <span>{type}</span>
                            </div>
                            <div className="font-medium leading-relaxed" dangerouslySetInnerHTML={{ __html: processMarkdown(content) }} />
                        </div>
                    );
                }

                // Standard Blockquotes
                if (trimmed.startsWith('> ')) {
                    const content = trimmed.replace(/^>\s*/gm, '').trim();
                    return (
                        <blockquote
                            key={`quote-${index}`}
                            className="border-l-4 border-slate-200 dark:border-white/10 pl-4 py-1 italic text-slate-500 dark:text-slate-400"
                            dangerouslySetInnerHTML={{ __html: processMarkdown(content) }}
                        />
                    );
                }

                // Headers
                if (trimmed.startsWith('### ')) {
                    return (
                        <h3
                            key={`h3-${index}`}
                            className="text-base font-bold mt-4 mb-2 text-slate-900 dark:text-white leading-tight"
                            dangerouslySetInnerHTML={{ __html: processMarkdown(trimmed.replace(/^###\s+/, '')) }}
                        />
                    );
                }
                if (trimmed.startsWith('## ')) {
                    return (
                        <h2
                            key={`h2-${index}`}
                            className="text-lg font-bold mt-5 mb-2 text-slate-900 dark:text-white leading-tight"
                            dangerouslySetInnerHTML={{ __html: processMarkdown(trimmed.replace(/^##\s+/, '')) }}
                        />
                    );
                }
                if (trimmed.startsWith('# ')) {
                    return (
                        <h1
                            key={`h1-${index}`}
                            className="text-xl font-bold mt-6 mb-3 text-slate-900 dark:text-white leading-tight border-b border-slate-100 dark:border-white/5 pb-2"
                            dangerouslySetInnerHTML={{ __html: processMarkdown(trimmed.replace(/^#\s+/, '')) }}
                        />
                    );
                }

                // Standard Paragraph (can contain multi-line text if not separated by \n\n)
                return (
                    <p
                        key={`p-${index}`}
                        className="font-normal leading-relaxed tracking-wide"
                        dangerouslySetInnerHTML={{ __html: processMarkdown(trimmed) }}
                    />
                );
            })}
        </div>
    );
};

// Internal helper for regex replacements
function processMarkdown(text: string): string {
    let html = text
        .replace(/\*\*\*\*(.*?)\*\*\*\*/g, '<strong>$1</strong>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/__([^_]+)__/g, '<strong>$1</strong>')
        .replace(/_(.*?)_/g, '<em>$1</em>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        // Special CTA Link
        .replace(/\[CTA:\s*(.*?)\]\s*\((.*?)\)/g, '<a href="$2" target="_blank" class="text-indigo-500 hover:text-indigo-600 font-extrabold underline decoration-2 underline-offset-2 transition-colors uppercase tracking-wider text-sm">$1</a>')
        // Standard links - Allow spaces
        .replace(/\[(.*?)\]\s*\((.*?)\)/g, '<a href="$2" target="_blank" class="text-indigo-500 hover:text-indigo-600 font-bold underline decoration-2 underline-offset-2 transition-colors">$1</a>');

    // Autolink raw URLs (not already in an <a> tag)
    // We do this by matching existing <a> tags OR raw URLs.
    html = html.replace(/(<a\b[^>]*>[\s\S]*?<\/a>)|(https?:\/\/[^\s<]+[^.,\s<)])/gi, (match: string, aTag: string, url: string) => {
        if (aTag) return aTag; // Already a link, leave untouched
        return `<a href="${url}" target="_blank" class="text-indigo-500 hover:text-indigo-600 font-bold underline decoration-2 underline-offset-2 transition-colors">${url}</a>`;
    });

    return html;
}
