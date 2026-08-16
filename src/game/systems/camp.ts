import { ITEM_DEFS } from '../data/item-defs';
import { ZONES } from '../data/zones';
import type { InventoryItem, World } from '../types';
import { applyGearStats, addItemToBag, potionStackRoom, bagAddFailText } from './inventory';
import { clearAttrDraft } from './attributes';
import { upgradeCost, skillsForClass } from './skills';
import { travelToNode } from './zone-travel';
import { sfx } from '../../audio/sfx';
import { resetSpecialization } from './specialization';
import {
  dismantleYield,
  GEAR_MAX_DURABILITY,
  repairGoldCost,
  REPAIR_MAT_GOLD_MULT,
} from './gear-durability';

export type CampNpcId =
  | 'merchant'
  | 'weaponsmith'
  | 'apothecary'
  | 'blacksmith'
  | 'trainer'
  | 'teleport'
  | 'challenge';

export type CampNpc = {
  id: CampNpcId;
  name: string;
  x: number;
  /** 世界空间交互提示高度 */
  promptY: number;
  prompt: string;
};

export const CAMP_NPCS: CampNpc[] = [
  { id: 'teleport', name: '传送阵', x: -5.6, promptY: 3.35, prompt: '打开传送' },
  { id: 'challenge', name: '词缀试炼', x: -2.6, promptY: 3.2, prompt: '开启挑战' },
  { id: 'trainer', name: '训练师', x: 0.4, promptY: 3.05, prompt: '重置加点' },
  { id: 'blacksmith', name: '铁匠', x: 3.0, promptY: 3.35, prompt: '强化 / 修理' },
  { id: 'weaponsmith', name: '武器商人', x: 5.5, promptY: 3.35, prompt: '买卖武器' },
  { id: 'merchant', name: '杂货商人', x: 7.9, promptY: 3.4, prompt: '买卖材料' },
  { id: 'apothecary', name: '药水商人', x: 10.3, promptY: 3.35, prompt: '购买药水' },
];

const INTERACT_RANGE = 2.5;

/** 药水商人库存（各档红/蓝）。 */
export const POTION_SHOP_STOCK: { defId: string; price: number }[] = [
  { defId: 'life-potion-minor', price: 25 },
  { defId: 'life-potion-mid', price: 70 },
  { defId: 'life-potion-greater', price: 160 },
  { defId: 'life-potion-ultra', price: 380 },
  { defId: 'mana-potion-minor', price: 22 },
  { defId: 'mana-potion-mid', price: 65 },
  { defId: 'mana-potion-greater', price: 150 },
  { defId: 'mana-potion-ultra', price: 360 },
];

/** 杂货商人：基础材料。 */
export const MERCHANT_STOCK: { defId: string; price: number }[] = [
  { defId: 'woodland-scrap', price: 18 },
  { defId: 'magic-dust', price: 45 },
];

/** @deprecated 兼容旧引用；请用 shopStockFor */
export const SHOP_STOCK = [...POTION_SHOP_STOCK, ...MERCHANT_STOCK];

/** 药水一键买入数量 */
export const SHOP_POTION_BULK = 5;

const WEAPON_SHOP_CAP = 6;

export function weaponShopPrice(defId: string): number {
  const def = ITEM_DEFS[defId];
  if (!def || def.kind !== 'gear') {
    return 50;
  }
  const qBonus = def.quality === 'uncommon' ? 55 : 0;
  return 28 + def.ilvl * 9 + qBonus;
}

/** 当前等级段白/绿主手（偏本职，最多 6 件）。 */
export function weaponShopStock(world: World): { defId: string; price: number }[] {
  const level = world.player.level;
  const classId = world.player.classId;
  const minIlvl = Math.max(1, level - 6);
  const maxIlvl = level + 2;
  type Row = { defId: string; price: number; score: number };
  const classHits: Row[] = [];
  const otherHits: Row[] = [];
  for (const def of Object.values(ITEM_DEFS)) {
    if (def.kind !== 'gear' || def.slot !== 'mainhand') {
      continue;
    }
    if (def.quality !== 'common' && def.quality !== 'uncommon') {
      continue;
    }
    if (def.ilvl < minIlvl || def.ilvl > maxIlvl) {
      continue;
    }
    const affinity = def.classAffinity;
    const classOk = !affinity || affinity.length === 0 || affinity.includes(classId);
    const row: Row = {
      defId: def.id,
      price: weaponShopPrice(def.id),
      score: def.ilvl * 10 + (def.quality === 'uncommon' ? 5 : 0),
    };
    if (classOk) {
      classHits.push(row);
    } else {
      otherHits.push(row);
    }
  }
  const byScore = (a: Row, b: Row) => b.score - a.score || a.price - b.price;
  classHits.sort(byScore);
  otherHits.sort(byScore);
  const picked = [...classHits, ...otherHits].slice(0, WEAPON_SHOP_CAP);
  return picked.map(({ defId, price }) => ({ defId, price }));
}

