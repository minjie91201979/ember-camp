import { sfx } from '../../audio/sfx';
import { CLASS_DEFS, type PlayerClassId } from '../data/classes';
import { ITEM_DEFS } from '../data/item-defs';
import type { InventoryItem, Player, World } from '../types';
import { POTION } from '../config';
import { applyDerivedToPlayer } from './stats';
import { ngPlusWeaponAtkMult } from './ng-plus-scale';
import { noteLegendaryDiscover } from './legendary';
import { advanceTutorial } from './tutorial';
import { getGameplayPrefs } from '../prefs/gameplay-prefs';
import { BROKEN_WEAPON_MULT, GEAR_MAX_DURABILITY, isGearBroken } from './gear-durability';

/** 一期格子背包容量（设计：40 格）。 */
export const BAG_CAPACITY = 40;

/** 某种药水还可堆叠的数量（已满为 0）。 */
export function potionStackRoom(world: World, defId: string): number {
  const def = ITEM_DEFS[defId];
  if (!def || def.kind !== 'potion') {
    return 0;
  }
  const existing = world.bag.find((it) => it.defId === defId);
  const have = existing?.qty ?? 0;
  return Math.max(0, POTION.stackMax - have);
}

/** 拾取/购买失败时的用户提示。 */
export function bagAddFailText(world: World, defId: string): string {
  const def = ITEM_DEFS[defId];
  if (def?.kind === 'potion' && potionStackRoom(world, defId) <= 0) {
    return `药水堆叠已满（上限 ${POTION.stackMax}）`;
  }
  return '背包已满';
}

export function createStarterInventory(classId: PlayerClassId = 'warrior'): {
  gold: number;
  bag: InventoryItem[];
  itemUid: number;
} {
  const cls = CLASS_DEFS[classId];
  const bag: InventoryItem[] = [
    { uid: 1, defId: cls.starterWeapon, qty: 1, dur: GEAR_MAX_DURABILITY },
  ];
  let uid = 1;
  for (const pot of cls.starterPotions) {
    uid += 1;
    bag.push({ uid, defId: pot.defId, qty: pot.qty });
  }
  return {
    gold: 50,
    bag,
    itemUid: uid,
  };
}

export function nextItemUid(world: World): number {
  world.itemUid += 1;
  return world.itemUid;
}

export function addItemToBag(
  world: World,
  defId: string,
  qty = 1,
  opts?: { powerBonus?: number },
): boolean {
  const def = ITEM_DEFS[defId];
  if (!def) {
    return false;
  }
  let addQty = Math.max(1, Math.floor(qty));
  if (def.kind === 'potion') {
    const room = potionStackRoom(world, defId);
    if (room <= 0) {
      return false;
    }
    addQty = Math.min(addQty, room);
    const existing = world.bag.find((it) => it.defId === defId);
    if (existing) {
      existing.qty += addQty;
      noteLegendaryDiscover(world, defId);
      maybeWarnBagNearFull(world);
      return true;
    }
    if (world.bag.length >= BAG_CAPACITY) {
      return false;
    }
    world.bag.push({ uid: nextItemUid(world), defId, qty: addQty });
    noteLegendaryDiscover(world, defId);
    maybeWarnBagNearFull(world);
    return true;
  }
  if (def.kind === 'material') {
    const existing = world.bag.find((it) => it.defId === defId);
    if (existing) {
      existing.qty += addQty;
      noteLegendaryDiscover(world, defId);
      maybeWarnBagNearFull(world);
      return true;
    }
  }
  if (world.bag.length >= BAG_CAPACITY) {
    return false;
  }
  const item: InventoryItem = { uid: nextItemUid(world), defId, qty: addQty };
  if (opts?.powerBonus && opts.powerBonus > 0 && def.kind === 'gear') {
    item.powerBonus = opts.powerBonus;
  }
  if (def.kind === 'gear') {
    item.dur = GEAR_MAX_DURABILITY;
  }
  world.bag.push(item);
  noteLegendaryDiscover(world, defId);
  maybeWarnBagNearFull(world);
  return true;
}

/** 剩余格数 ≤2 时轻提示（满包仍用「背包已满」）。 */
export function maybeWarnBagNearFull(world: World): void {
  const left = Math.max(0, BAG_CAPACITY - world.bag.length);
  if (left <= 0 || left > 2) {
    return;
  }
  world.levelToastT = Math.max(world.levelToastT, 1.35);
  world.levelToastText = `背包将满 · 剩余 ${left} 格`;
}

/** NG+ 装备掉落淬炼：2 + 周目×2 + 0～2（传说再 +2）。 */
export function rollNgPlusPowerBonus(world: World, defId: string): number | undefined {
  if (world.ngPlusLevel <= 0) {
    return undefined;
  }
  const def = ITEM_DEFS[defId];
  if (!def || def.kind !== 'gear') {
    return undefined;
  }
  let bonus = 2 + world.ngPlusLevel * 2 + Math.floor(Math.random() * 3);
  if (def.quality === 'legendary') {
    bonus += 2;
  }
  return bonus;
}

