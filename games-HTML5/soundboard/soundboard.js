class SoundboardApp {
    constructor() {
        // List of sound files (all sounds from sounds-soundboard directory)
        this.sounds = [
            { name: '5x30', file: '5x30.mp3', displayName: '5x30' },
            { name: '67', file: '67.mp3', displayName: 'Sixty Seven' },
            { name: 'allah-hu-akbar', file: 'allah-hu-akbar_4xWvL6y.mp3', displayName: 'Allah Hu Akbar' },
            { name: 'american-anthem', file: 'american-anthem-gun-and-eagle.mp3', displayName: 'American Anthem' },
            { name: 'among-us-role', file: 'among-us-role-reveal-sound.mp3', displayName: 'Among Us Role' },
            { name: 'angels-bonus', file: 'angels-bonus-technique.mp3', displayName: 'Angels Bonus' },
            { name: 'arab-song', file: 'arab-song-meme.mp3', displayName: 'Arab Song' },
            { name: 'batman', file: 'batman.mp3', displayName: 'Batman' },
            { name: 'biden-skill', file: 'biden-skill-issue.mp3', displayName: 'Biden Skill Issue' },
            { name: 'brr-patapim', file: 'brr-brr-patapim.mp3', displayName: 'Brr Brr Patapim' },
            { name: 'burn-witch', file: 'burn-the-witch-pt-2.mp3', displayName: 'Burn The Witch' },
            { name: 'chorax', file: 'chorax-estourado.mp3', displayName: 'Chorax' },
            { name: 'christmas', file: 'christmas.mp3', displayName: 'Christmas' },
            { name: 'clashsetup', file: 'clashsetup.mp3', displayName: 'Clash Setup' },
            { name: 'diarrea', file: 'diarrea.mp3', displayName: 'Diarrea' },
            { name: 'elevator', file: 'elevator-waiting.mp3', displayName: 'Elevator' },
            { name: 'fairy-dust', file: 'fairy-dust-sound-effect.mp3', displayName: 'Fairy Dust' },
            { name: 'forklift', file: 'forklift-certified.mp3', displayName: 'Forklift Certified' },
            { name: 'garama-madung', file: 'garama-and-madung-kid.mp3', displayName: 'Garama Madung' },
            { name: 'goofy-mickey', file: 'goofy-mickey-mouse-laugh.mp3', displayName: 'Goofy Mickey Laugh' },
            { name: 'german-spongebob', file: 'german-spongebob.mp3', displayName: 'German SpongeBob' },
            { name: 'pedro-song', file: 'pedro-song.mp3', displayName: 'Pedro Song' },
            { name: 'hogrider', file: 'hogrider.mp3', displayName: 'Hog Rider' },
            { name: 'hornet-calling', file: 'hornet-calling-yarnaby-3.mp3', displayName: 'Hornet Calling' },
            { name: 'hornet-chaw', file: 'hornet-chaw.mp3', displayName: 'Hornet Chaw' },
            { name: 'heavenly-ahh', file: 'heavenly-ahh.mp3', displayName: 'Heavenly Ahh' },
            { name: 'indian-scammer', file: 'indian-scammer-123.mp3', displayName: 'Indian Scammer' },
            { name: 'fart-poopy', file: 'i-farted-and-a-poopy-almost-slipped-out.mp3', displayName: 'Fart Poopy' },
            { name: 'i-know-u-belong', file: 'i-know-u-belong.mp3', displayName: 'I Know You Belong' },
            { name: 'ian-3', file: 'ian-3.mp3', displayName: 'Ian 3' },
            { name: 'not-egg', file: 'im-not-an-egg.mp3', displayName: 'Not An Egg' },
            { name: 'im-old', file: 'im-old.mp3', displayName: 'Im Old' },
            { name: 'tired-grandpa', file: 'im-tired-of-this-grandpa-holes.mp3', displayName: 'Tired Grandpa' },
            { name: 'iphone', file: 'iphone.mp3', displayName: 'iPhone' },
            { name: 'italian-brainrot', file: 'italian-brainrot-ringtone.mp3', displayName: 'Italian Brainrot' },
            { name: 'jsab-boss', file: 'jsab-boss1.mp3', displayName: 'JSAB Boss' },
            { name: 'kaykay', file: 'kaykay.mp3', displayName: 'KayKay' },
            { name: 'katze-effekt', file: 'katze-effekt.mp3', displayName: 'Katze Effekt' },
            { name: 'oh-no-ai-voice', file: 'oh-no-ai-voice-brainrot.mp3', displayName: 'Oh No AI Voice' },
            { name: 'smrt-circle', file: 'smrt-circle-line-mind-the-platform-gap.mp3', displayName: 'Mind The Platform Gap' },
            { name: 'saja-boys', file: 'saja-boys-soda-pop-bass-boosted.mp3', displayName: 'Saja Boys Soda Pop' },
            { name: 'kids-yay', file: 'kids-saying-yay-sound-effect_3.mp3', displayName: 'Kids Yay' },
            { name: 'meow', file: 'm-e-o-w.mp3', displayName: 'Meow' },
            { name: 'marcell-davis', file: 'marcell-davis.mp3', displayName: 'Marcell Davis' },
            { name: 'mario-spring', file: 'mario-galaxy-spring-jump-1.mp3', displayName: 'Mario Spring' },
            { name: 'marios', file: 'marios.mp3', displayName: 'Marios' },
            { name: 'mlb', file: 'mlb.swf.mp3', displayName: 'MLB' },
            { name: 'music', file: 'music.mp3', displayName: 'Music' },
            { name: 'elevator-music', file: 'musica-elevador-short_CNEma6b.mp3', displayName: 'Elevator Music' },
            { name: 'omniman', file: 'omniman.mp3', displayName: 'Omni Man' },
            { name: 'papaleta', file: 'papaleta-ezequieltejera.mp3', displayName: 'Papaleta' },
            { name: 'peter-quagmire', file: 'peter-oh-hey-quagmire.mp3', displayName: 'Peter Quagmire' },
            { name: 'po-pi-po', file: 'po-pi-po.mp3', displayName: 'Po Pi Po' },
            { name: 'pokeball', file: 'pokeball_sound_effects_mp3cut_1.mp3', displayName: 'Pokeball' },
            { name: 'polish', file: 'polish.mp3', displayName: 'Polish' },
            { name: 'potrzebujemy', file: 'potrzebujemyciewnaszymskadzie_bybakster.mp3', displayName: 'Potrzebujemy' },
            { name: 'record-online', file: 'record-online-voice-recorder_IhMRzYN.mp3', displayName: 'Recorded Voice' },
            { name: 'rizz', file: 'rizz-sound-effect.mp3', displayName: 'Rizz' },
            { name: 'rucka-osama', file: 'rucka-rucka-ali-im-osama-2.mp3', displayName: 'Rucka Osama' },
            { name: 'sandstorm-grave', file: 'sandstorm-in-da-grave.mp3', displayName: 'Sandstorm Grave' },
            { name: 'shut-up-tiktok', file: 'shut-up-tiktok-ai-video.mp3', displayName: 'Shut Up TikTok' },
            { name: 'space-jumpscare', file: 'space-shuttle-jumpscare-sound.mp3', displayName: 'Space Jumpscare' },
            { name: 'spas12-pump', file: 'spas12-pump.mp3', displayName: 'SPAS12 Pump' },
            { name: 'spongebob-fail', file: 'spongebob-fail.mp3', displayName: 'SpongeBob Fail' },
            { name: 'tuco-get-out', file: 'tuco-get-out.mp3', displayName: 'Tuco Get Out' },
            { name: 'uwu', file: 'uwu.mp3', displayName: 'UwU' },
            { name: 'voice-sans', file: 'voice_sans.mp3', displayName: 'Voice Sans' },
            { name: 'wario-time', file: 'wario-time.mp3', displayName: 'Wario Time' },
            { name: 'whopper-ad', file: 'whopper-ad.mp3', displayName: 'Whopper Ad' },
            { name: 'winnie-pooh', file: 'winnie-the-f-ing-pooh.mp3', displayName: 'Winnie The Pooh (NSFW)' },
            { name: 'smallest-violin', file: 'worlds-smallest-violin.mp3', displayName: 'Smallest Violin' },
            { name: 'wizard-harry', file: 'your-a-wizard-harry-loud.mp3', displayName: 'Wizard Harry' }
        ];
        
        // Audio objects storage
        this.audioObjects = {};
        this.currentlyPlaying = new Set();
        this.masterVolume = 1.0;
        
        // DOM elements
        this.soundGrid = document.getElementById('soundGrid');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.volumeValue = document.getElementById('volumeValue');
        this.stopAllBtn = document.getElementById('stopAllBtn');
        this.soundStatus = document.getElementById('soundStatus');
        
        this.init();
    }
    
    init() {
        this.preloadSounds();
        this.createSoundButtons();
        this.setupEventListeners();
    }
    
    preloadSounds() {
        // Preload all audio files with aggressive browser caching
        this.sounds.forEach(sound => {
            const audio = new Audio();
            
            // Add cache-busting prevention and force browser caching
            const audioUrl = `../sounds-soundboard/${sound.file}`;
            audio.src = audioUrl;
            
            // Set preload to 'auto' to fully load the audio file into browser cache
            audio.preload = 'auto';
            audio.volume = this.masterVolume;
            
            // Force loading by setting crossOrigin (helps with caching)
            audio.crossOrigin = 'anonymous';
            
            // Add cache headers hint via loading attribute
            audio.loading = 'eager';
            
            // Handle audio events
            audio.addEventListener('ended', () => {
                this.onSoundEnded(sound.name);
            });
            
            audio.addEventListener('error', (e) => {
                console.warn(`Failed to load sound: ${sound.file}`, e);
                this.updateStatus(`Failed to load: ${sound.displayName}`);
            });
            
            audio.addEventListener('loadstart', () => {
                console.log(`Loading: ${sound.file}`);
            });
            
            // Cache the audio data by triggering a load
            audio.addEventListener('canplaythrough', () => {
                console.log(`Cached: ${sound.file}`);
            });
            
            // Force the browser to start loading immediately
            audio.load();
            
            this.audioObjects[sound.name] = audio;
        });
    }
    
    createSoundButtons() {
        this.soundGrid.innerHTML = '';
        
        this.sounds.forEach(sound => {
            const button = document.createElement('button');
            button.className = 'sound-button';
            button.id = `btn-${sound.name}`;
            button.textContent = sound.displayName;
            button.title = `Play ${sound.displayName}`;
            
            button.addEventListener('click', () => {
                this.playSound(sound.name);
            });
            
            this.soundGrid.appendChild(button);
        });
    }
    
    setupEventListeners() {
        // Stop all sounds button
        this.stopAllBtn.addEventListener('click', () => {
            this.stopAllSounds();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.stopAllSounds();
            } else if (e.code === 'Escape') {
                this.stopAllSounds();
            }
        });
    }
    
    playSound(soundName) {
        const audio = this.audioObjects[soundName];
        const button = document.getElementById(`btn-${soundName}`);
        
        if (!audio) {
            this.updateStatus(`Sound not found: ${soundName}`);
            return;
        }
        
        try {
            // Reset audio to beginning
            audio.currentTime = 0;
            
            // Play the audio
            const playPromise = audio.play();
            
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    // Audio started playing successfully
                    this.currentlyPlaying.add(soundName);
                    button.classList.add('playing');
                    
                    const sound = this.sounds.find(s => s.name === soundName);
                    this.updateStatus(`Playing: ${sound.displayName}`);
                }).catch((error) => {
                    console.error('Error playing sound:', error);
                    this.updateStatus(`Error playing: ${soundName}`);
                });
            }
        } catch (error) {
            console.error('Error playing sound:', error);
            this.updateStatus(`Error playing: ${soundName}`);
        }
    }
    
    onSoundEnded(soundName) {
        this.currentlyPlaying.delete(soundName);
        const button = document.getElementById(`btn-${soundName}`);
        if (button) {
            button.classList.remove('playing');
        }
        
        if (this.currentlyPlaying.size === 0) {
            this.updateStatus('Ready to play sounds!');
        }
    }
    
    stopAllSounds() {
        Object.values(this.audioObjects).forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
        
        // Clear playing status
        this.currentlyPlaying.clear();
        
        // Remove playing class from all buttons
        document.querySelectorAll('.sound-button.playing').forEach(button => {
            button.classList.remove('playing');
        });
        
        this.updateStatus('All sounds stopped');
        
        // Reset status after a short delay
        setTimeout(() => {
            if (this.currentlyPlaying.size === 0) {
                this.updateStatus('Ready to play sounds!');
            }
        }, 2000);
    }
    
    updateAllVolumes() {
        Object.values(this.audioObjects).forEach(audio => {
            audio.volume = this.masterVolume;
        });
    }
    
    updateVolumeDisplay() {
        const percentage = Math.round(this.masterVolume * 100);
        this.volumeValue.textContent = `${percentage}%`;
    }
    
    updateStatus(message) {
        this.soundStatus.textContent = message;
    }
    
    // Utility method to get sound info
    getSoundInfo() {
        return {
            totalSounds: this.sounds.length,
            currentlyPlaying: this.currentlyPlaying.size,
            volume: this.masterVolume
        };
    }
}

