import { stepBoss, stepHazards } from './boss';
import { stepBreakables } from './breakables';
import { stepEliteAffixes } from './elite-affixes';
import { createDummyFromSpawn, spawnEliteAffixAdd } from './enemy-spawn';
import { stepEnemyBehavior, stepProjectiles } from './enemy-behaviors';
import type { Dummy, World } from '../types';
import type { EnemyDefId } from '../data/enemy-defs';

const RESPAWN_DELAY = 12;
const ATTACK_DURATION = 0.55;

export function stepDummies(world: World, dt: number): void {
  stepHazards(world, dt);
  stepProjectiles(world, dt);
  stepBreakables(world, dt);
  for (const dummy of world.dummies) {
    dummy.flash = Math.max(0, dummy.flash - dt);
    dummy.stunT = Math.max(0, dummy.stunT - dt);
    if (dummy.hp <= 0) {
      dummy.state = 'dead';
      dummy.vx = 0;
      dummy.castT = 0;
      dummy.castId = null;
      dummy.chargeDashT = 0;
      dummy.fuseT = 0;
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

    if (dummy.boss && stepBoss(world, dummy, dt)) {
      continue;
    }

    if (dummy.stunT > 0) {
      dummy.state = 'idle';
      dummy.vx = 0;
      dummy.attackT = 0;
      dummy.chargeDashT = 0;
      continue;
    }

    const affixAction = stepEliteAffixes(world, dummy, dt);
    if (affixAction?.type === 'summon') {
      spawnEliteAffixAdd(world, dummy);
    }

    stepEnemyBehavior(world, dummy, dt);
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
