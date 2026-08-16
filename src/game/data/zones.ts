import type { EnemyDefId } from './enemy-defs';
import {
  expandKitCollision,
  listBreakablePieces,
  type KitPiece,
  type KitThemeId,
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

/** A01 迷雾林地样板关 — 套件 + 刷怪 + 掉落，不改战斗代码。 */
export const ZONE_A01: ZoneDef = {
  id: 'a01',
  name: '迷雾林地',
  levelMin: 1,
  levelMax: 5,
  theme: 'woodland',
  kit: [
    // 营地加宽：容纳传送 / 试炼 / 训练 / 铁匠 / 杂货 / 药水摊
    { id: 'g-camp', kind: 'ground', x: -10, y: 0, w: 22, h: 1 },
    { id: 'g-mid-a', kind: 'ground', x: 14.6, y: 0, w: 7.4, h: 1 },
    { id: 'g-mid-b', kind: 'ground', x: 24.8, y: 0, w: 6.6, h: 1 },
    { id: 'g-end', kind: 'ground', x: 34.8, y: 0, w: 14, h: 1 },
    // 通往宝箱台的斜坡套件（上层窄台已去掉，避免挡在藤墙站立空间上方）
    { id: 'slope-chest', kind: 'slope', x: 19.35, y: 1, w: 2.15, h: 0.32, rise: 1.15 },
    { id: 'ledge-chest', kind: 'ledge', x: 21.2, y: 2.15, w: 2.4, h: 0.38 },
    // 可破坏木箱（挡路 / 藏药）
    {
      id: 'crate-ford',
      kind: 'breakable',
      x: 19.25,
      y: 1,
      w: 0.7,
      h: 0.7,
      rewardDefId: 'woodland-scrap',
      rewardQty: 1,
    },
    {
      id: 'crate-gate',
      kind: 'breakable',
      x: 43.4,
      y: 1,
      w: 0.75,
      h: 0.8,
      rewardDefId: 'life-potion-minor',
      rewardQty: 1,
    },
    // 伪装藤墙：立在台左侧入口，无碰撞，从斜坡上来可直接走进去
    { id: 'false-moss', kind: 'secret-wall', x: 21.25, y: 2.53, w: 0.42, h: 1.35 },
    { id: 'bg-stump', kind: 'backdrop', x: 16.2, y: 1, w: 0.6, h: 0.9 },
    // 第二秘密：中段跳台小龛
    { id: 'ledge-alcove', kind: 'ledge', x: 32.35, y: 2.35, w: 1.6, h: 0.32 },
  ],
  rivers: [{ x: 12.2, y: 0, w: 2.4, h: 1 }],
  banners: [
    { x: 2.35, y: 1 },
    { x: 35.4, y: 1 },
  ],
  spawns: [
    { enemyId: 'rotwolf', x: 17.4, y: 1, patrolMin: 15.2, patrolMax: 21.4 },
    { enemyId: 'mist-spitter', x: 22.6, y: 1, patrolMin: 21.0, patrolMax: 24.8 },
    { enemyId: 'mist-spitter', x: 25.4, y: 1, patrolMin: 24.0, patrolMax: 28.6 },
    { enemyId: 'treant', x: 30.2, y: 1, patrolMin: 28.6, patrolMax: 32.2 },
    { enemyId: 'blight-pod', x: 36.2, y: 1, patrolMin: 34.6, patrolMax: 38.8 },
    { enemyId: 'treant-elite', x: 41.2, y: 1, patrolMin: 39.5, patrolMax: 43.2 },
    { enemyId: 'rotwood', x: 46.2, y: 1, patrolMin: 44.4, patrolMax: 48.4 },
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
      x: 33.05,
      y: 2.67,
      rewardDefId: 'mist-blade',
      rewardQty: 1,
    },
  ],
  bossId: 'rotwood',
};

/** A02 荒石矿坑 — 6–10 级；岩傀儡 / 蝙蝠 / 岩虫 + 岩甲监工。 */
export const ZONE_A02: ZoneDef = {
  id: 'a02',
  name: '荒石矿坑',
  levelMin: 6,
  levelMax: 10,
  theme: 'quarry',
  kit: [
    { id: 'g-entry', kind: 'ground', x: -2, y: 0, w: 12, h: 1 },
    { id: 'g-mid', kind: 'ground', x: 12.5, y: 0, w: 10, h: 1 },
    { id: 'g-deep', kind: 'ground', x: 25, y: 0, w: 8, h: 1 },
    { id: 'g-boss', kind: 'ground', x: 35.5, y: 0, w: 12, h: 1 },
    { id: 'slope-ore', kind: 'slope', x: 16.4, y: 1, w: 1.9, h: 0.3, rise: 1.1 },
    { id: 'ledge-ore', kind: 'ledge', x: 18.2, y: 2.1, w: 2.2, h: 0.35 },
    {
      id: 'crate-shaft',
      kind: 'breakable',
      x: 14.5,
      y: 1,
      w: 0.7,
      h: 0.7,
      rewardDefId: 'quarry-ore',
      rewardQty: 2,
    },
    {
      id: 'crate-arena',
      kind: 'breakable',
      x: 37.2,
      y: 1,
      w: 0.75,
      h: 0.8,
      rewardDefId: 'life-potion-minor',
      rewardQty: 1,
    },
    { id: 'bg-pile', kind: 'backdrop', x: 28.4, y: 1, w: 0.8, h: 1.1 },
    { id: 'ledge-alcove', kind: 'ledge', x: 27.6, y: 2.35, w: 1.6, h: 0.32 },
  ],
  rivers: [],
  banners: [
    { x: 1.5, y: 1 },
    { x: 36.2, y: 1 },
  ],
  spawns: [
    { enemyId: 'mine-golem', x: 8.2, y: 1, patrolMin: 6.4, patrolMax: 10.8 },
    { enemyId: 'cave-bat', x: 15.6, y: 1, patrolMin: 13.2, patrolMax: 18.4 },
    { enemyId: 'blast-bug', x: 21.4, y: 1, patrolMin: 19.6, patrolMax: 23.8 },
    { enemyId: 'cave-bat', x: 24.8, y: 1, patrolMin: 23.2, patrolMax: 27.0 },
    { enemyId: 'mine-golem', x: 28.6, y: 1, patrolMin: 26.4, patrolMax: 31.2 },
    { enemyId: 'mine-golem-elite', x: 33.4, y: 1, patrolMin: 31.6, patrolMax: 35.2 },
    { enemyId: 'rock-warden', x: 42.2, y: 1, patrolMin: 39.8, patrolMax: 45.2 },
  ],
  secrets: [
    {
      id: 'a02-chest-ledge',
      x: 19.15,
      y: 2.45,
      rewardDefId: 'iron-pick-blade',
      rewardQty: 1,
    },
    {
      id: 'a02-chest-alcove',
      x: 28.3,
      y: 2.67,
      rewardDefId: 'relic-ore-sigil',
      rewardQty: 1,
    },
  ],
  bossId: 'rock-warden',
  hubPortal: { x: 0.8, y: 1, promptY: 3.2 },
};

