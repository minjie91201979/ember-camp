import {
  eliteAffixHintsOf,
  eliteAffixLabel,
  ELITE_AFFIX_POOL,
  formatEliteName,
  type EliteAffixId,
} from '../data/elite-affixes';
import { ENEMY_DEFS, type EnemyDefId } from '../data/enemy-defs';
import type { Dummy, Hazard, World } from '../types';
import { sfx } from '../../audio/sfx';

const HASTE_MOVE = 1.35;
const FROST_RANGE = 4.8;
const FROST_CD = 5.6;
const FROST_SLOW = 2.4;
const SUMMON_RANGE = 11;
const SUMMON_CD = 9.0;
const VAMP_RATIO = 0.38;
const VOLATILE_BLAST = 2.4;

export type EliteAffixAction = { type: 'summon' };

function pushHazard(world: World, spec: Omit<Hazard, 'id' | 'age' | 'struck'>): void {
  world.hazardId += 1;
  world.hazards.push({
    id: world.hazardId,
    age: 0,
    struck: false,
    ...spec,
  });
}

/** 将指定词缀套到精英上（先按敌人表重置移速/体型，避免叠乘）。 */
export function applyEliteAffixes(dummy: Dummy, picked: EliteAffixId[]): void {
  if (!dummy.elite || dummy.boss) {
    dummy.affixes = [];
    return;
  }
  const def = ENEMY_DEFS[dummy.enemyId as EnemyDefId];
  const baseName = def?.name ?? dummy.name.split(' · ')[0] ?? dummy.name;
  if (def) {
    dummy.moveSpeed = def.moveSpeed;
    dummy.visualScale = def.visualScale;
  }
  dummy.affixes = [...picked];
  dummy.affixCd = 1.5 + Math.random() * 1.5;
  dummy.name = formatEliteName(baseName, picked);
  if (picked.includes('haste')) {
    dummy.moveSpeed *= HASTE_MOVE;
    dummy.vx = dummy.moveSpeed * dummy.facing;
  } else {
    dummy.vx = dummy.moveSpeed * dummy.facing;
  }
  if (picked.includes('volatile') || picked.includes('vampiric')) {
    dummy.visualScale *= 1.06;
  }
}

/** 精英（非 BOSS）随机 1～2 条词缀；NG+ 更密，最高 3 条。 */
export function rollAndApplyEliteAffixes(dummy: Dummy, ngPlusLevel = 0): void {
  if (!dummy.elite || dummy.boss) {
    dummy.affixes = [];
    return;
  }
  const r = Math.random();
  let count = 1;
  if (ngPlusLevel >= 2) {
    count = r < 0.35 ? 3 : r < 0.85 ? 2 : 1;
  } else if (ngPlusLevel >= 1) {
    count = r < 0.78 ? 2 : 1;
  } else {
    count = r < 0.55 ? 2 : 1;
  }
  const pool = [...ELITE_AFFIX_POOL];
  const picked: EliteAffixId[] = [];
  for (let i = 0; i < count && pool.length > 0; i += 1) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(idx, 1)[0]!);
  }
  applyEliteAffixes(dummy, picked);
}

export function stepEliteAffixes(
  world: World,
  dummy: Dummy,
  dt: number,
): EliteAffixAction | null {
  if (!dummy.elite || dummy.boss || dummy.hp <= 0 || dummy.affixes.length === 0) {
    return null;
  }
  dummy.affixCd = Math.max(0, dummy.affixCd - dt);
  const player = world.player;
  if (player.hp <= 0 || player.state === 'dead') {
    return null;
  }
  const dist = Math.abs(player.x - dummy.x);
  const dy = Math.abs(player.y - dummy.y);

  if (dummy.affixes.includes('frost') && dummy.affixCd <= 0 && dist < FROST_RANGE && dy < 1.6) {
    beginFrostNova(world, dummy);
    dummy.affixCd = FROST_CD;
    return null;
  }

  if (
    dummy.affixes.includes('summoner') &&
    dummy.affixCd <= 0 &&
    dist < SUMMON_RANGE &&
    dy < 2.2
  ) {
    dummy.affixCd = SUMMON_CD;
    return { type: 'summon' };
  }
  return null;
}

/** 近战命中玩家后：吸血回血。 */
export function onEliteHitPlayer(dummy: Dummy, damageDealt: number): void {
  if (!dummy.affixes.includes('vampiric') || dummy.hp <= 0) {
    return;
  }
  const heal = Math.max(1, Math.round(damageDealt * VAMP_RATIO));
  dummy.hp = Math.min(dummy.maxHp, dummy.hp + heal);
  dummy.flash = Math.max(dummy.flash, 0.12);
}

/** 死亡时：自爆词缀炸一圈（由 hazard 结算伤害）。 */
export function onEliteDeath(world: World, dummy: Dummy): void {
  if (!dummy.affixes.includes('volatile')) {
    return;
  }
  pushHazard(world, {
    x: dummy.x - VOLATILE_BLAST * 0.5,
    y: 1,
    w: VOLATILE_BLAST,
    h: 0.65,
    windup: 0.05,
    life: 0.35,
    damage: Math.round(dummy.atk * 1.25),
    kind: 'fire',
  });
  world.shake = Math.max(world.shake, 0.95);
  sfx.play('bash');
}

/** 词缀越多掉落越好：金币倍率。 */
export function eliteLootGoldMult(dummy: Dummy): number {
  if (!dummy.elite || dummy.affixes.length === 0) {
    return 1;
  }
  return 1 + 0.22 * dummy.affixes.length;
}

export function eliteAffixTags(dummy: Dummy): string[] {
  return dummy.affixes.map(eliteAffixLabel);
}

export function eliteAffixHints(dummy: Dummy): string[] {
  return eliteAffixHintsOf(dummy.affixes);
}

function beginFrostNova(world: World, dummy: Dummy): void {
  const player = world.player;
  if (Math.abs(player.x - dummy.x) < FROST_RANGE) {
    player.slowT = Math.max(player.slowT, FROST_SLOW);
  }
  const spots = [dummy.x - 1.6, dummy.x, dummy.x + 1.6];
  for (const x of spots) {
    pushHazard(world, {
      x: x - 0.85,
      y: 1,
      w: 1.7,
      h: 0.5,
      windup: 0.35,
      life: 1.4,
      damage: Math.round(dummy.atk * 0.65),
      kind: 'ice',
      hitGap: 0.45,
    });
  }
  world.shake = Math.max(world.shake, 0.4);
  sfx.play('deny');
}
