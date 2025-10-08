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
            { name: 'biden-skill', file: 'biden-skill-issue.mp3', displayName: 'Biden Skill Issue' },
            { name: 'brr-patapim', file: 'brr-brr-patapim.mp3', displayName: 'Brr Brr Patapim' },
            { name: 'christmas', file: 'christmas.mp3', displayName: 'Christmas' },
            { name: 'clashsetup', file: 'clashsetup.mp3', displayName: 'Clash Setup' },
            { name: 'fairy-dust', file: 'fairy-dust-sound-effect.mp3', displayName: 'Fairy Dust' },
            { name: 'german-spongebob', file: 'german-spongebob.mp3', displayName: 'German SpongeBob' },
            { name: 'hogrider', file: 'hogrider.mp3', displayName: 'Hog Rider' },
            { name: 'fart-poopy', file: 'i-farted-and-a-poopy-almost-slipped-out.mp3', displayName: 'Fart Poopy' },
            { name: 'ian-3', file: 'ian-3.mp3', displayName: 'Ian 3' },
            { name: 'iphone', file: 'iphone.mp3', displayName: 'iPhone' },
            { name: 'italian-brainrot', file: 'italian-brainrot-ringtone.mp3', displayName: 'Italian Brainrot' },
            { name: 'kids-yay', file: 'kids-saying-yay-sound-effect_3.mp3', displayName: 'Kids Yay' },
            { name: 'meow', file: 'm-e-o-w.mp3', displayName: 'Meow' },
            { name: 'mlb', file: 'mlb.swf.mp3', displayName: 'MLB' },
            { name: 'music', file: 'music.mp3', displayName: 'Music' },
            { name: 'omniman', file: 'omniman.mp3', displayName: 'Omni Man' },
            { name: 'pokeball', file: 'pokeball_sound_effects_mp3cut_1.mp3', displayName: 'Pokeball' },
            { name: 'polish', file: 'polish.mp3', displayName: 'Polish' },
            { name: 'potrzebujemy', file: 'potrzebujemyciewnaszymskadzie_bybakster.mp3', displayName: 'Potrzebujemy' },
            { name: 'rizz', file: 'rizz-sound-effect.mp3', displayName: 'Rizz' },
            { name: 'spongebob-fail', file: 'spongebob-fail.mp3', displayName: 'SpongeBob Fail' },
            { name: 'tuco-get-out', file: 'tuco-get-out.mp3', displayName: 'Tuco Get Out' },
            { name: 'uwu', file: 'uwu.mp3', displayName: 'UwU' },
            { name: 'voice-sans', file: 'voice_sans.mp3', displayName: 'Voice Sans' },
            { name: 'whopper-ad', file: 'whopper-ad.mp3', displayName: 'Whopper Ad' },
            { name: 'smallest-violin', file: 'worlds-smallest-violin.mp3', displayName: 'Smallest Violin' }
        ];
        
        // Audio objects storage
        this.audioObjects = {};
        this.currentlyPlaying = new Set();
        this.masterVolume = 0.5;
        
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
        this.updateVolumeDisplay();
    }
    
    preloadSounds() {
        // Preload all audio files
        this.sounds.forEach(sound => {
            const audio = new Audio();
            audio.src = `../sounds-soundboard/${sound.file}`;
            audio.preload = 'metadata';
            audio.volume = this.masterVolume;
            
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
        // Volume control
        this.volumeSlider.addEventListener('input', (e) => {
            this.masterVolume = e.target.value / 100;
            this.updateVolumeDisplay();
            this.updateAllVolumes();
        });
        
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