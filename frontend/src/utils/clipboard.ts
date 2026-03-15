/**
 * Robust copy to clipboard utility with fallback for older browsers or non-secure contexts.
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
    // 1. Try modern clipboard API
    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.error('Failed to copy using clipboard API:', err);
        }
    }

    // 2. Fallback to execCommand('copy')
    try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        
        // Ensure textarea is not visible but part of DOM
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '0';
        document.body.appendChild(textArea);
        
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) return true;
    } catch (err) {
        console.error('Keyboard copy fallback failed:', err);
    }

    return false;
};
