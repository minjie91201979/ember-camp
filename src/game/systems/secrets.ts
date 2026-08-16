import { sfx } from '../../audio/sfx';
import { ITEM_DEFS } from '../data/item-defs';
import { ZONES } from '../data/zones';
import type { World } from '../types';
import { addItemToBag } from './inventory';
import { spawnLootFlyAt } from './loot';

const SECRET_RANGE = 2.1;

export function syncSecretProximity(world: World): void {
  world.nearbySecretId = null;
  const zone = ZONES[world.zoneId];
  if (!zone) {
    return;
  }
  const px = world.player.x;
  const py = world.player.y;
  for (const secret of zone.secrets) {
    if (world.secretsClaimed[secret.id]) {
      continue;
    }
    if (Math.hypot(secret.x - px, secret.y - py) < SECRET_RANGE) {
      world.nearbySecretId = secret.id;
      return;
    }
  }
}

export function tryClaimSecret(world: World): boolean {
  const id = world.nearbySecretId;
  if (!id) {
    return false;
  }
  const zone = ZONES[world.zoneId];
  const secret = zone?.secrets.find((s) => s.id === id);
  if (!secret || world.secretsClaimed[id]) {
    return false;
  }
  if (!addItemToBag(world, secret.rewardDefId, secret.rewardQty)) {
    sfx.play('deny');
    world.levelToastT = 1.4;
    world.levelToastText = '背包已满';
    return true;
  }
  world.secretsClaimed[id] = true;
  world.nearbySecretId = null;
  const def = ITEM_DEFS[secret.rewardDefId];
  const itemName = def?.name ?? secret.rewardDefId;
  const qty = secret.rewardQty > 1 ? ` ×${secret.rewardQty}` : '';
  spawnLootFlyAt(world, secret.x, secret.y + 0.55, 'item', def?.quality ?? 'common');
  world.levelToastT = 2.0;
  world.levelToastText = `发现秘密 · ${itemName}${qty}`;
  sfx.play('levelup');
  return true;
}

export function secretPromptLabel(world: World): string | null {
  const id = world.nearbySecretId;
  if (!id) {
    return null;
  }
  const zone = ZONES[world.zoneId];
  const secret = zone?.secrets.find((s) => s.id === id);
  if (!secret) {
    return '秘密宝箱';
  }
  const itemName = ITEM_DEFS[secret.rewardDefId]?.name;
  return itemName ? `秘密宝箱 · ${itemName}` : '秘密宝箱';
}