export function shopStockFor(world: World): { defId: string; price: number }[] {
  if (world.campOpen === 'apothecary') {
    return POTION_SHOP_STOCK;
  }
  if (world.campOpen === 'merchant') {
    return MERCHANT_STOCK;
  }
  if (world.campOpen === 'weaponsmith') {
    return weaponShopStock(world);
  }
  return [];
}

export function syncCampProximity(world: World): void {
  if (world.campOpen) {
    return;
  }
  if (world.zoneId !== 'a01') {
    world.nearbyCamp = null;
    return;
  }
  const px = world.player.x;
  let best: CampNpc | null = null;
  let bestDist = INTERACT_RANGE;
  for (const npc of CAMP_NPCS) {
    const d = Math.abs(px - npc.x);
    // 只要求大致在地面高度，避免跳跃/落差误判
    if (d < bestDist && world.player.y > -0.5 && world.player.y < 3.5) {
      best = npc;
      bestDist = d;
    }
  }
  world.nearbyCamp = best ? best.id : null;
}

/** 非营地区域的回营传送点（如矿坑入口）。 */
export function syncHubPortalProximity(world: World): void {
  const zone = ZONES[world.zoneId];
  const portal = zone?.hubPortal;
  if (!portal || world.campOpen) {
    world.nearbyHubPortal = false;
    return;
  }
  const near =
    Math.abs(world.player.x - portal.x) < INTERACT_RANGE &&
    world.player.y > -0.5 &&
    world.player.y < 3.5;
  world.nearbyHubPortal = near;
}

export function tryOpenCamp(world: World): boolean {
  if (!world.nearbyCamp || world.player.hp <= 0) {
    return false;
  }
  world.campOpen = world.nearbyCamp;
  world.invOpen = false;
  world.charOpen = false;
  world.skillOpen = false;
  world.catalogOpen = false;
  world.specPickOpen = false;
  clearAttrDraft(world);
  if (world.nearbyCamp === 'teleport' && world.offerNgPlusHint) {
    world.campMessage = '通关奖励已就绪 · 可开启 NG+';
  } else {
    world.campMessage = '';
  }
  sfx.play('land');
  return true;
}

export function tryOpenHubPortal(world: World): boolean {
  if (!world.nearbyHubPortal || world.player.hp <= 0) {
    return false;
  }
  world.campOpen = 'teleport';
  world.invOpen = false;
  world.charOpen = false;
  world.skillOpen = false;
  world.catalogOpen = false;
  world.specPickOpen = false;
  clearAttrDraft(world);
  if (world.offerNgPlusHint) {
    world.campMessage = '通关奖励已就绪 · 可开启 NG+';
  }
  sfx.play('land');
  return true;
}

export function closeCamp(world: World): void {
  world.campOpen = null;
}

/** 背包中某 defId 的合计数量。 */
export function bagOwnedQty(world: World, defId: string): number {
  let n = 0;
  for (const it of world.bag) {
    if (it.defId === defId) {
      n += it.qty;
    }
  }
  return n;
}

export function buyShopItem(world: World, defId: string, qty = 1): string {
  const stock = shopStockFor(world).find((s) => s.defId === defId);
  if (!stock) {
    return '商品不存在';
  }
  const def = ITEM_DEFS[defId];
  let count = Math.max(1, Math.floor(qty));
  if (def?.kind === 'potion') {
    const room = potionStackRoom(world, defId);
    if (room <= 0) {
      sfx.play('deny');
      return '该药水已达堆叠上限（20）';
    }
    count = Math.min(count, SHOP_POTION_BULK, room);
  } else {
    count = 1;
  }
  const total = stock.price * count;
  if (world.gold < total) {
    sfx.play('deny');
    return '金币不足';
  }
  if (!addItemToBag(world, defId, count)) {
    sfx.play('deny');
    return bagAddFailText(world, defId);
  }
  world.gold -= total;
  sfx.play('land');
  const name = def?.name ?? defId;
  return count > 1 ? `购入 ${name} ×${count}` : `购入 ${name}`;
}