export function equipMainhand(world: World, uid: number): boolean {
  const item = world.bag.find((it) => it.uid === uid);
  const def = item ? ITEM_DEFS[item.defId] : undefined;
  if (!item || !def || def.slot !== 'mainhand') {
    sfx.play('deny');
    world.levelToastT = 1.2;
    world.levelToastText = '无法装备';
    return false;
  }
  world.mainhandUid = uid;
  applyGearStats(world.player, world);
  world.levelToastT = 1.2;
  world.levelToastText = `已装备 ${def.name}`;
  sfx.play('ui');
  return true;
}

/** 丢弃指定数量（默认整组）；若丢光已装备主手则自动卸下。 */
export function discardItem(world: World, uid: number, qty?: number): boolean {
  const idx = world.bag.findIndex((it) => it.uid === uid);
  if (idx < 0) {
    return false;
  }
  const item = world.bag[idx];
  const stack = Math.max(1, item.qty);
  const count = Math.max(1, Math.min(Math.floor(qty ?? stack), stack));
  const name = ITEM_DEFS[item.defId]?.name ?? '物品';
  if (count < stack) {
    item.qty -= count;
    world.levelToastT = 1.4;
    world.levelToastText = `已丢弃 ${name} ×${count}`;
    return true;
  }
  if (world.mainhandUid === uid) {
    world.mainhandUid = null;
    applyGearStats(world.player, world);
  }
  world.bag.splice(idx, 1);
  world.levelToastT = 1.4;
  world.levelToastText = count > 1 ? `已丢弃 ${name} ×${count}` : `已丢弃 ${name}`;
  return true;
}

export function applyGearStats(player: Player, world: World): void {
  const equipped = world.bag.find((it) => it.uid === world.mainhandUid);
  const def = equipped ? ITEM_DEFS[equipped.defId] : undefined;
  const base = def?.weaponAtk ?? 4;
  const enhanceStep = Math.max(2, Math.round(base * 0.14));
  let weaponAtk =
    Math.round(base * ngPlusWeaponAtkMult(world.ngPlusLevel)) +
    player.weaponEnhance * enhanceStep +
    (equipped?.powerBonus ?? 0);
  if (equipped && isGearBroken(equipped)) {
    weaponAtk = Math.max(1, Math.round(weaponAtk * BROKEN_WEAPON_MULT));
  }
  player.weaponAtk = weaponAtk;
  player.armorDef = CLASS_DEFS[player.classId].armorDef;
  applyDerivedToPlayer(player);
}

/** 药水回复：基础值与最大生命百分比取高，保证后期不废。 */
export function potionHealAmount(heal: number, maxHp: number): number {
  const pct = heal >= 1000 ? 0.75 : heal >= 220 ? 0.5 : heal >= 140 ? 0.35 : 0.22;
  return Math.max(heal, Math.round(maxHp * pct));
}

/** 法力药水：基础值与资源上限百分比取高。 */
export function potionManaAmount(mana: number, maxRage: number): number {
  const pct = mana >= 600 ? 0.8 : mana >= 280 ? 0.55 : mana >= 120 ? 0.4 : 0.28;
  return Math.max(mana, Math.round(maxRage * pct));
}

/** 生命药水：同档取回复最高。 */
function pickBestLifePotion(world: World): InventoryItem | undefined {
  const player = world.player;
  if (player.hp >= player.maxHp) {
    return undefined;
  }
  let best: InventoryItem | undefined;
  let bestHeal = -1;
  for (const it of world.bag) {
    const d = ITEM_DEFS[it.defId];
    if (!d || d.kind !== 'potion' || it.qty <= 0) {
      continue;
    }
    const heal = d.heal ?? 0;
    if (heal <= 0) {
      continue;
    }
    if (heal > bestHeal) {
      bestHeal = heal;
      best = it;
    }
  }
  return best;
}

/** 法力药水：同档取回复最高。 */
function pickBestManaPotion(world: World): InventoryItem | undefined {
  const player = world.player;
  if (player.rage >= player.maxRage) {
    return undefined;
  }
  let best: InventoryItem | undefined;
  let bestMana = -1;
  for (const it of world.bag) {
    const d = ITEM_DEFS[it.defId];
    if (!d || d.kind !== 'potion' || it.qty <= 0) {
      continue;
    }
    const mana = d.mana ?? 0;
    const heal = d.heal ?? 0;
    if (mana <= 0 || heal > 0) {
      continue;
    }
    if (mana > bestMana) {
      bestMana = mana;
      best = it;
    }
  }
  return best;
}

export type PotionQuickKind = 'life' | 'mana';

