import { hurtPlayer } from './combat';
import { createDummyFromSpawn } from './enemy-spawn';
import { applyBossUnlock, noteBossFrontUnlockToast } from './zone-travel';
import { autoSaveWorld } from './save';
import type { Dummy, Hazard, World } from '../types';
import { sfx } from '../../audio/sfx';
import { ENEMY_DEFS, type EnemyDefId } from '../data/enemy-defs';

function spawnBossAdd(
  world: World,
  enemyId: EnemyDefId,
  x: number,
  y: number,
  patrolMin: number,
  patrolMax: number,
): Dummy {
  return createDummyFromSpawn(++world.dummyId, enemyId, x, y, patrolMin, patrolMax, {
    ngPlusLevel: world.ngPlusLevel,
  });
}

const ROOT_WINDUP = 0.9;
const ROOT_ACTIVE = 0.5;
const ROOT_CD_PHASE1 = 4.4;
const ROOT_CD_PHASE2 = 2.9;
const SUMMON_HP = 0.55;
const ENRAGE_TIME = 75;

const QUAKE_WINDUP = 1.05;
const QUAKE_ACTIVE = 0.55;
const QUAKE_CD_PHASE1 = 4.8;
const QUAKE_CD_PHASE2 = 3.1;
const ARMOR_HP = 0.5;

const WAVE_WINDUP = 0.85;
const WAVE_LIFE = 2.4;
const WAVE_CD_PHASE1 = 5.2;
const WAVE_CD_PHASE2 = 3.6;
const WAVE_HP = 0.5;
const CLAW_WINDUP = 0.7;
const CLAW_ACTIVE = 0.45;

const BREATH_WINDUP = 0.95;
const BREATH_ACTIVE = 0.55;
const BREATH_CD_PHASE1 = 4.9;
const BREATH_CD_PHASE2 = 3.4;
const POOL_WINDUP = 0.55;
const POOL_LIFE = 3.2;
const CINDER_HP = 0.5;

const FOG_WINDUP = 0.9;
const FOG_LIFE = 3.6;
const FOG_CD_PHASE1 = 5.0;
const FOG_CD_PHASE2 = 3.5;
const BOG_HP = 0.5;

const HOWL_WINDUP = 0.95;
const HOWL_LIFE = 2.2;
const HOWL_CD_PHASE1 = 4.8;
const HOWL_CD_PHASE2 = 3.3;
const HOWL_SLOW = 2.6;
const POUNCE_WINDUP = 0.75;
const POUNCE_ACTIVE = 0.5;
const FROST_HP = 0.5;

const STORM_WINDUP = 1.0;
const STORM_LIFE = 3.8;
const STORM_CD_PHASE1 = 5.1;
const STORM_CD_PHASE2 = 3.5;
const STING_WINDUP = 0.7;
const STING_ACTIVE = 0.55;
const STING_POOL = 2.4;
const SCORP_HP = 0.5;

const LASER_WINDUP = 0.9;
const LASER_LIFE = 2.2;
const LASER_CD_PHASE1 = 5.0;
const LASER_CD_PHASE2 = 3.4;
const GAZE_WINDUP = 0.85;
const GAZE_PETRIFY = 2.2;
const GOLEM_HP = 0.5;

const TENTACLE_WINDUP = 0.95;
const TENTACLE_ACTIVE = 0.55;
const TENTACLE_CD_PHASE1 = 5.0;
const TENTACLE_CD_PHASE2 = 3.4;
const DEVOUR_WINDUP = 0.9;
const DEVOUR_LIFE = 2.6;
const TIDE_HP = 0.5;

const DIVE_WINDUP = 0.9;
const DIVE_ACTIVE = 0.55;
const DIVE_CD_PHASE1 = 4.9;
const DIVE_CD_PHASE2 = 3.3;
const DRAKE_BREATH_WINDUP = 0.95;
const DRAKE_BREATH_LIFE = 2.4;
const ROCKWING_HP = 0.5;

const CLONE_WINDUP = 0.85;
const CLONE_CD_PHASE1 = 5.1;
const CLONE_CD_PHASE2 = 3.5;
const VOID_HOLE_WINDUP = 0.95;
const VOID_HOLE_LIFE = 2.8;
const RIFT_HP = 0.5;

const SLASH_WINDUP = 0.8;
const SLASH_ACTIVE = 0.5;
const KING_CD_PHASE1 = 5.0;
const KING_CD_PHASE2 = 3.8;
const KING_CD_PHASE3 = 2.8;
const DECREE_WINDUP = 1.1;
const DECREE_ACTIVE = 0.7;
const KING_PHASE2_HP = 0.66;
const KING_PHASE3_HP = 0.33;

export function stepBoss(world: World, dummy: Dummy, dt: number): boolean {
  if (!dummy.boss || dummy.hp <= 0) {
    return false;
  }
  if (dummy.enemyId === 'rock-warden') {
    return stepRockWarden(world, dummy, dt);
  }
  if (dummy.enemyId === 'tide-crab') {
    return stepTideCrab(world, dummy, dt);
  }
  if (dummy.enemyId === 'cinder-lizard') {
    return stepCinderLizard(world, dummy, dt);
  }
  if (dummy.enemyId === 'bog-mother') {
    return stepBogMother(world, dummy, dt);
  }
  if (dummy.enemyId === 'frostfang') {
    return stepFrostfang(world, dummy, dt);
  }
  if (dummy.enemyId === 'storm-scorpion') {
    return stepStormScorpion(world, dummy, dt);
  }
  if (dummy.enemyId === 'golem-mage') {
    return stepGolemMage(world, dummy, dt);
  }
  if (dummy.enemyId === 'tide-lord') {
    return stepTideLord(world, dummy, dt);
  }
  if (dummy.enemyId === 'rockwing') {
    return stepRockwing(world, dummy, dt);
  }
  if (dummy.enemyId === 'rift-warden') {
    return stepRiftWarden(world, dummy, dt);
  }
  if (dummy.enemyId === 'end-king') {
    return stepEndKing(world, dummy, dt);
  }
  if (dummy.enemyId === 'ember-tyrant') {
    return stepEndKing(world, dummy, dt);
  }
  return stepRotwood(world, dummy, dt);
}

function stepRotwood(world: World, dummy: Dummy, dt: number): boolean {
  dummy.fightT += dt;

  if (dummy.phase < 2 && dummy.hp / dummy.maxHp <= SUMMON_HP) {
    dummy.phase = 2;
    spawnRotwoodAdds(world, dummy);
    world.levelToastT = 2;
    world.levelToastText = '腐木守卫 · 召出幼根';
    sfx.play('slam');
  }

  if (tickCast(dummy, dt)) {
    return true;
  }

  const enraged = dummy.fightT >= ENRAGE_TIME;
  const cd = dummy.phase >= 2 || enraged ? ROOT_CD_PHASE2 : ROOT_CD_PHASE1;
  const dist = Math.abs(world.player.x - dummy.x);
  dummy.skillCd = Math.max(0, dummy.skillCd - dt);
  if (dist < 10 && dummy.skillCd <= 0) {
    dummy.skillCd = cd;
    beginRootCast(world, dummy);
    return true;
  }

  return false;
}

