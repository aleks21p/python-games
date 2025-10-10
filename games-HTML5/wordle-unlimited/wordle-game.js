// Wordle Unlimited - Game Logic
// Made by vokenz - visit YouTube channel!

class WordleGame {
    constructor() {
        // 500 different 5-letter words for unlimited play
        this.wordList = [
            'about', 'above', 'abuse', 'actor', 'acute', 'admit', 'adopt', 'adult', 'after', 'again',
            'agent', 'agree', 'ahead', 'alarm', 'album', 'alert', 'alien', 'align', 'alike', 'alive',
            'allow', 'alone', 'along', 'alter', 'amber', 'amend', 'among', 'anger', 'angle', 'angry',
            'apart', 'apple', 'apply', 'arena', 'argue', 'arise', 'array', 'arrow', 'aside', 'asset',
            'avoid', 'awake', 'award', 'aware', 'badly', 'baker', 'bases', 'basic', 'batch', 'beach',
            'began', 'begin', 'being', 'below', 'bench', 'billy', 'birth', 'black', 'blame', 'blank',
            'blind', 'block', 'blood', 'board', 'boost', 'booth', 'bound', 'brain', 'brand', 'brass',
            'brave', 'bread', 'break', 'breed', 'brief', 'bring', 'broad', 'broke', 'brown', 'build',
            'built', 'buyer', 'cable', 'calif', 'carry', 'catch', 'cause', 'chain', 'chair', 'chaos',
            'charm', 'chart', 'chase', 'cheap', 'check', 'chest', 'chief', 'child', 'china', 'chose',
            'civil', 'claim', 'class', 'clean', 'clear', 'click', 'climb', 'clock', 'close', 'cloud',
            'coach', 'coast', 'could', 'count', 'court', 'cover', 'craft', 'crash', 'crazy', 'cream',
            'crime', 'cross', 'crowd', 'crown', 'crude', 'curve', 'cycle', 'daily', 'dance', 'dated',
            'dealt', 'death', 'debut', 'delay', 'depth', 'doing', 'doubt', 'dozen', 'draft', 'drama',
            'drank', 'dream', 'dress', 'drill', 'drink', 'drive', 'drove', 'dying', 'eager', 'early',
            'earth', 'eight', 'elite', 'empty', 'enemy', 'enjoy', 'enter', 'entry', 'equal', 'error',
            'event', 'every', 'exact', 'exist', 'extra', 'faith', 'false', 'fault', 'fiber', 'field',
            'fifth', 'fifty', 'fight', 'final', 'first', 'fixed', 'flash', 'fleet', 'floor', 'fluid',
            'focus', 'force', 'forth', 'forty', 'forum', 'found', 'frame', 'frank', 'fraud', 'fresh',
            'front', 'fruit', 'fully', 'funny', 'giant', 'given', 'glass', 'globe', 'going', 'grace',
            'grade', 'grand', 'grant', 'grass', 'grave', 'great', 'green', 'gross', 'group', 'grown',
            'guard', 'guess', 'guest', 'guide', 'happy', 'harry', 'heart', 'heavy', 'hence', 'henry',
            'horse', 'hotel', 'house', 'human', 'ideal', 'image', 'index', 'inner', 'input', 'issue',
            'japan', 'jimmy', 'joint', 'jones', 'judge', 'known', 'label', 'large', 'laser', 'later',
            'laugh', 'layer', 'learn', 'lease', 'least', 'leave', 'legal', 'level', 'lewis', 'light',
            'limit', 'links', 'lives', 'local', 'loose', 'lower', 'lucky', 'lunch', 'lying', 'magic',
            'major', 'maker', 'march', 'maria', 'match', 'maybe', 'mayor', 'meant', 'media', 'metal',
            'might', 'minor', 'minus', 'mixed', 'model', 'money', 'month', 'moral', 'motor', 'mount',
            'mouse', 'mouth', 'moved', 'movie', 'music', 'needs', 'never', 'newly', 'night', 'noise',
            'north', 'noted', 'novel', 'nurse', 'occur', 'ocean', 'offer', 'often', 'order', 'other',
            'ought', 'paint', 'panel', 'paper', 'party', 'peace', 'peter', 'phase', 'phone', 'photo',
            'piano', 'piece', 'pilot', 'pitch', 'place', 'plain', 'plane', 'plant', 'plate', 'point',
            'pound', 'power', 'press', 'price', 'pride', 'prime', 'print', 'prior', 'prize', 'proof',
            'proud', 'prove', 'queen', 'quick', 'quiet', 'quite', 'radio', 'raise', 'range', 'rapid',
            'ratio', 'reach', 'ready', 'realm', 'rebel', 'refer', 'relax', 'reply', 'right', 'rigid',
            'rival', 'river', 'robin', 'roger', 'roman', 'rough', 'round', 'route', 'royal', 'rural',
            'scale', 'scene', 'scope', 'score', 'sense', 'serve', 'setup', 'seven', 'shall', 'shape',
            'share', 'sharp', 'sheet', 'shelf', 'shell', 'shift', 'shine', 'shirt', 'shock', 'shoot',
            'short', 'shown', 'sides', 'sight', 'silly', 'since', 'sixth', 'sixty', 'sized', 'skill',
            'sleep', 'slide', 'small', 'smart', 'smile', 'smith', 'smoke', 'snake', 'snow', 'solid',
            'solve', 'sorry', 'sound', 'south', 'space', 'spare', 'speak', 'speed', 'spend', 'spent',
            'split', 'spoke', 'sport', 'staff', 'stage', 'stake', 'stand', 'start', 'state', 'steam',
            'steel', 'steep', 'steer', 'stern', 'stick', 'still', 'stock', 'stone', 'stood', 'store',
            'storm', 'story', 'strip', 'stuck', 'study', 'stuff', 'style', 'sugar', 'suite', 'super',
            'sweet', 'table', 'taken', 'taste', 'taxes', 'teach', 'teams', 'teeth', 'terry', 'texas',
            'thank', 'theft', 'their', 'theme', 'there', 'these', 'thick', 'thing', 'think', 'third',
            'those', 'three', 'threw', 'throw', 'thumb', 'tight', 'times', 'tired', 'title', 'today',
            'topic', 'total', 'touch', 'tough', 'tower', 'track', 'trade', 'train', 'treat', 'trend',
            'trial', 'tribe', 'trick', 'tried', 'tries', 'truck', 'truly', 'trust', 'truth', 'twice',
            'under', 'undue', 'union', 'unity', 'until', 'upper', 'upset', 'urban', 'usage', 'usual',
            'valid', 'value', 'video', 'virus', 'visit', 'vital', 'vocal', 'waste', 'watch', 'water',
            'wheel', 'where', 'which', 'while', 'white', 'whole', 'whose', 'woman', 'women', 'world',
            'worry', 'worse', 'worst', 'worth', 'would', 'write', 'wrong', 'wrote', 'young', 'youth'
        ];

        // Game state
        this.currentWord = '';
        this.currentRow = 0;
        this.currentCol = 0;
        this.gameOver = false;
        this.gameWon = false;
        this.guesses = [];
        this.keyboardState = {};

        // Statistics
        this.stats = this.loadStats();

        // DOM elements
        this.gameBoard = document.getElementById('gameBoard');
        this.keyboard = document.getElementById('keyboard');
        this.message = document.getElementById('message');
        this.overlay = document.getElementById('gameOverOverlay');

        this.init();
    }

