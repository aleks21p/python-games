/**
 * Universal Touch Controls Helper
 * Adds basic touch support to games that use keyboard controls
 * 
 * Usage: Include this script and call initTouchControls(canvas, options)
 */

(function(global) {
    'use strict';
    
    /**
     * Initialize touch controls on a canvas
     * @param {HTMLCanvasElement} canvas - The game canvas
     * @param {Object} options - Configuration options
     * @param {boolean} options.swipe - Enable swipe gestures (default: true)
     * @param {boolean} options.tap - Enable tap for action (default: true)
     * @param {boolean} options.pinch - Enable pinch to zoom (default: false)
     * @param {Function} options.onTap - Callback for tap events
     * @param {Function} options.onSwipe - Callback for swipe events (receives direction: 'up', 'down', 'left', 'right')
     * @param {Function} options.onPinch - Callback for pinch events (receives scale)
     */
    global.initTouchControls = function(canvas, options = {}) {
        if (!canvas) {
            console.warn('[Touch Controls] No canvas provided');
            return;
        }
        
        const config = {
            swipe: options.swipe !== false,
            tap: options.tap !== false,
            pinch: options.pinch === true,
            swipeThreshold: options.swipeThreshold || 50,
            tapThreshold: options.tapThreshold || 200,
            onTap: options.onTap || null,
            onSwipe: options.onSwipe || null,
            onPinch: options.onPinch || null
        };
        
        let touchStartX = 0;
        let touchStartY = 0;
        let touchStartTime = 0;
        let initialDistance = 0;
        
        // Prevent default touch behaviors on canvas
        canvas.style.touchAction = 'none';
        
        // Touch start
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            touchStartTime = Date.now();
            
            // Handle pinch gestures
            if (config.pinch && e.touches.length === 2) {
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                initialDistance = Math.hypot(
                    touch2.clientX - touch1.clientX,
                    touch2.clientY - touch1.clientY
                );
            }
        }, { passive: false });
        
        // Touch move (for pinch)
        canvas.addEventListener('touchmove', (e) => {
            if (config.pinch && e.touches.length === 2) {
                e.preventDefault();
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                const currentDistance = Math.hypot(
                    touch2.clientX - touch1.clientX,
                    touch2.clientY - touch1.clientY
                );
                
                if (initialDistance > 0) {
                    const scale = currentDistance / initialDistance;
                    if (config.onPinch) {
                        config.onPinch(scale);
                    }
                }
            }
        }, { passive: false });
        
        // Touch end
        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            
            if (e.changedTouches.length === 0) return;
            
            const touch = e.changedTouches[0];
            const touchEndX = touch.clientX;
            const touchEndY = touch.clientY;
            const touchEndTime = Date.now();
            
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            const deltaTime = touchEndTime - touchStartTime;
            const distance = Math.hypot(deltaX, deltaY);
            
            // Detect tap
            if (config.tap && distance < 20 && deltaTime < config.tapThreshold) {
                if (config.onTap) {
                    config.onTap({ x: touchEndX, y: touchEndY });
                }
                // Simulate spacebar or click for games expecting it
                simulateKeyPress(' ');
                return;
            }
            
            // Detect swipe
            if (config.swipe && distance > config.swipeThreshold) {
                const direction = getSwipeDirection(deltaX, deltaY);
                if (config.onSwipe) {
                    config.onSwipe(direction);
                }
                // Simulate arrow keys
                simulateArrowKey(direction);
            }
        }, { passive: false });
        
        console.log('[Touch Controls] Initialized on canvas');
    };
    
    /**
     * Get swipe direction from deltas
     */
    function getSwipeDirection(deltaX, deltaY) {
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);
        
        if (absDeltaX > absDeltaY) {
            return deltaX > 0 ? 'right' : 'left';
        } else {
            return deltaY > 0 ? 'down' : 'up';
        }
    }
    
    /**
     * Simulate arrow key press
     */
    function simulateArrowKey(direction) {
        const keyMap = {
            'up': 'ArrowUp',
            'down': 'ArrowDown',
            'left': 'ArrowLeft',
            'right': 'ArrowRight'
        };
        
        const key = keyMap[direction];
        if (key) {
            simulateKeyPress(key);
        }
    }
    
    /**
     * Simulate keyboard event
     */
    function simulateKeyPress(key) {
        const events = ['keydown', 'keyup'];
        events.forEach(eventType => {
            const event = new KeyboardEvent(eventType, {
                key: key,
                code: key === ' ' ? 'Space' : key,
                keyCode: getKeyCode(key),
                which: getKeyCode(key),
                bubbles: true,
                cancelable: true
            });
            document.dispatchEvent(event);
        });
    }
    
    /**
     * Get keyCode for common keys
     */
    function getKeyCode(key) {
        const codes = {
            ' ': 32,
            'ArrowUp': 38,
            'ArrowDown': 40,
            'ArrowLeft': 37,
            'ArrowRight': 39
        };
        return codes[key] || 0;
    }
    
    /**
     * Show touch control hints
     */
    global.showTouchHints = function(messages = []) {
        const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (!isMobile) return;
        
        const defaultMessages = [
            '👆 Tap to jump/shoot',
            '👉 Swipe to move',
            '🤏 Pinch to zoom (if supported)'
        ];
        
        const hints = messages.length > 0 ? messages : defaultMessages;
        
        const hintContainer = document.createElement('div');
        hintContainer.id = 'touch-hints';
        hintContainer.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 20px;
            border-radius: 12px;
            font-size: 0.85rem;
            text-align: center;
            z-index: 9998;
            backdrop-filter: blur(10px);
            animation: fadeInOut 4s ease-in-out;
            pointer-events: none;
        `;
        
        hintContainer.innerHTML = hints.join('<br>');
        
        // Add animation
        if (!document.getElementById('touch-hints-style')) {
            const style = document.createElement('style');
            style.id = 'touch-hints-style';
            style.textContent = `
                @keyframes fadeInOut {
                    0%, 100% { opacity: 0; transform: translateX(-50%) translateY(20px); }
                    10%, 90% { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(hintContainer);
        
        setTimeout(() => {
            hintContainer.remove();
        }, 4000);
    };
    
})(window);