function stepRockWarden(world: World, dummy: Dummy, dt: number): boolean {
  dummy.fightT += dt;

  if (dummy.phase < 2 && dummy.hp / dummy.maxHp <= ARMOR_HP) {
    dummy.phase = 2;
    dummy.def = Math.round(dummy.def * 1.75);
    spawnWardenAdds(world, dummy);
    world.levelToastT = 2.2;
    world.levelToastText = '岩甲监工 · 岩甲硬化';
    world.shake = Math.max(world.shake, 0.55);
    sfx.play('slam');
  }

  if (tickCast(dummy, dt)) {
    return true;
  }

  const enraged = dummy.fightT >= ENRAGE_TIME;
  const cd = dummy.phase >= 2 || enraged ? QUAKE_CD_PHASE2 : QUAKE_CD_PHASE1;
  const dist = Math.abs(world.player.x - dummy.x);
  dummy.skillCd = Math.max(0, dummy.skillCd - dt);
  if (dist < 11 && dummy.skillCd <= 0) {
    dummy.skillCd = cd;
    beginQuakeCast(world, dummy);
    return true;
  }

  return false;
}

function stepTideCrab(world: World, dummy: Dummy, dt: number): boolean {
  dummy.fightT += dt;

  if (dummy.phase < 2 && dummy.hp / dummy.maxHp <= WAVE_HP) {
    dummy.phase = 2;
    spawnTideAdds(world, dummy);
    world.levelToastT = 2.2;
    world.levelToastText = '潮汐巨蟹 · 掀起怒潮';
    world.shake = Math.max(world.shake, 0.6);
    sfx.play('slam');
  }

  if (tickCast(dummy, dt)) {
    return true;
  }

  const enraged = dummy.fightT >= ENRAGE_TIME;
  const cd = dummy.phase >= 2 || enraged ? WAVE_CD_PHASE2 : WAVE_CD_PHASE1;
  const dist = Math.abs(world.player.x - dummy.x);
  dummy.skillCd = Math.max(0, dummy.skillCd - dt);
  if (dist < 12 && dummy.skillCd <= 0) {
    dummy.skillCd = cd;
    // 近距偏钳击，远距偏浪墙
    if (dist < 3.2 && Math.random() < 0.45) {
      beginClawCast(world, dummy);
    } else {
      beginWaveCast(world, dummy);
    }
    return true;
  }

  return false;
}

function stepCinderLizard(world: World, dummy: Dummy, dt: number): boolean {
  dummy.fightT += dt;

  if (dummy.phase < 2 && dummy.hp / dummy.maxHp <= CINDER_HP) {
    dummy.phase = 2;
    spawnCinderAdds(world, dummy);
    beginFirePools(world, dummy, 3);
    world.levelToastT = 2.2;
    world.levelToastText = '烬火蜥蜴 · 焦土沸腾';
    world.shake = Math.max(world.shake, 0.65);
    sfx.play('slam');
  }

  if (tickCast(dummy, dt)) {
    return true;
  }

  const enraged = dummy.fightT >= ENRAGE_TIME;
  const cd = dummy.phase >= 2 || enraged ? BREATH_CD_PHASE2 : BREATH_CD_PHASE1;
  const dist = Math.abs(world.player.x - dummy.x);
  dummy.skillCd = Math.max(0, dummy.skillCd - dt);
  if (dist < 12 && dummy.skillCd <= 0) {
    dummy.skillCd = cd;
    if (dist < 4.2 && Math.random() < 0.4) {
      beginFirePools(world, dummy, dummy.phase >= 2 ? 3 : 2);
      dummy.castId = 'pools';
      dummy.castMax = POOL_WINDUP;
      dummy.castT = POOL_WINDUP;
      dummy.attackT = 0;
      dummy.state = 'attack';
      dummy.vx = 0;
    } else {
      beginBreathCast(world, dummy);
    }
    return true;
  }

  return false;
}

function stepBogMother(world: World, dummy: Dummy, dt: number): boolean {
  dummy.fightT += dt;

  if (dummy.phase < 2 && dummy.hp / dummy.maxHp <= BOG_HP) {
    dummy.phase = 2;
    spawnTadpoles(world, dummy, 3);
    beginPoisonFog(world, dummy, true);
    world.levelToastT = 2.2;
    world.levelToastText = '沼母 · 毒雾升腾';
    world.shake = Math.max(world.shake, 0.6);
    sfx.play('slam');
  }

  if (tickCast(dummy, dt)) {
    return true;
  }

  const enraged = dummy.fightT >= ENRAGE_TIME;
  const cd = dummy.phase >= 2 || enraged ? FOG_CD_PHASE2 : FOG_CD_PHASE1;
  const dist = Math.abs(world.player.x - dummy.x);
  dummy.skillCd = Math.max(0, dummy.skillCd - dt);
  if (dist < 12 && dummy.skillCd <= 0) {
    dummy.skillCd = cd;
    if (dummy.phase >= 2 && Math.random() < 0.4) {
      spawnTadpoles(world, dummy, 2);
      dummy.castId = 'tadpoles';
      dummy.castMax = 0.7;
      dummy.castT = 0.7;
      dummy.attackT = 0;
      dummy.state = 'attack';
      dummy.vx = 0;
      sfx.play('deny');
    } else {
      beginPoisonFog(world, dummy, false);
    }
    return true;
  }

  return false;
}

function stepFrostfang(world: World, dummy: Dummy, dt: number): boolean {
  dummy.fightT += dt;

  if (dummy.phase < 2 && dummy.hp / dummy.maxHp <= FROST_HP) {
    dummy.phase = 2;
    spawnFrostAdds(world, dummy);
    beginHowlCast(world, dummy);
    world.levelToastT = 2.2;
    world.levelToastText = '霜牙巨狼 · 冰嚎撕裂';
    world.shake = Math.max(world.shake, 0.65);
    sfx.play('slam');
    return true;
  }

  if (tickCast(dummy, dt)) {
    return true;
  }

  const enraged = dummy.fightT >= ENRAGE_TIME;
  const cd = dummy.phase >= 2 || enraged ? HOWL_CD_PHASE2 : HOWL_CD_PHASE1;
  const dist = Math.abs(world.player.x - dummy.x);
  dummy.skillCd = Math.max(0, dummy.skillCd - dt);
  if (dist < 12 && dummy.skillCd <= 0) {
    dummy.skillCd = cd;
    if (dist > 3.5 || Math.random() < 0.55) {
      beginPounceCast(world, dummy);
    } else {
      beginHowlCast(world, dummy);
    }
    return true;
  }

  return false;
}

function stepStormScorpion(world: World, dummy: Dummy, dt: number): boolean {
  dummy.fightT += dt;

  if (dummy.phase < 2 && dummy.hp / dummy.maxHp <= SCORP_HP) {
    dummy.phase = 2;
    spawnScorpAdds(world, dummy);
    beginSandstorm(world, dummy, true);
    world.levelToastT = 2.2;
    world.levelToastText = '沙暴巨蝎 · 沙暴蔽日';
    world.shake = Math.max(world.shake, 0.7);
    sfx.play('slam');
    return true;
  }

  if (tickCast(dummy, dt)) {
    return true;
  }

  const enraged = dummy.fightT >= ENRAGE_TIME;
  const cd = dummy.phase >= 2 || enraged ? STORM_CD_PHASE2 : STORM_CD_PHASE1;
  const dist = Math.abs(world.player.x - dummy.x);
  dummy.skillCd = Math.max(0, dummy.skillCd - dt);
  if (dist < 12 && dummy.skillCd <= 0) {
    dummy.skillCd = cd;
    if (dist < 4.0 || Math.random() < 0.4) {
      beginTailSting(world, dummy);
    } else {
      beginSandstorm(world, dummy, false);
    }
    return true;
  }

  return false;
}

