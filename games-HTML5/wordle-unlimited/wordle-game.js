// Wordle Unlimited - Game Logic
// Made by vokenz - visit YouTube channel!

class WordleGame {
    constructor() {
        // 1000 different 5-letter words for unlimited play
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
            'worry', 'worse', 'worst', 'worth', 'would', 'write', 'wrong', 'wrote', 'young', 'youth',
            // Additional 500 words to reach 1000 total
            'ankle', 'bacon', 'badge', 'badly', 'bagel', 'bench', 'berry', 'bikes', 'birds', 'birth',
            'blade', 'blame', 'blast', 'blaze', 'bleed', 'bless', 'blink', 'bliss', 'blood', 'bloom',
            'blown', 'blues', 'blunt', 'blurb', 'blush', 'boast', 'bobby', 'bonds', 'bonus', 'books',
            'boost', 'booth', 'boots', 'bound', 'bowls', 'boxes', 'brain', 'brake', 'brand', 'brass',
            'brave', 'bread', 'break', 'breed', 'brick', 'bride', 'brief', 'bring', 'brink', 'broad',
            'broke', 'brook', 'brown', 'brush', 'build', 'built', 'bunch', 'burns', 'burst', 'buses',
            'cable', 'cache', 'camps', 'candy', 'cards', 'cargo', 'carry', 'carve', 'catch', 'cause',
            'cells', 'chain', 'chair', 'chalk', 'champ', 'chaos', 'charm', 'chart', 'chase', 'cheap',
            'cheat', 'check', 'cheek', 'chess', 'chest', 'chick', 'chief', 'child', 'china', 'chips',
            'chose', 'chunk', 'civic', 'civil', 'claim', 'clamp', 'clash', 'class', 'clean', 'clear',
            'clerk', 'click', 'cliff', 'climb', 'cling', 'cloak', 'clock', 'close', 'cloth', 'cloud',
            'clown', 'clubs', 'clues', 'coach', 'coast', 'coats', 'codes', 'coins', 'color', 'comet',
            'comic', 'coral', 'cores', 'corps', 'costs', 'couch', 'cough', 'could', 'count', 'court',
            'cover', 'crack', 'craft', 'crane', 'crash', 'crazy', 'cream', 'creek', 'cribs', 'crime',
            'crisp', 'crops', 'cross', 'crowd', 'crown', 'crude', 'crush', 'crust', 'cubes', 'cuffs',
            'curry', 'curve', 'cycle', 'daily', 'dairy', 'daisy', 'dance', 'dandy', 'dared', 'dates',
            'deals', 'debut', 'decks', 'decor', 'deeds', 'delay', 'demon', 'dense', 'depot', 'depth',
            'desks', 'detox', 'diary', 'diced', 'diner', 'dirty', 'disco', 'disks', 'ditch', 'diver',
            'dizzy', 'docks', 'dodge', 'doing', 'dolls', 'donor', 'doors', 'doubt', 'dough', 'dozen',
            'draft', 'drain', 'drama', 'drank', 'drawn', 'dream', 'dress', 'dried', 'drill', 'drink',
            'drive', 'drone', 'drops', 'drove', 'drugs', 'drums', 'drunk', 'ducks', 'dunes', 'dusty',
            'duvet', 'dying', 'eager', 'eagle', 'early', 'earth', 'easel', 'eaten', 'eater', 'ebony',
            'edges', 'eight', 'elder', 'elite', 'email', 'ember', 'empty', 'ended', 'enemy', 'enjoy',
            'enter', 'entry', 'equal', 'error', 'ethos', 'event', 'every', 'exact', 'exams', 'excel',
            'exile', 'exist', 'exits', 'extra', 'faced', 'facts', 'faded', 'fails', 'fairy', 'faith',
            'falls', 'false', 'fancy', 'farms', 'fatal', 'fault', 'favor', 'feast', 'feeds', 'feels',
            'fence', 'ferry', 'fetch', 'fever', 'fiber', 'field', 'fiery', 'fifth', 'fifty', 'fight',
            'files', 'fills', 'films', 'final', 'finds', 'fines', 'fired', 'firms', 'first', 'fists',
            'fixed', 'flags', 'flame', 'flaps', 'flash', 'flask', 'flats', 'flaws', 'fleet', 'flesh',
            'flies', 'fling', 'flips', 'float', 'flock', 'flood', 'floor', 'flour', 'flows', 'fluid',
            'fluke', 'flush', 'flute', 'foams', 'focus', 'folks', 'fonts', 'foods', 'fools', 'force',
            'forge', 'forms', 'forth', 'forty', 'forum', 'found', 'frame', 'frank', 'fraud', 'freak',
            'freed', 'fresh', 'fried', 'fries', 'front', 'frost', 'fruit', 'fuels', 'fully', 'funds',
            'funny', 'furry', 'fused', 'games', 'gangs', 'gates', 'gears', 'genes', 'genre', 'ghost',
            'giant', 'gifts', 'girls', 'given', 'gives', 'glade', 'glass', 'gleam', 'globe', 'glory',
            'gloss', 'glove', 'glued', 'gnome', 'goals', 'goats', 'going', 'goods', 'grace', 'grade',
            'grain', 'grand', 'grant', 'grape', 'graph', 'grasp', 'grass', 'grave', 'gravy', 'great',
            'greed', 'green', 'greet', 'grief', 'grill', 'grind', 'grips', 'gross', 'group', 'grove',
            'grown', 'grows', 'gruel', 'guard', 'guess', 'guest', 'guide', 'guild', 'guilt', 'gulps',
            'habit', 'hacke', 'halls', 'hands', 'hangs', 'happy', 'harsh', 'haste', 'hatch', 'hated',
            'haven', 'hawks', 'heads', 'heals', 'heard', 'heart', 'heath', 'heavy', 'hedge', 'heels',
            'helps', 'hence', 'herbs', 'hides', 'highs', 'hills', 'hints', 'hired', 'hives', 'hobby',
            'holds', 'holes', 'holly', 'homes', 'honey', 'honor', 'hooks', 'hoped', 'hopes', 'horns',
            'horse', 'hosts', 'hotel', 'hours', 'house', 'hover', 'howls', 'hubby', 'huffy', 'hulks',
            'human', 'humid', 'humor', 'hurry', 'hurts', 'husky', 'hyena', 'icebox', 'ideal', 'ideas',
            'idiom', 'igloo', 'image', 'imply', 'inbox', 'incur', 'index', 'indie', 'inert', 'infer',
            'inked', 'inlet', 'inner', 'input', 'insect', 'intro', 'ionic', 'irons', 'issue', 'items',
            'ivory', 'jaded', 'jails', 'jeans', 'jelly', 'jerky', 'jewel', 'jiffy', 'joint', 'jokes',
            'jolly', 'jolts', 'joust', 'judge', 'juice', 'jumbo', 'jumps', 'junky', 'kayak', 'keeps',
            'kicks', 'kills', 'kinds', 'kings', 'kites', 'kitty', 'knees', 'knife', 'knits', 'knock',
            'knots', 'known', 'knows', 'koala', 'label', 'labor', 'laced', 'lacks', 'lakes', 'lamps',
            'lands', 'lanes', 'large', 'laser', 'lasts', 'later', 'laugh', 'lawn', 'layer', 'leads',
            'leafs', 'leaks', 'learn', 'lease', 'least', 'leave', 'ledge', 'lefts', 'legal', 'lemon',
            'level', 'lever', 'licks', 'lied', 'lifts', 'light', 'liked', 'likes', 'limit', 'lined',
            'lines', 'links', 'lions', 'lists', 'lived', 'liver', 'lives', 'loads', 'loans', 'lobby',
            'local', 'locks', 'lodge', 'logic', 'logos', 'looks', 'loops', 'loose', 'lords', 'loses',
            'loved', 'lover', 'loves', 'lower', 'loyal', 'lucky', 'lumps', 'lunch', 'lungs', 'lured',
            'lurks', 'lying', 'lyric', 'macro', 'magic', 'magma', 'mails', 'major', 'maker', 'makes',
            'males', 'mango', 'maple', 'march', 'marks', 'marry', 'marsh', 'masks', 'match', 'mates',
            'maths', 'mayor', 'meals', 'means', 'meant', 'meats', 'medal', 'media', 'meets', 'melon',
            'melts', 'memos', 'menus', 'mercy', 'merge', 'merit', 'merry', 'messy', 'metal', 'meter',
            'metro', 'might', 'miles', 'milks', 'minds', 'mined', 'mines', 'minor', 'minus', 'mixed',
            'mixes', 'moats', 'modal', 'model', 'modes', 'molds', 'money', 'monks', 'month', 'moods',
            'moons', 'moral', 'moths', 'motor', 'motto', 'mound', 'mount', 'mouse', 'mouth', 'moved',
            'mover', 'moves', 'movie', 'mowed', 'mower', 'muddy', 'muted', 'myths', 'nails', 'named',
            'names', 'nasty', 'naval', 'necks', 'needs', 'nests', 'never', 'newly', 'night', 'noise',
            'north', 'nose', 'noted', 'notes', 'novel', 'nurse', 'nutty', 'oaths', 'oasis', 'occur',
            'ocean', 'offer', 'often', 'older', 'olive', 'onion', 'opera', 'orbit', 'order', 'organ',
            'other', 'ought', 'ounce', 'outer', 'owned', 'owner', 'oxide', 'paced', 'paces', 'packs',
            'pages', 'pains', 'paint', 'pairs', 'panel', 'pangs', 'panic', 'pants', 'paper', 'parks',
            'parts', 'party', 'pasta', 'paste', 'patch', 'paths', 'pause', 'paved', 'paves', 'peace',
            'peaks', 'pearl', 'pedal', 'peers', 'penny', 'perks', 'petal', 'phase', 'phone', 'photo',
            'piano', 'picks', 'piece', 'piles', 'pills', 'pilot', 'pinch', 'pines', 'pipes', 'pitch',
            'pizza', 'place', 'plain', 'plane', 'plans', 'plant', 'plate', 'plays', 'plaza', 'plots',
            'plugs', 'poems', 'point', 'poles', 'polls', 'pools', 'porch', 'posed', 'poses', 'posts',
            'pouch', 'pound', 'pours', 'power', 'press', 'price', 'pride', 'prime', 'print', 'prior',
            'prize', 'proof', 'props', 'proud', 'prove', 'proxy', 'pulls', 'pulse', 'pumps', 'punch',
            'pupil', 'purse', 'push', 'query', 'quest', 'queue', 'quick', 'quiet', 'quilt', 'quirk',
            'quite', 'quote', 'races', 'racks', 'radar', 'radio', 'rails', 'rains', 'raise', 'raked',
            'rally', 'ranch', 'range', 'ranks', 'rapid', 'rated', 'rates', 'ratio', 'rays', 'reach',
            'reads', 'ready', 'realm', 'rebel', 'recap', 'refer', 'reign', 'relax', 'relay', 'repay',
            'reply', 'reset', 'rides', 'ridge', 'rifle', 'right', 'rigid', 'rings', 'rinse', 'rises',
            'risks', 'rival', 'river', 'roads', 'roast', 'robes', 'robot', 'rocks', 'roles', 'rolls',
            'roman', 'roofs', 'rooms', 'roots', 'ropes', 'roses', 'rough', 'round', 'route', 'royal',
            'ruins', 'ruled', 'ruler', 'rules', 'rumor', 'rural', 'safer', 'sails', 'saint', 'sales',
            'salon', 'salts', 'sandy', 'sauce', 'saved', 'saves', 'scale', 'scams', 'scare', 'scene',
            'scent', 'scope', 'score', 'scout', 'scrap', 'seeds', 'seems', 'sells', 'sends', 'sense',
            'serve', 'setup', 'seven', 'shade', 'shaft', 'shake', 'shall', 'shame', 'shape', 'share',
            'shark', 'sharp', 'sheep', 'sheet', 'shelf', 'shell', 'shift', 'shine', 'shirt', 'shock',
            'shoes', 'shoot', 'shore', 'short', 'shots', 'shown', 'shows', 'sided', 'sides', 'sight',
            'signs', 'silly', 'since', 'sinks', 'sites', 'sixth', 'sixty', 'sized', 'sizes', 'skill',
            'skins', 'skips', 'skull', 'sleep', 'slice', 'slide', 'slope', 'slots', 'slows', 'small',
            'smart', 'smell', 'smile', 'smoke', 'snake', 'snaps', 'sneak', 'snore', 'snowy', 'sober',
            'socks', 'sofas', 'solar', 'solid', 'solve', 'songs', 'sonic', 'sorry', 'sorts', 'souls',
            'sound', 'soups', 'south', 'space', 'spare', 'spark', 'speak', 'speed', 'spell', 'spend',
            'spent', 'spice', 'spine', 'split', 'spoke', 'spoon', 'sport', 'spots', 'spray', 'squad',
            'staff', 'stage', 'stain', 'stake', 'stamp', 'stand', 'stare', 'stars', 'start', 'state',
            'stays', 'steal', 'steam', 'steel', 'steep', 'steer', 'stems', 'steps', 'stern', 'stick',
            'stiff', 'still', 'sting', 'stink', 'stock', 'stomp', 'stone', 'stood', 'stool', 'stops',
            'store', 'storm', 'story', 'strap', 'strip', 'stuck', 'study', 'stuff', 'style', 'sugar',
            'suite', 'sumer', 'sunny', 'super', 'swear', 'sweat', 'sweep', 'sweet', 'swift', 'swing',
            'sword', 'sworn', 'table', 'tacky', 'taken', 'takes', 'tales', 'talks', 'tanks', 'tapes',
            'tasks', 'taste', 'taxes', 'teach', 'teams', 'tears', 'teens', 'teeth', 'tells', 'temps',
            'tends', 'tense', 'tenth', 'terms', 'tests', 'thank', 'theft', 'their', 'theme', 'there',
            'these', 'thick', 'thing', 'think', 'third', 'those', 'three', 'threw', 'throw', 'thumb',
            'tidal', 'tiger', 'tight', 'tiles', 'times', 'timer', 'tired', 'title', 'toast', 'today',
            'token', 'tombs', 'tones', 'tools', 'tooth', 'topic', 'torch', 'total', 'touch', 'tough',
            'tours', 'tower', 'towns', 'toxic', 'track', 'trade', 'trail', 'train', 'trash', 'treat',
            'trees', 'trend', 'trial', 'tribe', 'trick', 'tried', 'tries', 'trips', 'troop', 'truck',
            'truly', 'trunk', 'trust', 'truth', 'tubes', 'tuned', 'tunes', 'turns', 'twice', 'twins',
            'twist', 'typed', 'types', 'ultra', 'uncle', 'under', 'undue', 'unfed', 'union', 'unite',
            'unity', 'until', 'upper', 'upset', 'urban', 'urged', 'usage', 'users', 'usual', 'valid',
            'value', 'vapor', 'vault', 'veins', 'venue', 'verbs', 'verse', 'video', 'views', 'villa',
            'vinyl', 'virus', 'visit', 'vital', 'vocal', 'voice', 'vomit', 'voted', 'votes', 'vowel',
            'wages', 'waist', 'waits', 'walks', 'walls', 'wants', 'warns', 'waste', 'watch', 'water',
            'waves', 'weary', 'weeks', 'weird', 'wells', 'wheat', 'wheel', 'where', 'which', 'while',
            'whips', 'white', 'whole', 'whose', 'wider', 'widow', 'width', 'winds', 'wines', 'wings',
            'wipes', 'wired', 'wires', 'witch', 'woken', 'woman', 'women', 'woods', 'words', 'works',
            'world', 'worms', 'worry', 'worse', 'worst', 'worth', 'would', 'wraps', 'wrist', 'write',
            'wrong', 'wrote', 'yacht', 'yards', 'years', 'yeast', 'yield', 'young', 'youth', 'zebra',
            'zeros', 'zones'
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
        // Ensure keyboard element exists
        if (!this.keyboard) {
            console.error('Keyboard element not found!');
            return;
        }

        // Simple keyboard clicks - remove redundant handlers
        this.keyboard.addEventListener('click', (e) => {
            // Check if clicked element or its parent has the key class
            let target = e.target;
            let key = null;
            
            // Look for key data on clicked element or parent
            if (target.classList.contains('key')) {
                key = target.dataset.key;
            } else if (target.parentElement && target.parentElement.classList.contains('key')) {
                key = target.parentElement.dataset.key;
                target = target.parentElement;
            }
            
            if (key) {
                console.log('Key clicked:', key);
                this.handleKeyPress(key);
                e.preventDefault();
                e.stopPropagation();
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