/** A03 潮汐海滩 — 11–15 级；巨蟹 / 亡魂 / 潮沫 + 潮汐巨蟹。 */
export const ZONE_A03: ZoneDef = {
  id: 'a03',
  name: '潮汐海滩',
  levelMin: 11,
  levelMax: 15,
  theme: 'coast',
  kit: [
    { id: 'g-shore', kind: 'ground', x: -2, y: 0, w: 12, h: 1 },
    { id: 'g-mid', kind: 'ground', x: 14.4, y: 0, w: 9.2, h: 1 },
    { id: 'g-reef', kind: 'ground', x: 26.2, y: 0, w: 8.4, h: 1 },
    { id: 'g-boss', kind: 'ground', x: 37, y: 0, w: 13, h: 1 },
    { id: 'slope-dock', kind: 'slope', x: 17.1, y: 1, w: 1.85, h: 0.3, rise: 1.05 },
    { id: 'ledge-dock', kind: 'ledge', x: 18.8, y: 2.05, w: 2.3, h: 0.34 },
    {
      id: 'crate-shore',
      kind: 'breakable',
      x: 9.4,
      y: 1,
      w: 0.7,
      h: 0.7,
      rewardDefId: 'driftwood-scrap',
      rewardQty: 2,
    },
    {
      id: 'crate-reef',
      kind: 'breakable',
      x: 39.2,
      y: 1,
      w: 0.75,
      h: 0.8,
      rewardDefId: 'life-potion-minor',
      rewardQty: 1,
    },
    { id: 'bg-boat', kind: 'backdrop', x: 29.6, y: 1, w: 1.1, h: 0.85 },
    { id: 'ledge-alcove', kind: 'ledge', x: 29.0, y: 2.3, w: 1.6, h: 0.32 },
    // 礁石跳台：中段到潮沫前的第二层节奏
    { id: 'ledge-spray', kind: 'ledge', x: 24.6, y: 1.85, w: 1.35, h: 0.3 },
    {
      id: 'crate-spray',
      kind: 'breakable',
      x: 25.1,
      y: 2.15,
      w: 0.65,
      h: 0.65,
      rewardDefId: 'driftwood-scrap',
      rewardQty: 1,
    },
  ],
  rivers: [
    { x: 10, y: 0, w: 4.4, h: 1 },
    { x: 23.6, y: 0, w: 2.6, h: 1 },
  ],
  banners: [
    { x: 1.6, y: 1 },
    { x: 38.4, y: 1 },
  ],
  spawns: [
    { enemyId: 'sand-crab', x: 7.6, y: 1, patrolMin: 5.2, patrolMax: 10.2 },
    { enemyId: 'tide-spitter', x: 16.8, y: 1, patrolMin: 15.0, patrolMax: 20.4 },
    { enemyId: 'drowned-raider', x: 22.2, y: 1, patrolMin: 20.4, patrolMax: 24.8 },
    { enemyId: 'tide-spitter', x: 26.8, y: 1, patrolMin: 25.2, patrolMax: 29.0 },
    { enemyId: 'sand-crab', x: 30.4, y: 1, patrolMin: 28.0, patrolMax: 33.6 },
    { enemyId: 'reef-crab-elite', x: 35.2, y: 1, patrolMin: 33.4, patrolMax: 37.4 },
    { enemyId: 'tide-crab', x: 44.2, y: 1, patrolMin: 41.2, patrolMax: 47.4 },
  ],
  secrets: [
    {
      id: 'a03-chest-dock',
      x: 19.75,
      y: 2.39,
      rewardDefId: 'coral-blade',
      rewardQty: 1,
    },
    {
      id: 'a03-chest-alcove',
      x: 29.7,
      y: 2.62,
      rewardDefId: 'relic-tide-glass',
      rewardQty: 1,
    },
  ],
  bossId: 'tide-crab',
  hubPortal: { x: 0.9, y: 1, promptY: 3.2 },
};