function stepGolemMage(world: World, dummy: Dummy, dt: number): boolean {
  dummy.fightT += dt;

  if (dummy.phase < 2 && dummy.hp / dummy.maxHp <= GOLEM_HP) {
    dummy.phase = 2;
    spawnGolemAdds(world, dummy);
    beginLaserSweep(world, dummy);
    world.levelToastT = 2.2;
    world.levelToastText = '石像魔 · 星辉觉醒';
    world.shake = Math.max(world.shake, 0.7);
    sfx.play('slam');
    return true;
  }

  if (tickCast(dummy, dt)) {
    return true;
  }

  const enraged = dummy.fightT >= ENRAGE_TIME;
  const cd = dummy.phase >= 2 || enraged ? LASER_CD_PHASE2 : LASER_CD_PHASE1;
  const dist = Math.abs(world.player.x - dummy.x);
  dummy.skillCd = Math.max(0, dummy.skillCd - dt);
  if (dist < 12 && dummy.skillCd <= 0) {
    dummy.skillCd = cd;
    if (dist < 5.5 && Math.random() < 0.45) {
      beginPetrifyGaze(world, dummy);
    } else {
      beginLaserSweep(world, dummy);
    }
    return true;
  }

  return false;
}

function stepTideLord(world: World, dummy: Dummy, dt: number): boolean {
  dummy.fightT += dt;

  if (dummy.phase < 2 && dummy.hp / dummy.maxHp <= TIDE_HP) {
    dummy.phase = 2;
    spawnTideLordAdds(world, dummy);
    beginTentacleSlam(world, dummy, true);
    world.levelToastT = 2.2;
    world.levelToastText = '暗潮领主 · 深渊苏醒';
    world.shake = Math.max(world.shake, 0.75);
    sfx.play('slam');
    return true;
  }

  if (tickCast(dummy, dt)) {
    return true;
  }

  const enraged = dummy.fightT >= ENRAGE_TIME;
  const cd = dummy.phase >= 2 || enraged ? TENTACLE_CD_PHASE2 : TENTACLE_CD_PHASE1;
  const dist = Math.abs(world.player.x - dummy.x);
  dummy.skillCd = Math.max(0, dummy.skillCd - dt);
  if (dist < 13 && dummy.skillCd <= 0) {
    dummy.skillCd = cd;
    if (dist < 6 || Math.random() < 0.4) {
      beginDevourMark(world, dummy);
    } else {
      beginTentacleSlam(world, dummy, false);
    }
    return true;
  }

  return false;
}

function stepRockwing(world: World, dummy: Dummy, dt: number): boolean {
  dummy.fightT += dt;

  if (dummy.phase < 2 && dummy.hp / dummy.maxHp <= ROCKWING_HP) {
    dummy.phase = 2;
    spawnRockwingAdds(world, dummy);
    beginDrakeBreath(world, dummy);
    world.levelToastT = 2.2;
    world.levelToastText = '岩翼幼龙 · 风暴振翅';
    world.shake = Math.max(world.shake, 0.8);
    sfx.play('slam');
    return true;
  }

  if (tickCast(dummy, dt)) {
    return true;
  }

  const enraged = dummy.fightT >= ENRAGE_TIME;
  const cd = dummy.phase >= 2 || enraged ? DIVE_CD_PHASE2 : DIVE_CD_PHASE1;
  const dist = Math.abs(world.player.x - dummy.x);
  dummy.skillCd = Math.max(0, dummy.skillCd - dt);
  if (dist < 13 && dummy.skillCd <= 0) {
    dummy.skillCd = cd;
    if (dist < 6.5 || Math.random() < 0.42) {
      beginDiveBomb(world, dummy);
    } else {
      beginDrakeBreath(world, dummy);
    }
    return true;
  }

  return false;
}

function stepRiftWarden(world: World, dummy: Dummy, dt: number): boolean {
  dummy.fightT += dt;

  if (dummy.phase < 2 && dummy.hp / dummy.maxHp <= RIFT_HP) {
    dummy.phase = 2;
    spawnRiftWardenAdds(world, dummy);
    beginCloneWarp(world, dummy);
    world.levelToastT = 2.2;
    world.levelToastText = '裂隙看守 · 虚空撕裂';
    world.shake = Math.max(world.shake, 0.8);
    sfx.play('slam');
    return true;
  }

  if (tickCast(dummy, dt)) {
    return true;
  }

  const enraged = dummy.fightT >= ENRAGE_TIME;
  const cd = dummy.phase >= 2 || enraged ? CLONE_CD_PHASE2 : CLONE_CD_PHASE1;
  const dist = Math.abs(world.player.x - dummy.x);
  dummy.skillCd = Math.max(0, dummy.skillCd - dt);
  if (dist < 13 && dummy.skillCd <= 0) {
    dummy.skillCd = cd;
    if (dist < 6.2 || Math.random() < 0.4) {
      beginVoidHole(world, dummy);
    } else {
      beginCloneWarp(world, dummy);
    }
    return true;
  }

  return false;
}

function stepEndKing(world: World, dummy: Dummy, dt: number): boolean {
  dummy.fightT += dt;
  const ratio = dummy.hp / dummy.maxHp;

  if (dummy.phase < 2 && ratio <= KING_PHASE2_HP) {
    dummy.phase = 2;
    spawnEndKingAdds(world, dummy);
    beginRoyalSlash(world, dummy);
    world.levelToastT = 2.2;
    world.levelToastText = '终焉君王 · 二阶段 · 王座战意';
    world.shake = Math.max(world.shake, 0.75);
    sfx.play('slam');
    return true;
  }

  if (dummy.phase < 3 && ratio <= KING_PHASE3_HP) {
    dummy.phase = 3;
    beginEndingDecree(world, dummy);
    world.levelToastT = 2.4;
    world.levelToastText = '终焉君王 · 三阶段 · 终焉裁决';
    world.shake = Math.max(world.shake, 0.9);
    sfx.play('slam');
    return true;
  }

  if (tickCast(dummy, dt)) {
    return true;
  }

  const enraged = dummy.fightT >= ENRAGE_TIME;
  const cd =
    dummy.phase >= 3 || enraged
      ? KING_CD_PHASE3
      : dummy.phase >= 2
        ? KING_CD_PHASE2
        : KING_CD_PHASE1;
  const dist = Math.abs(world.player.x - dummy.x);
  dummy.skillCd = Math.max(0, dummy.skillCd - dt);
  if (dist < 14 && dummy.skillCd <= 0) {
    dummy.skillCd = cd;
    if (dummy.phase >= 3 || (dummy.phase >= 2 && Math.random() < 0.55)) {
      beginEndingDecree(world, dummy);
    } else {
      beginRoyalSlash(world, dummy);
    }
    return true;
  }

  return false;
}

function tickCast(dummy: Dummy, dt: number): boolean {
  if (dummy.castT <= 0) {
    return false;
  }
  dummy.castT = Math.max(0, dummy.castT - dt);
  dummy.state = 'attack';
  dummy.vx = 0;
  if (dummy.castT <= 0) {
    dummy.castId = null;
    dummy.castMax = 0;
  }
  return true;
}

