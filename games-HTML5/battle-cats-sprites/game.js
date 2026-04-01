const lane = document.getElementById("lane");
const moneyEl = document.getElementById("money");
const playerBaseEl = document.getElementById("player-base-hp");
const enemyBaseEl = document.getElementById("enemy-base-hp");
const levelNameEl = document.getElementById("level-name");
const matchCountEl = document.getElementById("match-count");
const hintEl = document.getElementById("hint");
const resetBtn = document.getElementById("reset");
const unitButtonsWrap = document.getElementById("unit-buttons");
const shopGrid = document.getElementById("shop-grid");
const audioToggleBtn = document.getElementById("audio-toggle");
const pauseToggleBtn = document.getElementById("pause-toggle");
const settingsToggleBtn = document.getElementById("settings-toggle");
const quickSettingsEl = document.getElementById("quick-settings");
const quickAudioToggleBtn = document.getElementById("quick-audio-toggle");
const quickRestartBtn = document.getElementById("quick-restart");
const battleTimeEl = document.getElementById("battle-time");
const statusEl = document.getElementById("status-text");
const difficultyNameEl = document.getElementById("difficulty-name");
const difficultyApplyNameEl = document.getElementById("difficulty-apply-name");
const pendingDifficultyNoteEl = document.getElementById("pending-difficulty-note");
const playerBaseBarEl = document.getElementById("player-base-bar");
const enemyBaseBarEl = document.getElementById("enemy-base-bar");
const forecastNextWaveEl = document.getElementById("forecast-next-wave");
const forecastWaveTypeEl = document.getElementById("forecast-wave-type");
const forecastBossEl = document.getElementById("forecast-boss");
const threatMeterEl = document.getElementById("threat-meter");
const threatFillEl = document.getElementById("threat-fill");
const threatTextEl = document.getElementById("threat-text");
const pauseOverlayEl = document.getElementById("pause-overlay");
const pauseStatusEl = document.getElementById("pause-status");
const pauseTitleEl = document.getElementById("pause-title");
const resumeBtn = document.getElementById("resume-btn");
const pauseRestartBtn = document.getElementById("pause-restart");
const pauseAudioToggleBtn = document.getElementById("pause-audio-toggle");
const musicVolumeInput = document.getElementById("music-volume");
const sfxVolumeInput = document.getElementById("sfx-volume");
const musicVolumeValueEl = document.getElementById("music-volume-value");
const sfxVolumeValueEl = document.getElementById("sfx-volume-value");
const quickMusicVolumeInput = document.getElementById("quick-music-volume");
const quickSfxVolumeInput = document.getElementById("quick-sfx-volume");
const quickMusicVolumeValueEl = document.getElementById("quick-music-volume-value");
const quickSfxVolumeValueEl = document.getElementById("quick-sfx-volume-value");
const difficultyButtons = Array.from(document.querySelectorAll(".difficulty-btn"));
const applyModeButtons = Array.from(document.querySelectorAll(".apply-mode-btn"));
const settingToggles = Array.from(document.querySelectorAll(".setting-toggle"));

const TICK_MS = 100;
const WORLD_WIDTH = 1000;
const ENEMY_BASE_X = 90;
const PLAYER_BASE_X = 910;
const LANE_MIN_X = 120;
const LANE_MAX_X = 880;
const PLAYER_SPAWN_X = 870;
const ENEMY_SPAWN_X = 130;
const STORAGE_KEY = "cat-clash-save-v2";
const AUDIO_STORAGE_KEY = "cat-clash-audio-v1";
const BALANCE = {
  incomeTickMs: 300,
  spawnFloorMs: 1080,
  spawnRampPer15s: 78,
  crowdSlowdownMs: 110,
  doubleWaveStartMs: 42000,
  bossBaseTimes: [92000, 84000, 77000, 71000],
};

const AUDIO_DEFAULTS = {
  musicVolume: 0.72,
  sfxVolume: 0.88,
};

const DIFFICULTY_APPLY_MODES = {
  instant: "Instant",
  "next-match": "Next Match",
};

const DIFFICULTY_PROFILES = {
  easy: {
    label: "Easy",
    playerBaseHpScale: 1.18,
    enemyBaseHpScale: 0.9,
    startMoneyScale: 1.08,
    incomeFlatBonus: 1,
    playerUnitHpScale: 1.1,
    playerUnitAtkScale: 1.08,
    deployCostScale: 0.94,
    enemyStatScale: 0.86,
    enemySpeedShift: -0.14,
    enemyCooldownScale: 1.08,
    enemyBaseDamageScale: 0.9,
    enemyBountyScale: 1.12,
    spawnDelayShift: 280,
    spawnFloorScale: 1.12,
    extraWaveChanceScale: 0.72,
    doubleWaveStartShift: 12000,
    bossDelayShift: 10000,
    bossStatScale: 0.88,
    bossBaseDamageScale: 0.9,
    upgradeCostScale: 0.9,
  },
  normal: {
    label: "Normal",
    playerBaseHpScale: 1,
    enemyBaseHpScale: 1,
    startMoneyScale: 1,
    incomeFlatBonus: 0,
    playerUnitHpScale: 1,
    playerUnitAtkScale: 1,
    deployCostScale: 1,
    enemyStatScale: 1,
    enemySpeedShift: 0,
    enemyCooldownScale: 1,
    enemyBaseDamageScale: 1,
    enemyBountyScale: 1,
    spawnDelayShift: 0,
    spawnFloorScale: 1,
    extraWaveChanceScale: 1,
    doubleWaveStartShift: 0,
    bossDelayShift: 0,
    bossStatScale: 1,
    bossBaseDamageScale: 1,
    upgradeCostScale: 1,
  },
  hard: {
    label: "Hard",
    playerBaseHpScale: 0.92,
    enemyBaseHpScale: 1.1,
    startMoneyScale: 0.95,
    incomeFlatBonus: 0,
    playerUnitHpScale: 0.95,
    playerUnitAtkScale: 0.96,
    deployCostScale: 1.08,
    enemyStatScale: 1.16,
    enemySpeedShift: 0.18,
    enemyCooldownScale: 0.9,
    enemyBaseDamageScale: 1.14,
    enemyBountyScale: 0.92,
    spawnDelayShift: -190,
    spawnFloorScale: 0.92,
    extraWaveChanceScale: 1.34,
    doubleWaveStartShift: -7000,
    bossDelayShift: -8500,
    bossStatScale: 1.18,
    bossBaseDamageScale: 1.16,
    upgradeCostScale: 1.1,
  },
};

const CAT_SHEET = {
  frameWidth: 72,
  frameHeight: 72,
  actions: {
    walk: {
      frameMs: 110,
      frames: [
        { x: 58, y: 22, w: 72, h: 72 },
        { x: 138, y: 22, w: 72, h: 72 },
        { x: 218, y: 22, w: 72, h: 72 },
        { x: 298, y: 22, w: 72, h: 72 },
      ],
    },
    attack: {
      frameMs: 85,
      frames: [
        { x: 58, y: 126, w: 72, h: 72 },
        { x: 138, y: 126, w: 72, h: 72 },
        { x: 218, y: 126, w: 72, h: 72 },
        { x: 298, y: 126, w: 72, h: 72 },
      ],
    },
    hurt: {
      frameMs: 140,
      frames: [{ x: 58, y: 230, w: 72, h: 72 }],
    },
  },
};

let catSheetImage = null;
let hintFlashTimer = 0;

const catDefs = {
  scout: {
    name: "Basic Cat",
    cost: 40,
    costGrowth: 9,
    hp: 80,
    atk: 14,
    speed: 2.8,
    range: 38,
    cooldown: 520,
    spawnCd: 980,
    baseDamage: 32,
    className: "scout",
    attackAnim: "slash",
  },
  tank: {
    name: "Wall Cat",
    cost: 95,
    costGrowth: 14,
    hp: 260,
    atk: 16,
    speed: 1.2,
    range: 36,
    cooldown: 780,
    spawnCd: 2200,
    baseDamage: 46,
    className: "tank",
    attackAnim: "slam",
  },
  sniper: {
    name: "Sniper Cat",
    cost: 145,
    costGrowth: 17,
    hp: 95,
    atk: 46,
    speed: 1.4,
    range: 158,
    cooldown: 1320,
    spawnCd: 2600,
    baseDamage: 42,
    className: "sniper",
    attackAnim: "spit",
  },
  ninja: {
    name: "Ninja Cat",
    cost: 120,
    costGrowth: 16,
    hp: 90,
    atk: 28,
    speed: 3.5,
    range: 42,
    cooldown: 430,
    spawnCd: 1900,
    baseDamage: 40,
    className: "ninja",
    attackAnim: "slash",
  },
  guardian: {
    name: "Guardian Cat",
    cost: 175,
    costGrowth: 20,
    hp: 330,
    atk: 34,
    speed: 1.1,
    range: 52,
    cooldown: 980,
    spawnCd: 3100,
    baseDamage: 68,
    className: "guardian",
    attackAnim: "slam",
  },
};

const unlockOrder = ["tank", "sniper", "ninja", "guardian"];

const enemyDefs = [
  { hp: 85, atk: 11, speed: 2.2, range: 28, cooldown: 650, className: "runner", attackAnim: "bite", bounty: 14, baseDamage: 26 },
  { hp: 160, atk: 18, speed: 1.7, range: 32, cooldown: 860, className: "brute", attackAnim: "slam", bounty: 24, baseDamage: 34 },
  { hp: 255, atk: 30, speed: 1.2, range: 40, cooldown: 1180, className: "hound", attackAnim: "bite", bounty: 34, baseDamage: 46 },
  { hp: 130, atk: 16, speed: 1.5, range: 120, cooldown: 1350, className: "spitter", attackAnim: "spit", bounty: 28, baseDamage: 28 },
  { hp: 320, atk: 24, speed: 1.0, range: 36, cooldown: 980, className: "armored", attackAnim: "slam", bounty: 42, baseDamage: 58 },
];

const bossDef = {
  hp: 1250,
  atk: 56,
  speed: 1.1,
  range: 56,
  cooldown: 880,
  className: "boss",
  attackAnim: "bite",
  bounty: 180,
  baseDamage: 90,
};

