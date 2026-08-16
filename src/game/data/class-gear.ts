import type { PlayerClassId } from './classes';
import type { ItemDef, ItemQuality } from '../types';

type GearTemplate = {
  baseId: string;
  ilvl: number;
  quality: ItemQuality;
  weaponAtk: number;
  names: Record<'mage' | 'hunter' | 'rogue', string>;
  types: Record<'mage' | 'hunter' | 'rogue', string>;
};

/** 与主掉落表常见装备同档的职业变体，供 60% 本职加权使用。 */
const TEMPLATES: GearTemplate[] = [
  {
    baseId: 'mist-blade',
    ilvl: 3,
    quality: 'uncommon',
    weaponAtk: 12,
    names: { mage: '雾林木杖', hunter: '雾林短弓', rogue: '雾林双匕' },
    types: { mage: '法杖', hunter: '短弓', rogue: '双匕' },
  },
  {
    baseId: 'grove-cleaver',
    ilvl: 5,
    quality: 'rare',
    weaponAtk: 16,
    names: { mage: '林地法杖', hunter: '林地长弓', rogue: '林地刺匕' },
    types: { mage: '法杖', hunter: '长弓', rogue: '匕首' },
  },
  {
    baseId: 'iron-pick-blade',
    ilvl: 7,
    quality: 'uncommon',
    weaponAtk: 15,
    names: { mage: '荒石魔杖', hunter: '荒石猎弓', rogue: '荒石短匕' },
    types: { mage: '魔杖', hunter: '短弓', rogue: '匕首' },
  },
  {
    baseId: 'slate-cleaver',
    ilvl: 9,
    quality: 'rare',
    weaponAtk: 20,
    names: { mage: '板岩法杖', hunter: '板岩复合弓', rogue: '板岩双刃' },
    types: { mage: '法杖', hunter: '复合弓', rogue: '双匕' },
  },
  {
    baseId: 'coral-blade',
    ilvl: 12,
    quality: 'uncommon',
    weaponAtk: 18,
    names: { mage: '珊瑚魔杖', hunter: '珊瑚猎弓', rogue: '珊瑚刺匕' },
    types: { mage: '魔杖', hunter: '短弓', rogue: '匕首' },
  },
  {
    baseId: 'brine-cleaver',
    ilvl: 14,
    quality: 'rare',
    weaponAtk: 24,
    names: { mage: '咸潮法杖', hunter: '咸潮长弓', rogue: '咸潮双匕' },
    types: { mage: '法杖', hunter: '长弓', rogue: '双匕' },
  },
  {
    baseId: 'ember-fang',
    ilvl: 17,
    quality: 'uncommon',
    weaponAtk: 22,
    names: { mage: '烬牙魔杖', hunter: '烬牙猎弓', rogue: '烬牙短匕' },
    types: { mage: '魔杖', hunter: '短弓', rogue: '匕首' },
  },
  {
    baseId: 'ashen-cleaver',
    ilvl: 19,
    quality: 'rare',
    weaponAtk: 28,
    names: { mage: '灰烬法杖', hunter: '灰烬长弓', rogue: '灰烬双刃' },
    types: { mage: '法杖', hunter: '长弓', rogue: '双匕' },
  },
  {
    baseId: 'bog-fang',
    ilvl: 22,
    quality: 'uncommon',
    weaponAtk: 26,
    names: { mage: '沼牙魔杖', hunter: '沼牙猎弓', rogue: '沼牙毒匕' },
    types: { mage: '魔杖', hunter: '短弓', rogue: '匕首' },
  },
  {
    baseId: 'venom-cleaver',
    ilvl: 24,
    quality: 'rare',
    weaponAtk: 32,
    names: { mage: '毒沼法杖', hunter: '毒沼长弓', rogue: '毒沼双匕' },
    types: { mage: '法杖', hunter: '长弓', rogue: '双匕' },
  },
  {
    baseId: 'ice-fang',
    ilvl: 27,
    quality: 'uncommon',
    weaponAtk: 30,
    names: { mage: '冰牙魔杖', hunter: '冰牙猎弓', rogue: '冰牙短匕' },
    types: { mage: '魔杖', hunter: '短弓', rogue: '匕首' },
  },
  {
    baseId: 'glacier-cleaver',
    ilvl: 29,
    quality: 'rare',
    weaponAtk: 36,
    names: { mage: '冰川法杖', hunter: '冰川长弓', rogue: '冰川双刃' },
    types: { mage: '法杖', hunter: '长弓', rogue: '双匕' },
  },
  {
    baseId: 'scorpion-stinger',
    ilvl: 32,
    quality: 'uncommon',
    weaponAtk: 34,
    names: { mage: '蝎刺魔杖', hunter: '蝎刺猎弓', rogue: '蝎刺短匕' },
    types: { mage: '魔杖', hunter: '短弓', rogue: '匕首' },
  },
  {
    baseId: 'sandstorm-cleaver',
    ilvl: 34,
    quality: 'rare',
    weaponAtk: 40,
    names: { mage: '沙暴法杖', hunter: '沙暴长弓', rogue: '沙暴双匕' },
    types: { mage: '法杖', hunter: '长弓', rogue: '双匕' },
  },
  {
    baseId: 'ruin-blade',
    ilvl: 37,
    quality: 'uncommon',
    weaponAtk: 38,
    names: { mage: '废墟魔杖', hunter: '废墟猎弓', rogue: '废墟刺匕' },
    types: { mage: '魔杖', hunter: '短弓', rogue: '匕首' },
  },
  {
    baseId: 'astral-cleaver',
    ilvl: 39,
    quality: 'rare',
    weaponAtk: 44,
    names: { mage: '星辉法杖', hunter: '星辉长弓', rogue: '星辉双刃' },
    types: { mage: '法杖', hunter: '长弓', rogue: '双匕' },
  },
  {
    baseId: 'cult-dagger',
    ilvl: 42,
    quality: 'uncommon',
    weaponAtk: 42,
    names: { mage: '教团魔杖', hunter: '教团猎弓', rogue: '教团仪式匕' },
    types: { mage: '魔杖', hunter: '短弓', rogue: '匕首' },
  },
  {
    baseId: 'tide-cleaver',
    ilvl: 44,
    quality: 'rare',
    weaponAtk: 48,
    names: { mage: '暗潮法杖', hunter: '暗潮长弓', rogue: '暗潮双匕' },
    types: { mage: '法杖', hunter: '长弓', rogue: '双匕' },
  },
  {
    baseId: 'wing-blade',
    ilvl: 47,
    quality: 'uncommon',
    weaponAtk: 46,
    names: { mage: '翼骨魔杖', hunter: '翼骨猎弓', rogue: '翼骨短匕' },
    types: { mage: '魔杖', hunter: '短弓', rogue: '匕首' },
  },
  {
    baseId: 'ridge-cleaver',
    ilvl: 49,
    quality: 'rare',
    weaponAtk: 52,
    names: { mage: '龙脊法杖', hunter: '龙脊长弓', rogue: '龙脊双刃' },
    types: { mage: '法杖', hunter: '长弓', rogue: '双匕' },
  },
  {
    baseId: 'rift-blade',
    ilvl: 52,
    quality: 'uncommon',
    weaponAtk: 50,
    names: { mage: '裂隙魔杖', hunter: '裂隙猎弓', rogue: '裂隙刺匕' },
    types: { mage: '魔杖', hunter: '短弓', rogue: '匕首' },
  },
  {
    baseId: 'void-cleaver',
    ilvl: 54,
    quality: 'rare',
    weaponAtk: 56,
    names: { mage: '虚空法杖', hunter: '虚空长弓', rogue: '虚空双匕' },
    types: { mage: '法杖', hunter: '长弓', rogue: '双匕' },
  },
  {
    baseId: 'guard-blade',
    ilvl: 57,
    quality: 'uncommon',
    weaponAtk: 54,
    names: { mage: '近卫魔杖', hunter: '近卫猎弓', rogue: '近卫短匕' },
    types: { mage: '魔杖', hunter: '短弓', rogue: '匕首' },
  },
  {
    baseId: 'end-cleaver',
    ilvl: 59,
    quality: 'rare',
    weaponAtk: 60,
    names: { mage: '终焉法杖', hunter: '终焉长弓', rogue: '终焉双刃' },
    types: { mage: '法杖', hunter: '长弓', rogue: '双匕' },
  },
];