export function sellBagItem(world: World, uid: number): string {
  const idx = world.bag.findIndex((it) => it.uid === uid);
  const item = world.bag[idx];
  if (!item) {
    return '物品不存在';
  }
  if (world.mainhandUid === uid) {
    sfx.play('deny');
    return '请先卸下已装备武器';
  }
  const price = sellPrice(item);
  world.gold += price;
  if (item.qty > 1) {
    item.qty -= 1;
  } else {
    world.bag.splice(idx, 1);
  }
  sfx.play('land');
  return `售出，获得 ${price} 金`;
}

/** 背包中可出售材料的件数与总价（整堆）。 */
export function materialsSellPreview(world: World): { stacks: number; units: number; gold: number } {
  let stacks = 0;
  let units = 0;
  let gold = 0;
  for (const item of world.bag) {
    const def = ITEM_DEFS[item.defId];
    if (def?.kind !== 'material') {
      continue;
    }
    stacks += 1;
    units += item.qty;
    gold += sellPrice(item) * item.qty;
  }
  return { stacks, units, gold };
}

/** 一键出售全部材料（不卖装备/药水）。 */
export function sellAllMaterials(world: World): string {
  const preview = materialsSellPreview(world);
  if (preview.stacks <= 0) {
    sfx.play('deny');
    return '没有可出售的材料';
  }
  const keep = world.bag.filter((it) => ITEM_DEFS[it.defId]?.kind !== 'material');
  world.bag = keep;
  world.gold += preview.gold;
  sfx.play('land');
  return `售出材料 ${preview.units} 件，获得 ${preview.gold} 金`;
}

function isUnequippedGearQuality(
  world: World,
  item: InventoryItem,
  quality: 'common' | 'uncommon' | 'rare',
): boolean {
  if (world.mainhandUid === item.uid) {
    return false;
  }
  const def = ITEM_DEFS[item.defId];
  return def?.kind === 'gear' && def.quality === quality;
}

function gearSellPreview(
  world: World,
  quality: 'common' | 'uncommon' | 'rare',
): { stacks: number; units: number; gold: number } {
  let stacks = 0;
  let units = 0;
  let gold = 0;
  for (const item of world.bag) {
    if (!isUnequippedGearQuality(world, item, quality)) {
      continue;
    }
    stacks += 1;
    units += item.qty;
    gold += sellPrice(item) * item.qty;
  }
  return { stacks, units, gold };
}

function sellAllGearQuality(
  world: World,
  quality: 'common' | 'uncommon' | 'rare',
  emptyMsg: string,
  okLabel: string,
): string {
  const preview = gearSellPreview(world, quality);
  if (preview.stacks <= 0) {
    sfx.play('deny');
    return emptyMsg;
  }
  const keep = world.bag.filter((it) => !isUnequippedGearQuality(world, it, quality));
  world.bag = keep;
  world.gold += preview.gold;
  sfx.play('land');
  return `售出${okLabel} ${preview.units} 件，获得 ${preview.gold} 金`;
}

/** 背包中可出售白装（未装备的 common 装备）件数与总价。 */
export function commonGearSellPreview(world: World): {
  stacks: number;
  units: number;
  gold: number;
} {
  return gearSellPreview(world, 'common');
}

/** 一键出售未装备白装（不卖绿装及以上 / 药水 / 材料 / 已装备）。 */
export function sellAllCommonGear(world: World): string {
  return sellAllGearQuality(world, 'common', '没有可出售的白装', '白装');
}

/** 背包中可出售绿装（未装备的 uncommon 装备）件数与总价。 */
export function uncommonGearSellPreview(world: World): {
  stacks: number;
  units: number;
  gold: number;
} {
  return gearSellPreview(world, 'uncommon');
}

/** 一键出售未装备绿装（不卖蓝装及以上 / 药水 / 材料 / 已装备）。 */
export function sellAllUncommonGear(world: World): string {
  return sellAllGearQuality(world, 'uncommon', '没有可出售的绿装', '绿装');
}

/** 背包中可出售蓝装（未装备的 rare 装备）件数与总价。 */
export function rareGearSellPreview(world: World): {
  stacks: number;
  units: number;
  gold: number;
} {
  return gearSellPreview(world, 'rare');
}

/** 一键出售未装备蓝装；紫装/橙装仍须逐件卖出。 */
export function sellAllRareGear(world: World): string {
  return sellAllGearQuality(world, 'rare', '没有可出售的蓝装', '蓝装');
}