/** A04 焦土丘陵 — 16–20 级；烬蜥 / 强盗 + 烬火蜥蜴。 */
export const ZONE_A04: ZoneDef = {
  id: 'a04',
  name: '焦土丘陵',
  levelMin: 16,
  levelMax: 20,
  theme: 'ashland',
  kit: [
    { id: 'g-entry', kind: 'ground', x: -2, y: 0, w: 11.5, h: 1 },
    { id: 'g-ridge', kind: 'ground', x: 12.2, y: 0, w: 9.5, h: 1 },
    { id: 'g-ash', kind: 'ground', x: 24.4, y: 0, w: 8.6, h: 1 },
    { id: 'g-boss', kind: 'ground', x: 35.6, y: 0, w: 13.5, h: 1 },
    { id: 'slope-ridge', kind: 'slope', x: 15.6, y: 1, w: 1.9, h: 0.3, rise: 1.1 },
    { id: 'ledge-ridge', kind: 'ledge', x: 17.4, y: 2.1, w: 2.25, h: 0.34 },
    {
      id: 'crate-ridge',
      kind: 'breakable',
      x: 10.2,
      y: 1,
      w: 0.7,
      h: 0.7,
      rewardDefId: 'cinder-shard',
      rewardQty: 2,
    },
    {
      id: 'crate-arena',
      kind: 'breakable',
      x: 38.4,
      y: 1,
      w: 0.75,
      h: 0.8,
      rewardDefId: 'life-potion-minor',
      rewardQty: 1,
    },
    { id: 'bg-rock', kind: 'backdrop', x: 27.8, y: 1, w: 0.9, h: 1.0 },
    { id: 'ledge-alcove', kind: 'ledge', x: 27.2, y: 2.35, w: 1.6, h: 0.32 },
    // 灰脊断坎：中段强制短跳，拉长推进节奏
    { id: 'ledge-ash-step', kind: 'ledge', x: 23.2, y: 1.55, w: 1.2, h: 0.28 },
    {
      id: 'crate-ash-step',
      kind: 'breakable',
      x: 23.55,
      y: 1.85,
      w: 0.6,
      h: 0.6,
      rewardDefId: 'cinder-shard',
      rewardQty: 1,
    },
  ],
  rivers: [{ x: 21.8, y: 0, w: 2.4, h: 1 }],
  banners: [
    { x: 1.5, y: 1 },
    { x: 37.2, y: 1 },
  ],
  spawns: [
    { enemyId: 'ember-lizard', x: 7.4, y: 1, patrolMin: 5.0, patrolMax: 10.0 },
    { enemyId: 'ash-bandit', x: 15.2, y: 1, patrolMin: 13.0, patrolMax: 18.6 },
    { enemyId: 'ash-spitter', x: 21.6, y: 1, patrolMin: 19.4, patrolMax: 21.6 },
    { enemyId: 'ash-bandit', x: 25.4, y: 1, patrolMin: 24.0, patrolMax: 27.6 },
    { enemyId: 'ember-lizard', x: 28.8, y: 1, patrolMin: 26.4, patrolMax: 32.0 },
    { enemyId: 'ember-lizard-elite', x: 34.2, y: 1, patrolMin: 32.4, patrolMax: 36.4 },
    { enemyId: 'cinder-lizard', x: 43.6, y: 1, patrolMin: 40.4, patrolMax: 47.2 },
  ],
  secrets: [
    {
      id: 'a04-chest-ridge',
      x: 18.35,
      y: 2.44,
      rewardDefId: 'ember-fang',
      rewardQty: 1,
    },
    {
      id: 'a04-chest-alcove',
      x: 27.9,
      y: 2.67,
      rewardDefId: 'relic-cinder-mask',
      rewardQty: 1,
    },
  ],
  bossId: 'cinder-lizard',
  hubPortal: { x: 0.85, y: 1, promptY: 3.2 },
};

/** A05 幽影沼泽 — 21–25 级；毒蛙 / 沼鬼 + 沼母。 */
export const ZONE_A05: ZoneDef = {
  id: 'a05',
  name: '幽影沼泽',
  levelMin: 21,
  levelMax: 25,
  theme: 'mire',
  kit: [
    { id: 'g-entry', kind: 'ground', x: -2, y: 0, w: 11, h: 1 },
    { id: 'g-mire', kind: 'ground', x: 12.8, y: 0, w: 9.0, h: 1 },
    { id: 'g-deep', kind: 'ground', x: 24.6, y: 0, w: 8.2, h: 1 },
    { id: 'g-boss', kind: 'ground', x: 35.4, y: 0, w: 13.8, h: 1 },
    { id: 'slope-moss', kind: 'slope', x: 15.2, y: 1, w: 1.85, h: 0.3, rise: 1.05 },
    { id: 'ledge-moss', kind: 'ledge', x: 16.95, y: 2.05, w: 2.2, h: 0.34 },
    {
      id: 'crate-mire',
      kind: 'breakable',
      x: 9.6,
      y: 1,
      w: 0.7,
      h: 0.7,
      rewardDefId: 'mire-moss',
      rewardQty: 2,
    },
    {
      id: 'crate-nest',
      kind: 'breakable',
      x: 38.8,
      y: 1,
      w: 0.75,
      h: 0.8,
      rewardDefId: 'life-potion-minor',
      rewardQty: 1,
    },
    { id: 'bg-reed', kind: 'backdrop', x: 27.2, y: 1, w: 0.7, h: 1.15 },
    { id: 'ledge-alcove', kind: 'ledge', x: 26.8, y: 2.3, w: 1.6, h: 0.32 },
    // 沼心踏脚石：第二道水沟上的短台 + 材料箱
    { id: 'ledge-mire-step', kind: 'ledge', x: 22.6, y: 1.7, w: 1.3, h: 0.28 },
    {
      id: 'crate-mire-step',
      kind: 'breakable',
      x: 22.95,
      y: 2.0,
      w: 0.6,
      h: 0.6,
      rewardDefId: 'mire-moss',
      rewardQty: 1,
    },
  ],
  rivers: [
    { x: 9, y: 0, w: 3.8, h: 1 },
    { x: 21.8, y: 0, w: 2.8, h: 1 },
  ],
  banners: [
    { x: 1.4, y: 1 },
    { x: 37.0, y: 1 },
  ],
  spawns: [
    { enemyId: 'poison-frog', x: 6.8, y: 1, patrolMin: 4.8, patrolMax: 9.2 },
    { enemyId: 'bog-wraith', x: 15.6, y: 1, patrolMin: 13.4, patrolMax: 19.0 },
    { enemyId: 'mire-lurker', x: 20.4, y: 1, patrolMin: 19.2, patrolMax: 21.6 },
    { enemyId: 'bog-wraith', x: 25.6, y: 1, patrolMin: 24.4, patrolMax: 27.8 },
    { enemyId: 'poison-frog', x: 28.4, y: 1, patrolMin: 26.0, patrolMax: 31.6 },
    { enemyId: 'bog-wraith-elite', x: 33.8, y: 1, patrolMin: 32.0, patrolMax: 36.2 },
    { enemyId: 'bog-mother', x: 44.0, y: 1, patrolMin: 40.6, patrolMax: 47.6 },
  ],
  secrets: [
    {
      id: 'a05-chest-moss',
      x: 17.85,
      y: 2.39,
      rewardDefId: 'bog-fang',
      rewardQty: 1,
    },
    {
      id: 'a05-chest-alcove',
      x: 27.5,
      y: 2.62,
      rewardDefId: 'relic-bog-lantern',
      rewardQty: 1,
    },
  ],
  bossId: 'bog-mother',
  hubPortal: { x: 0.9, y: 1, promptY: 3.2 },
};

