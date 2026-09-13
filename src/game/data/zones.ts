import type { EnemyDefId } from './enemy-defs';
import {
  expandKitCollision,
  listBreakablePieces,
  type KitPiece,
  type KitThemeId,
  type LandmarkProp,
} from './level-kit';
import type { Rect } from '../types';

export type ZoneSpawn = {
  enemyId: EnemyDefId;
  x: number;
  y: number;
  patrolMin: number;
  patrolMax: number;
};

export type ZoneSecret = {
  id: string;
  x: number;
  /** 平台顶面 / 交互高度 */
  y: number;
  rewardDefId: string;
  rewardQty: number;
};

export type ZoneDef = {
  id: string;
  name: string;
  levelMin: number;
  levelMax: number;
  theme: KitThemeId;
  /** 关卡套件：改此表即可换布局，碰撞由 expandKitCollision 生成 */
  kit: KitPiece[];
  rivers: Rect[];
  banners: { x: number; y: number }[];
  spawns: ZoneSpawn[];
  secrets: ZoneSecret[];
  bossId: string;
  /** 无营地时的回营传送点（如 A02） */
  hubPortal?: { x: number; y: number; promptY: number };
};

function g(id: string, x: number, w: number): KitPiece {
  return { id, kind: 'ground', x, y: 0, w, h: 1 };
}

function led(id: string, x: number, y: number, w: number, h = 0.34): KitPiece {
  return { id, kind: 'ledge', x, y, w, h };
}

function slp(id: string, x: number, y: number, w: number, rise: number): KitPiece {
  return { id, kind: 'slope', x, y, w, h: 0.3, rise };
}

function crate(
  id: string,
  x: number,
  y: number,
  rewardDefId: string,
  rewardQty: number,
  w = 0.7,
  h = 0.7,
): KitPiece {
  return { id, kind: 'breakable', x, y, w, h, rewardDefId, rewardQty };
}

function mark(id: string, x: number, prop: LandmarkProp, w = 3.4, h = 3.4): KitPiece {
  return { id, kind: 'landmark', x, y: 1, w, h, prop };
}

function wall(id: string, x: number, y: number, w: number, h: number): KitPiece {
  return { id, kind: 'secret-wall', x, y, w, h };
}

/** A02–A13 共用主路：约 100 单位、五段地面。 */
function beatGrounds(): KitPiece[] {
  return [
    g('g-entry', -2, 16),
    g('g-mid-a', 17.5, 20),
    g('g-mid-b', 42, 18),
    g('g-gate', 63.5, 12),
    g('g-boss', 78, 20),
  ];
}

function beatCommon(prefix: string, scrap: string, landmark: LandmarkProp): KitPiece[] {
  return [
    ...beatGrounds(),
    slp(`slope-${prefix}`, 20.4, 1, 2.0, 1.15),
    led(`ledge-${prefix}`, 22.3, 2.15, 2.4),
    led('ledge-high', 48.0, 2.18, 3.4),
    led('ledge-alcove', 52.8, 2.5, 1.7),
    led('ledge-gap', 38.7, 1.72, 1.45, 0.28),
    crate(`crate-${prefix}`, 8.6, 1, scrap, 2),
    crate('crate-gap', 39.05, 2.02, scrap, 1, 0.6, 0.6),
    crate('crate-arena', 80.6, 1, 'life-potion-minor', 1, 0.75, 0.8),
    mark(`lm-${prefix}`, 26.4, landmark),
  ];
}

const BEAT_BANNERS = [
  { x: 1.4, y: 1 },
  { x: 77.2, y: 1 },
];

const BEAT_PORTAL = { x: 0.85, y: 1, promptY: 3.2 };

