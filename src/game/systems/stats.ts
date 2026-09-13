import type { AttrKey, Player } from '../types';
import type { PlayerClassId } from '../data/classes';
import { CLASS_DEFS } from '../data/classes';

/** @deprecated 请用 CLASS_DEFS.warrior.base */
export const WARRIOR_BASE = CLASS_DEFS.warrior.base;

/** @deprecated 请用 CLASS_DEFS.warrior.growth */
export const WARRIOR_GROWTH = CLASS_DEFS.warrior.growth;

/** @deprecated 请用 CLASS_DEFS.warrior.starterSpent */
export const WARRIOR_STARTER_SPENT = CLASS_DEFS.warrior.starterSpent;

export const WARRIOR_STARTER = {
  level: 1,
  weaponAtk: CLASS_DEFS.warrior.weaponAtk,
  armorDef: CLASS_DEFS.warrior.armorDef,
} as const;

export const ATTR_LABELS: Record<AttrKey, { name: string; tag: '主' | '副'; note: string }> = {
  str: { name: '力量', tag: '主', note: '物理攻击、少量生命' },
  agi: { name: '敏捷', tag: '副', note: '暴击率' },
  int: { name: '智力', tag: '副', note: '法术强度（战士收益低）' },
  vit: { name: '体质', tag: '副', note: '生命、防御' },
  spi: { name: '精神', tag: '副', note: '资源回复、魔抗' },
};

export function attrLabelsForClass(
  classId: PlayerClassId,
): Record<AttrKey, { name: string; tag: '主' | '副'; note: string }> {
  if (classId === 'mage') {
    return {
      str: { name: '力量', tag: '副', note: '少量生命' },
      agi: { name: '敏捷', tag: '副', note: '暴击率' },
      int: { name: '智力', tag: '主', note: '法术强度' },
      vit: { name: '体质', tag: '副', note: '生命、防御' },
      spi: { name: '精神', tag: '副', note: '法力回复、少量法强' },
    };
  }
  if (classId === 'hunter') {
    return {
      str: { name: '力量', tag: '副', note: '少量物理攻击' },
      agi: { name: '敏捷', tag: '主', note: '物理攻击、暴击率' },
      int: { name: '智力', tag: '副', note: '收益低' },
      vit: { name: '体质', tag: '副', note: '生命、防御' },
      spi: { name: '精神', tag: '副', note: '集中回复' },
    };
  }
  if (classId === 'rogue') {
    return {
      str: { name: '力量', tag: '副', note: '少量物理攻击' },
      agi: { name: '敏捷', tag: '主', note: '物理攻击、暴击率' },
      int: { name: '智力', tag: '副', note: '收益低' },
      vit: { name: '体质', tag: '副', note: '生命、防御' },
      spi: { name: '精神', tag: '副', note: '能量回复' },
    };
  }
  return ATTR_LABELS;
}

export type CombatStats = {
  maxHp: number;
  atk: number;
  sp: number;
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
    sp: Math.round(weaponAtk * 0.2 + str * 0.1),
    def: Math.round(armorDef + vit * 0.6),
    critChance: Math.min(0.4, agi * 0.0015),
    critMult: 1.5,
  };
}

export function deriveMageStats(
  level: number,
  int: number,
  agi: number,
  vit: number,
  spi: number,
  weaponAtk: number,
  armorDef: number,
): CombatStats {
  return {
    maxHp: Math.round(68 + vit * 10 + level * 6),
    atk: Math.round(weaponAtk * 0.35 + int * 0.12),
    sp: Math.round(weaponAtk + int * 1.35 + spi * 0.25),
    def: Math.round(armorDef * 0.85 + vit * 0.45),
    critChance: Math.min(0.35, agi * 0.0015 + int * 0.0004),
    critMult: 1.5,
  };
}

export function deriveHunterStats(
  level: number,
  str: number,
  agi: number,
  vit: number,
  weaponAtk: number,
  armorDef: number,
): CombatStats {
  return {
    maxHp: Math.round(74 + vit * 11 + level * 7),
    atk: Math.round(weaponAtk + agi * 1.1 + str * 0.3),
    sp: Math.round(weaponAtk * 0.15 + agi * 0.1),
    def: Math.round(armorDef * 0.95 + vit * 0.5),
    critChance: Math.min(0.42, agi * 0.0018),
    critMult: 1.5,
  };
}