function beginRootCast(world: World, dummy: Dummy): void {
  dummy.castId = 'roots';
  dummy.castMax = ROOT_WINDUP;
  dummy.castT = ROOT_WINDUP;
  dummy.attackT = 0;
  dummy.state = 'attack';
  dummy.vx = 0;
  const px = world.player.x;
  const spots = [px, px + dummy.facing * 1.7, px - dummy.facing * 1.15];
  for (const x of spots) {
    spawnHazard(world, {
      x: x - 0.55,
      y: 1,
      w: 1.1,
      h: 0.4,
      windup: ROOT_WINDUP,
      life: ROOT_ACTIVE,
      damage: Math.round(dummy.atk * 1.4),
      kind: 'spike',
    });
  }
  world.shake = Math.max(world.shake, 0.35);
  sfx.play('deny');
}

function beginQuakeCast(world: World, dummy: Dummy): void {
  dummy.castId = 'quake';
  dummy.castMax = QUAKE_WINDUP;
  dummy.castT = QUAKE_WINDUP;
  dummy.attackT = 0;
  dummy.state = 'attack';
  dummy.vx = 0;
  const px = world.player.x;
  const spots = [
    px,
    px + dummy.facing * 2.1,
    px - dummy.facing * 1.4,
    px + dummy.facing * 3.4,
  ];
  for (const x of spots) {
    spawnHazard(world, {
      x: x - 0.7,
      y: 1,
      w: 1.4,
      h: 0.45,
      windup: QUAKE_WINDUP,
      life: QUAKE_ACTIVE,
      damage: Math.round(dummy.atk * 1.55),
      kind: 'spike',
    });
  }
  world.shake = Math.max(world.shake, 0.5);
  sfx.play('deny');
}

function beginClawCast(world: World, dummy: Dummy): void {
  dummy.castId = 'claw';
  dummy.castMax = CLAW_WINDUP;
  dummy.castT = CLAW_WINDUP;
  dummy.attackT = 0;
  dummy.state = 'attack';
  dummy.vx = 0;
  const px = world.player.x;
  const spots = [px, px + dummy.facing * 1.35];
  for (const x of spots) {
    spawnHazard(world, {
      x: x - 0.65,
      y: 1,
      w: 1.3,
      h: 0.5,
      windup: CLAW_WINDUP,
      life: CLAW_ACTIVE,
      damage: Math.round(dummy.atk * 1.65),
      kind: 'spike',
    });
  }
  world.shake = Math.max(world.shake, 0.4);
  sfx.play('bash');
}

/** 从竞技场一侧扫向另一侧的浪墙（翻滚可穿）。 */
function beginWaveCast(world: World, dummy: Dummy): void {
  dummy.castId = 'wave';
  dummy.castMax = WAVE_WINDUP;
  dummy.castT = WAVE_WINDUP;
  dummy.attackT = 0;
  dummy.state = 'attack';
  dummy.vx = 0;
  const arenaMin = dummy.patrolMin - 0.5;
  const arenaMax = dummy.patrolMax + 0.5;
  const fromLeft = world.player.x > (arenaMin + arenaMax) * 0.5;
  const speed = dummy.phase >= 2 ? 7.2 : 5.6;
  const startX = fromLeft ? arenaMin - 0.4 : arenaMax - 1.4;
  const vx = fromLeft ? speed : -speed;
  spawnHazard(world, {
    x: startX,
    y: 1,
    w: 1.8,
    h: 0.55,
    windup: WAVE_WINDUP,
    life: WAVE_LIFE,
    damage: Math.round(dummy.atk * 1.5),
    vx,
    kind: 'wave',
    hitGap: 0.35,
  });
  world.shake = Math.max(world.shake, 0.45);
  sfx.play('deny');
}

/** 朝玩家方向直线喷火（一串地面红区，翻滚可穿）。 */
function beginBreathCast(world: World, dummy: Dummy): void {
  dummy.facing = world.player.x >= dummy.x ? 1 : -1;
  dummy.castId = 'breath';
  dummy.castMax = BREATH_WINDUP;
  dummy.castT = BREATH_WINDUP;
  dummy.attackT = 0;
  dummy.state = 'attack';
  dummy.vx = 0;
  const dir = dummy.facing;
  const count = dummy.phase >= 2 ? 7 : 5;
  for (let i = 0; i < count; i += 1) {
    const x = dummy.x + dir * (1.4 + i * 1.15) - 0.55;
    spawnHazard(world, {
      x,
      y: 1,
      w: 1.15,
      h: 0.42,
      windup: BREATH_WINDUP,
      life: BREATH_ACTIVE,
      damage: Math.round(dummy.atk * 1.45),
      kind: 'fire',
    });
  }
  // 喷火末端再落一小火池，逼走位
  const tip = dummy.x + dir * (1.4 + (count - 1) * 1.15);
  spawnHazard(world, {
    x: tip - 0.7,
    y: 1,
    w: 1.4,
    h: 0.5,
    windup: BREATH_WINDUP + 0.15,
    life: POOL_LIFE * 0.7,
    damage: Math.round(dummy.atk * 0.85),
    kind: 'fire',
    hitGap: 0.4,
  });
  world.shake = Math.max(world.shake, 0.5);
  sfx.play('deny');
}

function beginFirePools(world: World, dummy: Dummy, count: number): void {
  const px = world.player.x;
  const offsets = [0, -1.6, 1.7, -3.1, 3.2].slice(0, count);
  for (const ox of offsets) {
    spawnHazard(world, {
      x: px + ox - 0.75,
      y: 1,
      w: 1.5,
      h: 0.5,
      windup: POOL_WINDUP,
      life: POOL_LIFE,
      damage: Math.round(dummy.atk * 0.9),
      kind: 'fire',
      hitGap: 0.4,
    });
  }
  world.shake = Math.max(world.shake, 0.4);
  sfx.play('bash');
}

/** 毒雾：大范围持续伤害区，翻滚可穿。 */
function beginPoisonFog(world: World, dummy: Dummy, wide: boolean): void {
  dummy.castId = 'fog';
  dummy.castMax = FOG_WINDUP;
  dummy.castT = FOG_WINDUP;
  dummy.attackT = 0;
  dummy.state = 'attack';
  dummy.vx = 0;
  const px = world.player.x;
  const spots = wide
    ? [px - 2.4, px, px + 2.4, dummy.x]
    : [px - 1.5, px, px + 1.6];
  for (const x of spots) {
    spawnHazard(world, {
      x: x - 1.1,
      y: 1,
      w: 2.2,
      h: 0.7,
      windup: FOG_WINDUP,
      life: FOG_LIFE,
      damage: Math.round(dummy.atk * 0.75),
      kind: 'fog',
      hitGap: 0.45,
    });
  }
  world.shake = Math.max(world.shake, 0.4);
  sfx.play('deny');
}