/** A01 迷雾林地样板关 — 营地 + 三段拍（断崖树根 / 高台喷吐 / 加宽 BOSS 台）。 */
export const ZONE_A01: ZoneDef = {
  id: 'a01',
  name: '迷雾林地',
  levelMin: 1,
  levelMax: 5,
  theme: 'woodland',
  kit: [
    g('g-camp', -10, 22),
    g('g-approach', 14.8, 13.4),
    g('g-mid', 32.8, 18.4),
    g('g-gate', 54.2, 13.4),
    g('g-boss', 70.5, 22),
    slp('slope-chest', 19.2, 1, 2.15, 1.15),
    led('ledge-chest', 21.2, 2.15, 2.4, 0.38),
    slp('slope-root', 26.6, 1, 2.4, 1.2),
    led('ledge-root-a', 29.0, 2.2, 2.3),
    led('ledge-root-b', 31.2, 2.05, 1.9),
    led('ledge-spit', 44.6, 2.18, 3.2),
    led('ledge-alcove', 48.8, 2.5, 1.7),
    crate('crate-ford', 19.2, 1, 'woodland-scrap', 1),
    crate('crate-root', 29.5, 2.54, 'woodland-scrap', 1, 0.6, 0.6),
    crate('crate-gate', 56.4, 1, 'life-potion-minor', 1, 0.75, 0.8),
    wall('false-moss', 21.25, 2.53, 0.42, 1.35),
    mark('lm-deadwood', 35.4, 'deadwood', 4.2, 3.8),
  ],
  rivers: [
    { x: 12.2, y: 0, w: 2.6, h: 1 },
    { x: 28.3, y: 0, w: 4.5, h: 1 },
    { x: 51.2, y: 0, w: 3.0, h: 1 },
  ],
  banners: [
    { x: 2.35, y: 1 },
    { x: 70.8, y: 1 },
  ],
  spawns: [
    { enemyId: 'rotwolf', x: 17.8, y: 1, patrolMin: 15.2, patrolMax: 22.4 },
    { enemyId: 'rotwolf', x: 24.6, y: 1, patrolMin: 22.0, patrolMax: 27.6 },
    { enemyId: 'mist-spitter', x: 30.1, y: 2.54, patrolMin: 29.0, patrolMax: 32.4 },
    { enemyId: 'treant', x: 38.4, y: 1, patrolMin: 34.2, patrolMax: 46.0 },
    { enemyId: 'mist-spitter', x: 46.0, y: 2.52, patrolMin: 44.8, patrolMax: 47.6 },
    { enemyId: 'blight-pod', x: 57.2, y: 1, patrolMin: 55.0, patrolMax: 61.4 },
    { enemyId: 'treant-elite', x: 63.4, y: 1, patrolMin: 60.6, patrolMax: 67.0 },
    { enemyId: 'rotwood', x: 82.4, y: 1, patrolMin: 74.0, patrolMax: 90.6 },
  ],
  secrets: [
    {
      id: 'a01-chest-ledge',
      x: 22.05,
      y: 2.53,
      rewardDefId: 'relic-mist-veil',
      rewardQty: 1,
    },
    {
      id: 'a01-chest-alcove',
      x: 49.5,
      y: 2.84,
      rewardDefId: 'mist-blade',
      rewardQty: 1,
    },
  ],
  bossId: 'rotwood',
};

/** A02 荒石矿坑 — 竖井跳台 + 矿车地标。 */
export const ZONE_A02: ZoneDef = {
  id: 'a02',
  name: '荒石矿坑',
  levelMin: 6,
  levelMax: 10,
  theme: 'quarry',
  kit: [
    ...beatCommon('ore', 'quarry-ore', 'minecart'),
    led('ledge-shaft-a', 37.8, 1.85, 1.35, 0.3),
    led('ledge-shaft-b', 40.2, 2.15, 1.4, 0.3),
    crate('crate-shaft', 38.1, 2.15, 'quarry-ore', 1, 0.6, 0.6),
  ],
  rivers: [],
  banners: BEAT_BANNERS,
  spawns: [
    { enemyId: 'mine-golem', x: 7.4, y: 1, patrolMin: 4.6, patrolMax: 12.4 },
    { enemyId: 'cave-bat', x: 24.2, y: 1, patrolMin: 18.8, patrolMax: 32.0 },
    { enemyId: 'blast-bug', x: 38.4, y: 2.15, patrolMin: 37.8, patrolMax: 41.4 },
    { enemyId: 'cave-bat', x: 49.4, y: 2.52, patrolMin: 48.0, patrolMax: 51.2 },
    { enemyId: 'mine-golem', x: 54.6, y: 1, patrolMin: 44.2, patrolMax: 59.0 },
    { enemyId: 'mine-golem-elite', x: 68.4, y: 1, patrolMin: 64.4, patrolMax: 74.6 },
    { enemyId: 'rock-warden', x: 88.2, y: 1, patrolMin: 80.0, patrolMax: 96.4 },
  ],
  secrets: [
    { id: 'a02-chest-ledge', x: 23.2, y: 2.49, rewardDefId: 'iron-pick-blade', rewardQty: 1 },
    { id: 'a02-chest-alcove', x: 53.5, y: 2.84, rewardDefId: 'relic-ore-sigil', rewardQty: 1 },
  ],
  bossId: 'rock-warden',
  hubPortal: BEAT_PORTAL,
};