const levels = [
  { name: "Meadow Clash", themeClass: "theme-meadow", playerBaseHp: 760, enemyBaseHp: 700, moneyStart: 140, moneyGain: 2, spawnBase: 4200, difficulty: 1.0 },
  { name: "Sunset Street", themeClass: "theme-sunset", playerBaseHp: 810, enemyBaseHp: 860, moneyStart: 150, moneyGain: 2, spawnBase: 3900, difficulty: 1.16 },
  { name: "Moon Docks", themeClass: "theme-moon", playerBaseHp: 880, enemyBaseHp: 1030, moneyStart: 165, moneyGain: 3, spawnBase: 3600, difficulty: 1.3 },
  { name: "Crystal Ruins", themeClass: "theme-ruins", playerBaseHp: 980, enemyBaseHp: 1180, moneyStart: 180, moneyGain: 3, spawnBase: 3300, difficulty: 1.45 },
];

const state = {
  entities: [],
  nextId: 1,
  money: 0,
  playerBaseHp: 0,
  playerBaseMaxHp: 1,
  enemyBaseHp: 0,
  enemyBaseMaxHp: 1,
  timeMs: 0,
  moneyTimer: 0,
  enemySpawnTimer: 0,
  running: true,
  paused: false,
  settingsOpen: false,
  matchCount: 0,
  levelIndex: 0,
  difficulty: "normal",
  difficultyApplyMode: "instant",
  pendingDifficulty: null,
  difficultyLocked: false,
  confirmHardSwitch: true,
  unlockedCats: ["scout"],
  upgrades: Object.fromEntries(Object.keys(catDefs).map((key) => [key, 1])),
  catCooldowns: Object.fromEntries(Object.keys(catDefs).map((key) => [key, -999999])),
  endedThisRound: false,
  bossSpawned: false,
  lastOutcome: "battle",
};

const audio = {
  enabled: false,
  context: null,
  masterGain: null,
  musicGain: null,
  sfxGain: null,
  lastSfxAt: Object.create(null),
  musicStep: 0,
  nextMusicAt: 0,
  musicVolume: AUDIO_DEFAULTS.musicVolume,
  sfxVolume: AUDIO_DEFAULTS.sfxVolume,
  noiseBuffer: null,
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function laneWidth() {
  return Math.max(1, lane.clientWidth || lane.getBoundingClientRect().width || WORLD_WIDTH);
}

function worldToLaneX(worldX) {
  return (worldX / WORLD_WIDTH) * laneWidth();
}

function formatBattleTime(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function levelTheme() {
  return levels[state.levelIndex % levels.length];
}

function difficultyProfile() {
  return DIFFICULTY_PROFILES[state.difficulty] || DIFFICULTY_PROFILES.normal;
}

function initCatSheet() {
  const img = new Image();
  img.src = "cat-sprite sheet.png";
  img.onload = () => {
    catSheetImage = img;
    for (const entity of state.entities) {
      if (entity.team === "player") {
        applyCatSpriteFrame(entity, true);
      }
    }
  };
  img.onerror = () => {
    showHint("Sprite sheet not found. Running with fallback visuals.", "warn");
  };
}

function getCatFrameRect(action, frameIndex) {
  if (!catSheetImage) {
    return null;
  }

  const actionDef = CAT_SHEET.actions[action] || CAT_SHEET.actions.walk;
  const frames = actionDef.frames;
  const frame = Math.max(0, Math.min(frames.length - 1, frameIndex));
  return frames[frame];
}

function loadProgress() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return;
  }

  try {
    const saved = JSON.parse(raw);

    if (Array.isArray(saved.unlockedCats)) {
      const filtered = saved.unlockedCats.filter((key) => catDefs[key]);
      state.unlockedCats = [...new Set(filtered)];
      if (!state.unlockedCats.includes("scout")) {
        state.unlockedCats.unshift("scout");
      }
    }

    if (saved && typeof saved.upgrades === "object") {
      for (const key of Object.keys(catDefs)) {
        const value = Number(saved.upgrades[key]);
        if (Number.isFinite(value)) {
          state.upgrades[key] = clamp(Math.floor(value), 1, 10);
        }
      }
    }

    if (Number.isFinite(saved.matchCount)) {
      state.matchCount = Math.max(0, Math.floor(saved.matchCount));
    }
    if (Number.isFinite(saved.levelIndex)) {
      state.levelIndex = Math.max(0, Math.floor(saved.levelIndex)) % levels.length;
    }

    if (typeof saved.difficulty === "string" && DIFFICULTY_PROFILES[saved.difficulty]) {
      state.difficulty = saved.difficulty;
    }

    if (typeof saved.difficultyApplyMode === "string" && DIFFICULTY_APPLY_MODES[saved.difficultyApplyMode]) {
      state.difficultyApplyMode = saved.difficultyApplyMode;
    }

    if (typeof saved.pendingDifficulty === "string" && DIFFICULTY_PROFILES[saved.pendingDifficulty]) {
      state.pendingDifficulty = saved.pendingDifficulty;
    }

    if (typeof saved.difficultyLocked === "boolean") {
      state.difficultyLocked = saved.difficultyLocked;
    }

    if (typeof saved.confirmHardSwitch === "boolean") {
      state.confirmHardSwitch = saved.confirmHardSwitch;
    }
  } catch {
    // Keep defaults when save data is corrupt.
  }
}

function saveProgress() {
  const payload = {
    unlockedCats: state.unlockedCats,
    upgrades: state.upgrades,
    matchCount: state.matchCount,
    levelIndex: state.levelIndex,
    difficulty: state.difficulty,
    difficultyApplyMode: state.difficultyApplyMode,
    pendingDifficulty: state.pendingDifficulty,
    difficultyLocked: state.difficultyLocked,
    confirmHardSwitch: state.confirmHardSwitch,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function loadAudioPreference() {
  const stored = localStorage.getItem(AUDIO_STORAGE_KEY);
  audio.enabled = true;
  audio.musicVolume = AUDIO_DEFAULTS.musicVolume;
  audio.sfxVolume = AUDIO_DEFAULTS.sfxVolume;

  if (stored !== null) {
    try {
      if (stored.trim().startsWith("{")) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          if (typeof parsed.enabled === "boolean") {
            audio.enabled = parsed.enabled;
          }

          const musicValue = Number(parsed.musicVolume);
          if (Number.isFinite(musicValue)) {
            audio.musicVolume = clamp(musicValue, 0, 1);
          }

          const sfxValue = Number(parsed.sfxVolume);
          if (Number.isFinite(sfxValue)) {
            audio.sfxVolume = clamp(sfxValue, 0, 1);
          }
        }
      } else {
        audio.enabled = stored === "1";
      }
    } catch {
      // Keep defaults if saved data is invalid.
    }
  }

  updateAudioButton();
  updateVolumeControls();
}

function saveAudioPreference() {
  localStorage.setItem(
    AUDIO_STORAGE_KEY,
    JSON.stringify({
      enabled: audio.enabled,
      musicVolume: audio.musicVolume,
      sfxVolume: audio.sfxVolume,
    }),
  );
}

function updateVolumeControls() {
  if (musicVolumeInput) {
    musicVolumeInput.value = String(Math.round(clamp(audio.musicVolume, 0, 1) * 100));
  }
  if (sfxVolumeInput) {
    sfxVolumeInput.value = String(Math.round(clamp(audio.sfxVolume, 0, 1) * 100));
  }
  if (quickMusicVolumeInput) {
    quickMusicVolumeInput.value = String(Math.round(clamp(audio.musicVolume, 0, 1) * 100));
  }
  if (quickSfxVolumeInput) {
    quickSfxVolumeInput.value = String(Math.round(clamp(audio.sfxVolume, 0, 1) * 100));
  }
  if (musicVolumeValueEl) {
    musicVolumeValueEl.textContent = `${Math.round(clamp(audio.musicVolume, 0, 1) * 100)}%`;
  }
  if (sfxVolumeValueEl) {
    sfxVolumeValueEl.textContent = `${Math.round(clamp(audio.sfxVolume, 0, 1) * 100)}%`;
  }
  if (quickMusicVolumeValueEl) {
    quickMusicVolumeValueEl.textContent = `${Math.round(clamp(audio.musicVolume, 0, 1) * 100)}%`;
  }
  if (quickSfxVolumeValueEl) {
    quickSfxVolumeValueEl.textContent = `${Math.round(clamp(audio.sfxVolume, 0, 1) * 100)}%`;
  }
}

function isBattleActive() {
  return state.running && state.timeMs > 0 && !state.endedThisRound;
}