export function deriveRogueStats(
  level: number,
  str: number,
  agi: number,
  vit: number,
  weaponAtk: number,
  armorDef: number,
): CombatStats {
  return {
    maxHp: Math.round(70 + vit * 10 + level * 6),
    atk: Math.round(weaponAtk + agi * 1.0 + str * 0.4),
    sp: Math.round(weaponAtk * 0.12 + agi * 0.08),
    def: Math.round(armorDef * 0.9 + vit * 0.45),
    critChance: Math.min(0.45, agi * 0.002),
    critMult: 1.55,
  };
}

export function deriveStats(player: Player): CombatStats {
  if (player.classId === 'mage') {
    return deriveMageStats(
      player.level,
      player.int,
      player.agi,
      player.vit,
      player.spi,
      player.weaponAtk,
      player.armorDef,
    );
  }
  if (player.classId === 'hunter') {
    return deriveHunterStats(
      player.level,
      player.str,
      player.agi,
      player.vit,
      player.weaponAtk,
      player.armorDef,
    );
  }
  if (player.classId === 'rogue') {
    return deriveRogueStats(
      player.level,
      player.str,
      player.agi,
      player.vit,
      player.weaponAtk,
      player.armorDef,
    );
  }
  return deriveWarriorStats(
    player.level,
    player.str,
    player.agi,
    player.vit,
    player.weaponAtk,
    player.armorDef,
  );
}

export function previewStats(
  player: Player,
  draft: Partial<Record<AttrKey, number>>,
): CombatStats {
  const str = totalAttr(player, 'str') + (draft.str ?? 0);
  const agi = totalAttr(player, 'agi') + (draft.agi ?? 0);
  const int = totalAttr(player, 'int') + (draft.int ?? 0);
  const vit = totalAttr(player, 'vit') + (draft.vit ?? 0);
  const spi = totalAttr(player, 'spi') + (draft.spi ?? 0);
  if (player.classId === 'mage') {
    return deriveMageStats(
      player.level,
      int,
      agi,
      vit,
      spi,
      player.weaponAtk,
      player.armorDef,
    );
  }
  if (player.classId === 'hunter') {
    return deriveHunterStats(
      player.level,
      str,
      agi,
      vit,
      player.weaponAtk,
      player.armorDef,
    );
  }
  if (player.classId === 'rogue') {
    return deriveRogueStats(
      player.level,
      str,
      agi,
      vit,
      player.weaponAtk,
      player.armorDef,
    );
  }
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
  const stats = deriveStats(player);
  const wasDead = player.hp <= 0;
  const ratio = player.maxHp > 0 ? player.hp / player.maxHp : 1;
  player.maxHp = stats.maxHp;
  // 已死亡保持 0；存活时取比例并至少 1，避免同步属性时四舍五入归零
  player.hp = wasDead
    ? 0
    : Math.min(stats.maxHp, Math.max(1, Math.round(stats.maxHp * ratio)));
  player.atk = stats.atk;
  player.sp = stats.sp;
  player.def = stats.def;
  player.critChance = stats.critChance;
  player.critMult = stats.critMult;
  player.maxRage = CLASS_DEFS[player.classId].maxResource;
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

/** 法术伤害：与物理同公式，用 SP。 */
export function spellDamage(
  spellPower: number,
  defense: number,
  skillMult: number,
  crit: boolean,
  critMult: number,
): number {
  return physicalDamage(spellPower, defense, skillMult, crit, critMult);
}

export function xpToNextLevel(level: number): number {
  return 35 + level * 25;
}

/** 设计文档等级上限。 */
export const PLAYER_LEVEL_CAP = 60;

export function xpForKill(dummy: { xpReward?: number; elite?: boolean; kind: string }): number {
  if (typeof dummy.xpReward === 'number') {
    return dummy.xpReward;
  }
  if (dummy.elite) {
    return 90;
  }
  return 28;
}