/** A03 潮汐海滩 — 宽河礁石跳 + 搁浅船骨。 */
export const ZONE_A03: ZoneDef = {
  id: 'a03',
  name: '潮汐海滩',
  levelMin: 11,
  levelMax: 15,
  theme: 'coast',
  kit: [
    ...beatCommon('dock', 'driftwood-scrap', 'wreck'),
    led('ledge-reef-a', 37.7, 1.55, 1.3, 0.28),
    led('ledge-reef-b', 40.0, 1.85, 1.35, 0.28),
    crate('crate-spray', 40.25, 2.15, 'driftwood-scrap', 1, 0.6, 0.6),
  ],
  rivers: [
    { x: 14.0, y: 0, w: 3.5, h: 1 },
    { x: 37.5, y: 0, w: 4.5, h: 1 },
  ],
  banners: BEAT_BANNERS,
  spawns: [
    { enemyId: 'sand-crab', x: 7.2, y: 1, patrolMin: 4.4, patrolMax: 12.6 },
    { enemyId: 'drowned-raider', x: 24.8, y: 1, patrolMin: 18.6, patrolMax: 34.0 },
    { enemyId: 'tide-spitter', x: 49.2, y: 2.52, patrolMin: 48.0, patrolMax: 51.2 },
    { enemyId: 'sand-crab', x: 54.4, y: 1, patrolMin: 43.4, patrolMax: 59.2 },
    { enemyId: 'tide-spitter', x: 58.2, y: 1, patrolMin: 54.0, patrolMax: 59.6 },
    { enemyId: 'reef-crab-elite', x: 68.6, y: 1, patrolMin: 64.2, patrolMax: 74.8 },
    { enemyId: 'tide-crab', x: 88.4, y: 1, patrolMin: 80.2, patrolMax: 96.6 },
  ],
  secrets: [
    { id: 'a03-chest-dock', x: 23.2, y: 2.49, rewardDefId: 'coral-blade', rewardQty: 1 },
    { id: 'a03-chest-alcove', x: 53.5, y: 2.84, rewardDefId: 'relic-tide-glass', rewardQty: 1 },
  ],
  bossId: 'tide-crab',
  hubPortal: BEAT_PORTAL,
};

/** A04 焦土丘陵 — 焦黑拱门 + 灰烬断坎。 */
export const ZONE_A04: ZoneDef = {
  id: 'a04',
  name: '焦土丘陵',
  levelMin: 16,
  levelMax: 20,
  theme: 'ashland',
  kit: [
    ...beatCommon('ridge', 'cinder-shard', 'cinder-arch'),
    led('ledge-ash-a', 37.8, 1.6, 1.3, 0.28),
    led('ledge-ash-b', 40.1, 1.9, 1.3, 0.28),
  ],
  rivers: [{ x: 37.5, y: 0, w: 4.5, h: 1 }],
  banners: BEAT_BANNERS,
  spawns: [
    { enemyId: 'ember-lizard', x: 7.2, y: 1, patrolMin: 4.4, patrolMax: 12.6 },
    { enemyId: 'ash-bandit', x: 24.6, y: 1, patrolMin: 18.8, patrolMax: 34.2 },
    { enemyId: 'ash-spitter', x: 49.2, y: 2.52, patrolMin: 48.0, patrolMax: 51.2 },
    { enemyId: 'ash-bandit', x: 54.8, y: 1, patrolMin: 44.0, patrolMax: 59.4 },
    { enemyId: 'ember-lizard', x: 58.0, y: 1, patrolMin: 52.4, patrolMax: 59.6 },
    { enemyId: 'ember-lizard-elite', x: 68.4, y: 1, patrolMin: 64.2, patrolMax: 74.6 },
    { enemyId: 'cinder-lizard', x: 88.2, y: 1, patrolMin: 80.0, patrolMax: 96.4 },
  ],
  secrets: [
    { id: 'a04-chest-ridge', x: 23.2, y: 2.49, rewardDefId: 'ember-fang', rewardQty: 1 },
    { id: 'a04-chest-alcove', x: 53.5, y: 2.84, rewardDefId: 'relic-cinder-mask', rewardQty: 1 },
  ],
  bossId: 'cinder-lizard',
  hubPortal: BEAT_PORTAL,
};