function updateDifficultyButtons() {
  const profile = difficultyProfile();
  const activeBattle = isBattleActive();
  const lockNow = state.difficultyLocked && activeBattle && state.difficultyApplyMode === "instant";

  if (difficultyNameEl) {
    difficultyNameEl.textContent = profile.label;
  }

  for (const button of difficultyButtons) {
    const key = button.dataset.difficulty;
    const active = key === state.difficulty;
    const pending = Boolean(state.pendingDifficulty) && key === state.pendingDifficulty && state.pendingDifficulty !== state.difficulty;
    button.classList.toggle("active", active);
    button.classList.toggle("pending", pending);
    button.classList.toggle("locked", lockNow && !active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
    button.disabled = lockNow && !active;
  }
}

function updateApplyModeButtons() {
  const label = DIFFICULTY_APPLY_MODES[state.difficultyApplyMode] || DIFFICULTY_APPLY_MODES.instant;

  if (difficultyApplyNameEl) {
    difficultyApplyNameEl.textContent = label;
  }

  for (const button of applyModeButtons) {
    const mode = button.dataset.applyMode;
    const active = mode === state.difficultyApplyMode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  }

  if (pendingDifficultyNoteEl) {
    if (state.difficultyApplyMode === "instant") {
      if (state.pendingDifficulty && DIFFICULTY_PROFILES[state.pendingDifficulty]) {
        pendingDifficultyNoteEl.textContent = `Queued from Next Match: ${DIFFICULTY_PROFILES[state.pendingDifficulty].label}. Select it again to apply now.`;
      } else {
        pendingDifficultyNoteEl.textContent = "Difficulty applies instantly to bases and all active units.";
      }
    } else if (state.pendingDifficulty && DIFFICULTY_PROFILES[state.pendingDifficulty]) {
      pendingDifficultyNoteEl.textContent = `Queued: ${DIFFICULTY_PROFILES[state.pendingDifficulty].label} applies on next restart.`;
    } else {
      pendingDifficultyNoteEl.textContent = "Choose a preset now to apply it on the next match restart.";
    }
  }
}

function updateSettingToggles() {
  for (const input of settingToggles) {
    const setting = input.dataset.setting;
    if (setting === "difficulty-lock") {
      input.checked = state.difficultyLocked;
    }
    if (setting === "hard-confirm") {
      input.checked = state.confirmHardSwitch;
    }
  }
}

function setDifficultyApplyMode(mode) {
  if (!DIFFICULTY_APPLY_MODES[mode] || state.difficultyApplyMode === mode) {
    return;
  }

  state.difficultyApplyMode = mode;

  if (mode === "instant" && state.pendingDifficulty) {
    if (!isBattleActive()) {
      const queued = state.pendingDifficulty;
      state.pendingDifficulty = null;
      applyDifficultyNow(queued, { announce: false, playSfx: false, rescaleUnits: true });
    }
  }

  updatePanels();
  saveProgress();
  showHint(
    mode === "instant"
      ? "Difficulty mode set to Instant. Changes affect active units immediately."
      : "Difficulty mode set to Next Match. Picks are queued until restart.",
    "good",
  );
}

function setDifficultyLock(enabled) {
  state.difficultyLocked = Boolean(enabled);
  updatePanels();
  saveProgress();
}

function setHardConfirm(enabled) {
  state.confirmHardSwitch = Boolean(enabled);
  updatePanels();
  saveProgress();
}

function rescaleLiveUnitsForDifficulty(oldProfile, nextProfile) {
  const playerHpScale = nextProfile.playerUnitHpScale / Math.max(0.01, oldProfile.playerUnitHpScale);
  const playerAtkScale = nextProfile.playerUnitAtkScale / Math.max(0.01, oldProfile.playerUnitAtkScale);
  const enemyStatScale = nextProfile.enemyStatScale / Math.max(0.01, oldProfile.enemyStatScale);
  const bossStatScale = nextProfile.bossStatScale / Math.max(0.01, oldProfile.bossStatScale);
  const enemyDamageScale = nextProfile.enemyBaseDamageScale / Math.max(0.01, oldProfile.enemyBaseDamageScale);
  const bossDamageScale = nextProfile.bossBaseDamageScale / Math.max(0.01, oldProfile.bossBaseDamageScale);
  const enemyCooldownScale = nextProfile.enemyCooldownScale / Math.max(0.01, oldProfile.enemyCooldownScale);
  const enemyBountyScale = nextProfile.enemyBountyScale / Math.max(0.01, oldProfile.enemyBountyScale);
  const speedShiftDelta = nextProfile.enemySpeedShift - oldProfile.enemySpeedShift;

  for (const unit of state.entities) {
    if (unit.hp <= 0) {
      continue;
    }

    const hpRatio = clamp(unit.hp / Math.max(1, unit.maxHp), 0, 1);

    if (unit.team === "player") {
      unit.maxHp = Math.max(1, Math.round(unit.maxHp * playerHpScale));
      unit.hp = Math.max(1, Math.round(unit.maxHp * hpRatio));
      unit.atk = Math.max(1, Math.round(unit.atk * playerAtkScale));
      unit.baseDamage = Math.max(8, Math.round(unit.baseDamage * playerAtkScale));
      continue;
    }

    const isBoss = unit.className === bossDef.className;
    const statScale = isBoss ? bossStatScale : enemyStatScale;
    const baseDamageScale = isBoss ? bossDamageScale : enemyDamageScale;

    unit.maxHp = Math.max(1, Math.round(unit.maxHp * statScale));
    unit.hp = Math.max(1, Math.round(unit.maxHp * hpRatio));
    unit.atk = Math.max(1, Math.round(unit.atk * statScale));
    unit.baseDamage = Math.max(8, Math.round(unit.baseDamage * baseDamageScale));
    unit.speed = Number(clamp(unit.speed + speedShiftDelta, 0.45, 6.8).toFixed(2));
    unit.cooldown = Math.max(280, Math.round(unit.cooldown * enemyCooldownScale));
    unit.bounty = Math.max(1, Math.round(unit.bounty * enemyBountyScale));
  }
}

function applyDifficultyNow(key, options = {}) {
  if (!DIFFICULTY_PROFILES[key]) {
    return false;
  }

  const oldProfile = difficultyProfile();
  const oldDifficulty = state.difficulty;
  const world = levelTheme();
  const oldPlayerRatio = state.playerBaseHp / Math.max(1, state.playerBaseMaxHp);
  const oldEnemyRatio = state.enemyBaseHp / Math.max(1, state.enemyBaseMaxHp);

  state.difficulty = key;
  const profile = difficultyProfile();

  state.playerBaseMaxHp = Math.max(1, Math.round(world.playerBaseHp * profile.playerBaseHpScale));
  state.enemyBaseMaxHp = Math.max(1, Math.round(world.enemyBaseHp * profile.enemyBaseHpScale));
  state.playerBaseHp = Math.round(clamp(oldPlayerRatio, 0, 1) * state.playerBaseMaxHp);
  state.enemyBaseHp = Math.round(clamp(oldEnemyRatio, 0, 1) * state.enemyBaseMaxHp);

  const shouldRescale = options.rescaleUnits !== false && oldDifficulty !== key;
  if (shouldRescale) {
    rescaleLiveUnitsForDifficulty(oldProfile, profile);
  }

  if (state.pendingDifficulty) {
    state.pendingDifficulty = null;
  }

  updatePanels();
  saveProgress();

  if (options.announce !== false) {
    const modeSuffix = shouldRescale ? " Active units were rescaled." : "";
    showHint(`Difficulty set to ${profile.label}.${modeSuffix}`, key === "hard" ? "warn" : "good");
  }

  if (options.playSfx !== false) {
    playSfx("upgrade");
  }

  return true;
}

function requestDifficultyChange(key) {
  if (!DIFFICULTY_PROFILES[key]) {
    return;
  }

  const activeBattle = isBattleActive();
  const isDifferent = key !== state.difficulty;

  if (state.difficultyApplyMode === "next-match" && activeBattle) {
    if (!isDifferent) {
      state.pendingDifficulty = null;
      updatePanels();
      saveProgress();
      showHint(`${DIFFICULTY_PROFILES[key].label} is already active.`, "good");
      return;
    }

    if (state.pendingDifficulty === key) {
      showHint(`${DIFFICULTY_PROFILES[key].label} is already queued for next match.`, "warn");
      return;
    }

    state.pendingDifficulty = key;
    updatePanels();
    saveProgress();
    showHint(`${DIFFICULTY_PROFILES[key].label} queued for next match restart.`, "warn");
    playSfx("upgrade");
    return;
  }

  if (!isDifferent) {
    if (state.pendingDifficulty) {
      state.pendingDifficulty = null;
      updatePanels();
      saveProgress();
      showHint("Cleared pending difficulty queue.", "good");
    }
    return;
  }

  if (state.difficultyLocked && activeBattle) {
    showHint("Difficulty lock is active. Unlock it in settings to change now.", "warn");
    return;
  }

  if (key === "hard" && activeBattle && state.confirmHardSwitch) {
    const confirmed = window.confirm("Switch to Hard now? Current units, economy, and spawn pacing will rescale immediately.");
    if (!confirmed) {
      showHint("Hard switch canceled.", "warn");
      return;
    }
  }

  applyDifficultyNow(key, { rescaleUnits: true, announce: true, playSfx: true });
}

function updateQuickSettingsPanel() {
  const canShow = state.running && !state.paused;
  const isVisible = canShow && state.settingsOpen;

  if (quickSettingsEl) {
    quickSettingsEl.classList.toggle("visible", isVisible);
    quickSettingsEl.setAttribute("aria-hidden", isVisible ? "false" : "true");
  }

  if (settingsToggleBtn) {
    settingsToggleBtn.setAttribute("aria-expanded", isVisible ? "true" : "false");
    settingsToggleBtn.disabled = !state.running;
  }
}

function setSettingsOpen(shouldOpen) {
  const nextOpen = Boolean(shouldOpen);
  if (state.settingsOpen === nextOpen) {
    return;
  }

  state.settingsOpen = nextOpen;
  updateQuickSettingsPanel();
}

function applyAudioVolumes(smooth = false) {
  if (!audio.masterGain || !audio.musicGain || !audio.sfxGain) {
    return;
  }

  const now = audio.context ? audio.context.currentTime : 0;
  const masterTarget = audio.enabled ? 0.72 : 0.0001;
  const musicTarget = audio.enabled ? clamp(audio.musicVolume, 0, 1) : 0.0001;
  const sfxTarget = audio.enabled ? clamp(audio.sfxVolume, 0, 1) : 0.0001;

  if (smooth) {
    audio.masterGain.gain.setTargetAtTime(masterTarget, now, 0.05);
    audio.musicGain.gain.setTargetAtTime(musicTarget, now, 0.05);
    audio.sfxGain.gain.setTargetAtTime(sfxTarget, now, 0.05);
    return;
  }

  audio.masterGain.gain.setValueAtTime(masterTarget, now);
  audio.musicGain.gain.setValueAtTime(musicTarget, now);
  audio.sfxGain.gain.setValueAtTime(sfxTarget, now);
}

function setMusicVolume(value) {
  audio.musicVolume = clamp(value, 0, 1);
  applyAudioVolumes(true);
  updateVolumeControls();
  saveAudioPreference();
}

function setSfxVolume(value) {
  audio.sfxVolume = clamp(value, 0, 1);
  applyAudioVolumes(true);
  updateVolumeControls();
  saveAudioPreference();
}

function clearLaneUnits() {
  for (const entity of state.entities) {
    entity.el.remove();
  }
  state.entities = [];
  state.nextId = 1;
}

function baseForCat(catKey) {
  const base = catDefs[catKey];
  const level = state.upgrades[catKey] ?? 1;
  const boost = level - 1;
  const profile = difficultyProfile();

  return {
    name: base.name,
    cost: Math.max(20, Math.round((base.cost + boost * base.costGrowth) * profile.deployCostScale)),
    hp: Math.round(base.hp * (1 + boost * 0.14) * profile.playerUnitHpScale),
    atk: Math.round(base.atk * (1 + boost * 0.13) * profile.playerUnitAtkScale),
    speed: Number((base.speed + boost * 0.05).toFixed(2)),
    range: base.range + boost * 2,
    cooldown: Math.max(300, Math.round(base.cooldown - boost * 18)),
    spawnCd: Math.max(500, Math.round(base.spawnCd - boost * 55)),
    baseDamage: Math.round(base.baseDamage * (1 + boost * 0.1) * profile.playerUnitAtkScale),
    className: base.className,
    attackAnim: base.attackAnim,
    level,
    golden: level >= 10,
  };
}

function livingUnits(team) {
  let count = 0;
  for (const entity of state.entities) {
    if (entity.team === team && entity.hp > 0) {
      count += 1;
    }
  }
  return count;
}

function incomePerTick() {
  const world = levelTheme();
  const profile = difficultyProfile();
  const playerUnits = livingUnits("player");
  const enemyUnits = livingUnits("enemy");
  const pressure = enemyUnits - playerUnits;
  const baseGain = Math.max(1, world.moneyGain + profile.incomeFlatBonus);
  let gain = baseGain + Math.floor(state.timeMs / 65000);

  if (state.playerBaseHp / Math.max(1, state.playerBaseMaxHp) < 0.5) {
    gain += 1;
  }
  if (pressure >= 2) {
    gain += 1;
  }
  if (pressure >= 4) {
    gain += 1;
  }

  return clamp(gain, baseGain, baseGain + 4);
}

function bossSpawnTime() {
  const base = BALANCE.bossBaseTimes[state.levelIndex % BALANCE.bossBaseTimes.length];
  const profile = difficultyProfile();
  const playerHpRatio = state.playerBaseHp / Math.max(1, state.playerBaseMaxHp);
  const enemyHpRatio = state.enemyBaseHp / Math.max(1, state.enemyBaseMaxHp);
  let spawnAt = base + profile.bossDelayShift;

  if (playerHpRatio < 0.55) {
    spawnAt += 7000;
  }
  if (enemyHpRatio < 0.55) {
    spawnAt -= 5000;
  }

  return clamp(spawnAt, 56000, 108000);
}

function enemyForWave() {
  const world = levelTheme();
  const profile = difficultyProfile();
  const elapsedTier = Math.min(4, Math.floor(state.timeMs / 22000));
  const maxIndex = Math.min(enemyDefs.length - 1, elapsedTier + 1);
  const pick = enemyDefs[Math.floor(Math.random() * (maxIndex + 1))];
  const diff = world.difficulty * profile.enemyStatScale;
  const phase = Math.min(1, state.timeMs / 130000);
  const playerUnits = livingUnits("player");
  const enemyUnits = livingUnits("enemy");
  const pressure = clamp((playerUnits - enemyUnits) * 0.03, -0.09, 0.22);
  const timeScale = 1 + phase * 0.34 + Math.max(0, pressure);
  const atkScale = 1 + phase * 0.12 + Math.max(0, pressure * 0.6);
  const cooldownScale = (1 - phase * 0.1) * profile.enemyCooldownScale;

  return {
    hp: Math.round(pick.hp * diff * timeScale),
    atk: Math.round(pick.atk * diff * atkScale),
    speed: Number((pick.speed + (diff - 1) * 0.24 + phase * 0.2 + profile.enemySpeedShift).toFixed(2)),
    range: pick.range,
    cooldown: Math.max(390, Math.round((pick.cooldown - (diff - 1) * 70) * cooldownScale)),
    className: pick.className,
    attackAnim: pick.attackAnim,
    bounty: Math.round(pick.bounty * (diff + phase * 0.2) * profile.enemyBountyScale),
    baseDamage: Math.round(pick.baseDamage * (0.9 + diff * 0.15) * profile.enemyBaseDamageScale),
  };
}

function createUnitElement(team, className, golden) {
  const el = document.createElement("div");
  const sideClass = team === "player" ? "cat" : "enemy";
  const facingClass = team === "player" ? "facing-left" : "facing-right";
  el.className = `entity ${sideClass} ${className} ${facingClass}`;
  if (golden) {
    el.classList.add("golden");
  }

  const spriteClass = team === "player" ? "cat-sprite" : "dog-sprite";
  el.innerHTML = `<div class="hp-rail"><div class="hp-fill"></div></div><div class="sprite ${spriteClass}"></div>`;
  lane.appendChild(el);
  return el;
}

function createEntity(team, stats, x) {
  const el = createUnitElement(team, stats.className, stats.golden);
  const spriteEl = el.querySelector(".sprite");
  const hpFillEl = el.querySelector(".hp-fill");
  const catAnim = team === "player" ? { action: "walk", frame: 0, lastFrameAt: 0 } : null;

  return {
    id: state.nextId++,
    team,
    x,
    hp: stats.hp,
    maxHp: stats.hp,
    atk: stats.atk,
    speed: stats.speed,
    range: stats.range,
    cooldown: stats.cooldown,
    bounty: stats.bounty || 0,
    baseDamage: stats.baseDamage || Math.max(10, Math.round(stats.atk * 0.9)),
    className: stats.className,
    attackAnim: stats.attackAnim || (team === "player" ? "slash" : "bite"),
    lastAttackAt: 0,
    moving: false,
    attackUntil: 0,
    hurtUntil: 0,
    spriteEl,
    hpFillEl,
    catAnim,
    el,
  };
}

function cooldownRemaining(catKey) {
  const lastUse = state.catCooldowns[catKey] ?? -999999;
  const cat = baseForCat(catKey);
  return Math.max(0, cat.spawnCd - (state.timeMs - lastUse));
}

function spawnPlayer(catKey) {
  if (!state.running || state.paused || !state.unlockedCats.includes(catKey)) {
    return;
  }

  const unit = baseForCat(catKey);
  const cooldownLeft = cooldownRemaining(catKey);
  if (cooldownLeft > 0) {
    showHint(`${unit.name} is recharging (${(cooldownLeft / 1000).toFixed(1)}s).`, "warn");
    return;
  }

  if (state.money < unit.cost) {
    showHint("Need more money for that cat.", "warn");
    return;
  }

  state.money -= unit.cost;
  state.catCooldowns[catKey] = state.timeMs;
  state.entities.push(createEntity("player", unit, PLAYER_SPAWN_X));
  playSfx("spawn");
  updatePanels();
}

function spawnEnemy() {
  const profile = difficultyProfile();

  if (!state.bossSpawned && state.timeMs >= bossSpawnTime()) {
    const world = levelTheme();
    const diff = world.difficulty * profile.bossStatScale;
    const bossStats = {
      hp: Math.round(bossDef.hp * diff),
      atk: Math.round(bossDef.atk * diff),
      speed: Number((bossDef.speed + profile.enemySpeedShift * 0.45).toFixed(2)),
      range: bossDef.range,
      cooldown: Math.max(520, Math.round((bossDef.cooldown - (diff - 1) * 70) * profile.enemyCooldownScale)),
      className: bossDef.className,
      attackAnim: bossDef.attackAnim,
      bounty: Math.round(bossDef.bounty * diff * profile.enemyBountyScale),
      baseDamage: Math.round(bossDef.baseDamage * (0.9 + diff * 0.2) * profile.bossBaseDamageScale),
    };
    state.entities.push(createEntity("enemy", bossStats, ENEMY_SPAWN_X));
    state.bossSpawned = true;
    showHint("Boss hound enters the battlefield!", "warn");
    playSfx("boss");
    return;
  }

  state.entities.push(createEntity("enemy", enemyForWave(), ENEMY_SPAWN_X));

  const doubleWaveStart = BALANCE.doubleWaveStartMs + profile.doubleWaveStartShift;
  const doubleChance = clamp((0.2 + Math.min(0.2, state.timeMs / 240000)) * profile.extraWaveChanceScale, 0.08, 0.65);
  if (state.timeMs > doubleWaveStart && Math.random() < doubleChance) {
    state.entities.push(createEntity("enemy", enemyForWave(), ENEMY_SPAWN_X + 18));
  }

  const tripleChance = clamp(0.12 * profile.extraWaveChanceScale, 0.04, 0.32);
  if (state.timeMs > 85000 + profile.doubleWaveStartShift && state.levelIndex >= 2 && Math.random() < tripleChance) {
    state.entities.push(createEntity("enemy", enemyForWave(), ENEMY_SPAWN_X + 34));
  }
}

function nearestTarget(attacker) {
  let best = null;
  let bestDist = Infinity;

  for (const target of state.entities) {
    if (target.team === attacker.team || target.hp <= 0) {
      continue;
    }

    if (attacker.team === "player" && target.x > attacker.x + 8) {
      continue;
    }
    if (attacker.team === "enemy" && target.x < attacker.x - 8) {
      continue;
    }

    const dist = Math.abs(target.x - attacker.x);
    if (dist < bestDist) {
      best = target;
      bestDist = dist;
    }
  }

  return { target: best, distance: bestDist };
}

function spawnHitEffect(worldX, strong = false) {
  const effect = document.createElement("div");
  effect.className = "hit-effect";
  if (strong) {
    effect.classList.add("strong");
  }
  effect.style.left = `${worldToLaneX(worldX)}px`;
  lane.appendChild(effect);
  window.setTimeout(() => effect.remove(), 280);
}

function spawnFloatingText(worldX, text, kind = "neutral") {
  const pop = document.createElement("div");
  pop.className = `floating-text ${kind}`;
  pop.style.left = `${worldToLaneX(worldX)}px`;
  pop.textContent = text;
  lane.appendChild(pop);
  window.setTimeout(() => pop.remove(), 680);
}

function shakeLane() {
  lane.classList.remove("shake");
  void lane.offsetWidth;
  lane.classList.add("shake");
  window.setTimeout(() => lane.classList.remove("shake"), 260);
}

function triggerAttackAnimation(attacker) {
  attacker.el.classList.remove("walking");
  attacker.el.classList.remove("atk-slash", "atk-bite", "atk-slam", "atk-spit");
  attacker.el.classList.add("attacking", `atk-${attacker.attackAnim}`);
  attacker.attackUntil = state.timeMs + 220;

  window.setTimeout(() => {
    attacker.el.classList.remove("attacking", `atk-${attacker.attackAnim}`);
  }, 220);
}

function attack(attacker, victim) {
  victim.hp -= attacker.atk;
  victim.hurtUntil = state.timeMs + 180;

  attacker.lastAttackAt = state.timeMs;
  triggerAttackAnimation(attacker);
  spawnHitEffect(victim.x, attacker.className === "boss");
  playSfx(attacker.team === "player" ? "cat-hit" : "dog-hit");

  if (victim.hp <= 0) {
    victim.hp = 0;
    if (victim.team === "enemy" && victim.bounty > 0) {
      state.money += victim.bounty;
      spawnFloatingText(victim.x, `+$${victim.bounty}`, "money");
      playSfx("coin");
    }
  }
}

function applyBaseDamage(unit) {
  const damage = Math.max(10, unit.baseDamage || Math.round(unit.atk * 0.9));

  if (unit.team === "player" && unit.x <= ENEMY_BASE_X) {
    state.enemyBaseHp -= damage;
    unit.hp = 0;
    spawnHitEffect(ENEMY_BASE_X, true);
    spawnFloatingText(ENEMY_BASE_X, `-${damage}`, "enemy");
    showHint(`Cat strike! Enemy base -${damage} HP.`, "good");
    shakeLane();
    playSfx("enemy-base-hit");
  }

  if (unit.team === "enemy" && unit.x >= PLAYER_BASE_X) {
    state.playerBaseHp -= damage;
    unit.hp = 0;
    spawnHitEffect(PLAYER_BASE_X, true);
    spawnFloatingText(PLAYER_BASE_X, `-${damage}`, "player");
    showHint(`Enemy hit your base for ${damage} HP!`, "bad");
    shakeLane();
    playSfx("player-base-hit");
  }
}

function moveUnit(unit) {
  const dir = unit.team === "player" ? -1 : 1;
  unit.x += dir * unit.speed;
  unit.x = clamp(unit.x, LANE_MIN_X, LANE_MAX_X);
  unit.moving = true;
  unit.el.classList.add("walking");
}

function updateEntities() {
  for (const unit of state.entities) {
    if (unit.hp <= 0) {
      continue;
    }

    unit.moving = false;
    const { target, distance } = nearestTarget(unit);
    const canHit = Boolean(target) && distance <= unit.range;
    const attackReady = state.timeMs - unit.lastAttackAt >= unit.cooldown;

    if (canHit) {
      unit.el.classList.remove("walking");
      if (attackReady) {
        attack(unit, target);
      }
      continue;
    }

    if (target && distance <= unit.range + 10) {
      unit.el.classList.remove("walking");
      continue;
    }

    moveUnit(unit);
    applyBaseDamage(unit);
  }

  state.entities = state.entities.filter((unit) => {
    if (unit.hp > 0) {
      return true;
    }

    unit.el.classList.add("defeated");
    window.setTimeout(() => unit.el.remove(), 70);
    return false;
  });
}

function currentCatAction(unit) {
  if (!unit.catAnim) {
    return "walk";
  }
  if (unit.hurtUntil > state.timeMs) {
    return "hurt";
  }
  if (unit.attackUntil > state.timeMs) {
    return "attack";
  }
  return unit.moving ? "walk" : "walk";
}

function applyCatSpriteFrame(unit, forceReset = false) {
  if (!unit.catAnim || !unit.spriteEl) {
    return;
  }

  const action = currentCatAction(unit);
  const anim = unit.catAnim;

  if (forceReset || anim.action !== action) {
    anim.action = action;
    anim.frame = 0;
    anim.lastFrameAt = state.timeMs;
  }

  const actionDef = CAT_SHEET.actions[action];
  const frameCount = actionDef.frames.length;
  if (frameCount > 1 && state.timeMs - anim.lastFrameAt >= actionDef.frameMs) {
    anim.frame = (anim.frame + 1) % frameCount;
    anim.lastFrameAt = state.timeMs;
  }

  const frameRect = getCatFrameRect(action, anim.frame);
  if (!frameRect || !catSheetImage) {
    return;
  }

  unit.spriteEl.style.backgroundSize = `${catSheetImage.naturalWidth}px ${catSheetImage.naturalHeight}px`;
  unit.spriteEl.style.backgroundPosition = `-${frameRect.x}px -${frameRect.y}px`;
  unit.spriteEl.style.width = `${frameRect.w}px`;
  unit.spriteEl.style.height = `${frameRect.h}px`;
}

function updateCatSprites() {
  for (const unit of state.entities) {
    if (unit.team === "player") {
      applyCatSpriteFrame(unit);
    }
  }
}

function drawEntities() {
  for (const unit of state.entities) {
    unit.el.style.left = `${worldToLaneX(unit.x)}px`;

    if (unit.hpFillEl) {
      const hpRatio = clamp(unit.hp / unit.maxHp, 0, 1);
      unit.hpFillEl.style.width = `${Math.round(hpRatio * 100)}%`;
      unit.hpFillEl.classList.toggle("low", hpRatio < 0.35);
    }
  }

  updateCatSprites();
}

function unlockNextCat() {
  for (const catKey of unlockOrder) {
    if (!state.unlockedCats.includes(catKey)) {
      state.unlockedCats.push(catKey);
      state.upgrades[catKey] = state.upgrades[catKey] ?? 1;
      state.catCooldowns[catKey] = -999999;
      showHint(`New cat unlocked: ${catDefs[catKey].name}`, "good");
      playSfx("unlock");
      return true;
    }
  }
  return false;
}

function endMatch(playerWon) {
  if (state.endedThisRound) {
    return;
  }

  state.running = false;
  state.paused = false;
  state.settingsOpen = false;
  state.endedThisRound = true;
  state.matchCount += 1;

  if (playerWon) {
    state.lastOutcome = "victory";
    state.levelIndex = (state.levelIndex + 1) % levels.length;
    const gotUnlock = unlockNextCat();
    showHint(gotUnlock ? "Victory! New cat unlocked for next match." : "Victory! Next stage unlocked.", "good");
    playSfx("victory");
  } else {
    state.lastOutcome = "defeat";
    showHint("Defeat. Upgrade your cats in the shop and try again.", "bad");
    playSfx("defeat");
  }

  renderUnitButtons();
  renderShop();
  updatePanels();
  saveProgress();
}

function checkGameOver() {
  if (!state.running) {
    return;
  }

  if (state.enemyBaseHp <= 0) {
    state.enemyBaseHp = 0;
    endMatch(true);
  } else if (state.playerBaseHp <= 0) {
    state.playerBaseHp = 0;
    endMatch(false);
  }
}

function levelSpawnDelay() {
  const world = levelTheme();
  const profile = difficultyProfile();
  const elapsedSteps = Math.floor(state.timeMs / 15000);
  const ramp = elapsedSteps * BALANCE.spawnRampPer15s;
  const enemyCount = livingUnits("enemy");
  const playerCount = livingUnits("player");
  const crowdSlowdown = Math.max(0, enemyCount - 7) * BALANCE.crowdSlowdownMs;
  const playerMomentum = Math.max(0, playerCount - enemyCount) * 26;
  const bossPressure = state.bossSpawned ? -100 : 0;
  const hpPressure = state.enemyBaseHp / Math.max(1, state.enemyBaseMaxHp) < 0.45 ? -120 : 0;
  const delay = world.spawnBase + profile.spawnDelayShift - ramp + crowdSlowdown - playerMomentum + bossPressure + hpPressure;
  const floor = Math.max(680, Math.round(BALANCE.spawnFloorMs * profile.spawnFloorScale));
  return Math.max(floor, Math.round(delay));
}

function formatEta(ms) {
  if (ms <= 0) {
    return "Now";
  }

  const sec = ms / 1000;
  if (sec < 10) {
    return `${sec.toFixed(1)}s`;
  }
  if (sec < 60) {
    return `${Math.round(sec)}s`;
  }

  const minutes = Math.floor(sec / 60);
  const seconds = Math.round(sec % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function forecastSnapshot() {
  const profile = difficultyProfile();
  const spawnDelay = levelSpawnDelay();
  const nextWaveMs = Math.max(0, spawnDelay - state.enemySpawnTimer);
  const doubleWaveStart = BALANCE.doubleWaveStartMs + profile.doubleWaveStartShift;
  const doubleChance = clamp((0.2 + Math.min(0.2, state.timeMs / 240000)) * profile.extraWaveChanceScale, 0.08, 0.65);
  const tripleChance = clamp(0.12 * profile.extraWaveChanceScale, 0.04, 0.32);
  const tripleOpen = state.timeMs > 85000 + profile.doubleWaveStartShift && state.levelIndex >= 2;

  let waveType = "Single";
  if (state.timeMs >= doubleWaveStart) {
    if (tripleOpen) {
      waveType = `Double ${Math.round(doubleChance * 100)}% / Triple ${Math.round(tripleChance * 100)}%`;
    } else {
      waveType = `Single / Double ${Math.round(doubleChance * 100)}%`;
    }
  } else {
    waveType = `Single (double in ${formatEta(doubleWaveStart - state.timeMs)})`;
  }

  const bossAt = bossSpawnTime();
  let bossEta = "Defeated";
  if (!state.bossSpawned) {
    bossEta = formatEta(Math.max(0, bossAt - state.timeMs));
  } else {
    const bossAlive = state.entities.some((unit) => unit.className === bossDef.className && unit.hp > 0);
    bossEta = bossAlive ? "Active" : "Defeated";
  }

  return {
    nextWave: formatEta(nextWaveMs),
    waveType,
    bossEta,
  };
}

function threatSnapshot() {
  const playerUnits = livingUnits("player");
  const enemyUnits = livingUnits("enemy");
  const playerHpRatio = state.playerBaseHp / Math.max(1, state.playerBaseMaxHp);
  const enemyHpRatio = state.enemyBaseHp / Math.max(1, state.enemyBaseMaxHp);
  const frontPressure = enemyUnits - playerUnits;
  const elapsedPressure = clamp(state.timeMs / 120000, 0, 1);

  let score = 25;
  score += frontPressure * 10;
  score += (1 - playerHpRatio) * 40;
  score += elapsedPressure * 16;
  if (state.bossSpawned) {
    score += 14;
  }
  if (enemyHpRatio < 0.45) {
    score -= 10;
  }

  const threat = clamp(Math.round(score), 0, 100);
  let label = "Low pressure";
  if (threat >= 78) {
    label = "Critical pressure";
  } else if (threat >= 58) {
    label = "High pressure";
  } else if (threat >= 36) {
    label = "Rising pressure";
  }

  return { threat, label };
}

const MUSIC_MODES = [
  {
    root: 174,
    scale: [0, 2, 4, 7, 9],
    progression: [0, 5, 7, 4],
    lead: [0, 1, 2, 1, 2, 3, 2, 1],
    accent: [4, 3, 4, 2, 3, 2, 1, 2],
    bass: [0, -12, -12, -12, 2, -12, -12, -12],
  },
  {
    root: 165,
    scale: [0, 2, 5, 7, 10],
    progression: [0, 3, 5, 2],
    lead: [0, 2, 3, 2, 4, 3, 2, 1],
    accent: [2, 4, 3, 4, 2, 3, 1, 2],
    bass: [0, -12, -12, 0, 3, -12, -12, -12],
  },
  {
    root: 156,
    scale: [0, 3, 5, 7, 10],
    progression: [0, 5, 2, 7],
    lead: [0, 1, 2, 3, 2, 3, 1, 0],
    accent: [4, 3, 2, 3, 4, 2, 1, 2],
    bass: [0, -12, -12, -12, 5, -12, -12, -12],
  },
  {
    root: 148,
    scale: [0, 1, 4, 7, 8],
    progression: [0, 4, 1, 7],
    lead: [0, 2, 1, 2, 3, 2, 1, 0],
    accent: [4, 2, 3, 2, 4, 1, 2, 1],
    bass: [0, -12, -12, -12, 4, -12, -12, -12],
  },
];

function semitoneToFreq(rootFreq, semitoneOffset) {
  return rootFreq * Math.pow(2, semitoneOffset / 12);
}

function ensureNoiseBuffer() {
  if (!audio.context) {
    return null;
  }
  if (audio.noiseBuffer) {
    return audio.noiseBuffer;
  }

  const frameCount = Math.floor(audio.context.sampleRate * 0.18);
  const buffer = audio.context.createBuffer(1, frameCount, audio.context.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < frameCount; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }

  audio.noiseBuffer = buffer;
  return buffer;
}

function playNoiseBurst(options) {
  if (!audio.enabled || !ensureAudioContext() || !audio.context || !audio.musicGain || !audio.sfxGain) {
    return;
  }

  const duration = options.duration ?? 0.05;
  const volume = options.volume ?? 0.02;
  const highpass = options.highpass ?? 1100;
  const start = options.start ?? 0;
  const bus = options.bus ?? "music";
  const targetGain = bus === "music" ? audio.musicGain : audio.sfxGain;
  const buffer = ensureNoiseBuffer();

  if (!buffer) {
    return;
  }

  const ctx = audio.context;
  const now = ctx.currentTime + start;
  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.setValueAtTime(highpass, now);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(targetGain);
  source.start(now);
  source.stop(now + duration + 0.01);
}

function playKick(volume) {
  playTone({ freq: 122, type: "sine", duration: 0.11, volume, slideTo: 56, bus: "music" });
}

function playSnare(volume) {
  playTone({ freq: 210, type: "triangle", duration: 0.06, volume: volume * 0.55, slideTo: 150, bus: "music" });
  playNoiseBurst({ duration: 0.08, volume, highpass: 1300, bus: "music" });
}

function playHat(volume, start = 0) {
  playNoiseBurst({ duration: 0.03, volume, highpass: 4200, start, bus: "music" });
}

function updateMusic() {
  if (!audio.enabled || !ensureAudioContext() || !state.running || state.paused) {
    return;
  }

  if (state.timeMs < audio.nextMusicAt) {
    return;
  }

  const mode = MUSIC_MODES[state.levelIndex % MUSIC_MODES.length];
  const step = audio.musicStep;
  const beat = step % 8;
  const phrase = Math.floor(step / 8);
  const progressionShift = mode.progression[phrase % mode.progression.length];
  const playerUnits = livingUnits("player");
  const enemyUnits = livingUnits("enemy");
  const battlePressure = clamp((enemyUnits - playerUnits) * 0.04, -0.2, 0.3);
  const energyBase = clamp(state.timeMs / 90000, 0, 1);
  const bossBoost = state.bossSpawned ? 0.2 : 0;
  const difficultyBoost = state.difficulty === "hard" ? 0.08 : state.difficulty === "easy" ? -0.05 : 0;
  const energy = clamp(energyBase + bossBoost + Math.max(0, battlePressure) + difficultyBoost, 0, 1);

  const leadSemitone = mode.scale[mode.lead[beat] % mode.scale.length] + progressionShift;
  const accentSemitone = mode.scale[mode.accent[beat] % mode.scale.length] + progressionShift + 12;
  const bassSemitone = mode.bass[beat] + progressionShift;

  const leadFreq = semitoneToFreq(mode.root, leadSemitone + (energy > 0.72 && beat % 4 === 3 ? 12 : 0));
  const accentFreq = semitoneToFreq(mode.root, accentSemitone);
  const bassFreq = semitoneToFreq(mode.root, bassSemitone);

  playTone({
    freq: bassFreq,
    type: "sine",
    duration: 0.2,
    volume: 0.028 + energy * 0.018,
    slideTo: bassFreq * 0.96,
    bus: "music",
  });

  playTone({
    freq: leadFreq,
    type: energy > 0.55 ? "triangle" : "sine",
    duration: 0.17,
    volume: 0.025 + energy * 0.02,
    start: 0.01,
    bus: "music",
  });

  if (energy > 0.36 && beat % 2 === 0) {
    playTone({
      freq: accentFreq,
      type: "triangle",
      duration: 0.11,
      volume: 0.012 + energy * 0.012,
      start: 0.05,
      bus: "music",
    });
  }

  if (beat % 4 === 0) {
    playKick(0.045 + energy * 0.03);
  }
  if (energy > 0.22 && beat === 4) {
    playSnare(0.035 + energy * 0.025);
  }
  if (energy > 0.4 && beat % 2 === 1) {
    playHat(0.016 + energy * 0.012);
  }
  if (energy > 0.75 && beat % 4 === 3) {
    playHat(0.012 + energy * 0.01, 0.03);
  }

  audio.musicStep += 1;
  audio.nextMusicAt = state.timeMs + Math.round(230 - energy * 55);
}

function gameLoop() {
  if (!state.running) {
    drawEntities();
    updatePanels();
    return;
  }

  if (state.paused) {
    drawEntities();
    updatePanels();
    return;
  }

  state.timeMs += TICK_MS;
  state.enemySpawnTimer += TICK_MS;
  state.moneyTimer += TICK_MS;

  while (state.moneyTimer >= BALANCE.incomeTickMs) {
    state.money += incomePerTick();
    state.moneyTimer -= BALANCE.incomeTickMs;
  }

  if (state.enemySpawnTimer >= levelSpawnDelay()) {
    state.enemySpawnTimer = 0;
    spawnEnemy();
  }

  updateEntities();
  checkGameOver();
  drawEntities();
  updatePanels();
  updateMusic();
}

function levelCost(catKey) {
  const lv = state.upgrades[catKey] ?? 1;
  const baseCost = catDefs[catKey].cost;
  const profile = difficultyProfile();
  const base = 62 + baseCost * 0.85 + lv * 46 + Math.pow(lv, 1.75) * 2;
  return Math.round(base * profile.upgradeCostScale);
}

function upgradeCat(catKey) {
  if (state.paused || !state.unlockedCats.includes(catKey)) {
    return;
  }

  const current = state.upgrades[catKey] ?? 1;
  if (current >= 10) {
    showHint(`${catDefs[catKey].name} is already golden.`, "warn");
    return;
  }

  const price = levelCost(catKey);
  if (state.money < price) {
    showHint("Not enough money for upgrade.", "warn");
    return;
  }

  state.money -= price;
  state.upgrades[catKey] = current + 1;
  if (state.upgrades[catKey] === 10) {
    showHint(`${catDefs[catKey].name} reached level 10 and turned golden.`, "good");
  } else {
    showHint(`${catDefs[catKey].name} upgraded to level ${state.upgrades[catKey]}.`, "good");
  }

  playSfx("upgrade");
  renderUnitButtons();
  renderShop();
  updatePanels();
  saveProgress();
}

function renderUnitButtons() {
  unitButtonsWrap.innerHTML = "";

  state.unlockedCats.forEach((catKey, index) => {
    const cat = baseForCat(catKey);
    const button = document.createElement("button");
    button.className = "unit-btn";
    if (cat.golden) {
      button.classList.add("gold");
    }

    button.dataset.unit = catKey;
    button.title = `Hotkey ${index + 1}`;
    button.innerHTML = `<strong>${index + 1}. ${cat.name} Lv${cat.level}${cat.golden ? " Gold" : ""}</strong><span class="meta">$${cat.cost}</span><span class="cooldown">Ready</span>`;
    button.addEventListener("click", () => spawnPlayer(catKey));
    unitButtonsWrap.appendChild(button);
  });

  syncControlStates();
}

function renderShop() {
  shopGrid.innerHTML = "";

  for (const catKey of state.unlockedCats) {
    const level = state.upgrades[catKey] ?? 1;
    const card = document.createElement("article");
    card.className = `shop-card ${level >= 10 ? "golden" : ""}`;
    card.dataset.unit = catKey;

    const title = document.createElement("h3");
    title.textContent = catDefs[catKey].name;

    const text = document.createElement("p");
    text.textContent = level >= 10
      ? "Level 10 Golden Cat unlocked"
      : `Level ${level} -> ${level + 1} upgrade costs $${levelCost(catKey)}`;

    const current = baseForCat(catKey);
    const stats = document.createElement("p");
    stats.className = "statline";
    stats.textContent = `HP ${current.hp} | ATK ${current.atk} | RNG ${current.range}`;

    const button = document.createElement("button");
    button.textContent = level >= 10 ? "Max Level" : "Upgrade";
    button.disabled = level >= 10 || !state.running || state.paused || state.money < levelCost(catKey);
    button.addEventListener("click", () => upgradeCat(catKey));

    card.appendChild(title);
    card.appendChild(text);
    card.appendChild(stats);
    card.appendChild(button);
    shopGrid.appendChild(card);
  }
}

function syncControlStates() {
  const controlsLocked = !state.running || state.paused;
  const unitButtons = unitButtonsWrap.querySelectorAll(".unit-btn");
  for (const button of unitButtons) {
    const catKey = button.dataset.unit;
    const cat = baseForCat(catKey);
    const remaining = cooldownRemaining(catKey);

    button.disabled = controlsLocked || state.money < cat.cost || remaining > 0;

    const metaEl = button.querySelector(".meta");
    const cooldownEl = button.querySelector(".cooldown");

    if (metaEl) {
      metaEl.textContent = `$${cat.cost}`;
    }

    if (cooldownEl) {
      if (!state.running) {
        cooldownEl.textContent = "Ended";
        cooldownEl.classList.remove("active");
      } else if (state.paused) {
        cooldownEl.textContent = "Paused";
        cooldownEl.classList.remove("active");
      } else if (remaining > 0) {
        cooldownEl.textContent = `CD ${(remaining / 1000).toFixed(1)}s`;
        cooldownEl.classList.add("active");
      } else {
        cooldownEl.textContent = "Ready";
        cooldownEl.classList.remove("active");
      }
    }
  }

  const shopCards = shopGrid.querySelectorAll(".shop-card");
  for (const card of shopCards) {
    const button = card.querySelector("button");
    if (!button) {
      continue;
    }

    const catKey = card.dataset.unit;
    if (!catKey) {
      continue;
    }

    const level = state.upgrades[catKey] ?? 1;
    button.disabled = level >= 10 || controlsLocked || state.money < levelCost(catKey);
  }
}

function updatePauseOverlay() {
  const isVisible = state.running && state.paused;

  if (pauseOverlayEl) {
    pauseOverlayEl.classList.toggle("visible", isVisible);
    pauseOverlayEl.setAttribute("aria-hidden", isVisible ? "false" : "true");
  }

  if (pauseToggleBtn) {
    pauseToggleBtn.textContent = isVisible ? "Resume" : "Pause";
    pauseToggleBtn.setAttribute("aria-pressed", isVisible ? "true" : "false");
    pauseToggleBtn.disabled = !state.running;
  }

  if (resumeBtn) {
    resumeBtn.disabled = !isVisible;
  }

  if (pauseTitleEl) {
    pauseTitleEl.textContent = state.running ? "Battle Paused" : "Match Over";
  }

  if (pauseStatusEl) {
    if (!state.running) {
      pauseStatusEl.textContent = state.lastOutcome === "victory"
        ? "Victory secured. Restart for the next match."
        : "Defeat. Upgrade your cats and restart.";
    } else if (state.paused) {
      const mode = DIFFICULTY_APPLY_MODES[state.difficultyApplyMode] || "Instant";
      const queued = state.pendingDifficulty ? ` | Queued ${DIFFICULTY_PROFILES[state.pendingDifficulty].label}` : "";
      pauseStatusEl.textContent = `${levelTheme().name} | ${difficultyProfile().label} | ${mode}${queued} | ${formatBattleTime(state.timeMs)} | Money $${Math.floor(state.money)}`;
    } else {
      pauseStatusEl.textContent = "Take a breath and adjust your audio mix.";
    }
  }
}

function setPaused(shouldPause, quiet = false) {
  if (!state.running) {
    return;
  }

  const nextPaused = Boolean(shouldPause);
  if (state.paused === nextPaused) {
    return;
  }

  state.paused = nextPaused;
  if (state.paused) {
    setSettingsOpen(false);
  }
  updatePanels();

  if (state.paused) {
    showHint("Paused. Press P or Esc to resume.", "warn");
    playSfx("pause");
  } else if (!quiet) {
    showHint("Battle resumed.", "good");
    playSfx("resume");
  }
}

function applyLevelTheme() {
  lane.className = "lane";
  lane.classList.add(levelTheme().themeClass);
}

function updateBattleIntel() {
  const forecast = forecastSnapshot();
  const threat = threatSnapshot();

  if (forecastNextWaveEl) {
    forecastNextWaveEl.textContent = forecast.nextWave;
  }
  if (forecastWaveTypeEl) {
    forecastWaveTypeEl.textContent = forecast.waveType;
  }
  if (forecastBossEl) {
    forecastBossEl.textContent = forecast.bossEta;
  }

  if (threatFillEl) {
    threatFillEl.style.width = `${threat.threat}%`;
  }
  if (threatMeterEl) {
    threatMeterEl.setAttribute("aria-valuenow", String(threat.threat));
  }
  if (threatTextEl) {
    threatTextEl.textContent = `${threat.label} (${threat.threat}%)`;
  }
}

function updatePanels() {
  moneyEl.textContent = String(Math.max(0, Math.floor(state.money)));
  playerBaseEl.textContent = String(Math.max(0, Math.floor(state.playerBaseHp)));
  enemyBaseEl.textContent = String(Math.max(0, Math.floor(state.enemyBaseHp)));
  levelNameEl.textContent = levelTheme().name;
  matchCountEl.textContent = String(state.matchCount);

  if (battleTimeEl) {
    battleTimeEl.textContent = formatBattleTime(state.timeMs);
  }

  if (statusEl) {
    statusEl.className = "";
    if (state.running && state.paused) {
      statusEl.textContent = "Paused";
      statusEl.classList.add("status-paused");
    } else if (state.running) {
      statusEl.textContent = "Battle";
      statusEl.classList.add("status-battle");
    } else if (state.lastOutcome === "victory") {
      statusEl.textContent = "Victory";
      statusEl.classList.add("status-victory");
    } else {
      statusEl.textContent = "Defeat";
      statusEl.classList.add("status-defeat");
    }
  }

  if (playerBaseBarEl) {
    const playerPct = clamp(state.playerBaseHp / Math.max(1, state.playerBaseMaxHp), 0, 1);
    playerBaseBarEl.style.width = `${Math.round(playerPct * 100)}%`;
  }

  if (enemyBaseBarEl) {
    const enemyPct = clamp(state.enemyBaseHp / Math.max(1, state.enemyBaseMaxHp), 0, 1);
    enemyBaseBarEl.style.width = `${Math.round(enemyPct * 100)}%`;
  }

  updateDifficultyButtons();
  updateApplyModeButtons();
  updateSettingToggles();
  updateBattleIntel();
  updateQuickSettingsPanel();
  updatePauseOverlay();
  syncControlStates();
}

function showHint(text, tone = "neutral") {
  hintEl.textContent = text;
  hintEl.classList.remove("good", "bad", "warn", "flash");

  if (tone === "good" || tone === "bad" || tone === "warn") {
    hintEl.classList.add(tone);
  }

  void hintEl.offsetWidth;
  hintEl.classList.add("flash");

  if (hintFlashTimer) {
    window.clearTimeout(hintFlashTimer);
  }
  hintFlashTimer = window.setTimeout(() => hintEl.classList.remove("flash"), 280);
}

function resetMatch() {
  clearLaneUnits();

  let pendingAppliedLabel = "";
  if (state.pendingDifficulty && DIFFICULTY_PROFILES[state.pendingDifficulty]) {
    state.difficulty = state.pendingDifficulty;
    pendingAppliedLabel = DIFFICULTY_PROFILES[state.pendingDifficulty].label;
    state.pendingDifficulty = null;
  }

  const world = levelTheme();
  const profile = difficultyProfile();
  state.money = Math.round(world.moneyStart * profile.startMoneyScale);
  state.playerBaseHp = Math.max(1, Math.round(world.playerBaseHp * profile.playerBaseHpScale));
  state.playerBaseMaxHp = state.playerBaseHp;
  state.enemyBaseHp = Math.max(1, Math.round(world.enemyBaseHp * profile.enemyBaseHpScale));
  state.enemyBaseMaxHp = state.enemyBaseHp;
  state.timeMs = 0;
  state.moneyTimer = 0;
  state.enemySpawnTimer = 0;
  state.running = true;
  state.paused = false;
  state.settingsOpen = false;
  state.endedThisRound = false;
  state.bossSpawned = false;
  state.lastOutcome = "battle";

  for (const catKey of Object.keys(catDefs)) {
    state.catCooldowns[catKey] = -999999;
  }

  audio.musicStep = 0;
  audio.nextMusicAt = 200;

  applyLevelTheme();
  if (pendingAppliedLabel) {
    showHint(`Queued difficulty applied: ${pendingAppliedLabel}. Deploy from the right and push the lane!`, "good");
  } else {
    showHint(`Deploy from the right. Difficulty ${profile.label}. Hotkeys 1-5 spawn cats, O opens settings, P pauses, M mutes.`);
  }
  renderUnitButtons();
  renderShop();
  updatePanels();
  saveProgress();
}

function ensureAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return false;
  }

  if (!audio.context) {
    audio.context = new AudioContextClass();
    audio.masterGain = audio.context.createGain();
    audio.musicGain = audio.context.createGain();
    audio.sfxGain = audio.context.createGain();
    audio.masterGain.gain.value = 0.72;
    audio.musicGain.gain.value = clamp(audio.musicVolume, 0, 1);
    audio.sfxGain.gain.value = clamp(audio.sfxVolume, 0, 1);
    audio.musicGain.connect(audio.masterGain);
    audio.sfxGain.connect(audio.masterGain);
    audio.masterGain.connect(audio.context.destination);
  }

  if (audio.enabled && audio.context.state === "suspended") {
    void audio.context.resume();
  }

  applyAudioVolumes();

  return audio.context.state === "running";
}

function updateAudioButton() {
  const label = audio.enabled ? "Sound On" : "Sound Off";
  if (audioToggleBtn) {
    audioToggleBtn.textContent = label;
    audioToggleBtn.setAttribute("aria-pressed", audio.enabled ? "true" : "false");
  }

  if (quickAudioToggleBtn) {
    quickAudioToggleBtn.textContent = label;
    quickAudioToggleBtn.setAttribute("aria-pressed", audio.enabled ? "true" : "false");
  }

  if (pauseAudioToggleBtn) {
    pauseAudioToggleBtn.textContent = label;
    pauseAudioToggleBtn.setAttribute("aria-pressed", audio.enabled ? "true" : "false");
  }
}

function setAudioEnabled(enabled) {
  audio.enabled = Boolean(enabled);
  if (audio.enabled) {
    ensureAudioContext();
  }
  applyAudioVolumes(true);
  saveAudioPreference();
  updateAudioButton();
  updateVolumeControls();
}

function playTone(options) {
  if (!audio.enabled || !ensureAudioContext() || !audio.context || !audio.musicGain || !audio.sfxGain) {
    return;
  }

  const freq = options.freq ?? 440;
  const type = options.type ?? "sine";
  const duration = options.duration ?? 0.12;
  const volume = options.volume ?? 0.06;
  const start = options.start ?? 0;
  const detune = options.detune ?? 0;
  const slideTo = options.slideTo ?? null;
  const bus = options.bus ?? "sfx";
  const targetGain = bus === "music" ? audio.musicGain : audio.sfxGain;

  const ctx = audio.context;
  const now = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  osc.detune.setValueAtTime(detune, now);
  if (slideTo) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), now + duration);
  }

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(gain);
  gain.connect(targetGain);

  osc.start(now);
  osc.stop(now + duration + 0.03);
}

