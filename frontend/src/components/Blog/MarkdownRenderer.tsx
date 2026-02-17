import { memo, useMemo } from 'react';

interface MarkdownRendererProps {
    content: string;
}

export const MarkdownRenderer = memo(({ content }: MarkdownRendererProps) => {
    const renderedBlocks = useMemo(() => {
        const lines = content.trim().split('\n');
        let cleanContent = content;
        const firstLineIndex = lines.findIndex(line => line.trim().length > 0);

        // Strip out the main H1 title if it exists at the top
        if (firstLineIndex !== -1 && lines[firstLineIndex].trim().startsWith('# ')) {
            cleanContent = lines.slice(firstLineIndex + 1).join('\n').trim();
        }

        // Split by newlines, but ALSO split by headers that might be joined to the end of a line (lookahead)
        const blocks = cleanContent.split(/\n+|(?=###\s)|(?=##\s)/);

        return blocks.map((block, index) => {
            const trimmed = block.trim();
            if (!trimmed) return null;

            if (trimmed.startsWith('### ')) {
                return (
                    <h3
                        key={`h3-${index}`}
                        className="text-[17px] font-black mt-6 mb-2.5 text-slate-900 dark:text-white leading-tight tracking-tight flex items-center gap-2"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-lg shadow-blue-500/40" />
                        <span dangerouslySetInnerHTML={{ __html: processMarkdown(trimmed.replace(/^###\s+/, '')) }} />
                    </h3>
                );
            }
            if (trimmed.startsWith('## ')) {
                return (
                    <h2
                        key={`h2-${index}`}
                        className="text-xl font-black mt-8 mb-4 text-slate-900 dark:text-white leading-tight tracking-tight border-l-4 border-blue-500 pl-4 py-1.5 bg-blue-500/5 rounded-r-xl"
                        dangerouslySetInnerHTML={{ __html: processMarkdown(trimmed.replace(/^##\s+/, '')) }}
                    />
                );
            }
            if (trimmed.startsWith('# ')) {
                return (
                    <h1
                        key={`h1-${index}`}
                        className="text-2xl font-black mt-8 mb-4 text-slate-900 dark:text-white leading-tight tracking-tight"
                        dangerouslySetInnerHTML={{ __html: processMarkdown(trimmed.replace(/^#\s+/, '')) }}
                    />
                );
            }

            // List item support
            if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
                return (
                    <div
                        key={`li-${index}`}
                        className="flex gap-3 items-start my-2.5 px-1 group"
                    >
                        <div className="mt-1.5 w-1.5 h-1.5 shrink-0 rounded-full bg-slate-300 dark:bg-slate-700 group-hover:bg-blue-500 transition-colors" />
                        <p
                            className="text-[14px] font-medium text-slate-600 dark:text-slate-300 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: processMarkdown(trimmed.replace(/^[*|-]\s+/, '')) }}
                        />
                    </div>
                );
            }

            // Blockquote support
            if (trimmed.startsWith('> ')) {
                return (
                    <blockquote
                        key={`quote-${index}`}
                        className="my-6 p-5 rounded-2xl bg-slate-100 dark:bg-white/5 border-l-4 border-slate-300 dark:border-white/10 italic text-[14px] text-slate-600 dark:text-slate-400 leading-relaxed shadow-inner"
                        dangerouslySetInnerHTML={{ __html: processMarkdown(trimmed.replace(/^>\s+/, '')) }}
                    />
                );
            }

            // Horizontal rule
            if (trimmed === '---' || trimmed === '***') {
                return <hr key={`hr-${index}`} className="my-8 border-slate-200 dark:border-white/5" />;
            }

            return (
                <p
                    key={`p-${index}`}
                    className="text-[14px] font-medium text-slate-600 dark:text-slate-300 leading-[1.7] tracking-normal mb-1"
                    dangerouslySetInnerHTML={{ __html: processMarkdown(trimmed) }}
                />
            );
        });
    }, [content]);

    return <div className="space-y-3">{renderedBlocks}</div>;
});

MarkdownRenderer.displayName = 'MarkdownRenderer';

// Enhanced regex parser for markdown
function processMarkdown(text: string): string {
    if (!text) return '';

    return text
        // Fix for missing spaces around headers if they were concatenated
        .replace(/([^\n])(###\s)/g, '$1\n\n$2')
        .replace(/([^\n])(##\s)/g, '$1\n\n$2')

        // Fix for bold text that might cover entire lines or has internal spaces
        .replace(/\*\*\s+(.*?)\s+\*\*/g, '**$1**')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/__([^_]+)__/g, '<strong>$1</strong>')
        .replace(/_(.*?)_/g, '<em>$1</em>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')

        // Fix for missing spaces around bold results
        .replace(/(\S)<strong>/g, '$1 <strong>')
        .replace(/<\/strong>(\S)/g, '</strong> $1')

        // Special CTA button
        .replace(/\[CTA:\s*(.*?)\]\s*\((.*?)\)/g, '<a href="$2" target="_blank" class="inline-block my-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 no-underline active:scale-95">$1</a>')
        // Standard links
        .replace(/\[(.*?)\]\s*\((.*?)\)/g, '<a href="$2" target="_blank" class="text-blue-500 hover:text-blue-600 font-extrabold underline decoration-2 underline-offset-4 transition-all">$1</a>')

        // Clean up double spaces
        .replace(/\s{2,}/g, ' ');
}