/** A05 幽影沼泽 — 双河木栈 + 潜伏者切路。 */
export const ZONE_A05: ZoneDef = {
  id: 'a05',
  name: '幽影沼泽',
  levelMin: 21,
  levelMax: 25,
  theme: 'mire',
  kit: [
    ...beatCommon('moss', 'mire-moss', 'boardwalk'),
    led('ledge-mire-a', 37.7, 1.55, 1.35, 0.28),
    led('ledge-mire-b', 40.0, 1.75, 1.4, 0.28),
  ],
  rivers: [
    { x: 14.0, y: 0, w: 3.5, h: 1 },
    { x: 37.5, y: 0, w: 4.5, h: 1 },
  ],
  banners: BEAT_BANNERS,
  spawns: [
    { enemyId: 'poison-frog', x: 7.0, y: 1, patrolMin: 4.6, patrolMax: 12.4 },
    { enemyId: 'bog-wraith', x: 24.4, y: 1, patrolMin: 18.6, patrolMax: 34.0 },
    { enemyId: 'mire-lurker', x: 40.55, y: 2.03, patrolMin: 40.0, patrolMax: 41.4 },
    { enemyId: 'bog-wraith', x: 49.2, y: 2.52, patrolMin: 48.0, patrolMax: 51.2 },
    { enemyId: 'poison-frog', x: 54.6, y: 1, patrolMin: 44.2, patrolMax: 59.2 },
    { enemyId: 'bog-wraith-elite', x: 68.6, y: 1, patrolMin: 64.4, patrolMax: 74.8 },
    { enemyId: 'bog-mother', x: 88.4, y: 1, patrolMin: 80.2, patrolMax: 96.6 },
  ],
  secrets: [
    { id: 'a05-chest-moss', x: 23.2, y: 2.49, rewardDefId: 'bog-fang', rewardQty: 1 },
    { id: 'a05-chest-alcove', x: 53.5, y: 2.84, rewardDefId: 'relic-bog-lantern', rewardQty: 1 },
  ],
  bossId: 'bog-mother',
  hubPortal: BEAT_PORTAL,
};

/** A06 霜风雪原 — 冰桥地标 + 冻崖绕行。 */
export const ZONE_A06: ZoneDef = {
  id: 'a06',
  name: '霜风雪原',
  levelMin: 26,
  levelMax: 30,
  theme: 'frost',
  kit: [
    ...beatCommon('snow', 'frost-fur', 'ice-span'),
    led('ledge-ice-a', 37.8, 2.05, 1.4, 0.26),
    led('ledge-ice-b', 40.1, 1.85, 1.35, 0.26),
  ],
  rivers: [],
  banners: BEAT_BANNERS,
  spawns: [
    { enemyId: 'frost-wolf', x: 7.2, y: 1, patrolMin: 4.4, patrolMax: 12.6 },
    { enemyId: 'snow-brute', x: 25.2, y: 1, patrolMin: 19.0, patrolMax: 34.4 },
    { enemyId: 'ice-spitter', x: 49.2, y: 2.52, patrolMin: 48.0, patrolMax: 51.2 },
    { enemyId: 'frost-wolf', x: 54.8, y: 1, patrolMin: 44.0, patrolMax: 59.4 },
    { enemyId: 'snow-brute', x: 57.6, y: 1, patrolMin: 52.0, patrolMax: 59.6 },
    { enemyId: 'frost-wolf-elite', x: 68.4, y: 1, patrolMin: 64.2, patrolMax: 74.6 },
    { enemyId: 'frostfang', x: 88.2, y: 1, patrolMin: 80.0, patrolMax: 96.4 },
  ],
  secrets: [
    { id: 'a06-chest-snow', x: 23.2, y: 2.49, rewardDefId: 'ice-fang', rewardQty: 1 },
    { id: 'a06-chest-alcove', x: 53.5, y: 2.84, rewardDefId: 'relic-frost-charm', rewardQty: 1 },
  ],
  bossId: 'frostfang',
  hubPortal: BEAT_PORTAL,
};