function canPlaySfx(key, minGapMs) {
  const last = audio.lastSfxAt[key] ?? -999999;
  if (state.timeMs - last < minGapMs) {
    return false;
  }

  audio.lastSfxAt[key] = state.timeMs;
  return true;
}

function playSfx(kind) {
  switch (kind) {
    case "spawn":
      if (!canPlaySfx("spawn", 80)) {
        return;
      }
      playTone({ freq: 510, type: "square", duration: 0.06, volume: 0.05 });
      playTone({ freq: 700, type: "square", duration: 0.07, volume: 0.045, start: 0.05 });
      break;
    case "upgrade":
      playTone({ freq: 460, type: "triangle", duration: 0.09, volume: 0.06 });
      playTone({ freq: 620, type: "triangle", duration: 0.11, volume: 0.055, start: 0.06 });
      playTone({ freq: 820, type: "triangle", duration: 0.14, volume: 0.05, start: 0.12 });
      break;
    case "cat-hit":
      if (!canPlaySfx("cat-hit", 65)) {
        return;
      }
      playTone({ freq: 300, type: "square", duration: 0.05, volume: 0.04, slideTo: 220 });
      break;
    case "dog-hit":
      if (!canPlaySfx("dog-hit", 65)) {
        return;
      }
      playTone({ freq: 170, type: "sawtooth", duration: 0.06, volume: 0.04, slideTo: 120 });
      break;
    case "coin":
      if (!canPlaySfx("coin", 90)) {
        return;
      }
      playTone({ freq: 920, type: "triangle", duration: 0.07, volume: 0.04 });
      playTone({ freq: 1250, type: "triangle", duration: 0.08, volume: 0.03, start: 0.03 });
      break;
    case "enemy-base-hit":
      playTone({ freq: 120, type: "sawtooth", duration: 0.16, volume: 0.06, slideTo: 85 });
      break;
    case "player-base-hit":
      playTone({ freq: 95, type: "sawtooth", duration: 0.2, volume: 0.07, slideTo: 70 });
      break;
    case "unlock":
      playTone({ freq: 520, type: "triangle", duration: 0.09, volume: 0.05 });
      playTone({ freq: 780, type: "triangle", duration: 0.12, volume: 0.05, start: 0.05 });
      playTone({ freq: 1050, type: "triangle", duration: 0.15, volume: 0.045, start: 0.1 });
      break;
    case "boss":
      playTone({ freq: 110, type: "sawtooth", duration: 0.3, volume: 0.08, slideTo: 72 });
      playTone({ freq: 65, type: "square", duration: 0.2, volume: 0.06, start: 0.07 });
      break;
    case "victory":
      playTone({ freq: 520, type: "triangle", duration: 0.12, volume: 0.06 });
      playTone({ freq: 680, type: "triangle", duration: 0.12, volume: 0.06, start: 0.08 });
      playTone({ freq: 880, type: "triangle", duration: 0.17, volume: 0.06, start: 0.16 });
      break;
    case "defeat":
      playTone({ freq: 320, type: "sawtooth", duration: 0.16, volume: 0.06, slideTo: 180 });
      playTone({ freq: 190, type: "sawtooth", duration: 0.2, volume: 0.055, start: 0.07, slideTo: 110 });
      break;
    case "pause":
      playTone({ freq: 410, type: "triangle", duration: 0.08, volume: 0.05 });
      playTone({ freq: 300, type: "triangle", duration: 0.1, volume: 0.045, start: 0.04 });
      break;
    case "resume":
      playTone({ freq: 360, type: "triangle", duration: 0.08, volume: 0.05 });
      playTone({ freq: 500, type: "triangle", duration: 0.1, volume: 0.045, start: 0.04 });
      break;
    default:
      break;
  }
}

