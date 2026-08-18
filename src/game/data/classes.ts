export type PlayerClassId = 'warrior' | 'mage' | 'hunter' | 'rogue' | 'paladin';

export type ClassDef = {
  id: PlayerClassId;
  name: string;
  tagline: string;
  resourceLabel: string;
  /** 资源字段上限（存档仍用 maxRage）。 */
  maxResource: number;
  base: { str: number; agi: number; int: number; vit: number; spi: number };
  growth: { str: number; agi: number; int: number; vit: number; spi: number };
  starterSpent: { str: number; agi: number; int: number; vit: number; spi: number };
  /** 推荐加点循环（填草稿）。 */
  recommendCycle: Array<'str' | 'agi' | 'int' | 'vit' | 'spi'>;
  starterWeapon: string;
  starterPotions: { defId: string; qty: number }[];
  weaponAtk: number;
  armorDef: number;
};

export const CLASS_DEFS: Record<PlayerClassId, ClassDef> = {
  warrior: {
    id: 'warrior',
    name: '战士',
    tagline: '近战怒气 · 猛击与盾击',
    resourceLabel: '怒气',
    maxResource: 100,
    base: { str: 12, agi: 6, int: 4, vit: 10, spi: 5 },
    growth: { str: 2, agi: 0, int: 0, vit: 2, spi: 0 },
    starterSpent: { str: 3, agi: 0, int: 0, vit: 1, spi: 0 },
    recommendCycle: ['str', 'str', 'str', 'vit'],
    starterWeapon: 'apprentice-sword',
    starterPotions: [{ defId: 'life-potion-minor', qty: 5 }],
    weaponAtk: 8,
    armorDef: 6,
  },
  mage: {
    id: 'mage',
    name: '法师',
    tagline: '法力远程 · 火球与冰霜新星',
    resourceLabel: '法力',
    maxResource: 100,
    base: { str: 4, agi: 6, int: 12, vit: 8, spi: 8 },
    growth: { str: 0, agi: 0, int: 2, vit: 1, spi: 1 },
    starterSpent: { str: 0, agi: 0, int: 3, vit: 1, spi: 0 },
    recommendCycle: ['int', 'int', 'int', 'vit'],
    starterWeapon: 'apprentice-staff',
    starterPotions: [
      { defId: 'life-potion-minor', qty: 3 },
      { defId: 'mana-potion-minor', qty: 5 },
    ],
    weaponAtk: 7,
    armorDef: 4,
  },
  hunter: {
    id: 'hunter',
    name: '猎人',
    tagline: '集中远程 · 瞄准与后跳',
    resourceLabel: '集中',
    maxResource: 100,
    base: { str: 6, agi: 12, int: 5, vit: 8, spi: 6 },
    growth: { str: 0, agi: 2, int: 0, vit: 1, spi: 0 },
    starterSpent: { str: 0, agi: 3, int: 0, vit: 1, spi: 0 },
    recommendCycle: ['agi', 'agi', 'agi', 'vit'],
    starterWeapon: 'apprentice-bow',
    starterPotions: [{ defId: 'life-potion-minor', qty: 5 }],
    weaponAtk: 7,
    armorDef: 5,
  },
  rogue: {
    id: 'rogue',
    name: '盗贼',
    tagline: '能量近战 · 影袭与刺骨',
    resourceLabel: '能量',
    maxResource: 100,
    base: { str: 8, agi: 12, int: 4, vit: 7, spi: 6 },
    growth: { str: 1, agi: 2, int: 0, vit: 1, spi: 0 },
    starterSpent: { str: 1, agi: 2, int: 0, vit: 1, spi: 0 },
    recommendCycle: ['agi', 'agi', 'str', 'vit'],
    starterWeapon: 'apprentice-daggers',
    starterPotions: [{ defId: 'life-potion-minor', qty: 5 }],
    weaponAtk: 7,
    armorDef: 4,
  },
  paladin: {
    id: 'paladin',
    name: '圣骑士',
    tagline: '圣能近战 · 审判与圣盾',
    resourceLabel: '圣能',
    maxResource: 100,
    base: { str: 13, agi: 6, int: 5, vit: 11, spi: 6 },
    growth: { str: 2, agi: 0, int: 0, vit: 2, spi: 0 },
    starterSpent: { str: 3, agi: 0, int: 0, vit: 1, spi: 0 },
    recommendCycle: ['str', 'str', 'str', 'vit'],
    starterWeapon: 'apprentice-sword',
    starterPotions: [{ defId: 'life-potion-minor', qty: 5 }],
    weaponAtk: 8,
    armorDef: 7,
  },
};

export function isPlayerClassId(value: unknown): value is PlayerClassId {
  return (
    value === 'warrior' || value === 'mage' || value === 'hunter' || value === 'rogue' || value === 'paladin'
  );
}

export function classDef(id: PlayerClassId): ClassDef {
  return CLASS_DEFS[id];
}