/** A07 赤沙峡谷 — 沙拱 + 窄踏脚冲坡。 */
export const ZONE_A07: ZoneDef = {
  id: 'a07',
  name: '赤沙峡谷',
  levelMin: 31,
  levelMax: 35,
  theme: 'dunes',
  kit: [
    ...beatCommon('dune', 'dune-chitin', 'dune-arch'),
    led('ledge-sand-a', 37.9, 1.5, 1.15, 0.26),
    led('ledge-sand-b', 40.2, 1.7, 1.15, 0.26),
  ],
  rivers: [],
  banners: BEAT_BANNERS,
  spawns: [
    { enemyId: 'sand-scorpion', x: 7.0, y: 1, patrolMin: 4.4, patrolMax: 12.4 },
    { enemyId: 'dune-raider', x: 24.8, y: 1, patrolMin: 18.8, patrolMax: 34.2 },
    { enemyId: 'sand-spitter', x: 49.2, y: 2.52, patrolMin: 48.0, patrolMax: 51.2 },
    { enemyId: 'sand-scorpion', x: 54.6, y: 1, patrolMin: 44.2, patrolMax: 59.2 },
    { enemyId: 'dune-raider', x: 57.8, y: 1, patrolMin: 52.4, patrolMax: 59.6 },
    { enemyId: 'sand-scorpion-elite', x: 68.6, y: 1, patrolMin: 64.4, patrolMax: 74.8 },
    { enemyId: 'storm-scorpion', x: 88.4, y: 1, patrolMin: 80.2, patrolMax: 96.6 },
  ],
  secrets: [
    { id: 'a07-chest-dune', x: 23.2, y: 2.49, rewardDefId: 'scorpion-stinger', rewardQty: 1 },
    { id: 'a07-chest-alcove', x: 53.5, y: 2.84, rewardDefId: 'relic-dune-scarab', rewardQty: 1 },
  ],
  bossId: 'storm-scorpion',
  hubPortal: BEAT_PORTAL,
};

/** A08 坠星废墟 — 石像柱 + 塌方木箱挡路。 */
export const ZONE_A08: ZoneDef = {
  id: 'a08',
  name: '坠星废墟',
  levelMin: 36,
  levelMax: 40,
  theme: 'ruins',
  kit: [
    ...beatCommon('ruin', 'star-shard', 'idol-column'),
    g('g-choke', 36.2, 1.35),
    led('ledge-lintel', 36.15, 2.62, 1.5, 0.28),
    crate('crate-block', 36.3, 1, 'star-shard', 1, 1.15, 1.55),
  ],
  rivers: [],
  banners: BEAT_BANNERS,
  spawns: [
    { enemyId: 'stone-idol', x: 7.0, y: 1, patrolMin: 4.4, patrolMax: 12.4 },
    { enemyId: 'arcane-wisp', x: 24.6, y: 1, patrolMin: 18.6, patrolMax: 34.0 },
    { enemyId: 'ruin-watcher', x: 49.2, y: 2.52, patrolMin: 48.0, patrolMax: 51.2 },
    { enemyId: 'arcane-wisp', x: 54.8, y: 1, patrolMin: 44.0, patrolMax: 59.4 },
    { enemyId: 'stone-idol', x: 57.6, y: 1, patrolMin: 52.0, patrolMax: 59.6 },
    { enemyId: 'stone-idol-elite', x: 68.4, y: 1, patrolMin: 64.2, patrolMax: 74.6 },
    { enemyId: 'golem-mage', x: 88.2, y: 1, patrolMin: 80.0, patrolMax: 96.4 },
  ],
  secrets: [
    { id: 'a08-chest-ruin', x: 23.2, y: 2.49, rewardDefId: 'ruin-blade', rewardQty: 1 },
    { id: 'a08-chest-alcove', x: 53.5, y: 2.84, rewardDefId: 'relic-ruin-glyph', rewardQty: 1 },
  ],
  bossId: 'golem-mage',
  hubPortal: BEAT_PORTAL,
};

/** A09 暗潮地窟 — 垂触手 + 高台远程。 */
export const ZONE_A09: ZoneDef = {
  id: 'a09',
  name: '暗潮地窟',
  levelMin: 41,
  levelMax: 45,
  theme: 'abyss',
  kit: [
    ...beatCommon('abyss', 'abyss-ink', 'hanging-tendril'),
    led('ledge-tent-a', 84.0, 2.5, 1.8),
    led('ledge-tent-b', 88.2, 3.2, 1.6),
    led('ledge-dark-a', 37.8, 1.7, 1.3, 0.28),
    led('ledge-dark-b', 40.1, 2.0, 1.3, 0.28),
  ],
  rivers: [
    { x: 14.0, y: 0, w: 3.5, h: 1 },
    { x: 37.5, y: 0, w: 4.5, h: 1 },
  ],
  banners: BEAT_BANNERS,
  spawns: [
    { enemyId: 'tide-cultist', x: 7.0, y: 1, patrolMin: 4.4, patrolMax: 12.4 },
    { enemyId: 'tentacle-spawn', x: 24.4, y: 1, patrolMin: 18.6, patrolMax: 34.0 },
    { enemyId: 'abyss-spitter', x: 49.2, y: 2.52, patrolMin: 48.0, patrolMax: 51.2 },
    { enemyId: 'tide-cultist', x: 54.6, y: 1, patrolMin: 44.2, patrolMax: 59.2 },
    { enemyId: 'abyss-spitter', x: 58.0, y: 1, patrolMin: 54.0, patrolMax: 59.6 },
    { enemyId: 'tide-cultist-elite', x: 68.6, y: 1, patrolMin: 64.4, patrolMax: 74.8 },
    { enemyId: 'tide-lord', x: 88.4, y: 1, patrolMin: 80.2, patrolMax: 96.6 },
  ],
  secrets: [
    { id: 'a09-chest-ledge', x: 23.2, y: 2.49, rewardDefId: 'cult-dagger', rewardQty: 1 },
    { id: 'a09-chest-high', x: 88.9, y: 3.54, rewardDefId: 'relic-abyss-mask', rewardQty: 1 },
  ],
  bossId: 'tide-lord',
  hubPortal: BEAT_PORTAL,
};

