import { sfx } from '../../audio/sfx';
import { ITEM_DEFS } from '../data/item-defs';
import { rollLootTable } from '../data/loot-tables';
import type { Dummy, GroundLoot, ItemQuality, World } from '../types';
import { eliteLootGoldMult } from './elite-affixes';
import { ngPlusLootGoldMult } from './ng-plus-scale';
import { addItemToBag } from './inventory';
import { advanceTutorial } from './tutorial';

const PICK_RANGE = 1.35;
const GOLD_VACUUM = 2.4;
export const LOOT_FLY_LIFE = 0.58;

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
        defId: drop.defId,
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
      defId: drop.defId,
      age: 0,
    });
    i += 1;
  }
}

export function stepLoot(world: World, wantPick: boolean): void {
  const player = world.player;
  world.nearbyLootName = null;
  const keep: GroundLoot[] = [];
  for (const loot of world.loots) {
    const dist = Math.hypot(loot.x - player.x, loot.y - player.y);

    if (loot.kind === 'gold' && dist < GOLD_VACUUM) {
      world.gold += loot.amount;
      spawnLootFly(world, loot);
      sfx.play('loot');
      advanceTutorial(world, 'loot');
      continue;
    }

    if (dist < PICK_RANGE) {
      const label =
        loot.kind === 'gold'
          ? `${loot.amount} 金币`
          : (ITEM_DEFS[loot.defId ?? '']?.name ?? '物品');
      world.nearbyLootName = label;
      if (wantPick && loot.kind === 'item' && loot.defId) {
        if (addItemToBag(world, loot.defId, loot.amount)) {
          spawnLootFly(world, loot);
          sfx.play('loot');
          advanceTutorial(world, 'loot');
          continue;
        }
        sfx.play('deny');
        world.levelToastT = 1.4;
        world.levelToastText = '背包已满';
        world.nearbyLootName = '背包已满';
      }
    }

    keep.push(loot);
  }
  world.loots = keep;
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