/** A06 霜风雪原 — 26–30 级；霜狼 / 雪人 + 霜牙巨狼。 */
export const ZONE_A06: ZoneDef = {
  id: 'a06',
  name: '霜风雪原',
  levelMin: 26,
  levelMax: 30,
  theme: 'frost',
  kit: [
    { id: 'g-entry', kind: 'ground', x: -2, y: 0, w: 11.2, h: 1 },
    { id: 'g-drift', kind: 'ground', x: 12.0, y: 0, w: 9.4, h: 1 },
    { id: 'g-ridge', kind: 'ground', x: 24.2, y: 0, w: 8.4, h: 1 },
    { id: 'g-boss', kind: 'ground', x: 35.2, y: 0, w: 14, h: 1 },
    { id: 'slope-snow', kind: 'slope', x: 15.0, y: 1, w: 1.9, h: 0.3, rise: 1.1 },
    { id: 'ledge-snow', kind: 'ledge', x: 16.8, y: 2.1, w: 2.3, h: 0.34 },
    {
      id: 'crate-snow',
      kind: 'breakable',
      x: 9.8,
      y: 1,
      w: 0.7,
      h: 0.7,
      rewardDefId: 'frost-fur',
      rewardQty: 2,
    },
    {
      id: 'crate-den',
      kind: 'breakable',
      x: 38.6,
      y: 1,
      w: 0.75,
      h: 0.8,
      rewardDefId: 'life-potion-minor',
      rewardQty: 1,
    },
    { id: 'bg-pine', kind: 'backdrop', x: 27.6, y: 1, w: 0.75, h: 1.3 },
    { id: 'ledge-alcove', kind: 'ledge', x: 27.0, y: 2.35, w: 1.6, h: 0.32 },
    // 雪脊断坎：中段短跳 + 材料箱
    { id: 'ledge-drift-step', kind: 'ledge', x: 22.4, y: 1.6, w: 1.25, h: 0.28 },
    {
      id: 'crate-drift-step',
      kind: 'breakable',
      x: 22.75,
      y: 1.9,
      w: 0.6,
      h: 0.6,
      rewardDefId: 'frost-fur',
      rewardQty: 1,
    },
  ],
  rivers: [{ x: 21.4, y: 0, w: 2.6, h: 1 }],
  banners: [
    { x: 1.5, y: 1 },
    { x: 37.4, y: 1 },
  ],
  spawns: [
    { enemyId: 'frost-wolf', x: 7.2, y: 1, patrolMin: 5.0, patrolMax: 10.0 },
    { enemyId: 'ice-spitter', x: 15.4, y: 1, patrolMin: 13.0, patrolMax: 19.0 },
    { enemyId: 'snow-brute', x: 20.6, y: 1, patrolMin: 19.2, patrolMax: 21.4 },
    { enemyId: 'ice-spitter', x: 25.4, y: 1, patrolMin: 24.0, patrolMax: 27.4 },
    { enemyId: 'frost-wolf', x: 28.6, y: 1, patrolMin: 26.2, patrolMax: 32.0 },
    { enemyId: 'frost-wolf-elite', x: 34.0, y: 1, patrolMin: 32.2, patrolMax: 36.4 },
    { enemyId: 'frostfang', x: 44.2, y: 1, patrolMin: 40.8, patrolMax: 47.8 },
  ],
  secrets: [
    {
      id: 'a06-chest-snow',
      x: 17.75,
      y: 2.44,
      rewardDefId: 'ice-fang',
      rewardQty: 1,
    },
    {
      id: 'a06-chest-alcove',
      x: 27.7,
      y: 2.67,
      rewardDefId: 'relic-frost-charm',
      rewardQty: 1,
    },
  ],
  bossId: 'frostfang',
  hubPortal: { x: 0.85, y: 1, promptY: 3.2 },
};

