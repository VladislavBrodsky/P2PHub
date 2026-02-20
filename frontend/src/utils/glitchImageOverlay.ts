/**
 * GlitchImageOverlay
 * ------------------
 * Renders a glitch-styled text overlay on top of an AI-generated image
 * entirely in the browser using the Canvas 2D API.
 *
 * Safety guarantee:
 *   If the resulting text pixels are blank (WebFont not loaded, missing
 *   glyphs, or other rendering failure) the function bails out and returns
 *   the original image URL so the image is never polluted with invisible /
 *   unreadable text.
 */

export interface GlitchOverlayOptions {
    /** The headline text to render (usually generatedResult.title). */
    text: string;
    /** Source URL of the AI-generated image. May be relative or absolute. */
    imageUrl: string;
    /** Optional CORS proxy / base for relative URLs. */
    baseUrl?: string;
    /** Font size as a fraction of canvas width (0..1). Default 0.065 */
    fontSizeFraction?: number;
    /** Number of glitch animation frames baked into the canvas. Default 3 */
    glitchPasses?: number;
    /** Minimum % of text-row pixels that must be non-transparent to pass readability check. Default 0.02 (2%) */
    minReadableRatio?: number;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Load an image via fetch (needed for cross-origin) and decode it. */
async function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

/**
 * Attempt to ensure a web-safe font is available.
 * Returns true if the font loads within the timeout, false otherwise.
 */
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
 * Measure how readable the text is: render it on an off-screen canvas, then
 * count colored (non-transparent) pixels in the text band.
 * Returns a ratio 0..1; higher means more pixels were drawn = more readable.
 */
function measureReadability(
    text: string,
    fontDecl: string,
    canvasWidth: number
): number {
    const probe = document.createElement('canvas');
    probe.width = canvasWidth;
    probe.height = Math.ceil(canvasWidth * 0.15);
    const ctx = probe.getContext('2d')!;
    ctx.clearRect(0, 0, probe.width, probe.height);
    ctx.font = fontDecl;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, probe.width / 2, probe.height / 2, probe.width * 0.9);

    const { data } = ctx.getImageData(0, 0, probe.width, probe.height);
    let painted = 0;
    for (let i = 3; i < data.length; i += 4) {
        if (data[i] > 10) painted++;
    }
    return painted / (probe.width * probe.height);
}

// ---------------------------------------------------------------------------
// Glitch rendering primitives
// ---------------------------------------------------------------------------

/** Draw a single scanline glitch slice. */
function drawGlitchSlice(
    ctx: CanvasRenderingContext2D,
    y: number,
    height: number,
    maxShift: number,
    canvasWidth: number,
    canvasHeight: number,
    color: string,
    alpha: number
) {
    const shift = (Math.random() - 0.5) * 2 * maxShift;
    const imageData = ctx.getImageData(0, y, canvasWidth, height);
    ctx.putImageData(imageData, shift, y);

    // Colored glitch bar
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha * Math.random();
    ctx.fillRect(shift > 0 ? 0 : canvasWidth + shift, y, Math.abs(shift), height);
    ctx.globalAlpha = 1;
}

/**
 * Paint the entire glitch text overlay on `ctx`.
 * Returns the bounding box {x, y, w, h} of the text area.
 */
