/**
 * GlitchImageOverlay
 * ------------------
 * Renders a high-fidelity glitch-styled text overlay on top of AI-generated images.
 * Now supports multiline wrapping, film grain, and enhanced CRT effects.
 */

export interface GlitchOverlayOptions {
    text: string;
    imageUrl: string;
    baseUrl?: string;
    fontSizeFraction?: number;
    glitchPasses?: number;
    minReadableRatio?: number;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

async function ensureFont(family: string, timeoutMs = 2500): Promise<boolean> {
    if (typeof document === 'undefined') return false;
    try {
        await Promise.race([
            document.fonts.load(`700 40px "${family}"`),
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('font timeout')), timeoutMs)
            ),
        ]);
        return document.fonts.check(`700 40px "${family}"`);
    } catch {
        return false;
    }
}

/**
 * Wraps text into lines based on maxWidth.
 */
function wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + ' ' + word).width;
        if (width < maxWidth) {
            currentLine += ' ' + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}

// ---------------------------------------------------------------------------
// Rendering Core
// ---------------------------------------------------------------------------

function drawGlitchSlice(
    ctx: CanvasRenderingContext2D,
    y: number,
    height: number,
    maxShift: number,
    canvasWidth: number,
    color: string,
    alpha: number
) {
    const shift = (Math.random() - 0.5) * 2 * maxShift;
    try {
        const imageData = ctx.getImageData(0, y, canvasWidth, height);
        ctx.putImageData(imageData, shift, y);
        ctx.fillStyle = color;
        ctx.globalAlpha = alpha * Math.random();
        ctx.fillRect(shift > 0 ? 0 : canvasWidth + shift, y, Math.abs(shift), height);
        ctx.globalAlpha = 1;
    } catch { /* Ignore CORS/Out-of-bounds */ }
}

function paintGlitchText(
    ctx: CanvasRenderingContext2D,
    text: string,
    fontDecl: string,
    canvasWidth: number,
    canvasHeight: number,
    passes: number
) {
    const PADDING_X = canvasWidth * 0.05;
    const maxWidth = canvasWidth - PADDING_X * 2;
    ctx.font = fontDecl;

    // 1. Wrap text
    const lines = wrapText(ctx, text, maxWidth);
    const fontSize = parseInt(fontDecl, 10);
    const lineHeight = fontSize * 1.15;
    const totalTextHeight = lines.length * lineHeight;

    // Position: bottom cluster
    const startX = PADDING_X;
    const startY = canvasHeight - totalTextHeight - (canvasHeight * 0.08);

    // 2. Backdrop Overlay (Elite Gradient)
    const backdropGrad = ctx.createLinearGradient(0, startY - fontSize, 0, canvasHeight);
    backdropGrad.addColorStop(0, 'rgba(0,0,0,0)');
    backdropGrad.addColorStop(0.2, 'rgba(0,0,0,0.6)');
    backdropGrad.addColorStop(1, 'rgba(0,0,0,0.9)');
    ctx.fillStyle = backdropGrad;
    ctx.fillRect(0, startY - fontSize, canvasWidth, canvasHeight - (startY - fontSize));

    // 3. Bake-in noise/grain to the backdrop
    for (let i = 0; i < 400; i++) {
        const rx = Math.random() * canvasWidth;
        const ry = startY - fontSize + Math.random() * (canvasHeight - startY + fontSize);
        const size = Math.random() * 2;
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`;
        ctx.fillRect(rx, ry, size, size);
    }

    // 4. Glitch Passes (Before main text)
    const glitchColors = ['#00f5ff', '#ff00e6', '#00ff88'];
    for (let p = 0; p < passes; p++) {
        const color = glitchColors[p % glitchColors.length];
        const sliceY = startY + Math.random() * totalTextHeight;
        const sliceH = 5 + Math.random() * 15;
        drawGlitchSlice(ctx, sliceY, sliceH, 20, canvasWidth, color, 0.4);
    }

    // 5. Render Lines
    lines.forEach((line, i) => {
        const y = startY + (i * lineHeight);

        // Chromatic Aberration Layers
        const offsets = [
            { dx: -2, dy: 0, color: 'rgba(0,245,255,0.4)' },
            { dx: 2, dy: 0, color: 'rgba(255,0,230,0.4)' },
        ];

        offsets.forEach(off => {
            ctx.fillStyle = off.color;
            ctx.fillText(line, startX + off.dx, y + off.dy);
        });

        // Sub-line accent (staggered)
        if (i === lines.length - 1) {
            const metrics = ctx.measureText(line);
            const accent = ctx.createLinearGradient(startX, 0, startX + metrics.width, 0);
            accent.addColorStop(0, '#6366f1');
            accent.addColorStop(1, 'transparent');
            ctx.fillStyle = accent;
            ctx.fillRect(startX, y + 8, metrics.width, 3);
        }

        // Main text
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(99,102,241,0.8)';
        ctx.shadowBlur = 15;
        ctx.fillText(line, startX, y);
        ctx.shadowBlur = 0;
    });

    // 6. Metadata Label
    const labelSize = Math.max(10, Math.round(fontSize * 0.35));
    ctx.font = `black ${labelSize}px monospace`;
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('PROTOCOL: VIRAL_P2P // AI_SYS_V4', startX, startY - fontSize * 0.6);

    ctx.fillStyle = '#6366f1';
    ctx.fillRect(startX, startY - fontSize * 0.55, 30, 2);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function applyGlitchOverlay(opts: GlitchOverlayOptions): Promise<string> {
    const { text, imageUrl, baseUrl = '', fontSizeFraction = 0.065, glitchPasses = 3, minReadableRatio = 0.015 } = opts;
    if (!text || !imageUrl) return imageUrl;

    let fullUrl = imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
    fullUrl = fullUrl.replace(/\/api\/images/, '/images');

    try {
        const img = await loadImage(fullUrl);
        const W = img.naturalWidth || 1024;
        const H = img.naturalHeight || 1024;

        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d');
        if (!ctx) return imageUrl;

        ctx.drawImage(img, 0, 0, W, H);

        const fontSize = Math.round(W * fontSizeFraction);
        const fontName = 'Inter';
        const fontLoaded = await ensureFont(fontName);
        const fontDecl = `bold ${fontSize}px ${fontLoaded ? `"${fontName}", sans-serif` : 'sans-serif'}`;
        ctx.font = fontDecl;

        // Readability Pre-check
        const metrics = ctx.measureText(text);
        if (metrics.width < 5) return imageUrl; // Blank/Too small

        paintGlitchText(ctx, text, fontDecl, W, H, glitchPasses);

        // Final Canvas check for transparency / failure
        return canvas.toDataURL('image/jpeg', 0.9);
    } catch (err) {
        console.error('[GlitchOverlay] Failed:', err);
        return imageUrl;
    }
}