/** A07 赤沙峡谷 — 31–35 级；沙蝎 / 沙盗 + 沙暴巨蝎。 */
export const ZONE_A07: ZoneDef = {
  id: 'a07',
  name: '赤沙峡谷',
  levelMin: 31,
  levelMax: 35,
  theme: 'dunes',
  kit: [
    { id: 'g-entry', kind: 'ground', x: -2, y: 0, w: 11.0, h: 1 },
    { id: 'g-dune', kind: 'ground', x: 12.0, y: 0, w: 9.2, h: 1 },
    { id: 'g-canyon', kind: 'ground', x: 24.0, y: 0, w: 8.6, h: 1 },
    { id: 'g-boss', kind: 'ground', x: 35.4, y: 0, w: 13.8, h: 1 },
    { id: 'slope-dune', kind: 'slope', x: 14.8, y: 1, w: 1.9, h: 0.3, rise: 1.1 },
    { id: 'ledge-dune', kind: 'ledge', x: 16.6, y: 2.1, w: 2.25, h: 0.34 },
    {
      id: 'crate-dune',
      kind: 'breakable',
      x: 9.4,
      y: 1,
      w: 0.7,
      h: 0.7,
      rewardDefId: 'dune-chitin',
      rewardQty: 2,
    },
    {
      id: 'crate-nest',
      kind: 'breakable',
      x: 38.8,
      y: 1,
      w: 0.75,
      h: 0.8,
      rewardDefId: 'life-potion-minor',
      rewardQty: 1,
    },
    { id: 'bg-rock', kind: 'backdrop', x: 28.0, y: 1, w: 0.9, h: 1.2 },
    { id: 'ledge-alcove', kind: 'ledge', x: 27.4, y: 2.35, w: 1.6, h: 0.32 },
    // 沙脊断坎：中段短跳 + 甲壳箱
    { id: 'ledge-canyon-step', kind: 'ledge', x: 22.2, y: 1.55, w: 1.25, h: 0.28 },
    {
      id: 'crate-canyon-step',
      kind: 'breakable',
      x: 22.55,
      y: 1.85,
      w: 0.6,
      h: 0.6,
      rewardDefId: 'dune-chitin',
      rewardQty: 1,
    },
  ],
  rivers: [{ x: 21.2, y: 0, w: 2.6, h: 1 }],
  banners: [
    { x: 1.5, y: 1 },
    { x: 37.2, y: 1 },
  ],
  spawns: [
    { enemyId: 'sand-scorpion', x: 7.0, y: 1, patrolMin: 4.8, patrolMax: 9.8 },
    { enemyId: 'dune-raider', x: 15.2, y: 1, patrolMin: 12.8, patrolMax: 18.8 },
    { enemyId: 'sand-spitter', x: 20.6, y: 1, patrolMin: 19.4, patrolMax: 21.2 },
    { enemyId: 'dune-raider', x: 25.2, y: 1, patrolMin: 23.8, patrolMax: 27.4 },
    { enemyId: 'sand-scorpion', x: 28.8, y: 1, patrolMin: 26.4, patrolMax: 32.2 },
    { enemyId: 'sand-scorpion-elite', x: 34.2, y: 1, patrolMin: 32.4, patrolMax: 36.6 },
    { enemyId: 'storm-scorpion', x: 44.0, y: 1, patrolMin: 40.6, patrolMax: 47.6 },
  ],
  secrets: [
    {
      id: 'a07-chest-dune',
      x: 17.55,
      y: 2.44,
      rewardDefId: 'scorpion-stinger',
      rewardQty: 1,
    },
    {
      id: 'a07-chest-alcove',
      x: 28.1,
      y: 2.67,
      rewardDefId: 'relic-dune-scarab',
      rewardQty: 1,
    },
  ],
  bossId: 'storm-scorpion',
  hubPortal: { x: 0.9, y: 1, promptY: 3.2 },
};

/** A08 坠星废墟 — 36–40 级；石像 / 奥术残影 + 石像魔。 */
export const ZONE_A08: ZoneDef = {
  id: 'a08',
  name: '坠星废墟',
  levelMin: 36,
  levelMax: 40,
  theme: 'ruins',
  kit: [
    { id: 'g-entry', kind: 'ground', x: -2, y: 0, w: 11.0, h: 1 },
    { id: 'g-court', kind: 'ground', x: 11.8, y: 0, w: 9.4, h: 1 },
    { id: 'g-hall', kind: 'ground', x: 24.0, y: 0, w: 8.4, h: 1 },
    { id: 'g-boss', kind: 'ground', x: 35.2, y: 0, w: 14.0, h: 1 },
    { id: 'slope-ruin', kind: 'slope', x: 14.6, y: 1, w: 1.9, h: 0.3, rise: 1.1 },
    { id: 'ledge-ruin', kind: 'ledge', x: 16.4, y: 2.1, w: 2.3, h: 0.34 },
    {
      id: 'crate-ruin',
      kind: 'breakable',
      x: 9.2,
      y: 1,
      w: 0.7,
      h: 0.7,
      rewardDefId: 'star-shard',
      rewardQty: 2,
    },
    {
      id: 'crate-altar',
      kind: 'breakable',
      x: 39.0,
      y: 1,
      w: 0.75,
      h: 0.8,
      rewardDefId: 'life-potion-minor',
      rewardQty: 1,
    },
    { id: 'bg-pillar', kind: 'backdrop', x: 28.2, y: 1, w: 0.55, h: 1.6 },
    { id: 'ledge-alcove', kind: 'ledge', x: 27.6, y: 2.35, w: 1.6, h: 0.32 },
    // 废墟断梁：中段短跳 + 星屑箱
    { id: 'ledge-hall-step', kind: 'ledge', x: 22.2, y: 1.6, w: 1.25, h: 0.28 },
    {
      id: 'crate-hall-step',
      kind: 'breakable',
      x: 22.55,
      y: 1.9,
      w: 0.6,
      h: 0.6,
      rewardDefId: 'star-shard',
      rewardQty: 1,
    },
  ],
  rivers: [{ x: 21.2, y: 0, w: 2.6, h: 1 }],
  banners: [
    { x: 1.5, y: 1 },
    { x: 37.4, y: 1 },
  ],
  spawns: [
    { enemyId: 'stone-idol', x: 6.8, y: 1, patrolMin: 4.6, patrolMax: 9.6 },
    { enemyId: 'arcane-wisp', x: 15.0, y: 1, patrolMin: 12.6, patrolMax: 18.8 },
    { enemyId: 'ruin-watcher', x: 20.4, y: 1, patrolMin: 19.2, patrolMax: 21.2 },
    { enemyId: 'arcane-wisp', x: 25.2, y: 1, patrolMin: 23.8, patrolMax: 27.2 },
    { enemyId: 'stone-idol', x: 28.4, y: 1, patrolMin: 26.0, patrolMax: 31.8 },
    { enemyId: 'stone-idol-elite', x: 34.0, y: 1, patrolMin: 32.2, patrolMax: 36.4 },
    { enemyId: 'golem-mage', x: 44.2, y: 1, patrolMin: 40.8, patrolMax: 47.8 },
  ],
  secrets: [
    {
      id: 'a08-chest-ruin',
      x: 17.35,
      y: 2.44,
      rewardDefId: 'ruin-blade',
      rewardQty: 1,
    },
    {
      id: 'a08-chest-alcove',
      x: 28.3,
      y: 2.67,
      rewardDefId: 'relic-ruin-glyph',
      rewardQty: 1,
    },
  ],
  bossId: 'golem-mage',
  hubPortal: { x: 0.85, y: 1, promptY: 3.2 },
};

