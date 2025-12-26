// JavaSnake Games Service Worker - Comprehensive Offline Caching
// Caches all game assets for offline play with smart update strategy

const CACHE_VERSION = 'javasnake-v1.0.0';
const CACHE_NAME = `javasnake-cache-${CACHE_VERSION}`;

// Core files to cache immediately
const CORE_ASSETS = [
    '/',
    '/index.html',
    '/version.json',
    '/robots.txt',
    '/site.webmanifest'
];

// Game-specific assets to cache on first visit
const GAME_PATTERNS = [
    /\/arrow-runner\//,
    /\/dino-jump\//,
    /\/pingball\//,
    /\/soundboard\//,
    /\/street-fighter\//,
    /\/tetris\//,
    /\/tic-tac-toe\//,
    /\/wordle-unlimited\//,
    /\/zombie-shooter\//
];

// File extensions to cache
const CACHEABLE_EXTENSIONS = ['.html', '.js', '.css', '.json', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.mp3', '.wav', '.ogg', '.woff', '.woff2', '.ttf'];

// Install event - cache core assets
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching core assets');
                // Cache core assets, ignore failures for flexibility
                return cache.addAll(CORE_ASSETS.map(url => new Request(url, {cache: 'reload'})))
                    .catch(err => {
                        console.warn('[Service Worker] Some core assets failed to cache:', err);
                        // Continue anyway
                    });
            })
            .then(() => {
                console.log('[Service Worker] Installation complete');
                // Force the waiting service worker to become active
                return self.skipWaiting();
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME && cacheName.startsWith('javasnake-cache-')) {
                            console.log('[Service Worker] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[Service Worker] Activation complete');
                // Take control of all pages immediately
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }
    
    // Skip chrome extensions and non-http(s) requests
    if (!url.protocol.startsWith('http')) {
        return;
    }
    
    // Check if the file should be cached
    const shouldCache = isCacheable(url.pathname);
    
    if (shouldCache) {
        event.respondWith(
            caches.match(event.request)
                .then((cachedResponse) => {
                    if (cachedResponse) {
                        // Return cached version, but also fetch update in background
                        fetchAndCache(event.request);
                        return cachedResponse;
                    }
                    
                    // Not in cache, fetch and cache it
                    return fetchAndCache(event.request);
                })
                .catch((error) => {
                    console.error('[Service Worker] Fetch error:', error);
                    // Return a basic offline page if available
                    return caches.match('/index.html');
                })
        );
    }
});

// Helper: Check if URL should be cached
function isCacheable(pathname) {
    // Check if path matches game patterns
    const isGamePath = GAME_PATTERNS.some(pattern => pattern.test(pathname));
    
    // Check if extension is cacheable
    const hasCacheableExtension = CACHEABLE_EXTENSIONS.some(ext => pathname.endsWith(ext));
    
    // Cache if it's index, a game path, or has cacheable extension
    return pathname === '/' || pathname === '/index.html' || isGamePath || hasCacheableExtension;
}

// Helper: Fetch and cache a request
async function fetchAndCache(request) {
    try {
        const response = await fetch(request);
        
        // Only cache successful responses
        if (response && response.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            // Clone the response because it can only be consumed once
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
        console.error('[Service Worker] Fetch and cache error:', error);
        throw error;
    }
}

// Message handler for manual cache updates
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.delete(CACHE_NAME).then(() => {
                console.log('[Service Worker] Cache cleared');
                self.clients.matchAll().then(clients => {
                    clients.forEach(client => client.postMessage({type: 'CACHE_CLEARED'}));
                });
            })
        );
    }
});

console.log('[Service Worker] Script loaded');