/** 冰嚎：范围冰雾 + 减速。 */
function beginHowlCast(world: World, dummy: Dummy): void {
  dummy.castId = 'howl';
  dummy.castMax = HOWL_WINDUP;
  dummy.castT = HOWL_WINDUP;
  dummy.attackT = 0;
  dummy.state = 'attack';
  dummy.vx = 0;
  const dist = Math.abs(world.player.x - dummy.x);
  if (dist < 9.5 && world.player.hp > 0) {
    world.player.slowT = Math.max(world.player.slowT, HOWL_SLOW);
  }
  const spots = [dummy.x - 2.2, dummy.x, dummy.x + 2.2, world.player.x];
  for (const x of spots) {
    spawnHazard(world, {
      x: x - 1.0,
      y: 1,
      w: 2.0,
      h: 0.55,
      windup: HOWL_WINDUP,
      life: HOWL_LIFE,
      damage: Math.round(dummy.atk * 0.7),
      kind: 'ice',
      hitGap: 0.4,
    });
  }
  world.shake = Math.max(world.shake, 0.45);
  sfx.play('deny');
}

/** 冲锋：朝玩家方向一串冰刺红区。 */
function beginPounceCast(world: World, dummy: Dummy): void {
  dummy.facing = world.player.x >= dummy.x ? 1 : -1;
  dummy.castId = 'pounce';
  dummy.castMax = POUNCE_WINDUP;
  dummy.castT = POUNCE_WINDUP;
  dummy.attackT = 0;
  dummy.state = 'attack';
  dummy.vx = 0;
  const dir = dummy.facing;
  const count = dummy.phase >= 2 ? 7 : 5;
  for (let i = 0; i < count; i += 1) {
    const x = dummy.x + dir * (1.3 + i * 1.2) - 0.55;
    spawnHazard(world, {
      x,
      y: 1,
      w: 1.15,
      h: 0.42,
      windup: POUNCE_WINDUP,
      life: POUNCE_ACTIVE,
      damage: Math.round(dummy.atk * 1.5),
      kind: 'ice',
    });
  }
  world.shake = Math.max(world.shake, 0.5);
  sfx.play('bash');
}

/** 沙暴：大范围遮挡式持续伤害区。 */
function beginSandstorm(world: World, dummy: Dummy, wide: boolean): void {
  dummy.castId = 'sandstorm';
  dummy.castMax = STORM_WINDUP;
  dummy.castT = STORM_WINDUP;
  dummy.attackT = 0;
  dummy.state = 'attack';
  dummy.vx = 0;
  const px = world.player.x;
  const spots = wide
    ? [dummy.patrolMin + 1, (dummy.patrolMin + dummy.patrolMax) * 0.5, dummy.patrolMax - 1, px]
    : [px - 2.0, px, px + 2.0];
  for (const x of spots) {
    spawnHazard(world, {
      x: x - 1.4,
      y: 1,
      w: 2.8,
      h: 0.85,
      windup: STORM_WINDUP,
      life: STORM_LIFE,
      damage: Math.round(dummy.atk * 0.7),
      kind: 'sand',
      hitGap: 0.4,
    });
  }
  // 沙暴中略减速，模拟视线受阻
  if (Math.abs(world.player.x - dummy.x) < 11 && world.player.hp > 0) {
    world.player.slowT = Math.max(world.player.slowT, 1.4);
  }
  world.shake = Math.max(world.shake, 0.5);
  sfx.play('deny');
}

/** 尾刺：点名砸地 + 毒池。 */
function beginTailSting(world: World, dummy: Dummy): void {
  dummy.castId = 'sting';
  dummy.castMax = STING_WINDUP;
  dummy.castT = STING_WINDUP;
  dummy.attackT = 0;
  dummy.state = 'attack';
  dummy.vx = 0;
  const px = world.player.x;
  spawnHazard(world, {
    x: px - 0.7,
    y: 1,
    w: 1.4,
    h: 0.5,
    windup: STING_WINDUP,
    life: STING_ACTIVE,
    damage: Math.round(dummy.atk * 1.65),
    kind: 'spike',
  });
  spawnHazard(world, {
    x: px - 0.9,
    y: 1,
    w: 1.8,
    h: 0.55,
    windup: STING_WINDUP + 0.1,
    life: STING_POOL,
    damage: Math.round(dummy.atk * 0.8),
    kind: 'sand',
    hitGap: 0.35,
  });
  world.shake = Math.max(world.shake, 0.45);
  sfx.play('bash');
}

/** 激光扫射：从一侧扫向另一侧的竖向光束。 */
function beginLaserSweep(world: World, dummy: Dummy): void {
  dummy.castId = 'laser';
  dummy.castMax = LASER_WINDUP;
  dummy.castT = LASER_WINDUP;
  dummy.attackT = 0;
  dummy.state = 'attack';
  dummy.vx = 0;
  const arenaMin = dummy.patrolMin - 0.3;
  const arenaMax = dummy.patrolMax + 0.3;
  const fromLeft = world.player.x > (arenaMin + arenaMax) * 0.5;
  const speed = dummy.phase >= 2 ? 8.0 : 6.2;
  const startX = fromLeft ? arenaMin - 0.2 : arenaMax - 1.2;
  const vx = fromLeft ? speed : -speed;
  spawnHazard(world, {
    x: startX,
    y: 1,
    w: 1.2,
    h: 1.8,
    windup: LASER_WINDUP,
    life: LASER_LIFE,
    damage: Math.round(dummy.atk * 1.55),
    vx,
    kind: 'laser',
    hitGap: 0.3,
  });
  world.shake = Math.max(world.shake, 0.5);
  sfx.play('deny');
}

/** 石化凝视：强减速 + 脚下尖刺。 */
function beginPetrifyGaze(world: World, dummy: Dummy): void {
  dummy.castId = 'gaze';
  dummy.castMax = GAZE_WINDUP;
  dummy.castT = GAZE_WINDUP;
  dummy.attackT = 0;
  dummy.state = 'attack';
  dummy.vx = 0;
  const dist = Math.abs(world.player.x - dummy.x);
  if (dist < 10 && world.player.hp > 0) {
    world.player.petrifyT = Math.max(world.player.petrifyT, GAZE_PETRIFY);
    world.player.slowT = Math.max(world.player.slowT, GAZE_PETRIFY);
  }
  const px = world.player.x;
  spawnHazard(world, {
    x: px - 0.8,
    y: 1,
    w: 1.6,
    h: 0.5,
    windup: GAZE_WINDUP,
    life: 0.6,
    damage: Math.round(dummy.atk * 1.35),
    kind: 'spike',
  });
  world.shake = Math.max(world.shake, 0.4);
  sfx.play('bash');
}

/** 触手拍击：多点砸地，逼上高台。 */
function beginTentacleSlam(world: World, dummy: Dummy, wide: boolean): void {
  dummy.castId = 'tentacles';
  dummy.castMax = TENTACLE_WINDUP;
  dummy.castT = TENTACLE_WINDUP;
  dummy.attackT = 0;
  dummy.state = 'attack';
  dummy.vx = 0;
  const px = world.player.x;
  const spots = wide
    ? [px - 2.4, px, px + 2.4, dummy.x - 1.5, dummy.x + 1.5]
    : [px - 1.6, px, px + 1.7];
  for (const x of spots) {
    spawnHazard(world, {
      x: x - 0.65,
      y: 1,
      w: 1.3,
      h: 0.85,
      windup: TENTACLE_WINDUP,
      life: TENTACLE_ACTIVE,
      damage: Math.round(dummy.atk * 1.4),
      kind: 'tentacle',
    });
  }
  world.shake = Math.max(world.shake, 0.55);
  sfx.play('deny');
}