/** A09 暗潮地窟 — 41–45 级；教徒 / 触手 + 暗潮领主。 */
export const ZONE_A09: ZoneDef = {
  id: 'a09',
  name: '暗潮地窟',
  levelMin: 41,
  levelMax: 45,
  theme: 'abyss',
  kit: [
    { id: 'g-entry', kind: 'ground', x: -2, y: 0, w: 10.8, h: 1 },
    { id: 'g-tunnel', kind: 'ground', x: 11.6, y: 0, w: 9.2, h: 1 },
    { id: 'g-pool', kind: 'ground', x: 23.6, y: 0, w: 8.4, h: 1 },
    { id: 'g-boss', kind: 'ground', x: 34.8, y: 0, w: 14.2, h: 1 },
    { id: 'slope-abyss', kind: 'slope', x: 14.4, y: 1, w: 1.9, h: 0.3, rise: 1.1 },
    { id: 'ledge-abyss', kind: 'ledge', x: 16.2, y: 2.1, w: 2.25, h: 0.34 },
    // 触手平台：固定高台，战斗中也当落脚点
    { id: 'ledge-tent-a', kind: 'ledge', x: 38.2, y: 2.4, w: 1.8, h: 0.32 },
    { id: 'ledge-tent-b', kind: 'ledge', x: 42.0, y: 3.1, w: 1.6, h: 0.32 },
    {
      id: 'crate-abyss',
      kind: 'breakable',
      x: 9.0,
      y: 1,
      w: 0.7,
      h: 0.7,
      rewardDefId: 'abyss-ink',
      rewardQty: 2,
    },
    {
      id: 'crate-altar',
      kind: 'breakable',
      x: 39.4,
      y: 1,
      w: 0.75,
      h: 0.8,
      rewardDefId: 'life-potion-minor',
      rewardQty: 1,
    },
    { id: 'bg-idol', kind: 'backdrop', x: 27.8, y: 1, w: 0.7, h: 1.4 },
    // 潮沟踏脚：第二道暗潮上的短台 + 墨水箱
    { id: 'ledge-pool-step', kind: 'ledge', x: 21.6, y: 1.7, w: 1.3, h: 0.28 },
    {
      id: 'crate-pool-step',
      kind: 'breakable',
      x: 21.95,
      y: 2.0,
      w: 0.6,
      h: 0.6,
      rewardDefId: 'abyss-ink',
      rewardQty: 1,
    },
  ],
  rivers: [
    { x: 8.8, y: 0, w: 2.8, h: 1 },
    { x: 20.8, y: 0, w: 2.8, h: 1 },
  ],
  banners: [
    { x: 1.4, y: 1 },
    { x: 36.8, y: 1 },
  ],
  spawns: [
    { enemyId: 'tide-cultist', x: 6.6, y: 1, patrolMin: 4.4, patrolMax: 9.2 },
    { enemyId: 'abyss-spitter', x: 14.8, y: 1, patrolMin: 12.4, patrolMax: 18.4 },
    { enemyId: 'tentacle-spawn', x: 20.2, y: 1, patrolMin: 19.0, patrolMax: 20.8 },
    { enemyId: 'abyss-spitter', x: 25.0, y: 1, patrolMin: 23.4, patrolMax: 27.2 },
    { enemyId: 'tide-cultist', x: 28.2, y: 1, patrolMin: 25.8, patrolMax: 31.6 },
    { enemyId: 'tide-cultist-elite', x: 33.6, y: 1, patrolMin: 31.8, patrolMax: 36.0 },
    { enemyId: 'tide-lord', x: 44.4, y: 1, patrolMin: 40.6, patrolMax: 48.0 },
  ],
  secrets: [
    {
      id: 'a09-chest-ledge',
      x: 17.15,
      y: 2.44,
      rewardDefId: 'cult-dagger',
      rewardQty: 1,
    },
    {
      id: 'a09-chest-high',
      x: 42.7,
      y: 3.42,
      rewardDefId: 'relic-abyss-mask',
      rewardQty: 1,
    },
  ],
  bossId: 'tide-lord',
  hubPortal: { x: 0.9, y: 1, promptY: 3.2 },
};

