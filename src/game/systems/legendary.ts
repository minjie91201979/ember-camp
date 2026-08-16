import { ITEM_DEFS } from '../data/item-defs';
import type { AttackKind, Dummy, LegendaryEffectId, World } from '../types';

export type { LegendaryEffectId };

export type LegendaryCatalogEntry = {
  defId: string;
  name: string;
  effectDesc: string;
  discovered: boolean;
};

/** 图鉴固定顺序（未发现显示 ???）。 */
export const LEGENDARY_CATALOG_IDS = ['ember-maul', 'tide-buckler', 'rift-edge'] as const;

export function equippedLegendaryEffect(world: World): LegendaryEffectId | null {
  const item = world.bag.find((it) => it.uid === world.mainhandUid);
  const def = item ? ITEM_DEFS[item.defId] : undefined;
  return def?.legendaryEffect ?? null;
}

export function noteLegendaryDiscover(world: World, defId: string): void {
  const def = ITEM_DEFS[defId];
  if (!def || def.quality !== 'legendary') {
    return;
  }
  if (world.discoveredLegendaries.includes(defId)) {
    return;
  }
  world.discoveredLegendaries.push(defId);
  world.levelToastT = 2.4;
  world.levelToastText = `图鉴解锁 · ${def.name}`;
}

export function listLegendaryCatalog(world: World): LegendaryCatalogEntry[] {
  return LEGENDARY_CATALOG_IDS.map((defId) => {
    const def = ITEM_DEFS[defId];
    const discovered = world.discoveredLegendaries.includes(defId);
    return {
      defId,
      name: discovered ? (def?.name ?? defId) : '???',
      effectDesc: discovered ? (def?.effectDesc ?? '') : '尚未发现',
      discovered,
    };
  });
}

export function legendaryDamageMult(
  world: World,
  kind: AttackKind,
  dummy: Dummy,
): number {
  const fx = equippedLegendaryEffect(world);
  if (!fx) {
    return 1;
  }
  if (fx === 'ember-maul' && kind === 'slam') {
    return 1.28;
  }
  if (fx === 'tide-buckler' && kind === 'bash') {
    return 0.92;
  }
  if (fx === 'rift-edge') {
    if (kind === 'basic') {
      return 0.9;
    }
    if (dummy.maxHp > 0 && dummy.hp / dummy.maxHp <= 0.35) {
      return 1.4;
    }
  }
  return 1;
}

export function legendaryReachBonus(world: World, kind: AttackKind): number {
  if (equippedLegendaryEffect(world) === 'ember-maul' && kind === 'slam') {
    return 0.4;
  }
  if (equippedLegendaryEffect(world) === 'tide-buckler' && kind === 'bash') {
    return 0.15;
  }
  return 0;
}

export function legendarySlamStun(world: World): number {
  return equippedLegendaryEffect(world) === 'ember-maul' ? 0.48 : 0.28;
}

export function legendaryBashStun(world: World): number {
  return equippedLegendaryEffect(world) === 'tide-buckler'
    ? 1.35
    : 1.05;
}

export function legendarySlamDash(world: World): number {
  return equippedLegendaryEffect(world) === 'ember-maul' ? 5.4 : 4.4;
}

export function legendaryBashDash(world: World): number {
  return equippedLegendaryEffect(world) === 'tide-buckler' ? 9.6 : 7.2;
}

export function legendaryBashIFrame(world: World): number {
  return equippedLegendaryEffect(world) === 'tide-buckler' ? 0.22 : 0.12;
}

export function legendaryBashCost(world: World): number {
  return equippedLegendaryEffect(world) === 'tide-buckler' ? 14 : 20;
}

export function legendarySlamCooldownMult(world: World): number {
  return equippedLegendaryEffect(world) === 'ember-maul' ? 1.12 : 1;
}

export function legendaryCritMultBonus(world: World): number {
  return equippedLegendaryEffect(world) === 'rift-edge' ? 0.25 : 0;
}

export function toggleCatalog(world: World): void {
  if (world.player.hp <= 0) {
    return;
  }
  world.catalogOpen = !world.catalogOpen;
  if (world.catalogOpen) {
    world.invOpen = false;
    world.charOpen = false;
    world.skillOpen = false;
    world.campOpen = null;
    world.specPickOpen = false;
  }
}
