export type LootDrop = {
  kind: 'gold' | 'item';
  amount: number;
  defId?: string;
};

export type LootTable = {
  id: string;
  gold: { min: number; max: number };
  entries: {
    defId: string;
    chance: number;
    qtyMin?: number;
    qtyMax?: number;
  }[];
};

export const LOOT_TABLES: Record<string, LootTable> = {
  'a01-trash': {
    id: 'a01-trash',
    gold: { min: 4, max: 10 },
    entries: [
      { defId: 'woodland-scrap', chance: 0.35, qtyMin: 1, qtyMax: 1 },
      { defId: 'mist-blade', chance: 0.12, qtyMin: 1, qtyMax: 1 },
      { defId: 'life-potion-minor', chance: 0.12, qtyMin: 1, qtyMax: 1 },
    ],
  },
  'a01-elite': {
    id: 'a01-elite',
    gold: { min: 18, max: 31 },
    entries: [
      { defId: 'woodland-scrap', chance: 0.85, qtyMin: 2, qtyMax: 2 },
      { defId: 'grove-cleaver', chance: 0.18, qtyMin: 1, qtyMax: 1 },
      { defId: 'mist-blade', chance: 0.37, qtyMin: 1, qtyMax: 1 },
      { defId: 'life-potion-minor', chance: 0.45, qtyMin: 1, qtyMax: 1 },
    ],
  },
  'a01-boss': {
    id: 'a01-boss',
    gold: { min: 40, max: 65 },
    entries: [
      { defId: 'woodland-scrap', chance: 1, qtyMin: 3, qtyMax: 4 },
      { defId: 'grove-cleaver', chance: 0.7, qtyMin: 1, qtyMax: 1 },
      { defId: 'mist-blade', chance: 0.55, qtyMin: 1, qtyMax: 1 },
      { defId: 'life-potion-minor', chance: 0.8, qtyMin: 1, qtyMax: 2 },
      { defId: 'rotwood-essence', chance: 1, qtyMin: 1, qtyMax: 1 },
      { defId: 'ember-maul', chance: 0.1, qtyMin: 1, qtyMax: 1 },
    ],
  },
  'a02-trash': {
    id: 'a02-trash',
    gold: { min: 8, max: 16 },
    entries: [
      { defId: 'quarry-ore', chance: 0.4, qtyMin: 1, qtyMax: 2 },
      { defId: 'iron-pick-blade', chance: 0.1, qtyMin: 1, qtyMax: 1 },
      { defId: 'life-potion-minor', chance: 0.15, qtyMin: 1, qtyMax: 1 },
    ],
  },
  'a02-elite': {
    id: 'a02-elite',
    gold: { min: 28, max: 44 },
    entries: [
      { defId: 'quarry-ore', chance: 0.9, qtyMin: 2, qtyMax: 3 },
      { defId: 'iron-pick-blade', chance: 0.35, qtyMin: 1, qtyMax: 1 },
      { defId: 'slate-cleaver', chance: 0.2, qtyMin: 1, qtyMax: 1 },
      { defId: 'life-potion-minor', chance: 0.5, qtyMin: 1, qtyMax: 1 },
    ],
  },
  'a02-boss': {
    id: 'a02-boss',
    gold: { min: 55, max: 85 },
    entries: [
      { defId: 'quarry-ore', chance: 1, qtyMin: 4, qtyMax: 5 },
      { defId: 'slate-cleaver', chance: 0.75, qtyMin: 1, qtyMax: 1 },
      { defId: 'iron-pick-blade', chance: 0.5, qtyMin: 1, qtyMax: 1 },
      { defId: 'life-potion-minor', chance: 0.85, qtyMin: 2, qtyMax: 2 },
      { defId: 'warden-core', chance: 1, qtyMin: 1, qtyMax: 1 },
    ],
  },
  'a03-trash': {
    id: 'a03-trash',
    gold: { min: 12, max: 22 },
    entries: [
      { defId: 'driftwood-scrap', chance: 0.42, qtyMin: 1, qtyMax: 2 },
      { defId: 'coral-blade', chance: 0.1, qtyMin: 1, qtyMax: 1 },
      { defId: 'life-potion-minor', chance: 0.16, qtyMin: 1, qtyMax: 1 },
    ],
  },
  'a03-elite': {
    id: 'a03-elite',
    gold: { min: 36, max: 55 },
    entries: [
      { defId: 'driftwood-scrap', chance: 0.9, qtyMin: 2, qtyMax: 3 },
      { defId: 'coral-blade', chance: 0.38, qtyMin: 1, qtyMax: 1 },
      { defId: 'brine-cleaver', chance: 0.18, qtyMin: 1, qtyMax: 1 },
      { defId: 'life-potion-minor', chance: 0.55, qtyMin: 1, qtyMax: 1 },
    ],
  },
  'a03-boss': {
    id: 'a03-boss',
    gold: { min: 70, max: 105 },
    entries: [
      { defId: 'driftwood-scrap', chance: 1, qtyMin: 4, qtyMax: 6 },
      { defId: 'brine-cleaver', chance: 0.78, qtyMin: 1, qtyMax: 1 },
      { defId: 'coral-blade', chance: 0.55, qtyMin: 1, qtyMax: 1 },
      { defId: 'life-potion-minor', chance: 0.9, qtyMin: 2, qtyMax: 2 },
      { defId: 'tide-pearl', chance: 1, qtyMin: 1, qtyMax: 1 },
    ],
  },
  'a04-trash': {
    id: 'a04-trash',
    gold: { min: 16, max: 28 },
    entries: [
      { defId: 'cinder-shard', chance: 0.44, qtyMin: 1, qtyMax: 2 },
      { defId: 'ember-fang', chance: 0.1, qtyMin: 1, qtyMax: 1 },
      { defId: 'life-potion-minor', chance: 0.16, qtyMin: 1, qtyMax: 1 },
    ],
  },
  'a04-elite': {
    id: 'a04-elite',
    gold: { min: 44, max: 68 },
    entries: [
      { defId: 'cinder-shard', chance: 0.9, qtyMin: 2, qtyMax: 3 },
      { defId: 'ember-fang', chance: 0.4, qtyMin: 1, qtyMax: 1 },
      { defId: 'ashen-cleaver', chance: 0.18, qtyMin: 1, qtyMax: 1 },
      { defId: 'life-potion-minor', chance: 0.55, qtyMin: 1, qtyMax: 1 },
    ],
  },
  'a04-boss': {
    id: 'a04-boss',
    gold: { min: 85, max: 125 },
    entries: [
      { defId: 'cinder-shard', chance: 1, qtyMin: 4, qtyMax: 6 },
      { defId: 'ashen-cleaver', chance: 0.78, qtyMin: 1, qtyMax: 1 },
      { defId: 'ember-fang', chance: 0.55, qtyMin: 1, qtyMax: 1 },
      { defId: 'life-potion-minor', chance: 0.9, qtyMin: 2, qtyMax: 2 },
      { defId: 'cinder-heart', chance: 1, qtyMin: 1, qtyMax: 1 },
      { defId: 'ember-maul', chance: 0.16, qtyMin: 1, qtyMax: 1 },
    ],
  },
  'a05-trash': {
    id: 'a05-trash',
    gold: { min: 20, max: 34 },
    entries: [
      { defId: 'mire-moss', chance: 0.45, qtyMin: 1, qtyMax: 2 },
      { defId: 'bog-fang', chance: 0.1, qtyMin: 1, qtyMax: 1 },
      { defId: 'life-potion-minor', chance: 0.16, qtyMin: 1, qtyMax: 1 },
    ],
  },
  'a05-elite': {
    id: 'a05-elite',
    gold: { min: 52, max: 78 },
    entries: [
      { defId: 'mire-moss', chance: 0.9, qtyMin: 2, qtyMax: 3 },
      { defId: 'bog-fang', chance: 0.4, qtyMin: 1, qtyMax: 1 },
      { defId: 'venom-cleaver', chance: 0.18, qtyMin: 1, qtyMax: 1 },
      { defId: 'life-potion-minor', chance: 0.55, qtyMin: 1, qtyMax: 1 },
    ],
  },
  'a05-boss': {
    id: 'a05-boss',
    gold: { min: 100, max: 145 },
    entries: [
      { defId: 'mire-moss', chance: 1, qtyMin: 4, qtyMax: 6 },
      { defId: 'venom-cleaver', chance: 0.78, qtyMin: 1, qtyMax: 1 },
      { defId: 'bog-fang', chance: 0.55, qtyMin: 1, qtyMax: 1 },
      { defId: 'life-potion-minor', chance: 0.9, qtyMin: 2, qtyMax: 2 },
      { defId: 'bog-heart', chance: 1, qtyMin: 1, qtyMax: 1 },
    ],
  },
  'a06-trash': {
    id: 'a06-trash',
    gold: { min: 24, max: 40 },
    entries: [
      { defId: 'frost-fur', chance: 0.45, qtyMin: 1, qtyMax: 2 },
      { defId: 'ice-fang', chance: 0.1, qtyMin: 1, qtyMax: 1 },
      { defId: 'life-potion-minor', chance: 0.16, qtyMin: 1, qtyMax: 1 },
    ],
  },
  'a06-elite': {
    id: 'a06-elite',
    gold: { min: 60, max: 90 },
    entries: [
      { defId: 'frost-fur', chance: 0.9, qtyMin: 2, qtyMax: 3 },
      { defId: 'ice-fang', chance: 0.4, qtyMin: 1, qtyMax: 1 },
      { defId: 'glacier-cleaver', chance: 0.18, qtyMin: 1, qtyMax: 1 },
      { defId: 'life-potion-minor', chance: 0.55, qtyMin: 1, qtyMax: 1 },
    ],
  },
  'a06-boss': {
    id: 'a06-boss',
    gold: { min: 115, max: 165 },
    entries: [
      { defId: 'frost-fur', chance: 1, qtyMin: 4, qtyMax: 6 },
      { defId: 'glacier-cleaver', chance: 0.78, qtyMin: 1, qtyMax: 1 },
      { defId: 'ice-fang', chance: 0.55, qtyMin: 1, qtyMax: 1 },
      { defId: 'life-potion-mid', chance: 0.9, qtyMin: 2, qtyMax: 2 },
      { defId: 'frostfang-heart', chance: 1, qtyMin: 1, qtyMax: 1 },
    ],
  },
  'a07-trash': {
    id: 'a07-trash',
    gold: { min: 28, max: 46 },
    entries: [
      { defId: 'dune-chitin', chance: 0.45, qtyMin: 1, qtyMax: 2 },
      { defId: 'scorpion-stinger', chance: 0.1, qtyMin: 1, qtyMax: 1 },
      { defId: 'life-potion-minor', chance: 0.16, qtyMin: 1, qtyMax: 1 },
    ],
  },
  'a07-elite': {
    id: 'a07-elite',
    gold: { min: 70, max: 105 },
    entries: [
      { defId: 'dune-chitin', chance: 0.9, qtyMin: 2, qtyMax: 3 },
      { defId: 'scorpion-stinger', chance: 0.4, qtyMin: 1, qtyMax: 1 },
      { defId: 'sandstorm-cleaver', chance: 0.18, qtyMin: 1, qtyMax: 1 },
      { defId: 'life-potion-minor', chance: 0.55, qtyMin: 1, qtyMax: 1 },
    ],
  },
  'a07-boss': {
    id: 'a07-boss',
    gold: { min: 130, max: 185 },
    entries: [
      { defId: 'dune-chitin', chance: 1, qtyMin: 4, qtyMax: 6 },
      { defId: 'sandstorm-cleaver', chance: 0.78, qtyMin: 1, qtyMax: 1 },
      { defId: 'scorpion-stinger', chance: 0.55, qtyMin: 1, qtyMax: 1 },
      { defId: 'life-potion-mid', chance: 0.9, qtyMin: 2, qtyMax: 2 },
      { defId: 'storm-core', chance: 1, qtyMin: 1, qtyMax: 1 },
    ],
  },
  'a08-trash': {
    id: 'a08-trash',
    gold: { min: 32, max: 52 },
    entries: [
      { defId: 'star-shard', chance: 0.45, qtyMin: 1, qtyMax: 2 },
      { defId: 'ruin-blade', chance: 0.1, qtyMin: 1, qtyMax: 1 },
      { defId: 'life-potion-minor', chance: 0.16, qtyMin: 1, qtyMax: 1 },
    ],
  },
  'a08-elite': {
    id: 'a08-elite',
    gold: { min: 80, max: 120 },
    entries: [
      { defId: 'star-shard', chance: 0.9, qtyMin: 2, qtyMax: 3 },
      { defId: 'ruin-blade', chance: 0.4, qtyMin: 1, qtyMax: 1 },
      { defId: 'astral-cleaver', chance: 0.18, qtyMin: 1, qtyMax: 1 },
      { defId: 'life-potion-minor', chance: 0.55, qtyMin: 1, qtyMax: 1 },
    ],
  },
  'a08-boss': {
    id: 'a08-boss',
    gold: { min: 150, max: 210 },
    entries: [
      { defId: 'star-shard', chance: 1, qtyMin: 4, qtyMax: 6 },
      { defId: 'astral-cleaver', chance: 0.78, qtyMin: 1, qtyMax: 1 },
      { defId: 'ruin-blade', chance: 0.55, qtyMin: 1, qtyMax: 1 },
      { defId: 'life-potion-mid', chance: 0.9, qtyMin: 2, qtyMax: 2 },
      { defId: 'golem-core', chance: 1, qtyMin: 1, qtyMax: 1 },
      { defId: 'tide-buckler', chance: 0.14, qtyMin: 1, qtyMax: 1 },
    ],
  },
  'a09-trash': {
    id: 'a09-trash',
    gold: { min: 36, max: 58 },
    entries: [
      { defId: 'abyss-ink', chance: 0.45, qtyMin: 1, qtyMax: 2 },
      { defId: 'cult-dagger', chance: 0.1, qtyMin: 1, qtyMax: 1 },
      { defId: 'life-potion-minor', chance: 0.16, qtyMin: 1, qtyMax: 1 },
    ],
  },
  'a09-elite': {
    id: 'a09-elite',
    gold: { min: 90, max: 135 },
    entries: [
      { defId: 'abyss-ink', chance: 0.9, qtyMin: 2, qtyMax: 3 },
      { defId: 'cult-dagger', chance: 0.4, qtyMin: 1, qtyMax: 1 },
      { defId: 'tide-cleaver', chance: 0.18, qtyMin: 1, qtyMax: 1 },
      { defId: 'life-potion-minor', chance: 0.55, qtyMin: 1, qtyMax: 1 },
    ],
  },
  'a09-boss': {
    id: 'a09-boss',
    gold: { min: 170, max: 235 },
    entries: [
      { defId: 'abyss-ink', chance: 1, qtyMin: 4, qtyMax: 6 },
      { defId: 'tide-cleaver', chance: 0.78, qtyMin: 1, qtyMax: 1 },
      { defId: 'cult-dagger', chance: 0.55, qtyMin: 1, qtyMax: 1 },
      { defId: 'life-potion-mid', chance: 0.9, qtyMin: 2, qtyMax: 2 },
      { defId: 'tide-lord-heart', chance: 1, qtyMin: 1, qtyMax: 1 },
      { defId: 'tide-buckler', chance: 0.16, qtyMin: 1, qtyMax: 1 },
    ],
  },
  'a10-trash': {
    id: 'a10-trash',
    gold: { min: 40, max: 64 },
    entries: [
      { defId: 'ridge-scale', chance: 0.45, qtyMin: 1, qtyMax: 2 },
      { defId: 'wing-blade', chance: 0.1, qtyMin: 1, qtyMax: 1 },
      { defId: 'life-potion-minor', chance: 0.16, qtyMin: 1, qtyMax: 1 },
    ],
  },
  'a10-elite': {
    id: 'a10-elite',
    gold: { min: 100, max: 150 },
    entries: [
      { defId: 'ridge-scale', chance: 0.9, qtyMin: 2, qtyMax: 3 },
      { defId: 'wing-blade', chance: 0.4, qtyMin: 1, qtyMax: 1 },
      { defId: 'ridge-cleaver', chance: 0.18, qtyMin: 1, qtyMax: 1 },
      { defId: 'life-potion-minor', chance: 0.55, qtyMin: 1, qtyMax: 1 },
    ],
  },
  'a10-boss': {
    id: 'a10-boss',
    gold: { min: 190, max: 260 },
    entries: [
      { defId: 'ridge-scale', chance: 1, qtyMin: 4, qtyMax: 6 },
      { defId: 'ridge-cleaver', chance: 0.78, qtyMin: 1, qtyMax: 1 },
      { defId: 'wing-blade', chance: 0.55, qtyMin: 1, qtyMax: 1 },
      { defId: 'life-potion-greater', chance: 0.9, qtyMin: 2, qtyMax: 2 },
      { defId: 'rockwing-fang', chance: 1, qtyMin: 1, qtyMax: 1 },
    ],
  },
  'a11-trash': {
    id: 'a11-trash',
    gold: { min: 44, max: 70 },
    entries: [
      { defId: 'void-dust', chance: 0.45, qtyMin: 1, qtyMax: 2 },
      { defId: 'rift-blade', chance: 0.1, qtyMin: 1, qtyMax: 1 },
      { defId: 'life-potion-minor', chance: 0.16, qtyMin: 1, qtyMax: 1 },
    ],
  },
  'a11-elite': {
    id: 'a11-elite',
    gold: { min: 110, max: 165 },
    entries: [
      { defId: 'void-dust', chance: 0.9, qtyMin: 2, qtyMax: 3 },
      { defId: 'rift-blade', chance: 0.4, qtyMin: 1, qtyMax: 1 },
      { defId: 'void-cleaver', chance: 0.18, qtyMin: 1, qtyMax: 1 },
      { defId: 'life-potion-minor', chance: 0.55, qtyMin: 1, qtyMax: 1 },
    ],
  },
  'a11-boss': {
    id: 'a11-boss',
    gold: { min: 210, max: 285 },
    entries: [
      { defId: 'void-dust', chance: 1, qtyMin: 4, qtyMax: 6 },
      { defId: 'void-cleaver', chance: 0.78, qtyMin: 1, qtyMax: 1 },
      { defId: 'rift-blade', chance: 0.55, qtyMin: 1, qtyMax: 1 },
      { defId: 'life-potion-greater', chance: 0.9, qtyMin: 2, qtyMax: 2 },
      { defId: 'rift-core', chance: 1, qtyMin: 1, qtyMax: 1 },
    ],
  },
  'a12-trash': {
    id: 'a12-trash',
    gold: { min: 48, max: 76 },
    entries: [
      { defId: 'throne-sigil', chance: 0.45, qtyMin: 1, qtyMax: 2 },
      { defId: 'guard-blade', chance: 0.1, qtyMin: 1, qtyMax: 1 },
      { defId: 'life-potion-minor', chance: 0.16, qtyMin: 1, qtyMax: 1 },
    ],
  },
  'a12-elite': {
    id: 'a12-elite',
    gold: { min: 120, max: 180 },
    entries: [
      { defId: 'throne-sigil', chance: 0.9, qtyMin: 2, qtyMax: 3 },
      { defId: 'guard-blade', chance: 0.4, qtyMin: 1, qtyMax: 1 },
      { defId: 'end-cleaver', chance: 0.18, qtyMin: 1, qtyMax: 1 },
      { defId: 'life-potion-minor', chance: 0.55, qtyMin: 1, qtyMax: 1 },
    ],
  },
  'a12-boss': {
    id: 'a12-boss',
    gold: { min: 240, max: 320 },
    entries: [
      { defId: 'throne-sigil', chance: 1, qtyMin: 5, qtyMax: 7 },
      { defId: 'end-cleaver', chance: 0.85, qtyMin: 1, qtyMax: 1 },
      { defId: 'guard-blade', chance: 0.6, qtyMin: 1, qtyMax: 1 },
      { defId: 'life-potion-greater', chance: 1, qtyMin: 2, qtyMax: 3 },
      { defId: 'end-king-crown', chance: 1, qtyMin: 1, qtyMax: 1 },
      { defId: 'rift-edge', chance: 0.22, qtyMin: 1, qtyMax: 1 },
    ],
  },
};

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/** 按掉落表掷一次，产出地面掉落清单（不含坐标）�?*/
export function rollLootTable(tableId: string): LootDrop[] {
  const table = LOOT_TABLES[tableId];
  if (!table) {
    return [{ kind: 'gold', amount: 3 }];
  }
  const drops: LootDrop[] = [
    { kind: 'gold', amount: randInt(table.gold.min, table.gold.max) },
  ];
  for (const entry of table.entries) {
    if (Math.random() >= entry.chance) {
      continue;
    }
    const qtyMin = entry.qtyMin ?? 1;
    const qtyMax = entry.qtyMax ?? qtyMin;
    drops.push({
      kind: 'item',
      defId: entry.defId,
      amount: randInt(qtyMin, qtyMax),
    });
  }
  return drops;
}
