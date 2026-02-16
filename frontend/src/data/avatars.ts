import avatarData from './avatars.json';

/** 
 * Static Optimized Asset Paths
 * Loaded from JSON to keep the main JS bundle small.
 */
export const AVATAR_DATA: Record<string, string> = avatarData;

/**
 * Global Logo Asset
 * Pointing to the stable SVG in public_safe
 */
export const LOGO_DATA = "/logo.svg";