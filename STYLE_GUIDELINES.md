# P2PHub Brand & UI Guidelines (v1.8.4)

This file defines the entire Parent style rules, frontend design system, font sizes, colors, spacing, button sizes, and micro-interactions used across our application. Keep using this guide when making new pages for consistent and premium UI.

## 1. Typography

The default font engine relies on modern web-safe and system fonts optimized for readability and aesthetics. 

**Font Families:**
- **Primary / Body / Sans:** `Onest`, `Inter`, `system-ui`, `-apple-system`, `sans-serif`
- **Display / Heading:** `Onest`, `Inter`, `system-ui`, `sans-serif`

**Font Weights:**
- `Regular`: `400`
- `Medium`: `500`
- `Semibold`: `600`
- `Bold`: `700`
- `Black`: `900`

**Line Heights (Leading):**
- `tight` (1.1) - _Best for large headlines (`text-display`)_
- `snug` (1.3) - _Best for component headers (`text-heading`, `text-subheading`)_
- `normal` (1.5) - _Standard body reading (`text-readable`)_
- `relaxed` (1.625)
- `loose` (2) - _Best for fine print or short captions (`text-caption`)_

### Font Sizes

Use the following semantic classes to size your text:
- **Display (`text-display`)**: `34px` (Massive Hero text, H1)
- **Heading (`text-heading`)**: `24px` (Section titles, Modal headers, H2)
- **Subheading (`text-subheading`)**: `20px` (Card titles, minor headers, H3)
- **Body (`text-body`)**: `16px` (Standard readable text, Parapgraphs)
- **Button (`text-button`)**: `16px` (Default text size inside buttons)
- **Caption (`text-caption`)**: `12px` (Supporting metadata, hints under inputs)
- **Label (`text-label`)**: `11px` (Smallest tags, micro info)

---

## 2. Color System & Theming

Our app uses a sleek, Elite aesthetic with distinct **Light** and **Dark** modes based on a unified slate and neutral palette. Avoid basic red/blue; favor curated dynamic colors instead.

### Base App Backgrounds (Light mode default)
- **App Background `bg-app`**: `#F9FAFB` (Very subtle off-white for modern feel)
- **Surface Level `bg-surface`**: `#F9FAFB` 
- **Card Background `bg-card`**: `rgba(249, 250, 251, 0.85)` (Slightly opaque for floating feeling)

### Deep / Dark Mode Overrides
- **App Background `bg-app`**: `#030712` (Elite slate black)
- **Surface Level `bg-surface`**: `#030712`
- **Card Background `bg-card`**: `rgba(15, 23, 42, 0.6)`
- **Glass Panel / Blur Box (`bg-glass`)**: `rgba(15, 23, 42, 0.8)` 

### Typography Colors
- **Text Primary `text-primary`**: `#0F172A` (Light) / `#F9FAFB` (Dark mode text)
- **Text Secondary `text-secondary`**: `#64748B` (Light) / `#cbd5e1` (Dark mode muted)

### Brand Accent Colors
- **Brand Primary `brand-primary`**: `#2563EB` (vibrant blue default, toggles to `#FFFFFF` in dark mode)
- **Brand Blue `brand-blue`**: `#3B82F6` 
- **Success (Green)**: `#10B981` (Toggles slightly brighter to `#34D399` in dark mode)
- **Warning (Yellow/Orange)**: `#F59E0B` (Toggles to `#FBBF24` in dark mode)
- **Error (Red)**: `#EF4444` (Toggles to `#F87171` in dark mode)

---

## 3. Spacing, Shapes, and Elevation

### Border Radii
- **Default Buttons/Inputs `rounded-lg` / `rounded-xl`**: `1.5rem` is considered premium for larger cards (`radius-xl`), and `2rem` for very large sections (`radius-2xl`).

### Layout & Safe Areas
Always respect the top and bottom safe-area insets, particularly for full-screen Telegram Mini Apps:
- `header-height`: `52px`
- `bottom-nav-height`: `80px`
- **Telegram Header Area Space**: `74px`

