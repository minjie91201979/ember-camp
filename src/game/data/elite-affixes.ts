/** 精英词缀：野外精英随机 1～2 条。 */

export type EliteAffixId = 'haste' | 'frost' | 'volatile' | 'summoner' | 'vampiric';

export type EliteAffixDef = {
  id: EliteAffixId;
  name: string;
  /** 短标签，拼进敌人名 */
  tag: string;
};

export const ELITE_AFFIX_DEFS: Record<EliteAffixId, EliteAffixDef> = {
  haste: { id: 'haste', name: '加速', tag: '加速' },
  frost: { id: 'frost', name: '冰霜新星', tag: '冰霜' },
  volatile: { id: 'volatile', name: '自爆', tag: '自爆' },
  summoner: { id: 'summoner', name: '召唤', tag: '召唤' },
  vampiric: { id: 'vampiric', name: '吸血', tag: '吸血' },
};

export const ELITE_AFFIX_POOL: EliteAffixId[] = [
  'haste',
  'frost',
  'volatile',
  'summoner',
  'vampiric',
];

export function eliteAffixLabel(id: EliteAffixId): string {
  return ELITE_AFFIX_DEFS[id]?.tag ?? id;
}

export function formatEliteName(baseName: string, affixes: EliteAffixId[]): string {
  if (affixes.length === 0) {
    return baseName;
  }
  return `${baseName} · ${affixes.map(eliteAffixLabel).join('/')}`;
}
