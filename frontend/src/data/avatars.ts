import avatarData from './avatars.json';

// Static Optimized Asset Paths
// Loaded from JSON to keep the main JS bundle small and avoid EPERM binary issues.
export const AVATAR_DATA: Record<string, string> = avatarData;