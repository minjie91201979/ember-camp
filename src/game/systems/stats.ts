import type { AttrKey, Player } from '../types';

/** 战士 1 级种族基础（不含自由加点）。 */
export const WARRIOR_BASE = {
  str: 12,
  agi: 6,
  int: 4,
  vit: 10,
  spi: 5,
} as const;

/** 战士每级自动成长（不耗属性点）。 */
export const WARRIOR_GROWTH = {
  str: 2,
  agi: 0,
  int: 0,
  vit: 2,
  spi: 0,
} as const;

/** 默认推荐：3 力 1 体。 */
export const WARRIOR_STARTER_SPENT = {
  str: 3,
  agi: 0,
  int: 0,
  vit: 1,
  spi: 0,
} as const;

export const WARRIOR_STARTER = {
  level: 1,
  weaponAtk: 8,
  armorDef: 6,
} as const;

export const ATTR_LABELS: Record<AttrKey, { name: string; tag: '主' | '副'; note: string }> = {
  str: { name: '力量', tag: '主', note: '物理攻击、少量生命' },
  agi: { name: '敏捷', tag: '副', note: '暴击率' },
  int: { name: '智力', tag: '副', note: '法术强度（战士收益低）' },
  vit: { name: '体质', tag: '副', note: '生命、防御' },
  spi: { name: '精神', tag: '副', note: '资源回复、魔抗' },
};

export type CombatStats = {
  maxHp: number;
  atk: number;
  def: number;
  critChance: number;
  critMult: number;
};

export function totalAttr(player: Player, key: AttrKey): number {
  switch (key) {
    case 'str':
      return player.baseStr + player.spentStr;
    case 'agi':
      return player.baseAgi + player.spentAgi;
    case 'int':
      return player.baseInt + player.spentInt;
    case 'vit':
      return player.baseVit + player.spentVit;
    case 'spi':
      return player.baseSpi + player.spentSpi;
  }
}

export function deriveWarriorStats(
  level: number,
  str: number,
  agi: number,
  vit: number,
  weaponAtk: number,
  armorDef: number,
): CombatStats {
  return {
    maxHp: Math.round(80 + vit * 12 + str * 2 + level * 8),
    atk: Math.round(weaponAtk + str * 1.2 + agi * 0.2),
    def: Math.round(armorDef + vit * 0.6),
    critChance: Math.min(0.4, agi * 0.0015),
    critMult: 1.5,
  };
}

export function previewStats(
  player: Player,
  draft: Partial<Record<AttrKey, number>>,
): CombatStats {
  const str = totalAttr(player, 'str') + (draft.str ?? 0);
  const agi = totalAttr(player, 'agi') + (draft.agi ?? 0);
  const vit = totalAttr(player, 'vit') + (draft.vit ?? 0);
  return deriveWarriorStats(
    player.level,
    str,
    agi,
    vit,
    player.weaponAtk,
    player.armorDef,
  );
}

export function syncPlayerTotals(player: Player): void {
  player.str = totalAttr(player, 'str');
  player.agi = totalAttr(player, 'agi');
  player.int = totalAttr(player, 'int');
  player.vit = totalAttr(player, 'vit');
  player.spi = totalAttr(player, 'spi');
}

export function applyDerivedToPlayer(player: Player): void {
  syncPlayerTotals(player);
  const stats = deriveWarriorStats(
    player.level,
    player.str,
    player.agi,
    player.vit,
    player.weaponAtk,
    player.armorDef,
  );
  const ratio = player.maxHp > 0 ? player.hp / player.maxHp : 1;
  player.maxHp = stats.maxHp;
  player.hp = Math.min(stats.maxHp, Math.max(1, Math.round(stats.maxHp * ratio)));
  player.atk = stats.atk;
  player.def = stats.def;
  player.critChance = stats.critChance;
  player.critMult = stats.critMult;
}

export function physicalDamage(
  attack: number,
  defense: number,
  skillMult: number,
  crit: boolean,
  critMult: number,
): number {
  const mitigated = attack * skillMult * (1 - defense / (defense + 200));
  const raw = mitigated * (crit ? critMult : 1);
  return Math.max(1, Math.round(raw));
}

export function xpToNextLevel(level: number): number {
  return 35 + level * 25;
}

export function xpForKill(dummy: { xpReward?: number; elite?: boolean; kind: string }): number {
  if (typeof dummy.xpReward === 'number') {
    return dummy.xpReward;
  }
  if (dummy.elite) {
    return 90;
  }
  return dummy.kind === 'treant' ? 42 : 28;
}
