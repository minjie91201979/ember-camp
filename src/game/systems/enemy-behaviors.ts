import { WORLD } from '../config';
import { sfx } from '../../audio/sfx';
import { ENEMY_DEFS, type EnemyDefId } from '../data/enemy-defs';
import type { Dummy, EnemyShotVisual, Hazard, World } from '../types';
import { applyEnemyHit, applyPlayerProjectileHit, hurtPlayer } from './combat';
import { noteBossKill, spawnHazard } from './boss';
import { onEliteDeath } from './elite-affixes';
import { spawnKillLoot } from './loot';
import { grantKillXp } from './attributes';

const MELEE_RANGE = 1.55;
const MELEE_DURATION = 0.55;
const RANGED_RANGE = 7.2;
const RANGED_MIN = 2.2;
const RANGED_DURATION = 0.7;
const CHARGE_TRIGGER = 5.2;
const CHARGE_WINDUP = 0.55;
const CHARGE_DASH = 0.38;
const CHARGE_SPEED = 11.5;
const LEAP_TRIGGER = 4.6;
const LEAP_WINDUP = 0.32;
const LEAP_DASH = 0.42;
const LEAP_SPEED = 9.4;
const SLAM_RANGE = 4.4;
const SLAM_WINDUP = 0.62;
const SUICIDE_AGGRO = 6.5;
const SUICIDE_FUSE = 0.85;
const SUICIDE_BLAST = 1.65;

function defOf(dummy: Dummy) {
  return ENEMY_DEFS[dummy.enemyId as EnemyDefId];
}

function hitReachOf(dummy: Dummy): number {
  return dummy.h > 1.55 ? 1.4 : 1.15;
}

function applyStyleHit(world: World, dummy: Dummy): void {
  const effect = defOf(dummy)?.hitEffect;
  if (effect === 'slow') {
    world.player.slowT = Math.max(world.player.slowT, 1.35);
  } else if (effect === 'chill') {
    world.player.slowT = Math.max(world.player.slowT, 1.7);
  }
}

function strikePlayer(world: World, dummy: Dummy): boolean {
  const ok = applyEnemyHit(world, dummy);
  if (ok) {
    applyStyleHit(world, dummy);
  }
  return ok;
}

export function stepEnemyBehavior(world: World, dummy: Dummy, dt: number): void {
  switch (dummy.behavior) {
    case 'ranged':
      stepRanged(world, dummy, dt);
      break;
    case 'charge':
      stepCharge(world, dummy, dt);
      break;
    case 'suicide':
      stepSuicide(world, dummy, dt);
      break;
    case 'leap':
      stepLeap(world, dummy, dt);
      break;
    case 'sting':
      stepSting(world, dummy, dt);
      break;
    case 'slam':
      stepSlam(world, dummy, dt);
      break;
    default:
      stepMelee(world, dummy, dt, MELEE_RANGE, hitReachOf(dummy));
      break;
  }
}

export function stepProjectiles(world: World, dt: number): void {
  const player = world.player;
  const keep = [];
  for (const shot of world.projectiles) {
    shot.age += dt;
    shot.x += shot.vx * dt;
    if (typeof shot.vy === 'number') {
      shot.y += shot.vy * dt;
    }
    if (shot.age >= shot.life) {
      continue;
    }
    if (shot.owner === 'player') {
      let hit = false;
      for (const dummy of world.dummies) {
        if (dummy.hp <= 0) {
          continue;
        }
        if (
          Math.abs(shot.x - dummy.x) < shot.radius + dummy.w * 0.4 &&
          Math.abs(shot.y - (dummy.y + dummy.h * 0.45)) < shot.radius + 0.55
        ) {
          applyPlayerProjectileHit(world, shot, dummy);
          hit = true;
          break;
        }
      }
      if (hit) {
        continue;
      }
      keep.push(shot);
      continue;
    }
    if (
      player.hp > 0 &&
      player.state !== 'roll' &&
      Math.abs(shot.x - player.x) < shot.radius + player.w * 0.35 &&
      Math.abs(shot.y - (player.y + player.h * 0.45)) < shot.radius + 0.55
    ) {
      hurtPlayer(world, shot.damage, {
        knockbackFromX: shot.x - shot.vx,
        shake: 0.55,
        skillMult: 1,
      });
      if (shot.hitEffect === 'slow') {
        player.slowT = Math.max(player.slowT, 1.25);
      } else if (shot.hitEffect === 'chill') {
        player.slowT = Math.max(player.slowT, 1.6);
      }
      continue;
    }
    keep.push(shot);
  }
  world.projectiles = keep;
}

