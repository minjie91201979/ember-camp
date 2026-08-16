import type { ItemCompareLine, ItemDef, ItemQuality, World } from '../types';
import { ITEM_DEFS } from '../data/item-defs';
import { ngPlusWeaponAtkMult } from './ng-plus-scale';
import { isGearBroken } from './gear-durability';

export const QUALITY_LABEL: Record<ItemQuality, string> = {
  common: '普通',
  uncommon: '优秀',
  rare: '精良',
  epic: '史诗',
  legendary: '传说',
};

const SLOT_LABEL: Record<string, string> = {
  mainhand: '主手',
};

/** 与 applyGearStats 一致的主手投影攻击（含强化 / NG+ / 淬炼）。 */
export function projectedMainhandAtk(
  weaponAtk: number,
  powerBonus: number,
  weaponEnhance: number,
  ngPlusLevel: number,
  broken = false,
): number {
  const enhanceStep = Math.max(2, Math.round(weaponAtk * 0.14));
  const raw =
    Math.round(weaponAtk * ngPlusWeaponAtkMult(ngPlusLevel)) +
    weaponEnhance * enhanceStep +
    powerBonus;
  if (broken) {
    return Math.max(1, Math.round(raw * 0.3));
  }
  return raw;
}

function toneOfDelta(delta: number): ItemCompareLine['tone'] {
  if (delta > 0) {
    return 'better';
  }
  if (delta < 0) {
    return 'worse';
  }
  return 'equal';
}

function formatSigned(delta: number): string {
  if (delta > 0) {
    return `+${delta}`;
  }
  return `${delta}`;
}

/**
 * 悬停未装备主手时，相对当前主手的对比行。
 * 已装备 / 非装备物品返回空或提示行。
 */
export function gearCompareLines(opts: {
  candidate: ItemDef;
  candidateBonus: number;
  equipped: boolean;
  equippedDef: ItemDef | null;
  equippedBonus: number;
  equippedName: string | null;
  weaponEnhance: number;
  ngPlusLevel: number;
  equippedBroken?: boolean;
}): ItemCompareLine[] {
  const { candidate } = opts;
  if (candidate.kind !== 'gear' || candidate.slot !== 'mainhand') {
    return [];
  }
  if (opts.equipped) {
    return [{ text: '已装备', tone: 'note' }];
  }
  const candAtk = candidate.weaponAtk ?? 0;
  const candPower = projectedMainhandAtk(
    candAtk,
    opts.candidateBonus,
    opts.weaponEnhance,
    opts.ngPlusLevel,
  );
  if (!opts.equippedDef || typeof opts.equippedDef.weaponAtk !== 'number') {
    return [
      { text: '当前未装备主手', tone: 'note' },
      {
        text: `装备后攻击 ${candPower}`,
        tone: 'better',
      },
    ];
  }
  const eqAtk = opts.equippedDef.weaponAtk;
  const eqPower = projectedMainhandAtk(
    eqAtk,
    opts.equippedBonus,
    opts.weaponEnhance,
    opts.ngPlusLevel,
    opts.equippedBroken ?? false,
  );
  const lines: ItemCompareLine[] = [
    {
      text: `对比：${opts.equippedName ?? opts.equippedDef.name}`,
      tone: 'note',
    },
  ];
  const atkDelta = candPower - eqPower;
  lines.push({
    text: `攻击 ${candPower}（${formatSigned(atkDelta)}）`,
    tone: toneOfDelta(atkDelta),
  });
  const ilvlDelta = candidate.ilvl - opts.equippedDef.ilvl;
  lines.push({
    text: `装等 ${candidate.ilvl}（${formatSigned(ilvlDelta)}）`,
    tone: toneOfDelta(ilvlDelta),
  });
  const bonusDelta = opts.candidateBonus - opts.equippedBonus;
  if (opts.candidateBonus > 0 || opts.equippedBonus > 0) {
    lines.push({
      text: `淬炼 ${opts.candidateBonus}（${formatSigned(bonusDelta)}）`,
      tone: toneOfDelta(bonusDelta),
    });
  }
  return lines;
}

