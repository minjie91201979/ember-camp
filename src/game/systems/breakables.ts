import { sfx } from '../../audio/sfx';
import { ZONES } from '../data/zones';
import { expandKitCollision } from '../data/level-kit';
import type { BreakableProp, World } from '../types';
import { addItemToBag } from './inventory';
import { hitboxOverlaps } from './physics';

export function createBreakablesFromZone(zoneId: string): BreakableProp[] {
  const zone = ZONES[zoneId];
  if (!zone) {
    return [];
  }
  return zone.kit
    .filter((p) => p.kind === 'breakable')
    .map((p) => ({
      id: p.id,
      x: p.x + p.w / 2,
      y: p.y,
      w: p.w,
      h: p.h,
      hp: 18,
      maxHp: 18,
      rewardDefId: p.rewardDefId ?? 'woodland-scrap',
      rewardQty: p.rewardQty ?? 1,
      broken: false,
      flash: 0,
    }));
}

export function rebuildWorldPlatforms(world: World): void {
  const zone = ZONES[world.zoneId];
  if (!zone) {
    return;
  }
  const broken: Record<string, boolean> = {};
  for (const b of world.breakables) {
    if (b.broken) {
      broken[b.id] = true;
    }
  }
  world.platforms = expandKitCollision(zone.kit, broken);
}

export function stepBreakables(world: World, dt: number): void {
  for (const b of world.breakables) {
    b.flash = Math.max(0, b.flash - dt);
  }
}

export function tryHitBreakables(
  world: World,
  hx: number,
  hy: number,
  hw: number,
  hh: number,
): boolean {
  let hit = false;
  for (const b of world.breakables) {
    if (b.broken || b.flash > 0.05) {
      continue;
    }
    if (!hitboxOverlaps(hx, hy, hw, hh, b)) {
      continue;
    }
    hit = true;
    b.hp -= 10;
    b.flash = 0.12;
    world.shake = Math.max(world.shake, 0.28);
    sfx.play('hit');
    if (b.hp <= 0) {
      destroyBreakable(world, b);
    }
  }
  return hit;
}

function destroyBreakable(world: World, b: BreakableProp): void {
  b.broken = true;
  b.hp = 0;
  rebuildWorldPlatforms(world);
  if (addItemToBag(world, b.rewardDefId, b.rewardQty)) {
    world.levelToastT = 1.4;
    world.levelToastText = '破坏物掉落';
  } else {
    world.levelToastT = 1.4;
    world.levelToastText = '破坏成功 · 背包已满';
  }
  world.shake = Math.max(world.shake, 0.55);
  sfx.play('land');
}