export function sellPrice(item: InventoryItem): number {
  const def = ITEM_DEFS[item.defId];
  if (!def) {
    return 1;
  }
  if (def.kind === 'gear') {
    return Math.max(8, Math.round((def.weaponAtk ?? 4) * 4));
  }
  if (def.kind === 'potion') {
    return 8;
  }
  if (def.kind === 'material') {
    if (def.quality === 'legendary') {
      return 160 + def.ilvl * 2;
    }
    if (def.quality === 'rare') {
      return 36 + def.ilvl * 2;
    }
    if (def.quality === 'uncommon') {
      return 14 + def.ilvl;
    }
    return 6;
  }
  return 6;
}

export function enhanceGoldCost(enhanceLevel: number): number {
  return 35 + enhanceLevel * 30;
}

/** 主手强化上限（设计：最高 +8）。 */
export const WEAPON_ENHANCE_MAX = 8;

/**
 * 从当前强化等级升到下一级的成功率（0～1）。
 * 低档保底，高档递减；失败只耗材料与金币，不毁装、不掉级。
 */
export function enhanceSuccessRate(enhanceLevel: number): number {
  const table = [1, 1, 0.95, 0.9, 0.85, 0.75, 0.6, 0.45];
  return table[Math.min(enhanceLevel, table.length - 1)] ?? 0.45;
}

export function enhanceSuccessPct(enhanceLevel: number): number {
  return Math.round(enhanceSuccessRate(enhanceLevel) * 100);
}

export function countEnhanceMaterials(world: World): number {
  let n = 0;
  for (const it of world.bag) {
    if (ITEM_DEFS[it.defId]?.kind === 'material') {
      n += it.qty;
    }
  }
  return n;
}

export function canEnhanceWeapon(world: World): boolean {
  if (world.player.weaponEnhance >= WEAPON_ENHANCE_MAX) {
    return false;
  }
  if (!world.bag.some((it) => it.uid === world.mainhandUid)) {
    return false;
  }
  return countEnhanceMaterials(world) > 0 && world.gold >= enhanceGoldCost(world.player.weaponEnhance);
}

export function enhanceWeapon(world: World): string {
  const equipped = world.bag.find((it) => it.uid === world.mainhandUid);
  if (!equipped) {
    sfx.play('deny');
    return '没有装备主手武器';
  }
  if (world.player.weaponEnhance >= WEAPON_ENHANCE_MAX) {
    sfx.play('deny');
    return `已达强化上限 +${WEAPON_ENHANCE_MAX}`;
  }
  const scrap = world.bag.find((it) => ITEM_DEFS[it.defId]?.kind === 'material');
  const goldCost = enhanceGoldCost(world.player.weaponEnhance);
  if (!scrap || world.gold < goldCost) {
    sfx.play('deny');
    return `需要 ${goldCost} 金 + 1 任意材料`;
  }
  world.gold -= goldCost;
  if (scrap.qty > 1) {
    scrap.qty -= 1;
  } else {
    world.bag = world.bag.filter((it) => it.uid !== scrap.uid);
  }
  const rate = enhanceSuccessRate(world.player.weaponEnhance);
  if (Math.random() >= rate) {
    sfx.play('deny');
    return `强化失败 · 材料已耗（成功率 ${Math.round(rate * 100)}%）`;
  }
  world.player.weaponEnhance += 1;
  applyGearStats(world.player, world);
  sfx.play('bash');
  return `强化成功 · 当前 +${world.player.weaponEnhance}`;
}

export type RepairQuote = {
  fullCost: number;
  cost: number;
  useMat: boolean;
};

/** 修理报价：有任意材料时金币约六折并消耗 1 材料。 */
export function repairQuote(world: World): RepairQuote | null {
  const item = world.bag.find((it) => it.uid === world.mainhandUid);
  const def = item ? ITEM_DEFS[item.defId] : undefined;
  if (!item || !def || def.kind !== 'gear') {
    return null;
  }
  const fullCost = repairGoldCost(item, def);
  if (fullCost <= 0) {
    return { fullCost: 0, cost: 0, useMat: false };
  }
  const useMat = countEnhanceMaterials(world) > 0;
  const cost = useMat ? Math.max(1, Math.floor(fullCost * REPAIR_MAT_GOLD_MULT)) : fullCost;
  return { fullCost, cost, useMat };
}

export function canRepairWeapon(world: World): boolean {
  const quote = repairQuote(world);
  if (!quote || quote.cost <= 0) {
    return false;
  }
  return world.gold >= quote.cost;
}

