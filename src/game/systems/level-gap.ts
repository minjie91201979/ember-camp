import { ZONES } from '../data/zones';
import type { Dummy, World } from '../types';

/** 越级阈值：目标等级 − 玩家等级（正数表示打高了）。 */
export function levelGapVs(playerLevel: number, enemyLevel: number): number {
  return enemyLevel - playerLevel;
}

/** 推断敌人等级：BOSS≈区上限，精英略高于中位，小怪≈中位。 */
export function enemyLevelOf(world: World, dummy: Dummy): number {
  const zone = ZONES[world.zoneId];
  if (!zone) {
    return world.player.level;
  }
  const mid = (zone.levelMin + zone.levelMax) / 2;
  if (dummy.boss) {
    return zone.levelMax;
  }
  if (dummy.elite) {
    return Math.round(mid + 1.5);
  }
  return Math.round(mid);
}

/** 相对当前区中位的越级差距（正=玩家低于区中位）。 */
export function zoneLevelGap(world: World): number {
  const zone = ZONES[world.zoneId];
  if (!zone || world.zoneId === 'challenge') {
    return 0;
  }
  const mid = (zone.levelMin + zone.levelMax) / 2;
  return mid - world.player.level;
}

/**
 * 目标高出 ≥5 级：命中率下降（5→约 88%，之后每级约 −7%，地板 45%）。
 */
export function overlevelHitChance(gap: number): number {
  if (gap < 5) {
    return 1;
  }
  return Math.max(0.45, 1 - (gap - 4) * 0.07);
}

/** 目标高出 ≥5 级：玩家输出衰减。 */
export function overlevelOutgoingMult(gap: number): number {
  if (gap < 5) {
    return 1;
  }
  return Math.max(0.4, 1 - (gap - 4) * 0.065);
}

/** 目标高出 ≥5 级：玩家受伤增加。 */
export function overlevelIncomingMult(gap: number): number {
  if (gap < 5) {
    return 1;
  }
  return Math.min(1.8, 1 + (gap - 4) * 0.085);
}

export function playerOutgoingVsDummy(world: World, dummy: Dummy): number {
  return overlevelOutgoingMult(levelGapVs(world.player.level, enemyLevelOf(world, dummy)));
}

export function playerHitChanceVsDummy(world: World, dummy: Dummy): number {
  return overlevelHitChance(levelGapVs(world.player.level, enemyLevelOf(world, dummy)));
}

export function playerIncomingFromDummy(world: World, dummy: Dummy): number {
  return overlevelIncomingMult(levelGapVs(world.player.level, enemyLevelOf(world, dummy)));
}

/** 无具体敌人时（环境伤等）按区中位估算。 */
export function playerIncomingFromZone(world: World): number {
  return overlevelIncomingMult(zoneLevelGap(world));
}