    init() {
        this.newGame();
        this.setupEventListeners();
        this.updateStatsDisplay();
    }

    newGame() {
        // Reset game state
        this.currentWord = this.getRandomWord();
        this.currentRow = 0;
        this.currentCol = 0;
        this.gameOver = false;
        this.gameWon = false;
        this.guesses = Array(6).fill().map(() => Array(5).fill(''));
        this.keyboardState = {};

        // Clear the board
        this.clearBoard();
        this.resetKeyboard();
        this.hideOverlay();

        console.log('New word:', this.currentWord); // For testing - remove in production
    }

    getRandomWord() {
        return this.wordList[Math.floor(Math.random() * this.wordList.length)].toUpperCase();
    }

    clearBoard() {
        const letterBoxes = this.gameBoard.querySelectorAll('.letter-box');
        letterBoxes.forEach(box => {
            box.textContent = '';
            box.className = 'letter-box';
        });
    }

    resetKeyboard() {
        const keys = this.keyboard.querySelectorAll('.key');
        keys.forEach(key => {
            key.className = key.classList.contains('wide') ? 'key wide' : 'key';
        });
    }

    setupEventListeners() {
        // Keyboard clicks
        this.keyboard.addEventListener('click', (e) => {
            if (e.target.classList.contains('key')) {
                this.handleKeyPress(e.target.dataset.key);
            }
        });

        // Physical keyboard
        document.addEventListener('keydown', (e) => {
            if (this.gameOver) return;

            if (e.key === 'Enter') {
                this.handleKeyPress('Enter');
            } else if (e.key === 'Backspace') {
                this.handleKeyPress('Backspace');
            } else if (/^[a-zA-Z]$/.test(e.key)) {
                this.handleKeyPress(e.key.toUpperCase());
            }
        });
    }