/** A10 龙脊山脉 — 46–50 级；翼龙 / 山地巨人 + 岩翼幼龙。 */
export const ZONE_A10: ZoneDef = {
  id: 'a10',
  name: '龙脊山脉',
  levelMin: 46,
  levelMax: 50,
  theme: 'ridge',
  kit: [
    { id: 'g-entry', kind: 'ground', x: -2, y: 0, w: 10.6, h: 1 },
    { id: 'g-ridge', kind: 'ground', x: 11.4, y: 0, w: 9.4, h: 1 },
    { id: 'g-pass', kind: 'ground', x: 23.6, y: 0, w: 8.2, h: 1 },
    { id: 'g-boss', kind: 'ground', x: 34.6, y: 0, w: 14.4, h: 1 },
    { id: 'slope-ridge', kind: 'slope', x: 14.2, y: 1, w: 2.0, h: 0.3, rise: 1.2 },
    { id: 'ledge-ridge', kind: 'ledge', x: 16.1, y: 2.2, w: 2.35, h: 0.34 },
    // 飞扑躲避台：高台可躲龙息扫射
    { id: 'ledge-dive-a', kind: 'ledge', x: 38.0, y: 2.5, w: 1.7, h: 0.32 },
    { id: 'ledge-dive-b', kind: 'ledge', x: 42.4, y: 3.2, w: 1.55, h: 0.32 },
    {
      id: 'crate-ridge',
      kind: 'breakable',
      x: 8.8,
      y: 1,
      w: 0.7,
      h: 0.7,
      rewardDefId: 'ridge-scale',
      rewardQty: 2,
    },
    {
      id: 'crate-altar',
      kind: 'breakable',
      x: 39.2,
      y: 1,
      w: 0.75,
      h: 0.8,
      rewardDefId: 'life-potion-minor',
      rewardQty: 1,
    },
    { id: 'bg-peak', kind: 'backdrop', x: 27.4, y: 1, w: 0.8, h: 1.8 },
    // 山隘断坎：中段短跳 + 鳞片箱
    { id: 'ledge-pass-step', kind: 'ledge', x: 21.8, y: 1.6, w: 1.25, h: 0.28 },
    {
      id: 'crate-pass-step',
      kind: 'breakable',
      x: 22.15,
      y: 1.9,
      w: 0.6,
      h: 0.6,
      rewardDefId: 'ridge-scale',
      rewardQty: 1,
    },
  ],
  rivers: [{ x: 20.8, y: 0, w: 2.6, h: 1 }],
  banners: [
    { x: 1.4, y: 1 },
    { x: 36.6, y: 1 },
  ],
  spawns: [
    { enemyId: 'ridge-wyvern', x: 6.4, y: 1, patrolMin: 4.2, patrolMax: 9.0 },
    { enemyId: 'ridge-spitter', x: 14.6, y: 1, patrolMin: 12.2, patrolMax: 18.2 },
    { enemyId: 'mountain-giant', x: 20.0, y: 1, patrolMin: 18.8, patrolMax: 20.8 },
    { enemyId: 'ridge-spitter', x: 24.8, y: 1, patrolMin: 23.4, patrolMax: 26.8 },
    { enemyId: 'ridge-wyvern', x: 28.0, y: 1, patrolMin: 25.6, patrolMax: 31.4 },
    { enemyId: 'mountain-giant-elite', x: 33.4, y: 1, patrolMin: 31.6, patrolMax: 35.8 },
    { enemyId: 'rockwing', x: 44.2, y: 1, patrolMin: 40.4, patrolMax: 48.0 },
  ],
  secrets: [
    {
      id: 'a10-chest-ledge',
      x: 17.1,
      y: 2.54,
      rewardDefId: 'wing-blade',
      rewardQty: 1,
    },
    {
      id: 'a10-chest-high',
      x: 43.05,
      y: 3.52,
      rewardDefId: 'relic-wyrm-crest',
      rewardQty: 1,
    },
  ],
  bossId: 'rockwing',
  hubPortal: { x: 0.9, y: 1, promptY: 3.2 },
};

/** A11 虚空裂隙 — 51–55 级；虚空行者 / 裂片 + 裂隙看守。 */
export const ZONE_A11: ZoneDef = {
  id: 'a11',
  name: '虚空裂隙',
  levelMin: 51,
  levelMax: 55,
  theme: 'void',
  kit: [
    { id: 'g-entry', kind: 'ground', x: -2, y: 0, w: 10.4, h: 1 },
    { id: 'g-rift', kind: 'ground', x: 11.2, y: 0, w: 9.2, h: 1 },
    { id: 'g-span', kind: 'ground', x: 23.2, y: 0, w: 8.4, h: 1 },
    { id: 'g-boss', kind: 'ground', x: 34.4, y: 0, w: 14.6, h: 1 },
    { id: 'slope-void', kind: 'slope', x: 14.0, y: 1, w: 2.0, h: 0.3, rise: 1.15 },
    { id: 'ledge-void', kind: 'ledge', x: 15.9, y: 2.15, w: 2.3, h: 0.34 },
    // 黑洞躲避台：拉扯期间可站高台减伤面
    { id: 'ledge-hole-a', kind: 'ledge', x: 37.8, y: 2.45, w: 1.75, h: 0.32 },
    { id: 'ledge-hole-b', kind: 'ledge', x: 42.2, y: 3.15, w: 1.6, h: 0.32 },
    {
      id: 'crate-void',
      kind: 'breakable',
      x: 8.6,
      y: 1,
      w: 0.7,
      h: 0.7,
      rewardDefId: 'void-dust',
      rewardQty: 2,
    },
    {
      id: 'crate-altar',
      kind: 'breakable',
      x: 39.0,
      y: 1,
      w: 0.75,
      h: 0.8,
      rewardDefId: 'life-potion-minor',
      rewardQty: 1,
    },
    { id: 'bg-rift', kind: 'backdrop', x: 27.2, y: 1, w: 0.65, h: 1.7 },
    // 裂隙踏脚：第二道虚空沟上的短台 + 尘埃箱
    { id: 'ledge-span-step', kind: 'ledge', x: 21.4, y: 1.7, w: 1.3, h: 0.28 },
    {
      id: 'crate-span-step',
      kind: 'breakable',
      x: 21.75,
      y: 2.0,
      w: 0.6,
      h: 0.6,
      rewardDefId: 'void-dust',
      rewardQty: 1,
    },
  ],
  rivers: [
    { x: 9.0, y: 0, w: 2.2, h: 1 },
    { x: 20.6, y: 0, w: 2.4, h: 1 },
  ],
  banners: [
    { x: 1.35, y: 1 },
    { x: 36.4, y: 1 },
  ],
  spawns: [
    { enemyId: 'void-walker', x: 6.2, y: 1, patrolMin: 4.0, patrolMax: 8.8 },
    { enemyId: 'void-spitter', x: 14.4, y: 1, patrolMin: 12.0, patrolMax: 18.0 },
    { enemyId: 'rift-shard', x: 20.0, y: 1, patrolMin: 18.6, patrolMax: 20.6 },
    { enemyId: 'void-spitter', x: 24.6, y: 1, patrolMin: 23.0, patrolMax: 26.6 },
    { enemyId: 'void-walker', x: 27.8, y: 1, patrolMin: 25.4, patrolMax: 31.2 },
    { enemyId: 'void-walker-elite', x: 33.2, y: 1, patrolMin: 31.4, patrolMax: 35.6 },
    { enemyId: 'rift-warden', x: 44.0, y: 1, patrolMin: 40.2, patrolMax: 48.0 },
  ],
  secrets: [
    {
      id: 'a11-chest-ledge',
      x: 16.95,
      y: 2.5,
      rewardDefId: 'rift-blade',
      rewardQty: 1,
    },
    {
      id: 'a11-chest-high',
      x: 42.9,
      y: 3.47,
      rewardDefId: 'relic-void-prism',
      rewardQty: 1,
    },
  ],
  bossId: 'rift-warden',
  hubPortal: { x: 0.9, y: 1, promptY: 3.2 },
};

