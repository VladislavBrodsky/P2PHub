// #comment: Custom persistent caching service using native IndexedDB.
// This allows the app to store high-res assets (avatars, icons) permanently in the browser after the first fetch,
// significantly improving perceived load times and responsiveness on subsequent visits by bypassing the network.
const DB_NAME = 'p2phub-cache-db';
const STORE_NAME = 'image-cache';
const CACHE_VERSION = 1;

export class ImageCacheService {
    private static db: IDBDatabase | null = null;

    private static init(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            if (this.db) {
                resolve(this.db);
                return;
            }

            const request = indexedDB.open(DB_NAME, CACHE_VERSION);

            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onerror = () => reject(request.error);
        });
    }

    static async get(url: string): Promise<string | null> {
        try {
            const db = await this.init();
            return new Promise((resolve) => {
                const transaction = db.transaction(STORE_NAME, 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.get(url);

                request.onsuccess = () => {
                    const blob = request.result;
                    if (blob instanceof Blob) {
                        resolve(URL.createObjectURL(blob));
                    } else {
                        resolve(null);
                    }
                };

                request.onerror = () => {
                    console.warn('[Cache] Get failed:', request.error);
                    resolve(null);
                };
            });
        } catch (e) {
            console.warn('[Cache] Access failed:', e);
            return null;
        }
    }

    static async set(url: string, blob: Blob): Promise<void> {
        try {
            const db = await this.init();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(STORE_NAME, 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.put(blob, url);

                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (e) {
            console.warn('[Cache] Set failed:', e);
        }
    }

    static async fetchAndCache(url: string): Promise<string> {
        // 1. Check Cache
        const cached = await this.get(url);
        if (cached) return cached;

        // 2. Fetch from Network
        try {
            const response = await fetch(url, { mode: 'cors' });
            if (!response.ok) throw new Error('Network response not ok');
            const blob = await response.blob();

            // 3. Store in Cache
            await this.set(url, blob);

            return URL.createObjectURL(blob);
        } catch (e) {
            console.warn(`[Cache] Fetch failed for ${url}:`, e);
            return url;
        }
    }
}