export function repairWeapon(world: World): string {
  const item = world.bag.find((it) => it.uid === world.mainhandUid);
  const def = item ? ITEM_DEFS[item.defId] : undefined;
  if (!item || !def || def.kind !== 'gear') {
    sfx.play('deny');
    return '没有装备主手武器';
  }
  const quote = repairQuote(world);
  if (!quote || quote.cost <= 0) {
    sfx.play('deny');
    return '主手无需修理';
  }
  if (world.gold < quote.cost) {
    sfx.play('deny');
    return `需要 ${quote.cost} 金`;
  }
  if (quote.useMat) {
    const scrap = world.bag.find((it) => ITEM_DEFS[it.defId]?.kind === 'material');
    if (!scrap) {
      sfx.play('deny');
      return '材料不足';
    }
    if (scrap.qty > 1) {
      scrap.qty -= 1;
    } else {
      world.bag = world.bag.filter((it) => it.uid !== scrap.uid);
    }
  }
  world.gold -= quote.cost;
  item.dur = GEAR_MAX_DURABILITY;
  applyGearStats(world.player, world);
  sfx.play('bash');
  const matNote = quote.useMat ? ` · 耗 1 材料（省 ${quote.fullCost - quote.cost} 金）` : '';
  return `修理完成 · 耐久 ${GEAR_MAX_DURABILITY}/${GEAR_MAX_DURABILITY}${matNote}`;
}

/** 分解未装备装备 → 材料（蓝装以上另得魔法尘）。 */
export function dismantleBagItem(world: World, uid: number): string {
  const item = world.bag.find((it) => it.uid === uid);
  const def = item ? ITEM_DEFS[item.defId] : undefined;
  if (!item || !def || def.kind !== 'gear') {
    sfx.play('deny');
    return '只能分解装备';
  }
  if (world.mainhandUid === uid) {
    sfx.play('deny');
    return '请先卸下已装备的主手';
  }
  const { scrapQty, dustQty } = dismantleYield(def);
  world.bag = world.bag.filter((it) => it.uid !== uid);
  addItemToBag(world, 'woodland-scrap', scrapQty);
  if (dustQty > 0) {
    addItemToBag(world, 'magic-dust', dustQty);
  }
  const dustNote = dustQty > 0 ? ` · 魔法尘×${dustQty}` : '';
  sfx.play('loot');
  return `分解 ${def.name} → 碎材×${scrapQty}${dustNote}`;
}

export function resetAttributes(world: World): string {
  const p = world.player;
  const spent =
    p.spentStr + p.spentAgi + p.spentInt + p.spentVit + p.spentSpi;
  if (spent <= 0) {
    sfx.play('deny');
    return '没有可重置的属性点';
  }
  const cost = p.attrResetCount === 0 ? 0 : 20 * p.level * p.attrResetCount;
  if (world.gold < cost) {
    sfx.play('deny');
    return `需要 ${cost} 金`;
  }
  world.gold -= cost;
  p.unspentAttr += spent;
  p.spentStr = 0;
  p.spentAgi = 0;
  p.spentInt = 0;
  p.spentVit = 0;
  p.spentSpi = 0;
  p.attrResetCount += 1;
  clearAttrDraft(world);
  applyGearStats(p, world);
  sfx.play('levelup');
  return cost === 0 ? '属性点已重置（首次免费）' : `属性点已重置（花费 ${cost} 金）`;
}

export function resetSkills(world: World): string {
  const p = world.player;
  let refund = 0;
  for (const id of skillsForClass(p.classId)) {
    const level = world.skills[id] ?? 0;
    if (level <= 0) {
      continue;
    }
    for (let lv = 1; lv < level; lv += 1) {
      refund += upgradeCost(lv);
    }
    world.skills[id] = 1;
  }
  if (refund <= 0) {
    sfx.play('deny');
    return '技能已是初始等级';
  }
  const cost = p.skillResetCount === 0 ? 0 : 20 * p.level * p.skillResetCount;
  if (world.gold < cost) {
    sfx.play('deny');
    return `需要 ${cost} 金`;
  }
  world.gold -= cost;
  p.unspentSkill += refund;
  p.skillResetCount += 1;
  sfx.play('levelup');
  return cost === 0 ? `技能已重置，退回 ${refund} 点` : `技能已重置，退回 ${refund} 点（花费 ${cost} 金）`;
}

export function resetSpecAtCamp(world: World): string {
  return resetSpecialization(world);
}

/** 传送到已解锁节点（可跨区）。 */
export function teleportTo(world: World, nodeId: string): string {
  return travelToNode(world, nodeId);
}