function handleKeyControls(event) {
  if (event.repeat) {
    return;
  }

  const key = event.key.toLowerCase();
  if (key === "escape" && state.settingsOpen) {
    setSettingsOpen(false);
    return;
  }

  if (key === "p" || key === "escape") {
    if (state.running) {
      setPaused(!state.paused);
    }
    return;
  }

  if (key === "o") {
    if (state.running && !state.paused) {
      setSettingsOpen(!state.settingsOpen);
    }
    return;
  }

  if (key === "m") {
    setAudioEnabled(!audio.enabled);
    showHint(audio.enabled ? "Sound enabled." : "Sound muted.", "warn");
    return;
  }

  if (key === "r") {
    resetMatch();
    return;
  }

  if (state.paused) {
    return;
  }

  const hotkey = Number.parseInt(event.key, 10);
  if (!Number.isNaN(hotkey) && hotkey >= 1 && hotkey <= state.unlockedCats.length) {
    const catKey = state.unlockedCats[hotkey - 1];
    spawnPlayer(catKey);
  }
}

function primeAudioFromGesture() {
  if (!audio.enabled) {
    return;
  }

  ensureAudioContext();
  applyAudioVolumes(true);
}

loadProgress();
loadAudioPreference();
initCatSheet();

resetBtn.addEventListener("click", () => {
  if (state.paused) {
    setPaused(false, true);
  }
  setSettingsOpen(false);
  resetMatch();
});