function paintGlitchText(
    ctx: CanvasRenderingContext2D,
    text: string,
    fontDecl: string,
    canvasWidth: number,
    canvasHeight: number,
    passes: number
): { x: number; y: number; w: number; h: number } {
    const PADDING_X = canvasWidth * 0.05;
    const maxW = canvasWidth - PADDING_X * 2;

    // Measure text
    ctx.font = fontDecl;
    const metrics = ctx.measureText(text);
    const textWidth = Math.min(metrics.width, maxW);
    const fontSize = parseInt(fontDecl, 10);
    const textHeight = fontSize * 1.3;

    // Position: bottom-left cluster
    const textX = PADDING_X;
    const textY = canvasHeight - textHeight * 1.6;
    const boxH = textHeight * 2;

    // --- Dark gradient backdrop ---
    const grad = ctx.createLinearGradient(0, textY - textHeight, 0, textY + boxH);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.3, 'rgba(0,0,0,0.65)');
    grad.addColorStop(1, 'rgba(0,0,0,0.85)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, textY - textHeight, canvasWidth, canvasHeight - (textY - textHeight));

    // --- Glitch scanlines (drawn BEFORE text so text sits on top) ---
    const glitchColors = ['#00f5ff', '#ff00e6', '#00ff88'];
    for (let pass = 0; pass < passes; pass++) {
        const color = glitchColors[pass % glitchColors.length];
        const numSlices = 2 + Math.floor(Math.random() * 3);
        for (let s = 0; s < numSlices; s++) {
            const sliceY =
                textY - textHeight * 0.5 + Math.random() * (boxH + textHeight);
            const sliceH = 2 + Math.floor(Math.random() * 6);
            drawGlitchSlice(ctx, sliceY, sliceH, 18, canvasWidth, canvasHeight, color, 0.35);
        }
    }

    // --- Chromatic-aberration ghost layers ---
    const aberrations = [
        { dx: -3, dy: 0, color: 'rgba(0,245,255,0.35)' },
        { dx: 3, dy: 0, color: 'rgba(255,0,230,0.35)' },
        { dx: 0, dy: 2, color: 'rgba(0,255,136,0.20)' },
    ];
    for (const { dx, dy, color } of aberrations) {
        ctx.font = fontDecl;
        ctx.fillStyle = color;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(text, textX + dx, textY + dy, maxW);
    }

    // --- Primary text ---
    ctx.font = fontDecl;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(99,102,241,0.8)';
    ctx.shadowBlur = 12;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(text, textX, textY, maxW);
    ctx.shadowBlur = 0;

    // --- Scan-line accent bar under text ---
    const accent = ctx.createLinearGradient(textX, 0, textX + textWidth, 0);
    accent.addColorStop(0, '#6366f1');
    accent.addColorStop(0.5, '#00f5ff');
    accent.addColorStop(1, 'rgba(99,102,241,0)');
    ctx.fillStyle = accent;
    ctx.fillRect(textX, textY + 5, textWidth, 2);

    // --- "AI GENERATED" micro-label ---
    ctx.font = `bold ${Math.max(9, Math.round(fontSize * 0.38))}px monospace`;
    ctx.fillStyle = 'rgba(99,102,241,0.9)';
    ctx.textAlign = 'left';
    ctx.fillText('⚡ AI GENERATED', textX, textY + textHeight * 1.05);

    return { x: textX, y: textY - textHeight * 0.5, w: textWidth, h: boxH };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Composites the glitch text overlay onto the image and returns a data-URL.
 * Returns the original `imageUrl` (unchanged) if:
 *   - The image cannot be fetched (CORS / network error)
 *   - The chosen font is not available / text pixels are blank
 *   - Any canvas operation throws
 */
export async function applyGlitchOverlay(
    opts: GlitchOverlayOptions
): Promise<string> {
    const {
        text,
        imageUrl,
        baseUrl = '',
        fontSizeFraction = 0.065,
        glitchPasses = 3,
        minReadableRatio = 0.02,
    } = opts;

    if (!text || !imageUrl) return imageUrl;

    // Resolve full URL
    let fullUrl = imageUrl;
    if (!fullUrl.startsWith('http') && baseUrl) {
        fullUrl = `${baseUrl}${fullUrl.startsWith('/') ? '' : '/'}${fullUrl}`;
    }
    // Strip double /api/images
    fullUrl = fullUrl.replace(/\/api\/images/, '/images');

    // --- 1. Load image ---
    let img: HTMLImageElement;
    try {
        img = await loadImage(fullUrl);
    } catch {
        console.warn('[GlitchOverlay] Image load failed – returning original URL');
        return imageUrl;
    }

    const W = img.naturalWidth || img.width || 1024;
    const H = img.naturalHeight || img.height || 1024;

    // --- 2. Build canvas ---
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return imageUrl;

    // Draw the base image
    ctx.drawImage(img, 0, 0, W, H);

    // --- 3. Choose font ---
    const fontSize = Math.round(W * fontSizeFraction);
    // Prefer Inter (likely loaded by the app), fall back to system sans-serif
    const preferredFont = 'Inter';
    const fontLoaded = await ensureFont(preferredFont);
    const fontFamily = fontLoaded ? `"${preferredFont}", sans-serif` : 'sans-serif';
    const fontDecl = `bold ${fontSize}px ${fontFamily}`;

    // --- 4. Readability pre-check ---
    const readability = measureReadability(text, fontDecl, W);
    if (readability < minReadableRatio) {
        console.warn(
            `[GlitchOverlay] Text readability too low (${(readability * 100).toFixed(2)}%) – skipping overlay`
        );
        return imageUrl;
    }

    // --- 5. Paint glitch overlay ---
    try {
        paintGlitchText(ctx, text, fontDecl, W, H, glitchPasses);
    } catch (err) {
        console.error('[GlitchOverlay] Paint error:', err);
        return imageUrl;
    }

    // --- 6. Post-check: verify text pixels exist on the final canvas ---
    try {
        const textY = H - fontSize * 1.3 * 1.6;
        const probeH = Math.ceil(fontSize * 1.3);
        const { data } = ctx.getImageData(0, Math.max(0, textY - probeH), W, probeH);
        let bright = 0;
        for (let i = 0; i < data.length; i += 4) {
            if (data[i] > 200 && data[i + 3] > 128) bright++;
        }
        const ratio = bright / (W * probeH);
        if (ratio < minReadableRatio) {
            console.warn(
                `[GlitchOverlay] Post-paint check failed (${(ratio * 100).toFixed(2)}%) – returning original`
            );
            return imageUrl;
        }
    } catch {
        // If getImageData fails (CORS taint) we still return the data URL
    }

    // --- 7. Export ---
    try {
        return canvas.toDataURL('image/jpeg', 0.92);
    } catch (err) {
        // Canvas is tainted (CORS) – return original
        console.warn('[GlitchOverlay] Canvas tainted (CORS) – returning original URL');
        return imageUrl;
    }
}