/** A12 终焉王座 — 56–60 级；禁卫 / 怨灵 + 终焉君王（三阶段）。 */
export const ZONE_A12: ZoneDef = {
  id: 'a12',
  name: '终焉王座',
  levelMin: 56,
  levelMax: 60,
  theme: 'throne',
  kit: [
    { id: 'g-entry', kind: 'ground', x: -2, y: 0, w: 10.2, h: 1 },
    { id: 'g-hall', kind: 'ground', x: 11.0, y: 0, w: 9.4, h: 1 },
    { id: 'g-court', kind: 'ground', x: 23.2, y: 0, w: 8.2, h: 1 },
    { id: 'g-boss', kind: 'ground', x: 34.2, y: 0, w: 15.0, h: 1 },
    { id: 'slope-throne', kind: 'slope', x: 13.8, y: 1, w: 2.1, h: 0.3, rise: 1.2 },
    { id: 'ledge-throne', kind: 'ledge', x: 15.8, y: 2.2, w: 2.4, h: 0.34 },
    // 全屏裁决躲避台：安全缝不足时翻上高台
    { id: 'ledge-safe-a', kind: 'ledge', x: 37.6, y: 2.5, w: 1.8, h: 0.32 },
    { id: 'ledge-safe-b', kind: 'ledge', x: 42.0, y: 3.25, w: 1.65, h: 0.32 },
    {
      id: 'crate-throne',
      kind: 'breakable',
      x: 8.4,
      y: 1,
      w: 0.7,
      h: 0.7,
      rewardDefId: 'throne-sigil',
      rewardQty: 2,
    },
    {
      id: 'crate-altar',
      kind: 'breakable',
      x: 39.4,
      y: 1,
      w: 0.75,
      h: 0.8,
      rewardDefId: 'life-potion-minor',
      rewardQty: 1,
    },
    { id: 'bg-throne', kind: 'backdrop', x: 27.0, y: 1, w: 0.9, h: 2.0 },
    // 王座前庭断坎：中段短跳 + 徽记箱
    { id: 'ledge-court-step', kind: 'ledge', x: 21.4, y: 1.65, w: 1.3, h: 0.28 },
    {
      id: 'crate-court-step',
      kind: 'breakable',
      x: 21.75,
      y: 1.95,
      w: 0.6,
      h: 0.6,
      rewardDefId: 'throne-sigil',
      rewardQty: 1,
    },
  ],
  rivers: [{ x: 20.4, y: 0, w: 2.6, h: 1 }],
  banners: [
    { x: 1.3, y: 1 },
    { x: 36.2, y: 1 },
  ],
  spawns: [
    { enemyId: 'throne-guard', x: 6.0, y: 1, patrolMin: 3.8, patrolMax: 8.6 },
    { enemyId: 'throne-spitter', x: 14.2, y: 1, patrolMin: 11.8, patrolMax: 17.8 },
    { enemyId: 'wraith', x: 19.8, y: 1, patrolMin: 18.4, patrolMax: 20.4 },
    { enemyId: 'throne-spitter', x: 24.6, y: 1, patrolMin: 23.0, patrolMax: 26.6 },
    { enemyId: 'throne-guard', x: 27.6, y: 1, patrolMin: 25.2, patrolMax: 31.0 },
    { enemyId: 'throne-guard-elite', x: 33.0, y: 1, patrolMin: 31.2, patrolMax: 35.4 },
    { enemyId: 'end-king', x: 44.4, y: 1, patrolMin: 40.0, patrolMax: 48.2 },
  ],
  secrets: [
    {
      id: 'a12-chest-ledge',
      x: 16.9,
      y: 2.54,
      rewardDefId: 'guard-blade',
      rewardQty: 1,
    },
    {
      id: 'a12-chest-high',
      x: 42.7,
      y: 3.57,
      rewardDefId: 'relic-throne-seal',
      rewardQty: 1,
    },
  ],
  bossId: 'end-king',
  hubPortal: { x: 0.9, y: 1, promptY: 3.2 },
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
