/**
 * Enhanced markdown renderer for PRO Dashboard content.
 * Handles headers, bold, italic, links, and paragraphs with consistent styling.
 */
import React from 'react';

export const renderMarkdown = (text: string, isInline = false) => {
    if (!text) return null;

    // Inline mode: just return a span with minimal processing
    if (isInline) {
        const html = processMarkdown(text).replace(/\n/g, ' ');
        return <span dangerouslySetInnerHTML={{ __html: html }} />;
    }

    // Full mode: Split into blocks for proper paragraph/header handling
    // Split by ANY newline sequence to handle single-spaced content better
    const blocks = text.trim().split(/\n+/);

    return (
        <div className="space-y-3 text-[13px] text-slate-600 dark:text-slate-400">
            {blocks.map((block, index) => {
                const trimmed = block.trim();
                if (!trimmed) return null;

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
                            className="text-lg font-black mt-5 mb-2 text-slate-900 dark:text-white leading-tight"
                            dangerouslySetInnerHTML={{ __html: processMarkdown(trimmed.replace(/^##\s+/, '')) }}
                        />
                    );
                }
                if (trimmed.startsWith('# ')) {
                    return (
                        <h2
                            key={`h1-${index}`}
                            className="text-lg font-black mt-5 mb-2 text-slate-900 dark:text-white leading-tight"
                            dangerouslySetInnerHTML={{ __html: processMarkdown(trimmed.replace(/^#\s+/, '')) }}
                        />
                    );
                }

                // Standard Paragraph
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
    return text
        .replace(/\*\*\*\*(.*?)\*\*\*\*/g, '<strong>$1</strong>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/__([^_]+)__/g, '<strong>$1</strong>')
        .replace(/_(.*?)_/g, '<em>$1</em>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        // Special CTA button - Allow spaces
        .replace(/\[CTA:\s*(.*?)\]\s*\((.*?)\)/g, '<a href="$2" target="_blank" class="inline-block my-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-label font-black uppercase tracking-wider rounded-xl transition-all shadow-lg hover:shadow-indigo-500/30 no-underline">$1</a>')
        // Standard links - Allow spaces
        .replace(/\[(.*?)\]\s*\((.*?)\)/g, '<a href="$2" target="_blank" class="text-indigo-500 hover:text-indigo-600 font-bold underline decoration-2 underline-offset-2 transition-colors">$1</a>');
}