if (pauseToggleBtn) {
  pauseToggleBtn.addEventListener("click", () => {
    if (!state.running) {
      return;
    }
    setPaused(!state.paused);
  });
}

if (resumeBtn) {
  resumeBtn.addEventListener("click", () => setPaused(false));
}

if (pauseRestartBtn) {
  pauseRestartBtn.addEventListener("click", () => {
    if (state.paused) {
      setPaused(false, true);
    }
    setSettingsOpen(false);
    resetMatch();
  });
}

if (settingsToggleBtn) {
  settingsToggleBtn.addEventListener("click", () => {
    if (!state.running || state.paused) {
      return;
    }
    setSettingsOpen(!state.settingsOpen);
  });
}

if (quickRestartBtn) {
  quickRestartBtn.addEventListener("click", () => {
    if (state.paused) {
      setPaused(false, true);
    }
    setSettingsOpen(false);
    resetMatch();
  });
}

if (audioToggleBtn) {
  audioToggleBtn.addEventListener("click", () => {
    setAudioEnabled(!audio.enabled);
    showHint(audio.enabled ? "Sound enabled. Press M to mute." : "Sound muted.", "warn");
  });
}

if (quickAudioToggleBtn) {
  quickAudioToggleBtn.addEventListener("click", () => {
    setAudioEnabled(!audio.enabled);
    showHint(audio.enabled ? "Sound enabled." : "Sound muted.", "warn");
  });
}