/** 快捷栏：红药 / 蓝药分槽；背包传入 uid 仍按物品本身使用。 */
export function usePotion(
  world: World,
  uid?: number,
  quick?: PotionQuickKind,
): boolean {
  const player = world.player;
  if (player.hp <= 0 || player.hurtT > 0 || player.rollT > 0) {
    return false;
  }
  if (player.drinkT > 0 || player.potionCd > 0) {
    if (player.potionCd > 0) {
      sfx.play('deny');
      world.levelToastT = 1.0;
      world.levelToastText = '药水冷却中';
      return true;
    }
    return false;
  }
  const item =
    uid !== undefined
      ? world.bag.find((it) => it.uid === uid)
      : quick === 'mana'
        ? pickBestManaPotion(world)
        : pickBestLifePotion(world);
  const def = item ? ITEM_DEFS[item.defId] : undefined;
  if (!item || !def || def.kind !== 'potion') {
    sfx.play('deny');
    world.levelToastT = 1.2;
    world.levelToastText =
      uid !== undefined
        ? '没有可用药水'
        : quick === 'mana'
          ? '没有可用法力药水'
          : '没有可用生命药水';
    return true;
  }
  const isMana = (def.mana ?? 0) > 0 && !(def.heal && def.heal > 0);
  if (isMana) {
    if (player.rage >= player.maxRage) {
      sfx.play('deny');
      world.levelToastT = 1.2;
      world.levelToastText = '法力已满';
      return true;
    }
    const gain = potionManaAmount(def.mana ?? 0, player.maxRage);
    player.rage = Math.min(player.maxRage, player.rage + gain);
    player.drinkT = POTION.drinkAnim;
    player.potionCd = POTION.sharedCd;
    player.attackT = 0;
    player.state = 'drink';
    if (item.qty > 1) {
      item.qty -= 1;
    } else {
      world.bag = world.bag.filter((it) => it.uid !== item.uid);
    }
    world.levelToastT = 1.4;
    world.levelToastText = `使用 ${def.name} · +${gain} 法力`;
    sfx.play('drink');
    return true;
  }
  if (!(def.heal && def.heal > 0)) {
    sfx.play('deny');
    world.levelToastT = 1.2;
    world.levelToastText = '没有可用生命药水';
    return true;
  }
  if (player.hp >= player.maxHp) {
    sfx.play('deny');
    world.levelToastT = 1.2;
    world.levelToastText = '生命已满';
    return true;
  }
  const heal = potionHealAmount(def.heal, player.maxHp);
  player.hp = Math.min(player.maxHp, player.hp + heal);
  player.drinkT = POTION.drinkAnim;
  player.potionCd = POTION.sharedCd;
  player.attackT = 0;
  player.state = 'drink';
  if (item.qty > 1) {
    item.qty -= 1;
  } else {
    world.bag = world.bag.filter((it) => it.uid !== item.uid);
  }
  world.levelToastT = 1.4;
  world.levelToastText = `使用 ${def.name} · +${heal} 生命`;
  sfx.play('drink');
  advanceTutorial(world, 'potion');
  return true;
}

export function toggleInventory(world: World): void {
  if (world.player.hp <= 0) {
    return;
  }
  world.invOpen = !world.invOpen;
  if (world.invOpen) {
    world.charOpen = false;
    world.skillOpen = false;
    world.catalogOpen = false;
    world.campOpen = null;
    world.specPickOpen = false;
    if (getGameplayPrefs().autoSortBagOnOpen && world.bag.length >= 2) {
      sortBag(world, { silent: true });
    }
  }
}

const QUALITY_RANK: Record<string, number> = {
  legendary: 5,
  epic: 4,
  rare: 3,
  uncommon: 2,
  common: 1,
};

const KIND_RANK: Record<string, number> = {
  gear: 3,
  potion: 2,
  material: 1,
};

/** 品质↓ → 种类（装备/药水/材料）→ 名称 → uid。装备中的主手置顶。 */
export function sortBag(world: World, opts?: { silent?: boolean }): void {
  const mainUid = world.mainhandUid;
  world.bag.sort((a, b) => {
    if (a.uid === mainUid && b.uid !== mainUid) {
      return -1;
    }
    if (b.uid === mainUid && a.uid !== mainUid) {
      return 1;
    }
    const da = ITEM_DEFS[a.defId];
    const db = ITEM_DEFS[b.defId];
    const qa = QUALITY_RANK[da?.quality ?? 'common'] ?? 0;
    const qb = QUALITY_RANK[db?.quality ?? 'common'] ?? 0;
    if (qa !== qb) {
      return qb - qa;
    }
    const ka = KIND_RANK[da?.kind ?? 'material'] ?? 0;
    const kb = KIND_RANK[db?.kind ?? 'material'] ?? 0;
    if (ka !== kb) {
      return kb - ka;
    }
    const na = da?.name ?? a.defId;
    const nb = db?.name ?? b.defId;
    if (na !== nb) {
      return na.localeCompare(nb, 'zh');
    }
    return a.uid - b.uid;
  });
  if (opts?.silent) {
    return;
  }
  sfx.play('loot');
  world.levelToastT = 1.1;
  world.levelToastText = '背包已排序';
}