/** A10 龙脊山脉 — 龙骨梁 + 高落差跳台。 */
export const ZONE_A10: ZoneDef = {
  id: 'a10',
  name: '龙脊山脉',
  levelMin: 46,
  levelMax: 50,
  theme: 'ridge',
  kit: [
    ...beatCommon('ridge10', 'ridge-scale', 'dragon-rib'),
    led('ledge-drop-a', 37.8, 2.55, 1.4),
    led('ledge-drop-b', 40.2, 2.05, 1.35),
    led('ledge-dive-a', 84.0, 2.5, 1.8),
    led('ledge-dive-b', 88.2, 3.2, 1.55),
  ],
  rivers: [],
  banners: BEAT_BANNERS,
  spawns: [
    { enemyId: 'ridge-wyvern', x: 7.0, y: 1, patrolMin: 4.4, patrolMax: 12.4 },
    { enemyId: 'mountain-giant', x: 25.0, y: 1, patrolMin: 19.0, patrolMax: 34.4 },
    { enemyId: 'ridge-spitter', x: 49.2, y: 2.52, patrolMin: 48.0, patrolMax: 51.2 },
    { enemyId: 'ridge-wyvern', x: 54.6, y: 1, patrolMin: 44.2, patrolMax: 59.2 },
    { enemyId: 'mountain-giant', x: 57.8, y: 1, patrolMin: 52.4, patrolMax: 59.6 },
    { enemyId: 'mountain-giant-elite', x: 68.6, y: 1, patrolMin: 64.4, patrolMax: 74.8 },
    { enemyId: 'rockwing', x: 88.4, y: 1, patrolMin: 80.2, patrolMax: 96.6 },
  ],
  secrets: [
    { id: 'a10-chest-ledge', x: 23.2, y: 2.49, rewardDefId: 'wing-blade', rewardQty: 1 },
    { id: 'a10-chest-high', x: 88.85, y: 3.54, rewardDefId: 'relic-wyrm-crest', rewardQty: 1 },
  ],
  bossId: 'rockwing',
  hubPortal: BEAT_PORTAL,
};

/** A11 虚空裂隙 — 碎石跳岛 + 晶体地标。 */
export const ZONE_A11: ZoneDef = {
  id: 'a11',
  name: '虚空裂隙',
  levelMin: 51,
  levelMax: 55,
  theme: 'void',
  kit: [
    ...beatCommon('void', 'void-dust', 'rift-crystal'),
    g('g-isle-a', 37.7, 1.55),
    g('g-isle-b', 40.0, 1.5),
    led('ledge-hole-a', 84.0, 2.45, 1.75),
    led('ledge-hole-b', 88.2, 3.15, 1.6),
  ],
  rivers: [
    { x: 14.0, y: 0, w: 3.5, h: 1 },
    { x: 39.25, y: 0, w: 0.75, h: 1 },
  ],
  banners: BEAT_BANNERS,
  spawns: [
    { enemyId: 'void-walker', x: 7.0, y: 1, patrolMin: 4.4, patrolMax: 12.4 },
    { enemyId: 'rift-shard', x: 24.6, y: 1, patrolMin: 18.6, patrolMax: 34.0 },
    { enemyId: 'void-spitter', x: 49.2, y: 2.52, patrolMin: 48.0, patrolMax: 51.2 },
    { enemyId: 'void-walker', x: 54.6, y: 1, patrolMin: 44.2, patrolMax: 59.2 },
    { enemyId: 'rift-shard', x: 57.8, y: 1, patrolMin: 52.4, patrolMax: 59.6 },
    { enemyId: 'void-walker-elite', x: 68.6, y: 1, patrolMin: 64.4, patrolMax: 74.8 },
    { enemyId: 'rift-warden', x: 88.4, y: 1, patrolMin: 80.2, patrolMax: 96.6 },
  ],
  secrets: [
    { id: 'a11-chest-ledge', x: 23.2, y: 2.49, rewardDefId: 'rift-blade', rewardQty: 1 },
    { id: 'a11-chest-high', x: 88.9, y: 3.47, rewardDefId: 'relic-void-prism', rewardQty: 1 },
  ],
  bossId: 'rift-warden',
  hubPortal: BEAT_PORTAL,
};

