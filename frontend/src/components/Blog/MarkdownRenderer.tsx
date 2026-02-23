import { memo, useMemo } from 'react';
import { BookOpen } from 'lucide-react';

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
                        className="text-lg font-bold mt-6 mb-2.5 text-slate-900 dark:text-white leading-tight tracking-tight flex items-center gap-2"
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
                        className="text-xl sm:text-2xl font-bold mt-10 mb-5 text-slate-900 dark:text-white leading-tight tracking-tight border-l-6 border-blue-500 pl-5 py-3 bg-linear-to-r from-blue-500/10 via-blue-500/5 to-transparent rounded-r-2xl shadow-sm uppercase!"
                        dangerouslySetInnerHTML={{ __html: processMarkdown(trimmed.replace(/^##\s+/, '')) }}
                    />
                );
            }
            if (trimmed.startsWith('# ')) {
                return (
                    <h1
                        key={`h1-${index}`}
                        className="text-2xl sm:text-3xl font-bold mt-10 mb-6 text-slate-900 dark:text-white leading-tight tracking-[0.02em] uppercase!"
                        dangerouslySetInnerHTML={{ __html: processMarkdown(trimmed.replace(/^#\s+/, '')) }}
                    />
                );
            }

            // List item support
            if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
                return (
                    <div
                        key={`li-${index}`}
                        className="flex gap-4 items-start my-4 px-1 group"
                    >
                        <div className="mt-2 w-2 h-2 shrink-0 rounded-full bg-blue-500/30 group-hover:bg-blue-500 transition-all duration-300 shadow-sm" />
                        <p
                            className="text-caption sm:text-body font-bold text-slate-600 dark:text-slate-400 group-hover:dark:text-slate-200 transition-colors leading-[1.6]"
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
                        className="my-8 p-6 sm:p-8 rounded-[2.5rem] bg-slate-50 dark:bg-white/5 border-l-8 border-blue-500/20 italic text-body sm:text-button text-slate-700 dark:text-slate-300 leading-relaxed shadow-inner font-medium relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <BookOpen className="w-20 h-20 rotate-12" />
                        </div>
                        <div className="relative z-10" dangerouslySetInnerHTML={{ __html: processMarkdown(trimmed.replace(/^>\s+/, '')) }} />
                    </blockquote>
                );
            }

            // Horizontal rule
            if (trimmed === '---' || trimmed === '***') {
                return <hr key={`hr-${index}`} className="my-10 border-slate-200 dark:border-white/10" />;
            }

            return (
                <p
                    key={`p-${index}`}
                    className="text-caption sm:text-button font-bold text-slate-600 dark:text-slate-400 leading-[1.7] sm:leading-[1.8] tracking-tight mb-2 opacity-95"
                    dangerouslySetInnerHTML={{ __html: processMarkdown(trimmed) }}
                />
            );
        });
    }, [content]);

    return <div className="space-y-4 sm:space-y-5">{renderedBlocks}</div>;
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
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900 dark:text-blue-400/90">$1</strong>')
        .replace(/__([^_]+)__/g, '<strong class="font-bold text-slate-900 dark:text-blue-400/90">$1</strong>')
        .replace(/_(.*?)_/g, '<em class="italic text-slate-800 dark:text-slate-200">$1</em>')
        .replace(/\*([^*]+)\*/g, '<em class="italic text-slate-800 dark:text-slate-200">$1</em>')

        // Fix for missing spaces around bold results
        .replace(/(\S)<strong/g, '$1 <strong')
        .replace(/<\/strong>(\S)/g, '</strong> $1')

        // Small Highlight
        .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-blue-600 dark:text-blue-400 font-bold text-[0.9em] mx-0.5">$1</code>')

        // Special CTA button
        .replace(/\[CTA:\s*(.*?)\]\s*\((.*?)\)/g, '<a href="$2" target="_blank" class="inline-block my-4 px-8 py-4 bg-linear-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white text-caption font-bold uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 no-underline active:scale-95">$1</a>')

        // Internal blog links [text](internal:slug)
        .replace(/\[(.*?)\]\s*\(internal:(.*?)\)/g, (match, text, slug) => {
            return `<a href="#" onclick="window.dispatchEvent(new CustomEvent('nav-blog-post', {detail: '${slug}'})); return false;" class="text-blue-500 dark:text-blue-400 font-bold border-b-2 border-blue-500/30 hover:border-blue-500 hover:bg-blue-500/5 px-1 rounded-sm transition-all cursor-pointer inline-flex items-center gap-1 group/link">
                ${text}
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
            </a>`;
        })

        // Standard links
        .replace(/\[(.*?)\]\s*\((.*?)\)/g, (match, text, url) => {
            if (url.startsWith('internal:')) return match; // Already handled
            return `<a href="${url}" target="_blank" class="text-blue-600 dark:text-blue-400 hover:text-blue-500 font-bold underline decoration-2 underline-offset-4 transition-all">${text}</a>`;
        })

        // Term/Glossary highlighting (engagement)
        .replace(/\[TERM:\s*(.*?)\s*\|\s*(.*?)\s*\]/g, '<span class="px-1.5 py-0.25 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 font-bold text-[0.85em] cursor-help relative group">$1<span class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-white text-label rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl border border-white/10">$2</span></span>')

        // Clean up excessive spacing but preserve line breaks if they were meant to be there
        .replace(/[ \t]{2,}/g, ' ');
}