if (pauseAudioToggleBtn) {
  pauseAudioToggleBtn.addEventListener("click", () => {
    setAudioEnabled(!audio.enabled);
    showHint(audio.enabled ? "Sound enabled." : "Sound muted.", "warn");
  });
}

if (musicVolumeInput) {
  musicVolumeInput.addEventListener("input", () => {
    const value = Number(musicVolumeInput.value);
    if (Number.isFinite(value)) {
      setMusicVolume(value / 100);
      primeAudioFromGesture();
    }
  });
}

if (sfxVolumeInput) {
  sfxVolumeInput.addEventListener("input", () => {
    const value = Number(sfxVolumeInput.value);
    if (Number.isFinite(value)) {
      setSfxVolume(value / 100);
      primeAudioFromGesture();
    }
  });
}

if (quickMusicVolumeInput) {
  quickMusicVolumeInput.addEventListener("input", () => {
    const value = Number(quickMusicVolumeInput.value);
    if (Number.isFinite(value)) {
      setMusicVolume(value / 100);
      primeAudioFromGesture();
    }
  });
}

if (quickSfxVolumeInput) {
  quickSfxVolumeInput.addEventListener("input", () => {
    const value = Number(quickSfxVolumeInput.value);
    if (Number.isFinite(value)) {
      setSfxVolume(value / 100);
      primeAudioFromGesture();
    }
  });
}