/** 吞噬点名：脚下黑洞拉扯 + 持续伤害。 */
function beginDevourMark(world: World, dummy: Dummy): void {
  dummy.castId = 'devour';
  dummy.castMax = DEVOUR_WINDUP;
  dummy.castT = DEVOUR_WINDUP;
  dummy.attackT = 0;
  dummy.state = 'attack';
  dummy.vx = 0;
  const px = world.player.x;
  spawnHazard(world, {
    x: px - 1.1,
    y: 1,
    w: 2.2,
    h: 0.7,
    windup: DEVOUR_WINDUP,
    life: DEVOUR_LIFE,
    damage: Math.round(dummy.atk * 0.95),
    kind: 'tentacle',
    hitGap: 0.35,
    pull: 7.5,
  });
  world.levelToastT = 1.6;
  world.levelToastText = '吞噬点名 · 翻滚脱离！';
  world.shake = Math.max(world.shake, 0.5);
  sfx.play('bash');
}

/** 飞扑：落地砸击，逼上高台；二阶段多点砸落。 */
function beginDiveBomb(world: World, dummy: Dummy): void {
  dummy.castId = 'dive';
  dummy.castMax = DIVE_WINDUP;
  dummy.castT = DIVE_WINDUP;
  dummy.attackT = 0;
  dummy.state = 'attack';
  dummy.vx = 0;
  const px = world.player.x;
  const spots =
    dummy.phase >= 2
      ? [px - 2.2, px, px + 2.2, dummy.x]
      : [px - 1.2, px, px + 1.3];
  for (const x of spots) {
    spawnHazard(world, {
      x: x - 0.85,
      y: 1,
      w: 1.7,
      h: 0.75,
      windup: DIVE_WINDUP,
      life: DIVE_ACTIVE,
      damage: Math.round(dummy.atk * 1.55),
      kind: 'spike',
    });
  }
  // 短距扑近，制造压迫感
  const face = px >= dummy.x ? 1 : -1;
  dummy.facing = face;
  const leap = Math.min(4.2, Math.max(1.6, Math.abs(px - dummy.x) * 0.55));
  dummy.x = Math.max(dummy.patrolMin, Math.min(dummy.patrolMax, dummy.x + face * leap));
  world.levelToastT = 1.4;
  world.levelToastText = '岩翼飞扑 · 上高台！';
  world.shake = Math.max(world.shake, 0.6);
  sfx.play('slam');
}

/** 龙息扫射：横向火柱扫过场地。 */
function beginDrakeBreath(world: World, dummy: Dummy): void {
  dummy.castId = 'drake-breath';
  dummy.castMax = DRAKE_BREATH_WINDUP;
  dummy.castT = DRAKE_BREATH_WINDUP;
  dummy.attackT = 0;
  dummy.state = 'attack';
  dummy.vx = 0;
  const arenaMin = dummy.patrolMin - 0.3;
  const arenaMax = dummy.patrolMax + 0.3;
  const fromLeft = world.player.x > (arenaMin + arenaMax) * 0.5;
  const speed = dummy.phase >= 2 ? 7.6 : 5.8;
  const startX = fromLeft ? arenaMin - 0.2 : arenaMax - 1.4;
  const vx = fromLeft ? speed : -speed;
  spawnHazard(world, {
    x: startX,
    y: 1,
    w: 1.5,
    h: 1.5,
    windup: DRAKE_BREATH_WINDUP,
    life: DRAKE_BREATH_LIFE,
    damage: Math.round(dummy.atk * 1.5),
    vx,
    kind: 'fire',
    hitGap: 0.28,
  });
  if (dummy.phase >= 2) {
    spawnHazard(world, {
      x: world.player.x - 0.9,
      y: 1,
      w: 1.8,
      h: 0.55,
      windup: DRAKE_BREATH_WINDUP + 0.2,
      life: 2.0,
      damage: Math.round(dummy.atk * 0.85),
      kind: 'fire',
      hitGap: 0.4,
    });
  }
  world.shake = Math.max(world.shake, 0.55);
  sfx.play('deny');
}

/** 传送分身：瞬移到场地另一侧并放出裂片/行者。 */
function beginCloneWarp(world: World, dummy: Dummy): void {
  dummy.castId = 'clones';
  dummy.castMax = CLONE_WINDUP;
  dummy.castT = CLONE_WINDUP;
  dummy.attackT = 0;
  dummy.state = 'attack';
  dummy.vx = 0;
  const mid = (dummy.patrolMin + dummy.patrolMax) * 0.5;
  const target =
    dummy.x < mid
      ? Math.min(dummy.patrolMax - 0.8, dummy.x + 5.5)
      : Math.max(dummy.patrolMin + 0.8, dummy.x - 5.5);
  // 落地尖刺提示瞬移落点
  spawnHazard(world, {
    x: target - 0.7,
    y: 1,
    w: 1.4,
    h: 0.5,
    windup: CLONE_WINDUP,
    life: 0.45,
    damage: Math.round(dummy.atk * 1.2),
    kind: 'void',
  });
  dummy.x = target;
  dummy.facing = world.player.x >= dummy.x ? 1 : -1;
  const cloneCount = dummy.phase >= 2 ? 2 : 1;
  for (let i = 0; i < cloneCount; i += 1) {
    const side = i % 2 === 0 ? -1 : 1;
    const add = spawnBossAdd(world, i === 0 ? 'rift-shard' : 'void-walker',
      dummy.x + side * (1.8 + i * 0.4),
      dummy.y,
      dummy.patrolMin,
      dummy.patrolMax,
    );
    add.hp = Math.round(add.hp * (i === 0 ? 0.7 : 0.55));
    add.maxHp = add.hp;
    world.dummies.push(add);
  }
  world.levelToastT = 1.5;
  world.levelToastText = '传送分身 · 先清裂片！';
  world.shake = Math.max(world.shake, 0.55);
  sfx.play('deny');
}

/** 黑洞拉扯：强 pull + 持续伤害，翻滚可脱离。 */
function beginVoidHole(world: World, dummy: Dummy): void {
  dummy.castId = 'void-hole';
  dummy.castMax = VOID_HOLE_WINDUP;
  dummy.castT = VOID_HOLE_WINDUP;
  dummy.attackT = 0;
  dummy.state = 'attack';
  dummy.vx = 0;
  const px = world.player.x;
  spawnHazard(world, {
    x: px - 1.25,
    y: 1,
    w: 2.5,
    h: 0.85,
    windup: VOID_HOLE_WINDUP,
    life: VOID_HOLE_LIFE,
    damage: Math.round(dummy.atk * 1.0),
    kind: 'void',
    hitGap: 0.32,
    pull: 9.0,
  });
  if (dummy.phase >= 2) {
    spawnHazard(world, {
      x: dummy.x - 1.0,
      y: 1,
      w: 2.0,
      h: 0.7,
      windup: VOID_HOLE_WINDUP + 0.15,
      life: VOID_HOLE_LIFE * 0.85,
      damage: Math.round(dummy.atk * 0.85),
      kind: 'void',
      hitGap: 0.4,
      pull: 6.5,
    });
  }
  world.levelToastT = 1.6;
  world.levelToastText = '黑洞拉扯 · 翻滚脱离！';
  world.shake = Math.max(world.shake, 0.55);
  sfx.play('bash');
}

