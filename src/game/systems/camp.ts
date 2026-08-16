import { ITEM_DEFS } from '../data/item-defs';
import { ZONES } from '../data/zones';
import type { InventoryItem, World } from '../types';
import { applyGearStats, addItemToBag } from './inventory';
import { clearAttrDraft } from './attributes';
import { SKILL_DEFS, upgradeCost, type SkillId } from './skills';
import { travelToNode } from './zone-travel';
import { sfx } from '../../audio/sfx';
import { resetSpecialization } from './specialization';

export type CampNpcId = 'merchant' | 'blacksmith' | 'trainer' | 'teleport' | 'challenge';

export type CampNpc = {
  id: CampNpcId;
  name: string;
  x: number;
  /** 世界空间交互提示高度 */
  promptY: number;
  prompt: string;
};

export const CAMP_NPCS: CampNpc[] = [
  { id: 'teleport', name: '传送阵', x: -4.4, promptY: 3.35, prompt: '打开传送' },
  { id: 'challenge', name: '词缀试炼', x: -1.6, promptY: 3.2, prompt: '开启挑战' },
  { id: 'trainer', name: '训练师', x: 1.2, promptY: 3.05, prompt: '重置加点' },
  { id: 'blacksmith', name: '铁匠', x: 4.15, promptY: 3.35, prompt: '强化武器' },
  { id: 'merchant', name: '杂货商人', x: 6.6, promptY: 3.4, prompt: '买卖物品' },
];

const INTERACT_RANGE = 2.6;

export const SHOP_STOCK: { defId: string; price: number }[] = [
  { defId: 'life-potion-minor', price: 25 },
  { defId: 'life-potion-mid', price: 70 },
  { defId: 'life-potion-greater', price: 160 },
  { defId: 'mist-blade', price: 120 },
  { defId: 'woodland-scrap', price: 18 },
];

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
  sfx.play('land');
  return true;
}

export function closeCamp(world: World): void {
  world.campOpen = null;
}

export function buyShopItem(world: World, defId: string): string {
  const stock = SHOP_STOCK.find((s) => s.defId === defId);
  if (!stock) {
    return '商品不存在';
  }
  if (world.gold < stock.price) {
    sfx.play('deny');
    return '金币不足';
  }
  if (!addItemToBag(world, defId, 1)) {
    sfx.play('deny');
    return '背包已满';
  }
  world.gold -= stock.price;
  sfx.play('land');
  return `购入 ${ITEM_DEFS[defId]?.name ?? defId}`;
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
  if (world.player.weaponEnhance >= 5) {
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
  if (world.player.weaponEnhance >= 5) {
    sfx.play('deny');
    return '已达强化上限 +5';
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
  world.player.weaponEnhance += 1;
  applyGearStats(world.player, world);
  sfx.play('bash');
  return `强化成功 · 当前 +${world.player.weaponEnhance}`;
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
  for (const id of Object.keys(SKILL_DEFS) as SkillId[]) {
    const level = world.skills[id] ?? 1;
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