// Initialize the soundboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.soundboard = new SoundboardApp();
    
    // Listen for global mute changes (BroadcastChannel and storage fallback)
    const bc = (typeof BroadcastChannel !== 'undefined') ? new BroadcastChannel('javasnake-global') : null;
    const applyGlobalMute = (muted) => {
        try {
            if (muted) {
                // store previous volume
                if (!window.soundboard._previousMasterVolume) window.soundboard._previousMasterVolume = window.soundboard.masterVolume;
                window.soundboard.masterVolume = 0;
            } else {
                window.soundboard.masterVolume = window.soundboard._previousMasterVolume || 0.5;
            }
            window.soundboard.updateAllVolumes();
            window.soundboard.updateVolumeDisplay();
        } catch (e) { console.warn('applyGlobalMute error', e); }
    };

    if (bc) {
        bc.addEventListener('message', (ev) => {
            if (ev.data && ev.data.type === 'MUTE_CHANGED') {
                applyGlobalMute(!!ev.data.muted);
            }
        });
    }

    window.addEventListener('storage', (e) => {
        if (e.key === 'site_mute') {
            applyGlobalMute(e.newValue === '1');
        }
    });

    // Initialize from localStorage state
    applyGlobalMute(localStorage.getItem('site_mute') === '1');
    
    // Add some fun keyboard shortcuts for specific sounds
    document.addEventListener('keydown', (e) => {
        if (e.altKey) {
            switch (e.code) {
                case 'Digit1':
                    e.preventDefault();
                    window.soundboard.playSound('hogrider');
                    break;
                case 'Digit2':
                    e.preventDefault();
                    window.soundboard.playSound('omniman');
                    break;
                case 'Digit3':
                    e.preventDefault();
                    window.soundboard.playSound('uwu');
                    break;
                case 'KeyM':
                    e.preventDefault();
                    window.soundboard.playSound('music');
                    break;
                case 'KeyC':
                    e.preventDefault();
                    window.soundboard.playSound('christmas');
                    break;
            }
        }
    });
    
    // Add visual feedback for button interactions
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('sound-button')) {
            // Create ripple effect
            const button = e.target;
            const ripple = document.createElement('span');
            const rect = button.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.6);
                transform: scale(0);
                animation: ripple 0.6s linear;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                pointer-events: none;
            `;
            
            // Add ripple animation if not already defined
            if (!document.querySelector('#ripple-style')) {
                const style = document.createElement('style');
                style.id = 'ripple-style';
                style.textContent = `
                    @keyframes ripple {
                        to {
                            transform: scale(4);
                            opacity: 0;
                        }
                    }
                `;
                document.head.appendChild(style);
            }
            
            button.style.position = 'relative';
            button.style.overflow = 'hidden';
            button.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        }
    });
});