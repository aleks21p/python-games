/**
 * JavaSnake Auto-Update Script
 * Handles version checking and service worker registration for all games
 * 
 * Usage: Include this script in any game HTML file
 * <script src="../auto-update.js"></script>
 * 
 * Configuration: Set window.gameConfig before including this script
 * window.gameConfig = {
 *     gameName: 'zombie-shooter',  // Required: unique game identifier
 *     versionKey: 'zombie-shooter' // Optional: key in version.json games object
 * };
 */

(function() {
    'use strict';
    
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const config = window.gameConfig || {};
    const gameName = config.gameName || 'unknown';
    const versionKey = config.versionKey || gameName;
    
    let refreshTimeout;
    
    // Service Worker Registration
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('../sw.js')
                .then((registration) => {
                    console.log(`✅ [${gameName}] Service Worker registered. Offline play enabled!`);
                    
                    // Check for updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                console.log(`🔄 [${gameName}] New service worker available`);
                            }
                        });
                    });
                })
                .catch((error) => {
                    console.warn(`⚠️ [${gameName}] Service Worker registration failed:`, error);
                });
        });
    }
    
    // Version Check Function
    async function checkForUpdates() {
        try {
            // Check if we should skip (checked within last 24 hours)
            const lastCheckKey = `${gameName}-last-check`;
            const lastCheck = localStorage.getItem(lastCheckKey);
            
            if (lastCheck) {
                const timeSinceCheck = Date.now() - parseInt(lastCheck);
                if (timeSinceCheck < ONE_DAY_MS) {
                    console.log(`[${gameName}] Skipping auto-update check (last checked ${Math.round(timeSinceCheck / 1000 / 60)} minutes ago)`);
                    return;
                }
            }
            
            const response = await fetch('../version.json', {
                cache: 'no-cache',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            
            if (response.ok) {
                const versionData = await response.json();
                const serverVersion = (versionData.games && versionData.games[versionKey]) || versionData.version;
                const versionStorageKey = `${gameName}-version`;
                const currentVersion = localStorage.getItem(versionStorageKey) || '1.0.0';
                
                // Update last check timestamp
                localStorage.setItem(lastCheckKey, Date.now().toString());
                
                if (serverVersion !== currentVersion) {
                    console.log(`[${gameName}] Version mismatch:`, currentVersion, '->', serverVersion);
                    localStorage.setItem(versionStorageKey, serverVersion);
                    
                    showUpdateNotification('New version available! Updating automatically...');
                    
                    // Auto-refresh after 3 seconds
                    refreshTimeout = setTimeout(() => {
                        window.location.reload(true);
                    }, 3000);
                }
            }
        } catch (error) {
            console.error(`[${gameName}] Version check failed:`, error);
        }
    }
    
    // Show Update Notification
    function showUpdateNotification(message) {
        if (refreshTimeout) {
            clearTimeout(refreshTimeout);
        }
        
        const notificationId = `${gameName}-update-notification`;
        let notification = document.getElementById(notificationId);
        
        if (!notification) {
            notification = document.createElement('div');
            notification.id = notificationId;
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(45deg, #e74c3c, #c0392b);
                color: white;
                padding: 15px 25px;
                border-radius: 25px;
                font-weight: bold;
                font-size: 1rem;
                box-shadow: 0 6px 20px rgba(231, 76, 60, 0.4);
                z-index: 100000;
                text-align: center;
                max-width: 90vw;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                animation: slideDownFade 0.5s ease-out;
                cursor: pointer;
            `;
            
            // Add animation styles if not already present
            const styleId = 'auto-update-styles';
            if (!document.getElementById(styleId)) {
                const style = document.createElement('style');
                style.id = styleId;
                style.textContent = `
                    @keyframes slideDownFade {
                        from { 
                            transform: translateX(-50%) translateY(-100%); 
                            opacity: 0; 
                        }
                        to { 
                            transform: translateX(-50%) translateY(0); 
                            opacity: 1; 
                        }
                    }
                `;
                document.head.appendChild(style);
            }
            
            document.body.appendChild(notification);
        }
        
        notification.textContent = message;
        notification.style.display = 'block';
        notification.title = 'Click to refresh now';
        
        // Click to refresh immediately
        notification.onclick = () => {
            window.location.reload(true);
        };
    }
    
    // Start version checking after page load
    function startVersionChecking() {
        // Check once after 5 seconds (will be skipped if checked within last 24 hours)
        setTimeout(checkForUpdates, 5000);
    }
    
    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startVersionChecking);
    } else {
        startVersionChecking();
    }
    
    console.log(`[${gameName}] Auto-update script initialized`);
})();
