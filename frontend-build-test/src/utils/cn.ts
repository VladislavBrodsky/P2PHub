// Simple utility for class merging without external dependencies
// This replaces clsx + tailwind-merge to avoid installation issues
export function cn(...inputs: (string | undefined | null | false)[]) {
    return inputs.filter(Boolean).join(" ");
}