const CLASSES: Array<'mage' | 'hunter' | 'rogue'> = ['mage', 'hunter', 'rogue'];

export const CLASS_GEAR_DEFS: Record<string, ItemDef> = {};

for (const t of TEMPLATES) {
  for (const cls of CLASSES) {
    const id = `${t.baseId}-${cls}`;
    CLASS_GEAR_DEFS[id] = {
      id,
      name: t.names[cls],
      kind: 'gear',
      slot: 'mainhand',
      quality: t.quality,
      ilvl: t.ilvl,
      weaponAtk: t.weaponAtk,
      weaponType: t.types[cls],
      classAffinity: [cls],
      traits: ['职业装备'],
      flavor: `为${cls === 'mage' ? '法师' : cls === 'hunter' ? '猎人' : '盗贼'}改制的同档武具。`,
    };
  }
}

/** 基底近战默认亲和战士。 */
export const WARRIOR_BASE_AFFINITY: PlayerClassId[] = ['warrior'];

/** 去掉职业后缀，得到掉落表基底 id。 */
export function stripClassSuffix(defId: string): string {
  return defId.replace(/-(mage|hunter|rogue)$/, '');
}

export function classVariantId(defId: string, classId: PlayerClassId): string | null {
  if (classId === 'warrior') {
    return stripClassSuffix(defId);
  }
  const id = `${stripClassSuffix(defId)}-${classId}`;
  return id in CLASS_GEAR_DEFS ? id : null;
}

export function listClassGearFor(
  classId: PlayerClassId,
  ilvl: number,
  quality?: ItemQuality,
): ItemDef[] {
  return Object.values(CLASS_GEAR_DEFS).filter((d) => {
    if (!d.classAffinity?.includes(classId)) {
      return false;
    }
    if (Math.abs(d.ilvl - ilvl) > 4) {
      return false;
    }
    if (quality && d.quality !== quality) {
      return false;
    }
    return true;
  });
}