for (const button of difficultyButtons) {
  button.addEventListener("click", () => {
    const key = button.dataset.difficulty;
    if (key) {
      requestDifficultyChange(key);
    }
  });
}

for (const button of applyModeButtons) {
  button.addEventListener("click", () => {
    const mode = button.dataset.applyMode;
    if (mode) {
      setDifficultyApplyMode(mode);
    }
  });
}

for (const input of settingToggles) {
  input.addEventListener("change", () => {
    const setting = input.dataset.setting;
    if (setting === "difficulty-lock") {
      setDifficultyLock(input.checked);
      if (input.checked) {
        showHint("Difficulty lock enabled for active battles.", "good");
      }
      return;
    }
    if (setting === "hard-confirm") {
      setHardConfirm(input.checked);
      showHint(input.checked ? "Hard mode confirmation enabled." : "Hard mode confirmation disabled.", "warn");
    }
  });
}

if (pauseOverlayEl) {
  pauseOverlayEl.addEventListener("click", (event) => {
    if (event.target === pauseOverlayEl) {
      setPaused(false);
    }
  });
}

window.addEventListener("pointerdown", primeAudioFromGesture, { once: true });
window.addEventListener("pointerdown", (event) => {
  if (!state.settingsOpen || !quickSettingsEl || !settingsToggleBtn) {
    return;
  }

  const target = event.target;
  if (!(target instanceof Node)) {
    return;
  }

  if (quickSettingsEl.contains(target) || settingsToggleBtn.contains(target)) {
    return;
  }

  setSettingsOpen(false);
});
window.addEventListener("keydown", primeAudioFromGesture, { once: true });
window.addEventListener("keydown", handleKeyControls);

resetMatch();
window.setInterval(gameLoop, TICK_MS);