function stepMelee(
  world: World,
  dummy: Dummy,
  dt: number,
  aggroRange: number,
  hitReach: number,
): void {
  const player = world.player;
  if (dummy.attackT > 0) {
    dummy.attackT -= dt;
    dummy.state = 'attack';
    dummy.vx = 0;
    const swing = 1 - dummy.attackT / MELEE_DURATION;
    if (!dummy.struck && swing > 0.38 && swing < 0.68) {
      const hx = dummy.x + dummy.facing * 0.7;
      if (Math.abs(player.x - hx) < hitReach && Math.abs(player.y - dummy.y) < 1.15) {
        strikePlayer(world, dummy);
      }
    }
    return;
  }

  const near =
    Math.abs(player.x - dummy.x) < aggroRange &&
    Math.abs(player.y - dummy.y) < 1.2 &&
    player.state !== 'roll' &&
    player.state !== 'dead';
  if (near) {
    dummy.facing = player.x >= dummy.x ? 1 : -1;
    dummy.attackT = MELEE_DURATION;
    dummy.struck = false;
    dummy.state = 'attack';
    dummy.vx = 0;
    return;
  }
  patrol(dummy, dt);
}

function stepSting(world: World, dummy: Dummy, dt: number): void {
  stepMelee(world, dummy, dt, MELEE_RANGE + 0.45, hitReachOf(dummy) + 0.35);
}

function stepRanged(world: World, dummy: Dummy, dt: number): void {
  const player = world.player;
  dummy.skillCd = Math.max(0, dummy.skillCd - dt);

  if (dummy.attackT > 0) {
    dummy.attackT -= dt;
    dummy.state = 'attack';
    dummy.vx = 0;
    dummy.facing = player.x >= dummy.x ? 1 : -1;
    const release = 1 - dummy.attackT / RANGED_DURATION;
    if (!dummy.struck && release > 0.55) {
      dummy.struck = true;
      spawnEnemyShot(world, dummy);
      sfx.play('deny');
    }
    return;
  }

  const dx = Math.abs(player.x - dummy.x);
  const dy = Math.abs(player.y - dummy.y);
  if (dx < RANGED_RANGE && dx > RANGED_MIN && dy < 1.6 && dummy.skillCd <= 0 && player.hp > 0) {
    dummy.facing = player.x >= dummy.x ? 1 : -1;
    dummy.attackT = RANGED_DURATION;
    dummy.struck = false;
    dummy.skillCd = 1.8;
    dummy.vx = 0;
    dummy.state = 'attack';
    return;
  }

  if (dx < RANGED_MIN && dy < 1.4) {
    dummy.facing = player.x >= dummy.x ? -1 : 1;
    dummy.state = 'walk';
    dummy.x += dummy.moveSpeed * 1.1 * dummy.facing * dt;
    clampPatrol(dummy);
    return;
  }

  patrol(dummy, dt);
}

function stepCharge(world: World, dummy: Dummy, dt: number): void {
  const player = world.player;
  dummy.skillCd = Math.max(0, dummy.skillCd - dt);

  if (dummy.chargeDashT > 0) {
    dummy.chargeDashT -= dt;
    dummy.state = 'charge';
    dummy.x += CHARGE_SPEED * dummy.facing * dt;
    clampPatrol(dummy);
    if (!dummy.struck && Math.abs(player.x - dummy.x) < 1.2 && Math.abs(player.y - dummy.y) < 1.15) {
      if (strikePlayer(world, dummy)) {
        dummy.struck = true;
      }
    }
    if (dummy.chargeDashT <= 0) {
      dummy.state = 'walk';
      dummy.vx = dummy.moveSpeed;
    }
    return;
  }

  if (dummy.castT > 0 && dummy.castId === 'charge') {
    dummy.castT = Math.max(0, dummy.castT - dt);
    dummy.state = 'attack';
    dummy.vx = 0;
    dummy.flash = Math.max(dummy.flash, 0.08);
    if (dummy.castT <= 0) {
      dummy.castId = null;
      dummy.chargeDashT = CHARGE_DASH;
      dummy.struck = false;
      sfx.play('slam');
      world.shake = Math.max(world.shake, 0.35);
    }
    return;
  }

  const dx = Math.abs(player.x - dummy.x);
  if (
    dx < CHARGE_TRIGGER &&
    dx > 1.6 &&
    Math.abs(player.y - dummy.y) < 1.25 &&
    dummy.skillCd <= 0 &&
    player.hp > 0
  ) {
    dummy.facing = player.x >= dummy.x ? 1 : -1;
    dummy.castId = 'charge';
    dummy.castMax = CHARGE_WINDUP;
    dummy.castT = CHARGE_WINDUP;
    dummy.skillCd = 2.6;
    dummy.vx = 0;
    dummy.state = 'attack';
    sfx.play('deny');
    return;
  }

  stepMelee(world, dummy, dt, MELEE_RANGE, 1.15);
}