/** 王权斩击：朝玩家方向一串高伤地刺。 */
function beginRoyalSlash(world: World, dummy: Dummy): void {
  dummy.facing = world.player.x >= dummy.x ? 1 : -1;
  dummy.castId = 'royal-slash';
  dummy.castMax = SLASH_WINDUP;
  dummy.castT = SLASH_WINDUP;
  dummy.attackT = 0;
  dummy.state = 'attack';
  dummy.vx = 0;
  const dir = dummy.facing;
  const count = dummy.phase >= 3 ? 8 : dummy.phase >= 2 ? 6 : 5;
  for (let i = 0; i < count; i += 1) {
    const x = dummy.x + dir * (1.2 + i * 1.15) - 0.55;
    spawnHazard(world, {
      x,
      y: 1,
      w: 1.15,
      h: 0.45,
      windup: SLASH_WINDUP,
      life: SLASH_ACTIVE,
      damage: Math.round(dummy.atk * 1.5),
      kind: 'spike',
    });
  }
  world.shake = Math.max(world.shake, 0.5);
  sfx.play('bash');
}

/** 终焉裁决：几乎铺满场地，只留安全缝，需翻滚穿缝或上高台。 */
function beginEndingDecree(world: World, dummy: Dummy): void {
  dummy.castId = 'decree';
  dummy.castMax = DECREE_WINDUP;
  dummy.castT = DECREE_WINDUP;
  dummy.attackT = 0;
  dummy.state = 'attack';
  dummy.vx = 0;
  const arenaMin = dummy.patrolMin - 0.2;
  const arenaMax = dummy.patrolMax + 0.2;
  const safeW = dummy.phase >= 3 ? 1.55 : 1.9;
  let safeX = world.player.x;
  if (Math.random() < 0.35) {
    safeX = arenaMin + 1.5 + Math.random() * Math.max(1, arenaMax - arenaMin - 3);
  }
  safeX = Math.max(arenaMin + 0.8, Math.min(arenaMax - 0.8, safeX));
  const step = 1.35;
  for (let x = arenaMin; x < arenaMax - 0.4; x += step) {
    const cx = x + step * 0.5;
    if (Math.abs(cx - safeX) < safeW * 0.5) {
      continue;
    }
    spawnHazard(world, {
      x,
      y: 1,
      w: step * 0.92,
      h: 0.55,
      windup: DECREE_WINDUP,
      life: DECREE_ACTIVE,
      damage: Math.round(dummy.atk * 1.65),
      kind: 'laser',
    });
  }
  world.levelToastT = 1.7;
  world.levelToastText = '终焉裁决 · 翻滚进安全缝！';
  world.shake = Math.max(world.shake, 0.7);
  sfx.play('deny');
}

function spawnRotwoodAdds(world: World, boss: Dummy): void {
  const left = spawnBossAdd(world, 'treant',
    boss.x - 2.2,
    boss.y,
    boss.patrolMin,
    boss.x - 0.5,
  );
  const right = spawnBossAdd(world, 'rotwolf',
    boss.x + 2.4,
    boss.y,
    boss.x + 0.5,
    boss.patrolMax,
  );
  left.hp = Math.round(left.hp * 0.7);
  left.maxHp = left.hp;
  right.hp = Math.round(right.hp * 0.85);
  right.maxHp = right.hp;
  world.dummies.push(left, right);
}

function spawnWardenAdds(world: World, boss: Dummy): void {
  const left = spawnBossAdd(world, 'mine-golem',
    boss.x - 2.4,
    boss.y,
    boss.patrolMin,
    boss.x - 0.4,
  );
  const right = spawnBossAdd(world, 'blast-bug',
    boss.x + 2.6,
    boss.y,
    boss.x + 0.4,
    boss.patrolMax,
  );
  left.hp = Math.round(left.hp * 0.75);
  left.maxHp = left.hp;
  world.dummies.push(left, right);
}

function spawnTideAdds(world: World, boss: Dummy): void {
  const left = spawnBossAdd(world, 'drowned-raider',
    boss.x - 2.5,
    boss.y,
    boss.patrolMin,
    boss.x - 0.4,
  );
  const right = spawnBossAdd(world, 'sand-crab',
    boss.x + 2.7,
    boss.y,
    boss.x + 0.4,
    boss.patrolMax,
  );
  left.hp = Math.round(left.hp * 0.8);
  left.maxHp = left.hp;
  right.hp = Math.round(right.hp * 0.75);
  right.maxHp = right.hp;
  world.dummies.push(left, right);
}

function spawnCinderAdds(world: World, boss: Dummy): void {
  const left = spawnBossAdd(world, 'ash-bandit',
    boss.x - 2.6,
    boss.y,
    boss.patrolMin,
    boss.x - 0.4,
  );
  const right = spawnBossAdd(world, 'ember-lizard',
    boss.x + 2.8,
    boss.y,
    boss.x + 0.4,
    boss.patrolMax,
  );
  left.hp = Math.round(left.hp * 0.8);
  left.maxHp = left.hp;
  right.hp = Math.round(right.hp * 0.75);
  right.maxHp = right.hp;
  world.dummies.push(left, right);
}

function spawnTadpoles(world: World, boss: Dummy, count: number): void {
  for (let i = 0; i < count; i += 1) {
    const side = i % 2 === 0 ? -1 : 1;
    const offset = 1.8 + Math.floor(i / 2) * 1.2;
    const tad = spawnBossAdd(world, 'bog-tadpole',
      boss.x + side * offset,
      boss.y,
      boss.patrolMin,
      boss.patrolMax,
    );
    tad.hp = Math.round(tad.hp * (0.85 + i * 0.05));
    tad.maxHp = tad.hp;
    world.dummies.push(tad);
  }
}

function spawnFrostAdds(world: World, boss: Dummy): void {
  const left = spawnBossAdd(world, 'frost-wolf',
    boss.x - 2.5,
    boss.y,
    boss.patrolMin,
    boss.x - 0.4,
  );
  const right = spawnBossAdd(world, 'frost-wolf',
    boss.x + 2.7,
    boss.y,
    boss.x + 0.4,
    boss.patrolMax,
  );
  left.hp = Math.round(left.hp * 0.75);
  left.maxHp = left.hp;
  right.hp = Math.round(right.hp * 0.75);
  right.maxHp = right.hp;
  world.dummies.push(left, right);
}

function spawnScorpAdds(world: World, boss: Dummy): void {
  const left = spawnBossAdd(world, 'dune-raider',
    boss.x - 2.6,
    boss.y,
    boss.patrolMin,
    boss.x - 0.4,
  );
  const right = spawnBossAdd(world, 'sand-scorpion',
    boss.x + 2.8,
    boss.y,
    boss.x + 0.4,
    boss.patrolMax,
  );
  left.hp = Math.round(left.hp * 0.8);
  left.maxHp = left.hp;
  right.hp = Math.round(right.hp * 0.75);
  right.maxHp = right.hp;
  world.dummies.push(left, right);
}

function spawnGolemAdds(world: World, boss: Dummy): void {
  const left = spawnBossAdd(world, 'arcane-wisp',
    boss.x - 2.5,
    boss.y,
    boss.patrolMin,
    boss.x - 0.4,
  );
  const right = spawnBossAdd(world, 'stone-idol',
    boss.x + 2.7,
    boss.y,
    boss.x + 0.4,
    boss.patrolMax,
  );
  left.hp = Math.round(left.hp * 0.75);
  left.maxHp = left.hp;
  right.hp = Math.round(right.hp * 0.7);
  right.maxHp = right.hp;
  world.dummies.push(left, right);
}

