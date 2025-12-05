// Service Worker for Soundboard Audio Caching with Auto-Update
// This caches all audio files aggressively and checks for version updates

const CACHE_NAME = 'soundboard-audio-cache-v1.0.0';
const VERSION_URL = '../version.json';
const UPDATE_CHECK_INTERVAL = 30000; // Check for updates every 30 seconds

// Install event - cache all audio files
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    
    // List of audio files to cache (matches the soundboard.js list)
    const audioFiles = [
        'vibe check.mp3',
        '67.mp3',
        'allah-hu-akbar_4xWvL6y.mp3',
        'american-anthem-gun-and-eagle.mp3',
        'among-us-role-reveal-sound.mp3',
        'angels-bonus-technique.mp3',
        'arab-song-meme.mp3',
        'batman.mp3',
        'biden-skill-issue.mp3',
        'brr-brr-patapim.mp3',
        'burn-the-witch-pt-2.mp3',
        'chorax-estourado.mp3',
        'christmas.mp3',
        'clashsetup.mp3',
        'diarrea.mp3',
        'elevator-waiting.mp3',
        'fairy-dust-sound-effect.mp3',
        'forklift-certified.mp3',
        'garama-and-madung-kid.mp3',
        'goofy-mickey-mouse-laugh.mp3',
        'german-spongebob.mp3',
        'pedro-song.mp3',
        'hogrider.mp3',
        'hornet-calling-yarnaby-3.mp3',
        'hornet-chaw.mp3',
        'heavenly-ahh.mp3',
        'indian-scammer-123.mp3',
        'i-farted-and-a-poopy-almost-slipped-out.mp3',
        'i-know-u-belong.mp3',
        'ian-3.mp3',
        'im-not-an-egg.mp3',
        'im-old.mp3',
        'im-tired-of-this-grandpa-holes.mp3',
        'iphone.mp3',
        'italian-brainrot-ringtone.mp3',
        'jsab-boss1.mp3',
        'kaykay.mp3',
        'katze-effekt.mp3',
        'oh-no-ai-voice-brainrot.mp3',
        'smrt-circle-line-mind-the-platform-gap.mp3',
        'saja-boys-soda-pop-bass-boosted.mp3',
        'kids-saying-yay-sound-effect_3.mp3',
        'm-e-o-w.mp3',
        'marcell-davis.mp3',
        'mario-galaxy-spring-jump-1.mp3',
        'marios.mp3',
        'mlb.swf.mp3',
        'music.mp3',
        'musica-elevador-short_CNEma6b.mp3',
        'omniman.mp3',
        'papaleta-ezequieltejera.mp3',
        'peter-oh-hey-quagmire.mp3',
        'po-pi-po.mp3',
        'pokeball_sound_effects_mp3cut_1.mp3',
        'polish.mp3',
        'potrzebujemyciewnaszymskadzie_bybakster.mp3',
        'record-online-voice-recorder_IhMRzYN.mp3',
        'rizz-sound-effect.mp3',
        'rucka-rucka-ali-im-osama-2.mp3',
        'sandstorm-in-da-grave.mp3',
        'shut-up-tiktok-ai-video.mp3',
        'space-shuttle-jumpscare-sound.mp3',
        'spas12-pump.mp3',
        'spongebob-fail.mp3',
        'tuco-get-out.mp3',
        'uwu.mp3',
        'voice_sans.mp3',
        'wario-time.mp3',
        'whopper-ad.mp3',
        'winnie-the-f-ing-pooh.mp3',
        'worlds-smallest-violin.mp3',
        'your-a-wizard-harry-loud.mp3'
    ];
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                
                // Cache the main soundboard files
                const urlsToCache = [
                    './soundboard.html',
                    './soundboard.js',
                    './soundboard.css'
                ];
                
                // Add all audio files with proper paths
                audioFiles.forEach(file => {
                    urlsToCache.push(`../sounds-soundboard/${file}`);
                });
                
                return cache.addAll(urlsToCache);
            })
            .catch((error) => {
                console.error('Cache add failed:', error);
            })
    );
    
    // Skip waiting and activate immediately
    self.skipWaiting();
});

// Fetch event - serve from cache first, then network
self.addEventListener('fetch', (event) => {
    // Only cache audio files and soundboard resources
    if (event.request.url.includes('.mp3') || 
        event.request.url.includes('soundboard')) {
        
        event.respondWith(
            caches.match(event.request)
                .then((response) => {
                    // Return cached version if available
                    if (response) {
                        console.log('Serving from cache:', event.request.url);
                        return response;
                    }
                    
                    // Otherwise fetch from network and cache it
                    return fetch(event.request)
                        .then((response) => {
                            // Check if we received a valid response
                            if (!response || response.status !== 200 || response.type !== 'basic') {
                                return response;
                            }
                            
                            // Clone the response (streams can only be consumed once)
                            const responseToCache = response.clone();
                            
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    console.log('Caching new file:', event.request.url);
                                    cache.put(event.request, responseToCache);
                                });
                            
                            return response;
                        })
                        .catch((error) => {
                            console.error('Fetch failed:', error);
                            throw error;
                        });
                })
        );
    }
});

// Message event - handle cache updates and version checking
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_CACHE_SIZE') {
        caches.open(CACHE_NAME).then((cache) => {
            cache.keys().then((keys) => {
                event.ports[0].postMessage({
                    type: 'CACHE_SIZE',
                    size: keys.length
                });
            });
        });
    }
    
    if (event.data && event.data.type === 'CHECK_VERSION') {
        checkForUpdates().then((hasUpdate) => {
            event.ports[0].postMessage({
                type: 'VERSION_CHECK_RESULT',
                hasUpdate: hasUpdate
            });
        });
    }
});

// Check for version updates
async function checkForUpdates() {
    try {
        const response = await fetch(VERSION_URL, {
            cache: 'no-cache',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        
        if (!response.ok) {
            console.log('Version check failed:', response.status);
            return false;
        }
        
        const versionData = await response.json();
        const serverVersion = versionData.games.soundboard || versionData.version;
        const currentVersion = CACHE_NAME.split('-v')[1] || '1.0.0';
        
        console.log('Current version:', currentVersion);
        console.log('Server version:', serverVersion);
        
        if (serverVersion !== currentVersion) {
            console.log('New version available:', serverVersion);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Version check error:', error);
        return false;
    }
}

// Automatic version checking
function startVersionChecking() {
    setInterval(async () => {
        const hasUpdate = await checkForUpdates();
        if (hasUpdate) {
            console.log('New version detected, notifying clients...');
            
            // Notify all clients about the update
            const clients = await self.clients.matchAll();
            clients.forEach(client => {
                client.postMessage({
                    type: 'NEW_VERSION_AVAILABLE',
                    message: 'A new version is available. The page will refresh automatically.'
                });
            });
            
            // Clear old caches
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName.startsWith('soundboard-audio-cache-v') && cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }
    }, UPDATE_CHECK_INTERVAL);
}

// Start version checking after activation
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName.startsWith('soundboard-audio-cache-v')) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // Start version checking
            startVersionChecking();
        })
    );
    
    // Take control of all clients immediately
    return self.clients.claim();
});