function stepLeap(world: World, dummy: Dummy, dt: number): void {
  const player = world.player;
  dummy.skillCd = Math.max(0, dummy.skillCd - dt);

  if (dummy.chargeDashT > 0) {
    dummy.chargeDashT -= dt;
    dummy.state = 'charge';
    dummy.x += LEAP_SPEED * dummy.facing * dt;
    clampPatrol(dummy);
    if (!dummy.struck && Math.abs(player.x - dummy.x) < 1.25 && Math.abs(player.y - dummy.y) < 1.25) {
      if (strikePlayer(world, dummy)) {
        dummy.struck = true;
        const hz = defOf(dummy)?.hazardKind;
        if (hz) {
          spawnStyleHazard(world, dummy, player.x, hz, 0.9);
        }
      }
    }
    if (dummy.chargeDashT <= 0) {
      dummy.castId = null;
      dummy.state = 'walk';
      dummy.vx = dummy.moveSpeed;
    }
    return;
  }

  if (dummy.castT > 0 && dummy.castId === 'leap') {
    dummy.castT = Math.max(0, dummy.castT - dt);
    dummy.state = 'attack';
    dummy.vx = 0;
    dummy.flash = Math.max(dummy.flash, 0.1);
    if (dummy.castT <= 0) {
      dummy.chargeDashT = LEAP_DASH;
      dummy.struck = false;
      sfx.play('slam');
      world.shake = Math.max(world.shake, 0.28);
    }
    return;
  }

  const dx = Math.abs(player.x - dummy.x);
  if (
    dx < LEAP_TRIGGER &&
    dx > 1.35 &&
    Math.abs(player.y - dummy.y) < 1.35 &&
    dummy.skillCd <= 0 &&
    player.hp > 0
  ) {
    dummy.facing = player.x >= dummy.x ? 1 : -1;
    dummy.castId = 'leap';
    dummy.castMax = LEAP_WINDUP;
    dummy.castT = LEAP_WINDUP;
    dummy.skillCd = 2.1;
    dummy.vx = 0;
    dummy.state = 'attack';
    sfx.play('deny');
    return;
  }

  stepMelee(world, dummy, dt, MELEE_RANGE, hitReachOf(dummy));
}

function stepSlam(world: World, dummy: Dummy, dt: number): void {
  const player = world.player;
  dummy.skillCd = Math.max(0, dummy.skillCd - dt);

  if (dummy.castT > 0 && dummy.castId === 'slam') {
    dummy.castT = Math.max(0, dummy.castT - dt);
    dummy.state = 'attack';
    dummy.vx = 0;
    dummy.flash = Math.max(dummy.flash, 0.12);
    dummy.facing = player.x >= dummy.x ? 1 : -1;
    if (dummy.castT <= 0) {
      dummy.castId = null;
      dummy.struck = true;
      const hz = defOf(dummy)?.hazardKind ?? 'spike';
      spawnStyleHazard(world, dummy, player.x, hz, 1.35);
      world.shake = Math.max(world.shake, 0.55);
      sfx.play('slam');
    }
    return;
  }

  const dx = Math.abs(player.x - dummy.x);
  if (dx < SLAM_RANGE && dx > 1.4 && Math.abs(player.y - dummy.y) < 1.35 && dummy.skillCd <= 0 && player.hp > 0) {
    dummy.facing = player.x >= dummy.x ? 1 : -1;
    dummy.castId = 'slam';
    dummy.castMax = SLAM_WINDUP;
    dummy.castT = SLAM_WINDUP;
    dummy.skillCd = 2.8;
    dummy.vx = 0;
    dummy.state = 'attack';
    sfx.play('deny');
    return;
  }

  stepMelee(world, dummy, dt, MELEE_RANGE + 0.2, hitReachOf(dummy));
}

