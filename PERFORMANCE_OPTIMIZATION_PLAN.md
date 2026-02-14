# Performance Optimization Plan

## 🎯 Objective
Improve the PageSpeed Insights score (currently 56/100 Mobile) by addressing key bottlenecks: cache lifetimes, payload size, and image delivery.

## 📊 Current Metrics
- **Performance Score**: 56 (Mobile)
- **FCP**: 11.1s (Critical)
- **LCP**: 15.5s (Critical)
- **Payload**: ~2.77 MB (Excessive)
- **Unused JS**: ~800 KiB (Primary offenders: `vendor-charts`, `vendor-ton`, `vendor-ui`)

## 🛠 Implementation Steps

### 1. 🚀 Enable Aggressive Server-Side Caching
**Problem**: "Serve static assets with an efficient cache policy" (~2.3 MB savings potential).
**Fix**: Update `frontend/server.cjs` to serve `Cache-Control` headers.
- **Immutable Assets** (`/assets/`): `public, max-age=31536000, immutable`
- **Static files** (images, etc): `public, max-age=86400`
- **index.html**: `no-cache` (to ensure immediate updates)

### 2. 📦 Re-enable Gzip/Brotli Compression
**Problem**: "Avoid enormous network payloads". Currently, `vite.config.ts` has compression disabled to fix a build error.
**Fix**:
- Re-install and configure `vite-plugin-compression`.
- Update `server.cjs` to prefer serving `.br` or `.gz` files if they exist and the client supports them.
- Ensure build permissions are handled correctly to avoid `EPERM` errors.

### 3. ✂️ Advanced Code Splitting
**Problem**: "Reduce unused JavaScript" (~800 KiB unused).
- `vendor-charts` (484 KiB): Recharts is huge and likely only needed on specific dashboard pages.
- `vendor-ton` (445 KiB): TON Connect UI + SDK. Potentially lazy load this until user interaction.
- `vendor-ui` (183 KiB): Framer Motion + Lucide.

**Fix**:
- Refine `manualChunks` in `vite.config.ts`.
- Ensure `Recharts` and `TonConnectUI` are imported dynamically where possible.
- Verify `App.tsx` lazy loading implementation for heavy routes.

### 4. 🖼 Optimize Image Delivery
**Problem**: "Improve image delivery" (78 KiB savings).
**Fix**: 
- Re-enable `vite-plugin-image-optimizer`.
- Convert heavy assets to WebP/AVIF at build time.
- Ensure `logo.svg` vs `logo.webp` usage is efficient.

## 📅 Execution Strategy
1. **Modify `server.cjs`**: Add headers and compression serving logic.
2. **Update `vite.config.ts`**: Restore optimization plugins and refine chunks.
3. **Build & Verify**: Run a local build to ensure no `EPERM` errors.
4. **Deploy**: Push to Railway and re-audit.