    handleKeyPress(key) {
        if (this.gameOver) return;

        if (key === 'Enter') {
            this.submitGuess();
        } else if (key === 'Backspace') {
            this.deleteLetter();
        } else if (/^[A-Z]$/.test(key)) {
            this.addLetter(key);
        }
    }

    addLetter(letter) {
        if (this.currentCol < 5) {
            this.guesses[this.currentRow][this.currentCol] = letter;
            this.updateBoard();
            this.currentCol++;
        }
    }

    deleteLetter() {
        if (this.currentCol > 0) {
            this.currentCol--;
            this.guesses[this.currentRow][this.currentCol] = '';
            this.updateBoard();
        }
    }

    updateBoard() {
        const rows = this.gameBoard.querySelectorAll('.board-row');
        rows.forEach((row, rowIndex) => {
            const boxes = row.querySelectorAll('.letter-box');
            boxes.forEach((box, colIndex) => {
                const letter = this.guesses[rowIndex][colIndex];
                box.textContent = letter;
                if (letter) {
                    box.classList.add('filled');
                } else {
                    box.classList.remove('filled');
                }
            });
        });
    }

    submitGuess() {
        if (this.currentCol !== 5) {
            this.showMessage('Not enough letters');
            return;
        }

        const guess = this.guesses[this.currentRow].join('');
        
        // Check if guess is a valid word (for simplicity, we'll accept any 5-letter combination)
        if (guess.length !== 5) {
            this.showMessage('Invalid word');
            return;
        }

        // Evaluate the guess
        this.evaluateGuess(guess);
        
        if (guess === this.currentWord) {
            this.gameWon = true;
            this.gameOver = true;
            this.stats.gamesWon++;
            this.stats.currentStreak++;
            this.stats.maxStreak = Math.max(this.stats.maxStreak, this.stats.currentStreak);
            setTimeout(() => this.showGameOver(true), 2000);
        } else if (this.currentRow === 5) {
            this.gameOver = true;
            this.stats.currentStreak = 0;
            setTimeout(() => this.showGameOver(false), 2000);
        } else {
            this.currentRow++;
            this.currentCol = 0;
        }

        this.stats.gamesPlayed++;
        this.saveStats();
        this.updateStatsDisplay();
    }