function stepSuicide(world: World, dummy: Dummy, dt: number): void {
  const player = world.player;

  if (dummy.fuseT > 0) {
    dummy.fuseT -= dt;
    dummy.state = 'fuse';
    dummy.vx = 0;
    dummy.flash = 0.2;
    if (dummy.fuseT <= 0) {
      explode(world, dummy);
    }
    return;
  }

  const dx = Math.abs(player.x - dummy.x);
  const dy = Math.abs(player.y - dummy.y);
  if (dx < 1.25 && dy < 1.2 && player.hp > 0) {
    dummy.fuseT = SUICIDE_FUSE;
    dummy.state = 'fuse';
    dummy.vx = 0;
    sfx.play('deny');
    return;
  }

  if (dx < SUICIDE_AGGRO && dy < 1.5 && player.hp > 0) {
    dummy.facing = player.x >= dummy.x ? 1 : -1;
    dummy.state = 'walk';
    dummy.x += dummy.moveSpeed * 1.35 * dummy.facing * dt;
    clampPatrol(dummy);
    return;
  }

  patrol(dummy, dt);
}

function explode(world: World, dummy: Dummy): void {
  spawnHazard(world, {
    x: dummy.x - SUICIDE_BLAST * 0.5,
    y: WORLD.groundTop,
    w: SUICIDE_BLAST,
    h: 0.55,
    windup: 0.02,
    life: 0.28,
    damage: Math.round(dummy.atk * 1.1),
    kind: defOf(dummy)?.hazardKind ?? 'spike',
  });
  world.shake = Math.max(world.shake, 1.05);
  sfx.play('bash');
  if (dummy.hp > 0) {
    dummy.hp = 0;
    dummy.state = 'dead';
    onEliteDeath(world, dummy);
    spawnKillLoot(world, dummy);
    grantKillXp(world, dummy);
    noteBossKill(world, dummy);
  }
}

function spawnStyleHazard(
  world: World,
  dummy: Dummy,
  atX: number,
  kind: NonNullable<Hazard['kind']>,
  width: number,
): void {
  spawnHazard(world, {
    x: atX - width * 0.5,
    y: WORLD.groundTop,
    w: width,
    h: kind === 'wave' ? 0.85 : 0.62,
    windup: 0.12,
    life: kind === 'fog' || kind === 'void' ? 0.7 : 0.4,
    damage: Math.round(dummy.atk * 0.85),
    kind,
    hitGap: kind === 'fog' || kind === 'void' ? 0.22 : undefined,
  });
}

const SHOT_SPEED: Record<EnemyShotVisual, number> = {
  spit: 7.8,
  poison: 7.2,
  flame: 8.4,
  ice: 8.0,
  void: 8.6,
  sand: 7.0,
  arcane: 9.2,
  bolt: 11.2,
};

function spawnEnemyShot(world: World, dummy: Dummy): void {
  const def = defOf(dummy);
  const visual: EnemyShotVisual = def?.shotVisual ?? 'spit';
  world.projectileId += 1;
  world.projectiles.push({
    id: world.projectileId,
    x: dummy.x + dummy.facing * 0.55,
    y: dummy.y + dummy.h * 0.55,
    vx: dummy.facing * (SHOT_SPEED[visual] ?? 7.8),
    damage: dummy.atk,
    age: 0,
    life: visual === 'bolt' ? 0.95 : 1.35,
    radius: visual === 'flame' ? 0.34 : visual === 'bolt' ? 0.2 : 0.28,
    owner: 'enemy',
    visual,
    hitEffect: def?.hitEffect,
  });
}

function patrol(dummy: Dummy, dt: number): void {
  dummy.state = 'walk';
  dummy.x += dummy.moveSpeed * dummy.facing * dt;
  if (dummy.x > dummy.patrolMax) {
    dummy.x = dummy.patrolMax;
    dummy.facing = -1;
  } else if (dummy.x < dummy.patrolMin) {
    dummy.x = dummy.patrolMin;
    dummy.facing = 1;
  }
}

function clampPatrol(dummy: Dummy): void {
  if (dummy.x > dummy.patrolMax) {
    dummy.x = dummy.patrolMax;
  } else if (dummy.x < dummy.patrolMin) {
    dummy.x = dummy.patrolMin;
  }
}
