import { sfx } from '../../audio/sfx';
import { ITEM_DEFS } from '../data/item-defs';
import { rollLootTable } from '../data/loot-tables';
import { getGameplayPrefs } from '../prefs/gameplay-prefs';
import type { Dummy, GroundLoot, ItemQuality, World } from '../types';
import { biasGearDropForClass } from './class-loot';
import { eliteLootGoldMult } from './elite-affixes';
import { ngPlusLootGoldMult } from './ng-plus-scale';
import { addItemToBag, rollNgPlusPowerBonus, bagAddFailText } from './inventory';
import { groundGearCompareHint, QUALITY_LABEL } from './item-detail';
import { advanceTutorial } from './tutorial';

const PICK_RANGE = 1.35;
const GOLD_VACUUM = 2.4;
/** 材料/药水自动吸附范围（略小于金币） */
const CONSUMABLE_VACUUM = 2.0;
export const LOOT_FLY_LIFE = 0.58;

function isAutoPickupConsumable(defId: string | undefined): boolean {
  if (!defId) {
    return false;
  }
  const def = ITEM_DEFS[defId];
  return def?.kind === 'material' || def?.kind === 'potion';
}

function resolveDropDefId(world: World, defId: string | undefined): string | undefined {
  if (!defId) {
    return defId;
  }
  return biasGearDropForClass(defId, world.player.classId);
}

export function spawnKillLoot(world: World, dummy: Dummy): void {
  if (dummy.looted) {
    return;
  }
  dummy.looted = true;
  const drops = rollLootTable(dummy.lootTable);
  const goldMult = eliteLootGoldMult(dummy) * ngPlusLootGoldMult(world.ngPlusLevel);
  let i = 0;
  for (const drop of drops) {
    const amount =
      drop.kind === 'gold' ? Math.max(1, Math.round(drop.amount * goldMult)) : drop.amount;
    const defId = drop.kind === 'item' ? resolveDropDefId(world, drop.defId) : drop.defId;
    // 词缀精英额外一次材料掷骰机会
    if (
      drop.kind === 'item' &&
      dummy.elite &&
      dummy.affixes.length > 0 &&
      Math.random() < 0.12 * dummy.affixes.length + 0.06 * world.ngPlusLevel
    ) {
      const ox = (i % 3) * 0.28 - 0.28;
      const oy = 0.35 + Math.floor(i / 3) * 0.12;
      pushLoot(world, {
        id: nextLootId(world),
        x: dummy.x + ox,
        y: dummy.y + oy,
        kind: 'item',
        amount: 1,
        defId,
        age: 0,
      });
      i += 1;
    }
    const ox = (i % 3) * 0.28 - 0.28;
    const oy = 0.35 + Math.floor(i / 3) * 0.12;
    pushLoot(world, {
      id: nextLootId(world),
      x: dummy.x + ox,
      y: dummy.y + oy,
      kind: drop.kind,
      amount,
      defId,
      age: 0,
    });
    i += 1;
  }
}

