import { WORLD } from '../config';
import { ZONES, zonePlatforms, type ZoneDef } from '../data/zones';
import { createBreakablesFromZone } from './breakables';
import { createDummyFromSpawn } from './enemy-spawn';
import { closeCamp } from './camp';
import type { World } from '../types';
import { sfx } from '../../audio/sfx';
import { clearAttrDraft } from './attributes';

/** 击败该 BOSS 后解锁的下一区 */
export const BOSS_UNLOCKS: Record<string, string> = {
  rotwood: 'a02',
  'rock-warden': 'a03',
  'tide-crab': 'a04',
  'cinder-lizard': 'a05',
  'bog-mother': 'a06',
  frostfang: 'a07',
  'storm-scorpion': 'a08',
  'golem-mage': 'a09',
  'tide-lord': 'a10',
  rockwing: 'a11',
  'rift-warden': 'a12',
};

export type TravelNode = {
  id: string;
  label: string;
  zoneId: string;
  x: number;
  y: number;
  /** 仅当前区显示的区内点 */
  localOnly?: boolean;
};

export function defaultUnlockedZones(): string[] {
  return ['a01'];
}

export function isZoneUnlocked(world: World, zoneId: string): boolean {
  return world.unlockedZones.includes(zoneId);
}

export function unlockZone(world: World, zoneId: string): boolean {
  if (!ZONES[zoneId] || world.unlockedZones.includes(zoneId)) {
    return false;
  }
  world.unlockedZones.push(zoneId);
  return true;
}

export function applyBossUnlock(world: World, bossEnemyId: string): void {
  const next = BOSS_UNLOCKS[bossEnemyId];
  if (!next) {
    return;
  }
  if (unlockZone(world, next)) {
    const zone = ZONES[next];
    world.levelToastT = 2.8;
    world.levelToastText = zone
      ? `解锁区域 · ${zone.name}`
      : `解锁区域 · ${next}`;
  }
}

export function listTravelNodes(world: World): TravelNode[] {
  const nodes: TravelNode[] = [];
  if (isZoneUnlocked(world, 'a01')) {
    nodes.push(
      { id: 'a01-camp', label: '烬营出生点', zoneId: 'a01', x: WORLD.spawnX, y: WORLD.spawnY },
      { id: 'a01-mid', label: '林地中段', zoneId: 'a01', x: 21.2, y: 1.15, localOnly: true },
      { id: 'a01-gate', label: '石门前', zoneId: 'a01', x: 38.6, y: 1.15, localOnly: true },
    );
  }
  if (isZoneUnlocked(world, 'a02')) {
    nodes.push(
      {
        id: 'a02-entry',
        label: '荒石矿坑',
        zoneId: 'a02',
        x: 1.2,
        y: 1.15,
      },
      {
        id: 'a02-mid',
        label: '矿坑中段',
        zoneId: 'a02',
        x: 20.4,
        y: 1.15,
        localOnly: true,
      },
    );
  }
  if (isZoneUnlocked(world, 'a03')) {
    nodes.push(
      {
        id: 'a03-entry',
        label: '潮汐海滩',
        zoneId: 'a03',
        x: 1.3,
        y: 1.15,
      },
      {
        id: 'a03-mid',
        label: '礁石带',
        zoneId: 'a03',
        x: 28.4,
        y: 1.15,
        localOnly: true,
      },
    );
  }
  if (isZoneUnlocked(world, 'a04')) {
    nodes.push(
      {
        id: 'a04-entry',
        label: '焦土丘陵',
        zoneId: 'a04',
        x: 1.2,
        y: 1.15,
      },
      {
        id: 'a04-mid',
        label: '灰烬脊',
        zoneId: 'a04',
        x: 17.0,
        y: 1.15,
        localOnly: true,
      },
    );
  }
  if (isZoneUnlocked(world, 'a05')) {
    nodes.push(
      {
        id: 'a05-entry',
        label: '幽影沼泽',
        zoneId: 'a05',
        x: 1.25,
        y: 1.15,
      },
      {
        id: 'a05-mid',
        label: '泥沼深处',
        zoneId: 'a05',
        x: 17.3,
        y: 1.15,
        localOnly: true,
      },
    );
  }
  if (isZoneUnlocked(world, 'a06')) {
    nodes.push(
      {
        id: 'a06-entry',
        label: '霜风雪原',
        zoneId: 'a06',
        x: 1.2,
        y: 1.15,
      },
      {
        id: 'a06-mid',
        label: '雪脊',
        zoneId: 'a06',
        x: 16.7,
        y: 1.15,
        localOnly: true,
      },
    );
  }
  if (isZoneUnlocked(world, 'a07')) {
    nodes.push(
      {
        id: 'a07-entry',
        label: '赤沙峡谷',
        zoneId: 'a07',
        x: 1.25,
        y: 1.15,
      },
      {
        id: 'a07-mid',
        label: '峡谷中段',
        zoneId: 'a07',
        x: 16.6,
        y: 1.15,
        localOnly: true,
      },
    );
  }
  if (isZoneUnlocked(world, 'a08')) {
    nodes.push(
      {
        id: 'a08-entry',
        label: '坠星废墟',
        zoneId: 'a08',
        x: 1.2,
        y: 1.15,
      },
      {
        id: 'a08-mid',
        label: '庭院',
        zoneId: 'a08',
        x: 16.5,
        y: 1.15,
        localOnly: true,
      },
    );
  }
  if (isZoneUnlocked(world, 'a09')) {
    nodes.push(
      {
        id: 'a09-entry',
        label: '暗潮地窟',
        zoneId: 'a09',
        x: 1.2,
        y: 1.15,
      },
      {
        id: 'a09-mid',
        label: '隧洞深处',
        zoneId: 'a09',
        x: 16.2,
        y: 1.15,
        localOnly: true,
      },
    );
  }
  if (isZoneUnlocked(world, 'a10')) {
    nodes.push(
      {
        id: 'a10-entry',
        label: '龙脊山脉',
        zoneId: 'a10',
        x: 1.2,
        y: 1.15,
      },
      {
        id: 'a10-mid',
        label: '山脊隘口',
        zoneId: 'a10',
        x: 16.1,
        y: 1.15,
        localOnly: true,
      },
    );
  }
  if (isZoneUnlocked(world, 'a11')) {
    nodes.push(
      {
        id: 'a11-entry',
        label: '虚空裂隙',
        zoneId: 'a11',
        x: 1.2,
        y: 1.15,
      },
      {
        id: 'a11-mid',
        label: '裂隙中段',
        zoneId: 'a11',
        x: 15.8,
        y: 1.15,
        localOnly: true,
      },
    );
  }
  if (isZoneUnlocked(world, 'a12')) {
    nodes.push(
      {
        id: 'a12-entry',
        label: '终焉王座',
        zoneId: 'a12',
        x: 1.2,
        y: 1.15,
      },
      {
        id: 'a12-mid',
        label: '王座前厅',
        zoneId: 'a12',
        x: 15.7,
        y: 1.15,
        localOnly: true,
      },
    );
  }
  return nodes.filter((n) => {
    if (n.localOnly && world.zoneId !== n.zoneId) {
      return false;
    }
    return true;
  });
}

