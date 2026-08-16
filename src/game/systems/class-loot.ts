import type { PlayerClassId } from '../data/classes';
import { classVariantId, listClassGearFor } from '../data/class-gear';
import { ITEM_DEFS } from '../data/item-defs';

/** 设计文档：装备掉落 60% 本职可用，40% 随机。 */
export const CLASS_LOOT_BIAS = 0.6;

export function isGearForClass(defId: string, classId: PlayerClassId): boolean {
  const def = ITEM_DEFS[defId];
  if (!def || def.kind !== 'gear') {
    return true;
  }
  if (!def.classAffinity || def.classAffinity.length === 0) {
    return true;
  }
  return def.classAffinity.includes(classId);
}

/**
 * 若掉落为装备且命中本职加权，则换成同档职业武具；否则保持原样。
 */
export function biasGearDropForClass(defId: string, classId: PlayerClassId): string {
  const def = ITEM_DEFS[defId];
  if (!def || def.kind !== 'gear') {
    return defId;
  }
  if (Math.random() >= CLASS_LOOT_BIAS) {
    return defId;
  }
  if (isGearForClass(defId, classId)) {
    return defId;
  }
  const variant = classVariantId(defId, classId);
  if (variant && variant !== defId && ITEM_DEFS[variant]) {
    return variant;
  }
  const pool = listClassGearFor(classId, def.ilvl, def.quality);
  if (pool.length > 0) {
    return pool[Math.floor(Math.random() * pool.length)]!.id;
  }
  const loose = listClassGearFor(classId, def.ilvl);
  if (loose.length > 0) {
    return loose[Math.floor(Math.random() * loose.length)]!.id;
  }
  return defId;
}