/** A12 终焉王座 — 长阶地标 + 清波开门前的禁卫。 */
export const ZONE_A12: ZoneDef = {
  id: 'a12',
  name: '终焉王座',
  levelMin: 56,
  levelMax: 60,
  theme: 'throne',
  kit: [
    ...beatCommon('throne', 'throne-sigil', 'throne-stair'),
    led('ledge-safe-a', 84.0, 2.5, 1.8),
    led('ledge-safe-b', 88.2, 3.25, 1.65),
    g('g-choke', 36.2, 1.35),
    led('ledge-lintel', 36.15, 2.62, 1.5, 0.28),
    crate('crate-block', 36.3, 1, 'throne-sigil', 1, 1.15, 1.55),
  ],
  rivers: [],
  banners: BEAT_BANNERS,
  spawns: [
    { enemyId: 'throne-guard', x: 7.0, y: 1, patrolMin: 4.4, patrolMax: 12.4 },
    { enemyId: 'wraith', x: 24.6, y: 1, patrolMin: 18.6, patrolMax: 34.0 },
    { enemyId: 'throne-spitter', x: 49.2, y: 2.52, patrolMin: 48.0, patrolMax: 51.2 },
    { enemyId: 'throne-guard', x: 54.6, y: 1, patrolMin: 44.2, patrolMax: 59.2 },
    { enemyId: 'wraith', x: 57.8, y: 1, patrolMin: 52.4, patrolMax: 59.6 },
    { enemyId: 'throne-guard-elite', x: 68.6, y: 1, patrolMin: 64.4, patrolMax: 74.8 },
    { enemyId: 'end-king', x: 88.4, y: 1, patrolMin: 80.2, patrolMax: 96.6 },
  ],
  secrets: [
    { id: 'a12-chest-ledge', x: 23.2, y: 2.49, rewardDefId: 'guard-blade', rewardQty: 1 },
    { id: 'a12-chest-high', x: 88.9, y: 3.57, rewardDefId: 'relic-throne-seal', rewardQty: 1 },
  ],
  bossId: 'end-king',
  hubPortal: BEAT_PORTAL,
};

/** A13 余烬祭坛 — 火坛地标 + 同骨架王座路。 */
export const ZONE_A13: ZoneDef = {
  id: 'a13',
  name: '余烬祭坛',
  levelMin: 61,
  levelMax: 65,
  theme: 'throne',
  kit: [
    ...beatCommon('ember', 'throne-sigil', 'ember-pyre'),
    led('ledge-safe-a', 84.0, 2.5, 1.8),
    led('ledge-safe-b', 88.2, 3.25, 1.65),
    g('g-choke', 36.2, 1.35),
    led('ledge-lintel', 36.15, 2.62, 1.5, 0.28),
    crate('crate-block', 36.3, 1, 'throne-sigil', 1, 1.15, 1.55),
  ],
  rivers: [],
  banners: BEAT_BANNERS,
  spawns: [
    { enemyId: 'throne-guard', x: 7.0, y: 1, patrolMin: 4.4, patrolMax: 12.4 },
    { enemyId: 'wraith', x: 24.6, y: 1, patrolMin: 18.6, patrolMax: 34.0 },
    { enemyId: 'throne-spitter', x: 49.2, y: 2.52, patrolMin: 48.0, patrolMax: 51.2 },
    { enemyId: 'throne-guard', x: 54.6, y: 1, patrolMin: 44.2, patrolMax: 59.2 },
    { enemyId: 'wraith', x: 57.8, y: 1, patrolMin: 52.4, patrolMax: 59.6 },
    { enemyId: 'throne-guard-elite', x: 68.6, y: 1, patrolMin: 64.4, patrolMax: 74.8 },
    { enemyId: 'ember-tyrant', x: 88.4, y: 1, patrolMin: 80.2, patrolMax: 96.6 },
  ],
  secrets: [
    { id: 'a13-chest-ledge', x: 23.2, y: 2.49, rewardDefId: 'guard-blade', rewardQty: 1 },
    { id: 'a13-chest-high', x: 88.9, y: 3.57, rewardDefId: 'relic-throne-seal', rewardQty: 1 },
  ],
  bossId: 'ember-tyrant',
  hubPortal: BEAT_PORTAL,
};