### Shadows & Elevation (Depth)
Do not use harsh flat black shadows. Instead, utilize one of our premium float variants:
- `shadow-premium-sm`: Clean light drop for micro elements.
- `shadow-premium`: Layered soft blur.
- `shadow-premium-lg`: 0 20px 40px -10px drop; designed for major modal windows.
- `shadow-premium-xl`: Large ethereal blue-tinted float (`rgba(0, 102, 255, 0.15)`).
- `shadow-float`: 0 20px 40px -10px (`0.08` opacity); ideal for dynamic floating cards.

---

## 4. Components Rules (Buttons, Cards, Inputs)

### Buttons
Buttons should be padded correctly and have defined touch states (scaling down to 0.95 and dimming opacity).

- **Standard Base Button (`btn-base`)**: 
  - Height: `3.5rem` (`56px`)
  - Padding: `1.5rem` horizontal
  - Font Size: `1.125rem` (`18px`) and **Bold** (`700`)
  - Border Radius: `0.5rem` (`8px` internally or inherited)
  - Colors: `#1C1C1E` (Black in light mode, text white). Inverts to White with black text in Dark mode.
  - Box Shadow: Heavy bottom shadow.
- **Compact Button (`btn-compact`)**:
  - Height: `2.5rem` (`40px`)
  - Font Size: `0.875rem` (`14px`) and **SemiBold** (`600`)
  - Border radius: `1rem` (`16px`) fully rounded capsule.

### Premium Panels and Cards
Instead of boring `<div class="bg-white border">`, use our dynamic class systems:
- **`glass-panel`**: Standard blurred panel (`backdrop-blur(24px)`) bordered with subtle glass.
- **`glass-panel-premium`**: Aggressive beautiful blur (`backdrop-blur-xl`) with high transparency white/dark overlays.
- **`vibing-premium-panel`**: White card overlapping floating fuchsia and indigo gradient underlays with layered box shadows.
- **`pro-card-extreme`**: The apex level panel. Contains deep transparent internal glow via `::before` pseudo elements.

---

## 5. Premium Micro-Interactions (The "WOW" factor)

Always aim for a dynamic user experience using our custom `@keyframes` instead of static states!

- **Gradients**
  - `acid-yellow-gradient` / `emerald-liquid-gradient` / `acid-blue-gradient`
  - `liquid-blue-premium`: Smooth undulating blue gradient effect.
  - **Animated text (`vibing-crystal-text`, `vibing-yellow-text`, ইত্যাদি)**: Imbues text with a shifting 200% gradient background layer on a 4-6 second loop.

- **Progress Bars**
  - **`progress-bar-liquid`**: Simulates a high-gloss 3D liquid filling up using multiple keyframes and `::after` gloss layers.

- **Badges and Highlighting**
  - **`xp-acid-badge`**: Fast 4s vibing green/yellow pulse, excellent for "Viral" gamification elements.
  - **`neon-text`**: Blue to purple text coloring.
  - **`scanning-glow`**: Overlays a vertical sliding laser line on elements (great for "processing" or tech UIs).

- **Core Animations (Utility Classes)**
  - `animate-spring`: `spring-up` 0.6s (Bouncy fade-in ideal for modals or loading state complete).
  - `animate-float`: 6s ease-in-out Y-axis hovering loop.
  - `animate-shimmer`: Fast left-to-right white skeleton load state.
  - `animate-premium-pulse`: 3s very subtle scale (0.995 to 1) and shadow glow change (green/blue variants).

---

## Golden Checklist for New Pages

1. **Hierarchy First**: Start out your parent layout with `<div class="text-brand-text bg-app min-h-screen">`
2. **Never hardcode hex values**: Always refer to the tailwind generated variables (`text-primary`, `bg-glass`, `text-heading`). 
3. **Use Base Semantic Sizes**: `text-display`, `text-heading`, `text-body`. Never hardcode `text-[15px]`. 
4. **Make it Move**: If an element is supposed to impress the user, add `glass-panel-premium` or `holographic-card` instead of a plain solid background wrapper. 
5. **Always test Dark Mode (`.dark`)**: Verify color inversion rules (`bg-white` vs `bg-slate-900` equivalent mapping from Token list). 
6. **No Visible Scrollbars**: We globally set `.custom-scrollbar` and `hide-scrollbar`. Don't break this design tenet out of the box unless intentionally building a carousel.