/** 地上主手相对当前装备的短对比（拾取提示用；不含未掷出的淬炼）。 */
export function groundGearCompareHint(
  world: World,
  defId: string,
): { text: string; tone: ItemCompareLine['tone'] } | null {
  const candidate = ITEM_DEFS[defId];
  if (!candidate || candidate.kind !== 'gear' || candidate.slot !== 'mainhand') {
    return null;
  }
  const equippedItem = world.bag.find((it) => it.uid === world.mainhandUid);
  const equippedDef = equippedItem ? ITEM_DEFS[equippedItem.defId] ?? null : null;
  const lines = gearCompareLines({
    candidate,
    candidateBonus: 0,
    equipped: false,
    equippedDef,
    equippedBonus: equippedItem?.powerBonus ?? 0,
    equippedName: equippedDef?.name ?? null,
    weaponEnhance: world.player.weaponEnhance,
    ngPlusLevel: world.ngPlusLevel,
    equippedBroken: equippedItem ? isGearBroken(equippedItem) : false,
  });
  const atk = lines.find((l) => l.text.startsWith('攻击 ') || l.text.startsWith('装备后攻击'));
  if (atk) {
    return { text: atk.text, tone: atk.tone };
  }
  const first = lines[0];
  return first ? { text: first.text, tone: first.tone } : null;
}

/** 由物品定义拼出属性行（不含风味长文）。 */
export function itemStatLines(def: ItemDef, powerBonus = 0, dur?: number | null): string[] {
  const lines: string[] = [];
  lines.push(`${QUALITY_LABEL[def.quality]} · 装等 ${def.ilvl}`);
  if (def.kind === 'gear') {
    if (def.slot) {
      const slot = SLOT_LABEL[def.slot] ?? def.slot;
      const type = def.weaponType ? ` · ${def.weaponType}` : '';
      lines.push(`${slot}${type}`);
    }
    if (typeof def.weaponAtk === 'number') {
      lines.push(`武器攻击 +${def.weaponAtk}`);
      lines.push('战士：加成物攻 · 法师：加成法强');
    }
    if (powerBonus > 0) {
      lines.push(`周目淬炼 +${powerBonus}`);
    }
    if (dur !== undefined && dur !== null) {
      lines.push(`耐久 ${dur}/100${dur <= 0 ? ' · 破损（属性大降）' : ''}`);
    }
  } else if (def.kind === 'potion') {
    if (def.heal) {
      const pct = def.heal >= 1000 ? 75 : def.heal >= 220 ? 50 : def.heal >= 140 ? 35 : 22;
      lines.push(`生命回复：至少 ${def.heal}（约 ${pct}% 最大生命取高）`);
    }
    if (def.mana) {
      const pct = def.mana >= 600 ? 80 : def.mana >= 280 ? 55 : def.mana >= 120 ? 40 : 28;
      lines.push(`法力回复：至少 ${def.mana}（约 ${pct}% 资源上限取高）`);
    }
  } else if (def.kind === 'material') {
    lines.push('材料 · 铁匠强化 / 营地出售');
  }
  return lines;
}

export function itemTraitsOf(def: ItemDef): string[] {
  return def.traits ? [...def.traits] : [];
}

/** 风味 + 特效说明。 */
export function itemDetailText(def: ItemDef): string | null {
  const parts: string[] = [];
  if (def.flavor) {
    parts.push(def.flavor);
  }
  if (def.effectDesc) {
    parts.push(def.effectDesc);
  }
  return parts.length > 0 ? parts.join(' · ') : null;
}

/** 单行摘要（商店 / 兼容旧 desc）。 */
export function formatItemSummary(def: ItemDef): string {
  const stats = itemStatLines(def);
  const traits = itemTraitsOf(def);
  const detail = itemDetailText(def);
  const chunks = [
    stats.slice(0, 2).join(' · '),
    typeof def.weaponAtk === 'number' ? `攻击 +${def.weaponAtk}` : null,
    def.heal ? `生命 +${def.heal}` : null,
    def.mana ? `法力 +${def.mana}` : null,
    traits.length > 0 ? `特性：${traits.join('、')}` : null,
    detail,
  ].filter(Boolean);
  return chunks.join(' · ');
}
