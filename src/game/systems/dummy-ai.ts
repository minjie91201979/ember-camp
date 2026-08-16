import { stepBoss, stepHazards } from './boss';
import { stepBreakables } from './breakables';
import { stepEliteAffixes } from './elite-affixes';
import { createDummyFromSpawn, countAliveAdds, spawnEliteAffixAdd } from './enemy-spawn';
import { stepEnemyBehavior, stepProjectiles } from './enemy-behaviors';
import type { Dummy, World } from '../types';
import type { EnemyDefId } from '../data/enemy-defs';

const RESPAWN_DELAY = 12;
const ATTACK_DURATION = 0.55;
/** 镜头外休眠距离（世界单位） */
const AI_SLEEP_RANGE = 26;
/** 存活小怪（非 BOSS）软上限，抑制召唤爆炸 */
const MAX_ALIVE_MOBS = 20;

export function stepDummies(world: World, dt: number): void {
  stepHazards(world, dt);
  stepProjectiles(world, dt);
  stepBreakables(world, dt);
  const px = world.player.x;
  for (const dummy of world.dummies) {
    dummy.flash = Math.max(0, dummy.flash - dt);
    dummy.stunT = Math.max(0, dummy.stunT - dt);
    dummy.chillT = Math.max(0, (dummy.chillT ?? 0) - dt);
    if (dummy.chillT <= 0) {
      dummy.chillMove = 1;
    }
    if (dummy.hp <= 0) {
      dummy.state = 'dead';
      dummy.vx = 0;
      dummy.castT = 0;
      dummy.castId = null;
      dummy.chargeDashT = 0;
      dummy.fuseT = 0;
      dummy.chillT = 0;
      dummy.chillMove = 1;
      dummy.deadT += dt;
      if (!dummy.noRespawn && dummy.deadT >= RESPAWN_DELAY) {
        const refreshed = createDummyFromSpawn(
          dummy.id,
          dummy.enemyId as EnemyDefId,
          dummy.x,
          dummy.y,
          dummy.patrolMin,
          dummy.patrolMax,
          { ngPlusLevel: world.ngPlusLevel },
        );
        Object.assign(dummy, refreshed, {
          id: dummy.id,
          x: Math.min(dummy.patrolMax, Math.max(dummy.patrolMin, dummy.x)),
        });
      }
      continue;
    }
    dummy.deadT = 0;

    const baseSpeed = dummy.moveSpeed;
    const chillMult = dummy.chillT > 0 ? Math.min(1, dummy.chillMove || 0.52) : 1;
    if (chillMult < 1) {
      dummy.moveSpeed = baseSpeed * chillMult;
    }

    if (dummy.boss && stepBoss(world, dummy, dt)) {
      dummy.moveSpeed = baseSpeed;
      continue;
    }

    // 非 BOSS：远离玩家时休眠 AI，降低同屏压力
    if (!dummy.boss && Math.abs(dummy.x - px) > AI_SLEEP_RANGE) {
      dummy.vx = 0;
      dummy.state = 'idle';
      dummy.attackT = 0;
      dummy.moveSpeed = baseSpeed;
      continue;
    }

    if (dummy.stunT > 0) {
      dummy.state = 'idle';
      dummy.vx = 0;
      dummy.attackT = 0;
      dummy.chargeDashT = 0;
      dummy.moveSpeed = baseSpeed;
      continue;
    }

    const affixAction = stepEliteAffixes(world, dummy, dt);
    if (affixAction?.type === 'summon' && countAliveAdds(world) < MAX_ALIVE_MOBS) {
      spawnEliteAffixAdd(world, dummy);
    }

    stepEnemyBehavior(world, dummy, dt);
    dummy.moveSpeed = baseSpeed;
  }
}

export function dummyAttackProgress(dummy: Dummy): number {
  if (dummy.castT > 0 && dummy.castMax > 0) {
    return 1 - dummy.castT / dummy.castMax;
  }
  if (dummy.fuseT > 0) {
    return 1 - dummy.fuseT / 0.85;
  }
  if (dummy.attackT <= 0) {
    return 0;
  }
  return 1 - dummy.attackT / ATTACK_DURATION;
}