/** 词缀试炼 — 短关限时清精英，营地入口，不进世界地图。 */
export const ZONE_CHALLENGE: ZoneDef = {
  id: 'challenge',
  name: '词缀试炼',
  levelMin: 1,
  levelMax: 60,
  theme: 'ashland',
  kit: [
    { id: 'g-entry', kind: 'ground', x: -2, y: 0, w: 10.0, h: 1 },
    { id: 'g-mid', kind: 'ground', x: 10.5, y: 0, w: 8.6, h: 1 },
    { id: 'g-end', kind: 'ground', x: 22.0, y: 0, w: 11.0, h: 1 },
    { id: 'slope-ch', kind: 'slope', x: 12.8, y: 1, w: 1.8, h: 0.3, rise: 1.0 },
    { id: 'ledge-ch', kind: 'ledge', x: 14.5, y: 2.0, w: 2.0, h: 0.32 },
    // 试炼中段断坎：强制短跳，拉开精英遭遇
    { id: 'ledge-ch-step', kind: 'ledge', x: 19.8, y: 1.55, w: 1.2, h: 0.28 },
    {
      id: 'crate-ch',
      kind: 'breakable',
      x: 8.2,
      y: 1,
      w: 0.7,
      h: 0.7,
      rewardDefId: 'woodland-scrap',
      rewardQty: 2,
    },
    {
      id: 'crate-ch-step',
      kind: 'breakable',
      x: 20.15,
      y: 1.85,
      w: 0.6,
      h: 0.6,
      rewardDefId: 'cinder-shard',
      rewardQty: 1,
    },
    {
      id: 'crate-ch-end',
      kind: 'breakable',
      x: 29.2,
      y: 1,
      w: 0.7,
      h: 0.7,
      rewardDefId: 'life-potion-minor',
      rewardQty: 1,
    },
    { id: 'bg-ch', kind: 'backdrop', x: 26.4, y: 1, w: 0.85, h: 1.15 },
  ],
  rivers: [{ x: 19.1, y: 0, w: 2.6, h: 1 }],
  banners: [
    { x: 1.2, y: 1 },
    { x: 28.6, y: 1 },
  ],
  spawns: [
    { enemyId: 'treant-elite', x: 6.0, y: 1, patrolMin: 4.0, patrolMax: 8.5 },
    { enemyId: 'frost-wolf-elite', x: 14.8, y: 1, patrolMin: 12.4, patrolMax: 18.8 },
    { enemyId: 'sand-scorpion-elite', x: 23.4, y: 1, patrolMin: 21.8, patrolMax: 25.6 },
    { enemyId: 'void-walker-elite', x: 28.8, y: 1, patrolMin: 26.4, patrolMax: 31.2 },
  ],
  secrets: [],
  bossId: '',
  hubPortal: { x: 0.8, y: 1, promptY: 3.2 },
};

export const ZONES: Record<string, ZoneDef> = {
  a01: ZONE_A01,
  a02: ZONE_A02,
  a03: ZONE_A03,
  a04: ZONE_A04,
  a05: ZONE_A05,
  a06: ZONE_A06,
  a07: ZONE_A07,
  a08: ZONE_A08,
  a09: ZONE_A09,
  a10: ZONE_A10,
  a11: ZONE_A11,
  a12: ZONE_A12,
  a13: ZONE_A13,
  challenge: ZONE_CHALLENGE,
};

export const START_ZONE_ID = 'a01';

const END_WALL_W = 0.55;
const END_WALL_H = 3.8;

/** 关卡左右尽头挡墙（防掉落）。 */
export function isZoneEndWall(plat: Rect): boolean {
  return plat.h >= 3.2 && plat.w <= 0.7;
}

function appendZoneEndWalls(rects: Rect[]): Rect[] {
  if (rects.length === 0) {
    return rects;
  }
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  for (const r of rects) {
    minX = Math.min(minX, r.x);
    maxX = Math.max(maxX, r.x + r.w);
    minY = Math.min(minY, r.y);
  }
  return [
    ...rects,
    { x: minX - END_WALL_W, y: minY, w: END_WALL_W, h: END_WALL_H },
    { x: maxX, y: minY, w: END_WALL_W, h: END_WALL_H },
  ];
}

export function zonePlatforms(
  zone: ZoneDef,
  broken: Record<string, boolean> = {},
): Rect[] {
  return appendZoneEndWalls(expandKitCollision(zone.kit, broken));
}

export function zoneBreakableSpecs(zone: ZoneDef): KitPiece[] {
  return listBreakablePieces(zone.kit);
}
