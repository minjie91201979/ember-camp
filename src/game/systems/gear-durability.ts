import type { InventoryItem, ItemDef, ItemQuality, World } from '../types';

/** 装备最大耐久。 */
export const GEAR_MAX_DURABILITY = 100;

/** 死亡时主手耐久损耗。 */
export const DEATH_DURABILITY_LOSS = 10;

/** 耐久归零后武器攻击乘区。 */
export const BROKEN_WEAPON_MULT = 0.3;

const DISMANTLE_QTY: Record<ItemQuality, number> = {
  common: 1,
  uncommon: 1,
  rare: 2,
  epic: 2,
  legendary: 3,
};

export function gearDurability(item: InventoryItem): number {
  return item.dur ?? GEAR_MAX_DURABILITY;
}

export function isGearBroken(item: InventoryItem): boolean {
  return gearDurability(item) <= 0;
}

/** 修理缺失耐久所需金币（无材料折扣的标价）。 */
export function repairGoldCost(item: InventoryItem, def: ItemDef): number {
  const missing = GEAR_MAX_DURABILITY - gearDurability(item);
  if (missing <= 0) {
    return 0;
  }
  return missing * (2 + Math.floor(def.ilvl / 10));
}

/** 有材料时实付金币 = 标价 × 此系数（约四折优惠）。 */
export const REPAIR_MAT_GOLD_MULT = 0.6;

/**
 * 死亡：主手掉耐久。调用方需随后 `applyGearStats`。
 * @returns 是否本次归零破损
 */
export function applyDeathDurabilityLoss(world: World): boolean {
  const item = world.bag.find((it) => it.uid === world.mainhandUid);
  if (!item) {
    return false;
  }
  const before = gearDurability(item);
  if (before <= 0) {
    return false;
  }
  item.dur = Math.max(0, before - DEATH_DURABILITY_LOSS);
  if (item.dur <= 0) {
    world.levelToastT = Math.max(world.levelToastT, 1.6);
    world.levelToastText = '主手已破损 · 回营铁匠修理';
    return true;
  }
  return false;
}

/** 分解一件装备可得材料数量（蓝装以上另得魔法尘）。 */
export function dismantleYield(def: ItemDef): { scrapQty: number; dustQty: number } {
  const scrapQty = DISMANTLE_QTY[def.quality] ?? 1;
  const dustQty =
    def.quality === 'rare' || def.quality === 'epic' || def.quality === 'legendary' ? 1 : 0;
  return { scrapQty, dustQty };
}