export function stepLoot(world: World, wantPick: boolean): void {
  const player = world.player;
  clearNearbyLoot(world);
  const autoConsumables = getGameplayPrefs().autoPickupConsumables;
  const keep: GroundLoot[] = [];
  for (const loot of world.loots) {
    const dist = Math.hypot(loot.x - player.x, loot.y - player.y);

    if (loot.kind === 'gold' && dist < GOLD_VACUUM) {
      world.gold += loot.amount;
      pushGoldPopup(world, loot.x, loot.y + 0.45, loot.amount);
      spawnLootFly(world, loot);
      sfx.play('loot');
      advanceTutorial(world, 'loot');
      continue;
    }

    if (
      autoConsumables &&
      loot.kind === 'item' &&
      loot.defId &&
      isAutoPickupConsumable(loot.defId) &&
      dist < CONSUMABLE_VACUUM
    ) {
      if (tryPickItem(world, loot)) {
        continue;
      }
      if (dist < PICK_RANGE) {
        setNearbyLootFull(world);
        if (wantPick) {
          sfx.play('deny');
          world.levelToastT = 1.4;
          world.levelToastText = bagAddFailText(world, loot.defId!);
      const def = loot.kind === 'item' && loot.defId ? ITEM_DEFS[loot.defId] : undefined;
      const label =
        loot.kind === 'gold'
          ? `${loot.amount} 金币`
          : def
            ? def.kind === 'gear'
              ? `${QUALITY_LABEL[def.quality]} · ${def.name}`
              : def.name
            : '物品';
      // 装备优先作为拾取提示（可带对比）；非装备仅在尚无提示时显示
      if (def?.kind === 'gear' || !world.nearbyLootName) {
        setNearbyLoot(world, loot, label);
      }
      if (wantPick && loot.kind === 'item' && loot.defId) {
        if (tryPickItem(world, loot)) {
          clearNearbyLoot(world);
          continue;
        }
        sfx.play('deny');
        world.levelToastT = 1.4;
        world.levelToastText = bagAddFailText(world, loot.defId);
      }
    }

    keep.push(loot);
  }
  world.loots = keep;
}

function clearNearbyLoot(world: World): void {
  world.nearbyLootName = null;
  world.nearbyLootCompare = null;
  world.nearbyLootTone = null;
}

function setNearbyLootFull(world: World): void {
  world.nearbyLootName = '背包已满';
  world.nearbyLootCompare = null;
  world.nearbyLootTone = null;
}

function setNearbyLoot(world: World, loot: GroundLoot, label: string): void {
  world.nearbyLootName = label;
  world.nearbyLootCompare = null;
  world.nearbyLootTone = null;
  if (loot.kind !== 'item' || !loot.defId) {
    return;
  }
  const hint = groundGearCompareHint(world, loot.defId);
  if (hint) {
    world.nearbyLootCompare = hint.text;
    world.nearbyLootTone = hint.tone;
  }
}

function tryPickItem(world: World, loot: GroundLoot): boolean {
  if (loot.kind !== 'item' || !loot.defId) {
    return false;
  }
  const powerBonus = rollNgPlusPowerBonus(world, loot.defId);
  if (!addItemToBag(world, loot.defId, loot.amount, { powerBonus })) {
    return false;
  }
  spawnLootFly(world, loot);
  sfx.play('loot');
  advanceTutorial(world, 'loot');
  return true;
}

function pushGoldPopup(world: World, x: number, y: number, amount: number): void {
  world.popupId += 1;
  world.popups.push({
    id: world.popupId,
    x,
    y,
    value: amount,
    age: 0,
    lethal: false,
    crit: false,
    kind: 'gold',
  });
}

export function stepLootFlies(world: World, dt: number): void {
  const keep = [];
  for (const fly of world.lootFlies) {
    fly.age += dt;
    if (fly.age < LOOT_FLY_LIFE) {
      keep.push(fly);
    }
  }
  world.lootFlies = keep;
}

export function spawnLootFlyAt(
  world: World,
  x: number,
  y: number,
  kind: 'gold' | 'item',
  quality: ItemQuality = 'common',
): void {
  world.lootFlyId += 1;
  world.lootFlies.push({
    id: world.lootFlyId,
    startX: x,
    startY: y,
    kind,
    quality,
    age: 0,
  });
}

function spawnLootFly(world: World, loot: GroundLoot): void {
  const quality: ItemQuality =
    loot.kind === 'gold'
      ? 'legendary'
      : (ITEM_DEFS[loot.defId ?? '']?.quality ?? 'common');
  spawnLootFlyAt(world, loot.x, loot.y + 0.35, loot.kind, quality);
}

function pushLoot(world: World, loot: GroundLoot): void {
  world.loots.push(loot);
}

function nextLootId(world: World): number {
  world.lootId += 1;
  return world.lootId;
}

/**
 * 死亡惩罚：损失部分未拾取地上掉落（设计 §2）。
 * 金币必失；品质越高越易保留。返回散佚件数。
 */
export function applyDeathLootLoss(world: World): number {
  if (world.loots.length === 0) {
    return 0;
  }
  const kept: GroundLoot[] = [];
  let lost = 0;
  for (const loot of world.loots) {
    if (loot.kind === 'gold') {
      lost += 1;
      continue;
    }
    const def = loot.defId ? ITEM_DEFS[loot.defId] : undefined;
    let keepChance = 0.4;
    if (def?.quality === 'legendary') {
      keepChance = 0.85;
    } else if (def?.quality === 'epic') {
      keepChance = 0.7;
    } else if (def?.quality === 'rare') {
      keepChance = 0.55;
    } else if (def?.quality === 'uncommon') {
      keepChance = 0.45;
    }
    if (Math.random() < keepChance) {
      kept.push(loot);
    } else {
      lost += 1;
    }
  }
  world.loots = kept;
  clearNearbyLoot(world);
  if (lost > 0) {
    const prev = world.levelToastText;
    const note = `未拾取掉落散佚 ×${lost}`;
    world.levelToastT = Math.max(world.levelToastT, 1.9);
    if (prev && (prev.includes('破损') || prev.includes('坠落'))) {
      world.levelToastText = `${prev} · ${note}`;
    } else {
      world.levelToastText = note;
    }
  }
  return lost;
}
