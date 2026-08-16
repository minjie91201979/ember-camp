import { WORLD } from '../config';
import { ELITE_AFFIX_POOL, eliteAffixLabel, type EliteAffixId } from '../data/elite-affixes';
import { START_ZONE_ID, ZONES } from '../data/zones';
import type { World } from '../types';
import { closeCamp } from './camp';
import { applyEliteAffixes } from './elite-affixes';
import { addItemToBag } from './inventory';
import { populateZone, enterZone } from './zone-travel';
import { sfx } from '../../audio/sfx';

export const CHALLENGE_DURATION = 100;

const MID_MATS = ['cinder-shard', 'mire-moss', 'frost-fur'] as const;

export function challengeDurationOf(floor: number): number {
  return floor >= 5 ? 88 : CHALLENGE_DURATION;
}

function rollChallengeAffixes(floor: number): EliteAffixId[] {
  let count = 1;
  if (floor >= 8) {
    count = 3;
  } else if (floor >= 4) {
    count = Math.random() < 0.55 ? 3 : 2;
  } else if (floor >= 2) {
    count = Math.random() < 0.65 ? 2 : 1;
  }
  const pool = [...ELITE_AFFIX_POOL];
  const picked: EliteAffixId[] = [];
  for (let i = 0; i < count && pool.length > 0; i += 1) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(idx, 1)[0]!);
  }
  return picked;
}

function scaleChallengeEnemies(world: World, floor: number): void {
  const scale = 1 + (floor - 1) * 0.12;
  for (const dummy of world.dummies) {
    if (!dummy.elite || dummy.boss || dummy.hp <= 0) {
      continue;
    }
    dummy.hp = Math.max(1, Math.round(dummy.hp * scale));
    dummy.maxHp = dummy.hp;
    dummy.atk = Math.max(1, Math.round(dummy.atk * scale));
  }
}

function applyRunAffixesToElites(world: World): void {
  const affixes = world.challengeRunAffixes;
  for (const dummy of world.dummies) {
    if (!dummy.elite || dummy.boss) {
      continue;
    }
    applyEliteAffixes(dummy, affixes);
  }
}

function prepareChallengeFloor(world: World, floor: number): void {
  const zone = ZONES.challenge;
  if (!zone) {
    return;
  }
  world.challengeFloor = floor;
  world.challengeRunAffixes = rollChallengeAffixes(floor);
  world.challengeT = challengeDurationOf(floor);
  populateZone(world, zone, 1.5, 1.15);
  scaleChallengeEnemies(world, floor);
  applyRunAffixesToElites(world);
  const p = world.player;
  p.hp = p.maxHp;
  p.rage = Math.max(p.rage, 40);
  p.awaitRespawn = false;
  p.state = 'idle';
  p.deadT = 0;
  p.vx = 0;
  p.vy = 0;
  p.iFrame = 0.8;
  const tags = world.challengeRunAffixes.map(eliteAffixLabel).join(' / ');
  world.levelToastT = 2.2;
  world.levelToastText = `第 ${floor} 层 · ${tags}`;
}

function grantFloorReward(world: World, floor: number): void {
  const ng = world.ngPlusLevel;
  const scrap = 2 + floor + ng + Math.floor(Math.random() * 2);
  addItemToBag(world, 'woodland-scrap', scrap);
  if (floor >= 4) {
    const mat = MID_MATS[(floor + ng) % MID_MATS.length]!;
    addItemToBag(world, mat, 1 + Math.floor(floor / 6));
  }
  if (floor >= 8 && Math.random() < 0.28 + ng * 0.06) {
    addItemToBag(world, 'ashen-crest', 1);
  }
  world.gold += 30 + floor * 12 + ng * 10;
  world.challengeBestFloor = Math.max(world.challengeBestFloor, floor);
}

/** 营地开启词缀试炼：从第 1 层开始。 */
export function startChallenge(world: World): boolean {
  if (world.challengeActive) {
    sfx.play('deny');
    world.campMessage = '挑战进行中';
    return false;
  }
  if (!ZONES.challenge) {
    return false;
  }
  closeCamp(world);
  world.challengeActive = true;
  prepareChallengeFloor(world, 1);
  sfx.play('levelup');
  return true;
}

function advanceChallengeFloor(world: World): void {
  const cleared = world.challengeFloor;
  grantFloorReward(world, cleared);
  const next = cleared + 1;
  prepareChallengeFloor(world, next);
  sfx.play('levelup');
}

export function stepChallenge(world: World, dt: number): boolean {
  if (!world.challengeActive) {
    return false;
  }
  if (world.player.hp <= 0) {
    finishChallenge(world, false, '战败');
    return false;
  }
  world.challengeT = Math.max(0, world.challengeT - dt);
  if (world.challengeT <= 0) {
    finishChallenge(world, false, '时间耗尽');
    return false;
  }
  const elitesLeft = world.dummies.some((d) => d.elite && d.hp > 0);
  if (!elitesLeft) {
    advanceChallengeFloor(world);
    return true;
  }
  return false;
}

function finishChallenge(world: World, _won: boolean, failReason?: string): void {
  const reached = Math.max(0, world.challengeFloor - 1);
  world.challengeActive = false;
  world.challengeT = 0;
  world.challengeFloor = 0;
  world.challengeRunAffixes = [];
  const p = world.player;
  p.hp = p.maxHp;
  p.awaitRespawn = false;
  p.state = 'idle';
  p.deadT = 0;
  p.vx = 0;
  p.vy = 0;

  world.levelToastT = 2.4;
  if (reached > 0) {
    world.levelToastText = `试炼结束 · 最高通关第 ${world.challengeBestFloor} 层（${failReason ?? '未完成'}）`;
  } else {
    world.levelToastText = `试炼失败 · ${failReason ?? '未完成'}`;
  }
  sfx.play('deny');
  enterZone(world, START_ZONE_ID, WORLD.spawnX, WORLD.spawnY, { keepToast: true });
}

/** 存档/读档时若卡在挑战中，强制回营。 */
export function sanitizeChallengeOnLoad(world: World): void {
  if (world.zoneId === 'challenge' || world.challengeActive) {
    world.challengeActive = false;
    world.challengeT = 0;
    world.challengeFloor = 0;
    world.challengeRunAffixes = [];
    if (world.zoneId === 'challenge') {
      enterZone(world, START_ZONE_ID, WORLD.spawnX, WORLD.spawnY);
    }
  }
}
