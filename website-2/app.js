// Game State
let gameState = {
    mode: '',
    difficulty: '',
    currentQuestion: 0,
    totalQuestions: 10,
    score: 0,
    correctAnswers: 0,
    streak: 0,
    bestStreak: 0,
    startTime: null,
    timerInterval: null,
    stats: {
        totalSolved: 0,
        totalCorrect: 0,
        totalAttempts: 0
    }
};

// Load stats from localStorage
function loadStats() {
    const savedStats = localStorage.getItem('mathPracticeStats');
    if (savedStats) {
        gameState.stats = JSON.parse(savedStats);
        updateStatsDisplay();
    }
}

// Save stats to localStorage
function saveStats() {
    localStorage.setItem('mathPracticeStats', JSON.stringify(gameState.stats));
}

// Update stats display
function updateStatsDisplay() {
    document.getElementById('total-solved').textContent = gameState.stats.totalSolved;
    const accuracy = gameState.stats.totalAttempts > 0 
        ? Math.round((gameState.stats.totalCorrect / gameState.stats.totalAttempts) * 100) 
        : 0;
    document.getElementById('accuracy').textContent = accuracy + '%';
    document.getElementById('streak').textContent = gameState.bestStreak;
}

// Show screen
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// Select mode
function selectMode(mode) {
    gameState.mode = mode;
    showScreen('difficulty-screen');
}

// Start practice
function startPractice(difficulty) {
    gameState.difficulty = difficulty;
    gameState.currentQuestion = 0;
    gameState.score = 0;
    gameState.correctAnswers = 0;
    gameState.streak = 0;
    gameState.startTime = Date.now();
    
    showScreen('practice-screen');
    
    if (gameState.mode === 'timed') {
        startTimer();
    }
    
    generateQuestion();
    updateProgress();
}

// Start timer
function startTimer() {
    let seconds = 0;
    gameState.timerInterval = setInterval(() => {
        seconds++;
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        document.getElementById('timer').textContent = 
            `⏱️ ${minutes}:${secs.toString().padStart(2, '0')}`;
    }, 1000);
}

// Get number range based on difficulty
function getNumberRange() {
    switch (gameState.difficulty) {
        case 'easy':
            return { min: 1, max: 10 };
        case 'medium':
            return { min: 1, max: 50 };
        case 'hard':
            return { min: 1, max: 100 };
        default:
            return { min: 1, max: 10 };
    }
}

// Generate random number
function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Get operation based on mode
function getOperation() {
    if (gameState.mode === 'mixed' || gameState.mode === 'timed') {
        const operations = ['+', '-', '×', '÷'];
        return operations[Math.floor(Math.random() * operations.length)];
    }
    
    switch (gameState.mode) {
        case 'addition': return '+';
        case 'subtraction': return '-';
        case 'multiplication': return '×';
        case 'division': return '÷';
        default: return '+';
    }
}

// Generate question
function generateQuestion() {
    const range = getNumberRange();
    const operation = getOperation();
    
    let num1 = getRandomNumber(range.min, range.max);
    let num2 = getRandomNumber(range.min, range.max);
    let answer;
    
    // Adjust numbers based on operation
    if (operation === '-') {
        // Ensure positive result
        if (num1 < num2) {
            [num1, num2] = [num2, num1];
        }
        answer = num1 - num2;
    } else if (operation === '÷') {
        // Ensure whole number division
        answer = getRandomNumber(range.min, Math.floor(range.max / 2));
        num2 = getRandomNumber(2, 10);
        num1 = answer * num2;
    } else if (operation === '×') {
        answer = num1 * num2;
    } else {
        answer = num1 + num2;
    }
    
    gameState.currentAnswer = answer;
    
    // Display question
    document.getElementById('question').textContent = `${num1} ${operation} ${num2} = ?`;
    document.getElementById('answer-input').value = '';
    document.getElementById('feedback').textContent = '';
    document.getElementById('feedback').className = 'feedback';
    document.getElementById('answer-input').focus();
    
    // Update score display
    document.getElementById('score').textContent = `Score: ${gameState.score}`;
    document.getElementById('current-streak').textContent = gameState.streak;
}

// Check answer
function checkAnswer() {
    const userAnswer = parseInt(document.getElementById('answer-input').value);
    const feedback = document.getElementById('feedback');
    
    if (isNaN(userAnswer)) {
        feedback.textContent = 'Please enter a number!';
        feedback.className = 'feedback incorrect';
        return;
    }
    
    gameState.stats.totalAttempts++;
    
    if (userAnswer === gameState.currentAnswer) {
        // Correct answer
        feedback.textContent = '✓ Correct! Great job!';
        feedback.className = 'feedback correct';
        gameState.score += 10;
        gameState.correctAnswers++;
        gameState.streak++;
        gameState.stats.totalCorrect++;
        gameState.stats.totalSolved++;
        
        if (gameState.streak > gameState.bestStreak) {
            gameState.bestStreak = gameState.streak;
        }
        
        setTimeout(() => {
            gameState.currentQuestion++;
            
            if (gameState.currentQuestion < gameState.totalQuestions) {
                generateQuestion();
                updateProgress();
            } else {
                endPractice();
            }
        }, 1000);
    } else {
        // Incorrect answer
        feedback.textContent = `✗ Incorrect. The answer is ${gameState.currentAnswer}`;
        feedback.className = 'feedback incorrect';
        gameState.streak = 0;
        gameState.stats.totalSolved++;
        
        setTimeout(() => {
            gameState.currentQuestion++;
            
            if (gameState.currentQuestion < gameState.totalQuestions) {
                generateQuestion();
                updateProgress();
            } else {
                endPractice();
            }
        }, 1500);
    }
    
    saveStats();
    updateStatsDisplay();
}

// Update progress bar
function updateProgress() {
    const progress = (gameState.currentQuestion / gameState.totalQuestions) * 100;
    document.getElementById('progress-fill').style.width = progress + '%';
}

// End practice
function endPractice() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }
    
    const endTime = Date.now();
    const timeTaken = Math.floor((endTime - gameState.startTime) / 1000);
    const accuracy = Math.round((gameState.correctAnswers / gameState.totalQuestions) * 100);
    
    // Display results
    document.getElementById('final-score').textContent = gameState.score;
    document.getElementById('final-accuracy').textContent = accuracy + '%';
    document.getElementById('final-time').textContent = timeTaken + 's';
    
    // Generate message
    let message = '';
    if (accuracy >= 90) {
        message = '🌟 Outstanding! You\'re a math genius!';
    } else if (accuracy >= 70) {
        message = '👏 Great work! Keep practicing!';
    } else if (accuracy >= 50) {
        message = '👍 Good effort! You\'re improving!';
    } else {
        message = '💪 Keep practicing! You\'ll get better!';
    }
    
    document.getElementById('results-message').textContent = message;
    
    showScreen('results-screen');
    updateStatsDisplay();
}

// Restart practice
function restartPractice() {
    startPractice(gameState.difficulty);
}

// Enter key support
document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    
    const answerInput = document.getElementById('answer-input');
    answerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            checkAnswer();
        }
    });
});
