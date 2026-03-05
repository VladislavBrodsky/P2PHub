import React from 'react';

/**
 * Lightweight inline-markdown renderer.
 * Supports: **bold**, _italic_, `code`, and plain text.
 */
export function sanitizeAIGeneratedText(text: string): string {
    if (!text) return '';
    return text
        .replace(/\\n/g, '\n') // Handle literal \n
        .replace(/\n\s*\n/g, '\n\n') // Normalize double newlines
        .trim();
}

export function renderInline(text: string): React.ReactNode[] {
    const parts: React.ReactNode[] = [];
    // Regex that matches **bold**, _italic_, `code`, or raw links without breaking Safari
    // We match a URL if it starts with http:// or https://
    const pattern = /(\*\*(.+?)\*\*|_(.+?)_|`(.+?)`|(https?:\/\/[^\s<]+[^.,\s<)])|\[(.*?)\]\((.*?)\))/gi;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
        // Push preceding plain text
        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
        }

        if (match[0].startsWith('**')) {
            parts.push(<strong key={match.index} className="font-bold text-slate-900 dark:text-white">{match[2]}</strong>);
        } else if (match[0].startsWith('_')) {
            parts.push(<em key={match.index} className="italic">{match[3]}</em>);
        } else if (match[0].startsWith('`')) {
            parts.push(<code key={match.index} className="font-mono text-sm bg-slate-100 dark:bg-white/10 px-1 py-0.5 rounded text-blue-600 dark:text-blue-400">{match[4]}</code>);
        } else if (match[0].startsWith('http')) {
            parts.push(<a key={match.index} href={match[5]} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 underline font-medium">{match[5]}</a>);
        } else if (match[0].startsWith('[')) {
            parts.push(<a key={match.index} href={match[7]} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 underline font-medium">{match[6]}</a>);
        }

        lastIndex = match.index + match[0].length;
    }

    // Push remaining plain text
    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }

    return parts;
}

/**
 * Renders a markdown string into React elements.
 * Handles:
 *  - Blank-line separated paragraphs
 *  - Numbered lists (lines starting with "1.", "2.", etc.)
 *  - **bold**, _italic_, `code` inline formatting
 */
export function renderMarkdown(text: string | undefined | null): React.ReactNode {
    if (!text) return null;

    const sanitizedText = sanitizeAIGeneratedText(text);
    // Split by double newlines (paragraph breaks)
    const blocks = sanitizedText.split(/\n\n+/);

    return (
        <div className="space-y-4">
            {blocks.map((block, blockIdx) => {
                const trimmed = block.trim();
                if (!trimmed) return null;

                // Detect ordered list block: lines starting with "1.", "2.", …
                const lines = trimmed.split('\n');
                const isOrderedList = lines.every(l => /^\d+\.\s/.test(l.trim()));

                if (isOrderedList) {
                    return (
                        <ol key={blockIdx} className="space-y-2 pl-0 list-none">
                            {lines.map((line, lineIdx) => {
                                const content = line.replace(/^\d+\.\s*/, '').trim();
                                return (
                                    <li key={lineIdx} className="flex items-start gap-2.5">
                                        <span className="shrink-0 w-5 h-5 rounded-full bg-blue-500/20 text-blue-500 text-label font-bold flex items-center justify-center mt-0.5">
                                            {lineIdx + 1}
                                        </span>
                                        <span>{renderInline(content)}</span>
                                    </li>
                                );
                            })}
                        </ol>
                    );
                }

                // Mixed block: may have some list items and some plain lines
                const hasListItems = lines.some(l => /^\d+\.\s/.test(l.trim()));
                if (hasListItems) {
                    return (
                        <div key={blockIdx} className="space-y-2">
                            {lines.map((line, lineIdx) => {
                                const trimmedLine = line.trim();
                                if (/^\d+\.\s/.test(trimmedLine)) {
                                    const content = trimmedLine.replace(/^\d+\.\s*/, '');
                                    const num = parseInt(trimmedLine);
                                    return (
                                        <div key={lineIdx} className="flex items-start gap-2.5">
                                            <span className="shrink-0 w-5 h-5 rounded-full bg-blue-500/20 text-blue-500 text-label font-bold flex items-center justify-center mt-0.5">
                                                {num}
                                            </span>
                                            <span>{renderInline(content)}</span>
                                        </div>
                                    );
                                }
                                if (!trimmedLine) return null;
                                return <p key={lineIdx}>{renderInline(trimmedLine)}</p>;
                            })}
                        </div>
                    );
                }

                // Plain paragraph — join lines with a space
                const paragraphText = lines.map(l => l.trim()).join(' ');
                return <p key={blockIdx}>{renderInline(paragraphText)}</p>;
            })}
        </div>
    );
}
