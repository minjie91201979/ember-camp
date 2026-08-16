import { sfx } from '../../audio/sfx';
import { ITEM_DEFS } from '../data/item-defs';
import type { InventoryItem, Player, World } from '../types';
import { applyDerivedToPlayer } from './stats';
import { ngPlusWeaponAtkMult } from './ng-plus-scale';
import { noteLegendaryDiscover } from './legendary';
import { advanceTutorial } from './tutorial';

export const BAG_CAPACITY = 20;

export function createStarterInventory(): {
  gold: number;
  bag: InventoryItem[];
} {
  const sword: InventoryItem = {
    uid: 1,
    defId: 'apprentice-sword',
    qty: 1,
  };
  return {
    gold: 50,
    bag: [
      sword,
      { uid: 2, defId: 'life-potion-minor', qty: 5 },
    ],
  };
}

export function nextItemUid(world: World): number {
  world.itemUid += 1;
  return world.itemUid;
}

export function addItemToBag(world: World, defId: string, qty = 1): boolean {
  const def = ITEM_DEFS[defId];
  if (!def) {
    return false;
  }
  if (def.kind === 'potion' || def.kind === 'material') {
    const existing = world.bag.find((it) => it.defId === defId);
    if (existing) {
      existing.qty += qty;
      noteLegendaryDiscover(world, defId);
      return true;
    }
  }
  if (world.bag.length >= BAG_CAPACITY) {
    return false;
  }
  world.bag.push({ uid: nextItemUid(world), defId, qty });
  noteLegendaryDiscover(world, defId);
  return true;
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

/** 丢弃整组物品；若丢的是已装备主手则自动卸下。 */
export function discardItem(world: World, uid: number): boolean {
  const idx = world.bag.findIndex((it) => it.uid === uid);
  if (idx < 0) {
    return false;
  }
  if (world.mainhandUid === uid) {
    world.mainhandUid = null;
    applyGearStats(world.player, world);
  }
  const removed = world.bag[idx];
  world.bag.splice(idx, 1);
  const name = ITEM_DEFS[removed?.defId ?? '']?.name ?? '物品';
  world.levelToastT = 1.4;
  world.levelToastText = `已丢弃 ${name}`;
  return true;
}

export function applyGearStats(player: Player, world: World): void {
  const equipped = world.bag.find((it) => it.uid === world.mainhandUid);
  const def = equipped ? ITEM_DEFS[equipped.defId] : undefined;
  const base = def?.weaponAtk ?? 4;
  const enhanceStep = Math.max(2, Math.round(base * 0.14));
  player.weaponAtk =
    Math.round(base * ngPlusWeaponAtkMult(world.ngPlusLevel)) +
    player.weaponEnhance * enhanceStep;
  player.armorDef = 6;
  applyDerivedToPlayer(player);
}

/** 药水回复：基础值与最大生命百分比取高，保证后期不废。 */
export function potionHealAmount(heal: number, maxHp: number): number {
  const pct = heal >= 220 ? 0.5 : heal >= 140 ? 0.35 : 0.22;
  return Math.max(heal, Math.round(maxHp * pct));
}

export function usePotion(world: World, uid?: number): boolean {
  const player = world.player;
  if (player.hp <= 0 || player.drinkT > 0 || player.hurtT > 0 || player.rollT > 0) {
    return false;
  }
  if (player.hp >= player.maxHp) {
    sfx.play('deny');
    world.levelToastT = 1.2;
    world.levelToastText = '生命已满';
    return true;
  }
  const item =
    uid !== undefined
      ? world.bag.find((it) => it.uid === uid)
      : world.bag.find((it) => {
          const d = ITEM_DEFS[it.defId];
          return d?.kind === 'potion' && (d.heal ?? 0) > 0;
        });
  const def = item ? ITEM_DEFS[item.defId] : undefined;
  if (!item || !def || def.kind !== 'potion' || !(def.heal && def.heal > 0)) {
    sfx.play('deny');
    world.levelToastT = 1.2;
    world.levelToastText = '没有可用药水';
    return true;
  }
  const heal = potionHealAmount(def.heal, player.maxHp);
  player.hp = Math.min(player.maxHp, player.hp + heal);
  player.drinkT = 0.42;
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
  }
}