function spawnTideLordAdds(world: World, boss: Dummy): void {
  const left = spawnBossAdd(world, 'tentacle-spawn',
    boss.x - 2.4,
    boss.y,
    boss.patrolMin,
    boss.x - 0.4,
  );
  const right = spawnBossAdd(world, 'tide-cultist',
    boss.x + 2.6,
    boss.y,
    boss.x + 0.4,
    boss.patrolMax,
  );
  left.hp = Math.round(left.hp * 0.85);
  left.maxHp = left.hp;
  right.hp = Math.round(right.hp * 0.75);
  right.maxHp = right.hp;
  world.dummies.push(left, right);
}

function spawnRockwingAdds(world: World, boss: Dummy): void {
  const left = spawnBossAdd(world, 'ridge-wyvern',
    boss.x - 2.5,
    boss.y,
    boss.patrolMin,
    boss.x - 0.4,
  );
  const right = spawnBossAdd(world, 'ridge-spitter',
    boss.x + 2.7,
    boss.y,
    boss.x + 0.4,
    boss.patrolMax,
  );
  left.hp = Math.round(left.hp * 0.8);
  left.maxHp = left.hp;
  right.hp = Math.round(right.hp * 0.75);
  right.maxHp = right.hp;
  world.dummies.push(left, right);
}

function spawnRiftWardenAdds(world: World, boss: Dummy): void {
  const left = spawnBossAdd(world, 'rift-shard',
    boss.x - 2.6,
    boss.y,
    boss.patrolMin,
    boss.x - 0.4,
  );
  const right = spawnBossAdd(world, 'void-walker',
    boss.x + 2.8,
    boss.y,
    boss.x + 0.4,
    boss.patrolMax,
  );
  left.hp = Math.round(left.hp * 0.85);
  left.maxHp = left.hp;
  right.hp = Math.round(right.hp * 0.7);
  right.maxHp = right.hp;
  world.dummies.push(left, right);
}

function spawnEndKingAdds(world: World, boss: Dummy): void {
  const left = spawnBossAdd(world, 'throne-guard',
    boss.x - 2.6,
    boss.y,
    boss.patrolMin,
    boss.x - 0.4,
  );
  const right = spawnBossAdd(world, 'wraith',
    boss.x + 2.8,
    boss.y,
    boss.x + 0.4,
    boss.patrolMax,
  );
  left.hp = Math.round(left.hp * 0.75);
  left.maxHp = left.hp;
  right.hp = Math.round(right.hp * 0.8);
  right.maxHp = right.hp;
  world.dummies.push(left, right);
}

export function spawnHazard(
  world: World,
  spec: Omit<Hazard, 'id' | 'age' | 'struck'>,
): void {
  world.hazardId += 1;
  world.hazards.push({
    id: world.hazardId,
    age: 0,
    struck: false,
    ...spec,
  });
}

export function stepHazards(world: World, dt: number): void {
  const player = world.player;
  const keep: Hazard[] = [];
  for (const hz of world.hazards) {
    hz.age += dt;
    if (hz.age >= hz.windup + hz.life) {
      continue;
    }
    const active = hz.age >= hz.windup;
    if (active && hz.vx) {
      hz.x += hz.vx * dt;
    }
    const overlap =
      player.hp > 0 &&
      player.x + player.w * 0.35 > hz.x &&
      player.x - player.w * 0.35 < hz.x + hz.w &&
      player.y < hz.y + hz.h + 0.45 &&
      player.y + player.h > hz.y;
    if (overlap && hz.pull && player.state !== 'roll' && player.iFrame <= 0) {
      const cx = hz.x + hz.w / 2;
      const dir = cx >= player.x ? 1 : -1;
      player.vx += dir * hz.pull * dt * 3.2;
    }
    if (active && overlap && player.state !== 'roll' && player.iFrame <= 0) {
      const canHit =
        hz.hitGap !== undefined
          ? hz.lastHitAge === undefined || hz.age - hz.lastHitAge >= hz.hitGap
          : !hz.struck;
      if (canHit) {
        hz.struck = true;
        hz.lastHitAge = hz.age;
        hurtPlayer(world, 0, {
          flatDamage: hz.damage,
          knockbackFromX: hz.x + hz.w / 2,
          shake: hz.kind === 'wave' ? 0.55 : 0.7,
        });
      }
    }
    keep.push(hz);
  }
  world.hazards = keep;
}

export function noteBossKill(world: World, dummy: Dummy): void {
  if (!dummy.boss) {
    return;
  }
  world.bossKills[dummy.enemyId] = true;
  if (dummy.enemyId === 'end-king') {
    world.offerNgPlusHint = true;
  }
  world.levelToastT = 2.4;
  world.levelToastText =
    dummy.enemyId === 'end-king'
      ? world.ngPlusLevel > 0
        ? `通关 NG+${world.ngPlusLevel} · 回营地传送阵可再开周目`
        : '通关 · 回营地传送阵开启 NG+'
      : `击败 ${dummy.name}`;
  applyBossUnlock(world, dummy.enemyId);
  noteBossFrontUnlockToast(world, dummy.enemyId);
  world.slowMoT = Math.max(world.slowMoT, 1.2);
  world.shake = Math.max(world.shake, 1.1);
  sfx.play('levelup');
  autoSaveWorld(world);
}

export function activeBoss(world: World): Dummy | null {
  return world.dummies.find((d) => d.boss && d.hp > 0) ?? null;
}

export function bossCastLabel(castId: string | null): string | null {
  if (castId === 'roots') {
    return '根须地刺';
  }
  if (castId === 'quake') {
    return '岩层震裂';
  }
  if (castId === 'wave') {
    return '潮汐浪墙';
  }
  if (castId === 'claw') {
    return '巨钳砸击';
  }
  if (castId === 'breath') {
    return '直线喷火';
  }
  if (castId === 'pools') {
    return '地面火焰池';
  }
  if (castId === 'fog') {
    return '毒雾弥漫';
  }
  if (castId === 'tadpoles') {
    return '召唤蝌蚪';
  }
  if (castId === 'howl') {
    return '冰嚎减速';
  }
  if (castId === 'pounce') {
    return '霜牙冲锋';
  }
  if (castId === 'sandstorm') {
    return '沙暴蔽日';
  }
  if (castId === 'sting') {
    return '尾刺剧毒';
  }
  if (castId === 'laser') {
    return '激光扫射';
  }
  if (castId === 'gaze') {
    return '石化凝视';
  }
  if (castId === 'tentacles') {
    return '触手拍击';
  }
  if (castId === 'devour') {
    return '吞噬点名';
  }
  if (castId === 'dive') {
    return '岩翼飞扑';
  }
  if (castId === 'drake-breath') {
    return '龙息扫射';
  }
  if (castId === 'clones') {
    return '传送分身';
  }
  if (castId === 'void-hole') {
    return '黑洞拉扯';
  }
  if (castId === 'royal-slash') {
    return '王权斩击';
  }
  if (castId === 'decree') {
    return '终焉裁决';
  }
  return null;
}

export function isEnemyDefId(id: string): id is EnemyDefId {
  return id in ENEMY_DEFS;
}