/** 切换区域内容（保留玩家成长与背包）。 */
export function enterZone(world: World, zoneId: string, spawnX?: number, spawnY?: number): boolean {
  const zone = ZONES[zoneId];
  if (!zone || !isZoneUnlocked(world, zoneId)) {
    sfx.play('deny');
    return false;
  }
  if (world.challengeActive && zoneId !== 'challenge') {
    world.challengeActive = false;
    world.challengeT = 0;
  }
  populateZone(world, zone, spawnX, spawnY);
  closeCamp(world);
  world.invOpen = false;
  world.charOpen = false;
  world.skillOpen = false;
  world.catalogOpen = false;
  world.specPickOpen = false;
  clearAttrDraft(world);
  sfx.play('jump');
  world.levelToastT = 1.8;
  world.levelToastText = `抵达 · ${zone.name}`;
  return true;
}

export function populateZone(
  world: World,
  zone: ZoneDef,
  spawnX?: number,
  spawnY?: number,
): void {
  world.zoneId = zone.id;
  world.kitTheme = zone.theme;
  world.rivers = zone.rivers.map((r) => ({ ...r }));
  world.banners = zone.banners.map((b) => ({ ...b }));
  world.dummies = zone.spawns.map((spawn, i) =>
    createDummyFromSpawn(
      i + 1,
      spawn.enemyId,
      spawn.x,
      spawn.y,
      spawn.patrolMin,
      spawn.patrolMax,
      { ngPlusLevel: world.ngPlusLevel },
    ),
  );
  world.dummyId = world.dummies.length;
  world.breakables = createBreakablesFromZone(zone.id);
  world.platforms = zonePlatforms(zone, {});
  world.hazards = [];
  world.projectiles = [];
  world.loots = [];
  world.lootFlies = [];
  world.nearbyLootName = null;
  world.nearbySecretId = null;
  world.nearbyCamp = null;
  world.nearbyHubPortal = false;
  world.campMessage = '';

  const x = spawnX ?? zone.spawns[0]?.x ?? WORLD.spawnX;
  const y = spawnY ?? 1.15;
  const p = world.player;
  p.x = x;
  p.y = y;
  p.prevX = x;
  p.prevY = y;
  p.vx = 0;
  p.vy = 0;
  p.iFrame = 0.6;
  if (zone.banners[0]) {
    p.bannerX = zone.banners[0].x;
    p.bannerY = zone.banners[0].y;
  }
}

export function travelToNode(world: World, nodeId: string): string {
  const node = listTravelNodes(world).find((n) => n.id === nodeId);
  if (!node) {
    sfx.play('deny');
    return '尚未解锁';
  }
  if (world.zoneId !== node.zoneId) {
    if (!enterZone(world, node.zoneId, node.x, node.y)) {
      return '无法进入该区域';
    }
    return `已传送至${node.label}`;
  }
  world.player.x = node.x;
  world.player.y = node.y;
  world.player.prevX = node.x;
  world.player.prevY = node.y;
  world.player.vx = 0;
  world.player.vy = 0;
  world.player.iFrame = 0.5;
  closeCamp(world);
  sfx.play('jump');
  return `已传送至${node.label}`;
}