    evaluateGuess(guess) {
        const row = this.gameBoard.querySelectorAll('.board-row')[this.currentRow];
        const boxes = row.querySelectorAll('.letter-box');
        const wordArray = this.currentWord.split('');
        const guessArray = guess.split('');
        const result = Array(5).fill('absent');

        // First pass: mark exact matches
        for (let i = 0; i < 5; i++) {
            if (guessArray[i] === wordArray[i]) {
                result[i] = 'correct';
                wordArray[i] = null; // Mark as used
            }
        }

        // Second pass: mark present letters
        for (let i = 0; i < 5; i++) {
            if (result[i] !== 'correct') {
                const letterIndex = wordArray.indexOf(guessArray[i]);
                if (letterIndex !== -1) {
                    result[i] = 'present';
                    wordArray[letterIndex] = null; // Mark as used
                }
            }
        }

        // Apply results with animation
        boxes.forEach((box, index) => {
            setTimeout(() => {
                box.classList.add('flip');
                setTimeout(() => {
                    box.classList.add(result[index]);
                    this.updateKeyboard(guessArray[index], result[index]);
                }, 300);
            }, index * 100);
        });
    }

    updateKeyboard(letter, state) {
        const key = this.keyboard.querySelector(`[data-key="${letter.toLowerCase()}"]`);
        if (key) {
            // Don't downgrade key state (correct > present > absent)
            const currentState = this.keyboardState[letter] || 'absent';
            if (state === 'correct' || (state === 'present' && currentState !== 'correct')) {
                key.classList.remove('correct', 'present', 'absent');
                key.classList.add(state);
                this.keyboardState[letter] = state;
            } else if (state === 'absent' && !this.keyboardState[letter]) {
                key.classList.add('absent');
                this.keyboardState[letter] = 'absent';
            }
        }
    }

    showMessage(text) {
        this.message.textContent = text;
        this.message.classList.add('show');
        setTimeout(() => {
            this.message.classList.remove('show');
        }, 2000);
    }

    showGameOver(won) {
        const title = document.getElementById('gameOverTitle');
        const message = document.getElementById('gameOverMessage');
        const word = document.getElementById('gameOverWord');

        if (won) {
            title.textContent = '🎉 Congratulations!';
            message.textContent = `You guessed the word in ${this.currentRow + 1} tries!`;
        } else {
            title.textContent = '😞 Game Over';
            message.textContent = 'Better luck next time!';
        }

        word.textContent = this.currentWord;
        this.overlay.classList.add('show');
    }

    hideOverlay() {
        this.overlay.classList.remove('show');
    }

    loadStats() {
        const saved = localStorage.getItem('wordle-unlimited-stats');
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            gamesPlayed: 0,
            gamesWon: 0,
            currentStreak: 0,
            maxStreak: 0
        };
    }

    saveStats() {
        localStorage.setItem('wordle-unlimited-stats', JSON.stringify(this.stats));
    }

    updateStatsDisplay() {
        document.getElementById('gamesPlayed').textContent = this.stats.gamesPlayed;
        document.getElementById('winPercentage').textContent = 
            this.stats.gamesPlayed > 0 ? Math.round((this.stats.gamesWon / this.stats.gamesPlayed) * 100) : 0;
        document.getElementById('currentStreak').textContent = this.stats.currentStreak;
        document.getElementById('maxStreak').textContent = this.stats.maxStreak;
    }
}

// Global functions for buttons
function newGame() {
    if (window.wordleGame) {
        window.wordleGame.newGame();
    }
}

function goHome() {
    window.location.href = '../index.html';
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.wordleGame = new WordleGame();
});

// Listen for global mute changes
(function(){
    const bc = (typeof BroadcastChannel !== 'undefined') ? new BroadcastChannel('javasnake-global') : null;
    
    function applyMuteState(muted) {
        // Wordle doesn't have audio, but we'll keep this for consistency
        // Could add sound effects in the future
    }

    if (bc) {
        bc.addEventListener('message', (ev) => {
            if (ev.data && ev.data.type === 'MUTE_CHANGED') {
                applyMuteState(!!ev.data.muted);
            }
        });
    }

    window.addEventListener('storage', (e) => {
        if (e.key === 'site_mute') applyMuteState(e.newValue === '1');
    });

    applyMuteState(localStorage.getItem('site_mute') === '1');
})();