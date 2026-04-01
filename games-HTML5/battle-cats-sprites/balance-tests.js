"use strict";

const BALANCE = {
  spawnFloorMs: 1080,
  spawnRampPer15s: 78,
  crowdSlowdownMs: 110,
  bossBaseTimes: [92000, 84000, 77000, 71000],
};

const DIFFICULTY_PROFILES = {
  easy: {
    incomeFlatBonus: 1,
    spawnDelayShift: 280,
    spawnFloorScale: 1.12,
    bossDelayShift: 10000,
  },
  normal: {
    incomeFlatBonus: 0,
    spawnDelayShift: 0,
    spawnFloorScale: 1,
    bossDelayShift: 0,
  },
  hard: {
    incomeFlatBonus: 0,
    spawnDelayShift: -190,
    spawnFloorScale: 0.92,
    bossDelayShift: -8500,
  },
};

const LEVELS = [
  { moneyGain: 2, spawnBase: 4200 },
  { moneyGain: 2, spawnBase: 3900 },
  { moneyGain: 3, spawnBase: 3600 },
  { moneyGain: 3, spawnBase: 3300 },
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function incomePerTick(input) {
  const world = LEVELS[input.levelIndex % LEVELS.length];
  const profile = DIFFICULTY_PROFILES[input.difficulty];
  const pressure = input.enemyUnits - input.playerUnits;
  const baseGain = Math.max(1, world.moneyGain + profile.incomeFlatBonus);
  let gain = baseGain + Math.floor(input.timeMs / 65000);

  if (input.playerBaseHpRatio < 0.5) {
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

function levelSpawnDelay(input) {
  const world = LEVELS[input.levelIndex % LEVELS.length];
  const profile = DIFFICULTY_PROFILES[input.difficulty];
  const elapsedSteps = Math.floor(input.timeMs / 15000);
  const ramp = elapsedSteps * BALANCE.spawnRampPer15s;
  const crowdSlowdown = Math.max(0, input.enemyUnits - 7) * BALANCE.crowdSlowdownMs;
  const playerMomentum = Math.max(0, input.playerUnits - input.enemyUnits) * 26;
  const bossPressure = input.bossSpawned ? -100 : 0;
  const hpPressure = input.enemyBaseHpRatio < 0.45 ? -120 : 0;
  const delay = world.spawnBase + profile.spawnDelayShift - ramp + crowdSlowdown - playerMomentum + bossPressure + hpPressure;
  const floor = Math.max(680, Math.round(BALANCE.spawnFloorMs * profile.spawnFloorScale));
  return Math.max(floor, Math.round(delay));
}

function bossSpawnTime(input) {
  const profile = DIFFICULTY_PROFILES[input.difficulty];
  const base = BALANCE.bossBaseTimes[input.levelIndex % BALANCE.bossBaseTimes.length];
  let spawnAt = base + profile.bossDelayShift;

  if (input.playerBaseHpRatio < 0.55) {
    spawnAt += 7000;
  }
  if (input.enemyBaseHpRatio < 0.55) {
    spawnAt -= 5000;
  }

  return clamp(spawnAt, 56000, 108000);
}

const tests = [
  {
    name: "income easy early baseline",
    actual: incomePerTick({
      levelIndex: 0,
      difficulty: "easy",
      timeMs: 0,
      playerUnits: 2,
      enemyUnits: 2,
      playerBaseHpRatio: 1,
    }),
    expected: 3,
  },
  {
    name: "income normal under pressure cap",
    actual: incomePerTick({
      levelIndex: 0,
      difficulty: "normal",
      timeMs: 130000,
      playerUnits: 2,
      enemyUnits: 6,
      playerBaseHpRatio: 0.49,
    }),
    expected: 6,
  },
  {
    name: "income hard midgame comeback",
    actual: incomePerTick({
      levelIndex: 2,
      difficulty: "hard",
      timeMs: 70000,
      playerUnits: 4,
      enemyUnits: 6,
      playerBaseHpRatio: 0.48,
    }),
    expected: 6,
  },
  {
    name: "spawn delay normal early lane",
    actual: levelSpawnDelay({
      levelIndex: 0,
      difficulty: "normal",
      timeMs: 30000,
      playerUnits: 3,
      enemyUnits: 4,
      enemyBaseHpRatio: 1,
      bossSpawned: false,
    }),
    expected: 4044,
  },
  {
    name: "spawn delay hard pressure burst",
    actual: levelSpawnDelay({
      levelIndex: 2,
      difficulty: "hard",
      timeMs: 90000,
      playerUnits: 7,
      enemyUnits: 11,
      enemyBaseHpRatio: 0.4,
      bossSpawned: true,
    }),
    expected: 3162,
  },
  {
    name: "spawn delay floor guard",
    actual: levelSpawnDelay({
      levelIndex: 3,
      difficulty: "hard",
      timeMs: 330000,
      playerUnits: 22,
      enemyUnits: 0,
      enemyBaseHpRatio: 0.2,
      bossSpawned: true,
    }),
    expected: 994,
  },
  {
    name: "boss timing normal default",
    actual: bossSpawnTime({
      levelIndex: 0,
      difficulty: "normal",
      playerBaseHpRatio: 1,
      enemyBaseHpRatio: 1,
    }),
    expected: 92000,
  },
  {
    name: "boss timing easy tug-of-war",
    actual: bossSpawnTime({
      levelIndex: 2,
      difficulty: "easy",
      playerBaseHpRatio: 0.5,
      enemyBaseHpRatio: 0.4,
    }),
    expected: 89000,
  },
  {
    name: "boss timing hard acceleration",
    actual: bossSpawnTime({
      levelIndex: 3,
      difficulty: "hard",
      playerBaseHpRatio: 0.4,
      enemyBaseHpRatio: 0.3,
    }),
    expected: 64500,
  },
  {
    name: "boss timing clamp high",
    actual: bossSpawnTime({
      levelIndex: 0,
      difficulty: "easy",
      playerBaseHpRatio: 0.4,
      enemyBaseHpRatio: 1,
    }),
    expected: 108000,
  },
];

let failed = 0;
for (const test of tests) {
  if (test.actual !== test.expected) {
    failed += 1;
    console.error(`[FAIL] ${test.name}: expected ${test.expected}, got ${test.actual}`);
  } else {
    console.log(`[PASS] ${test.name}: ${test.actual}`);
  }
}

if (failed > 0) {
  console.error(`\n${failed} balance checks failed.`);
  process.exit(1);
}

console.log(`\nAll ${tests.length} deterministic balance checks passed.`);
