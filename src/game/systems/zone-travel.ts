import { WORLD, alignLegacyY } from '../config';
import { START_ZONE_ID, ZONES, zonePlatforms, type ZoneDef } from '../data/zones';
import { ENEMY_DEFS } from '../data/enemy-defs';
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
  'end-king': 'a13',
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

export type WorldMapNode = {
  zoneId: string;
  name: string;
  levelMin: number;
  levelMax: number;
  unlocked: boolean;
  bossCleared: boolean;
  current: boolean;
  /** 已解锁时可传送的入口节点 id */
  travelId: string | null;
  lockHint: string;
};

/** 世界地图区域顺序（不含试炼） */
export const WORLD_MAP_ZONE_IDS = [
  'a01',
  'a02',
  'a03',
  'a04',
  'a05',
  'a06',
  'a07',
  'a08',
  'a09',
  'a10',
  'a11',
  'a12',
  'a13',
] as const;

const ZONE_ENTRY_TRAVEL: Record<string, string> = {
  a01: 'a01-camp',
  a02: 'a02-entry',
  a03: 'a03-entry',
  a04: 'a04-entry',
  a05: 'a05-entry',
  a06: 'a06-entry',
  a07: 'a07-entry',
  a08: 'a08-entry',
  a09: 'a09-entry',
  a10: 'a10-entry',
  a11: 'a11-entry',
  a12: 'a12-entry',
  a13: 'a13-entry',
};

/** 击败该区 BOSS 后解锁的「门前」落点（约在禁锢门一侧，可从营地直达刷 BOSS） */
const ZONE_BOSS_FRONT: Record<
  string,
  { travelId: string; bossId: string; x: number; y: number }
> = {
  a01: { travelId: 'a01-gate', bossId: 'rotwood', x: 71.2, y: WORLD.spawnY },
  a02: { travelId: 'a02-boss', bossId: 'rock-warden', x: 78.8, y: WORLD.spawnY },
  a03: { travelId: 'a03-boss', bossId: 'tide-crab', x: 78.8, y: WORLD.spawnY },
  a04: { travelId: 'a04-boss', bossId: 'cinder-lizard', x: 78.8, y: WORLD.spawnY },
  a05: { travelId: 'a05-boss', bossId: 'bog-mother', x: 78.8, y: WORLD.spawnY },
  a06: { travelId: 'a06-boss', bossId: 'frostfang', x: 78.8, y: WORLD.spawnY },
  a07: { travelId: 'a07-boss', bossId: 'storm-scorpion', x: 78.8, y: WORLD.spawnY },
  a08: { travelId: 'a08-boss', bossId: 'golem-mage', x: 78.8, y: WORLD.spawnY },
  a09: { travelId: 'a09-boss', bossId: 'tide-lord', x: 78.8, y: WORLD.spawnY },
  a10: { travelId: 'a10-boss', bossId: 'rockwing', x: 78.8, y: WORLD.spawnY },
  a11: { travelId: 'a11-boss', bossId: 'rift-warden', x: 78.8, y: WORLD.spawnY },
  a12: { travelId: 'a12-boss', bossId: 'end-king', x: 78.8, y: WORLD.spawnY },
  a13: { travelId: 'a13-boss', bossId: 'ember-tyrant', x: 78.8, y: WORLD.spawnY },
};

export function isBossFrontUnlocked(world: World, zoneId: string): boolean {
  const front = ZONE_BOSS_FRONT[zoneId];
  return Boolean(front && world.bossKills[front.bossId]);
}

export function bossFrontTravelId(zoneId: string): string | null {
  return ZONE_BOSS_FRONT[zoneId]?.travelId ?? null;
}

/** 解锁该区所需击败的 BOSS enemyId */
const ZONE_REQUIRE_BOSS: Record<string, string> = {
  a02: 'rotwood',
  a03: 'rock-warden',
  a04: 'tide-crab',
  a05: 'cinder-lizard',
  a06: 'bog-mother',
  a07: 'frostfang',
  a08: 'storm-scorpion',
  a09: 'golem-mage',
  a10: 'tide-lord',
  a11: 'rockwing',
  a12: 'rift-warden',
  a13: 'end-king',
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

/** 若本击杀解锁了门前传送且 toast 未被「解锁下一区」覆盖，则提示门前。 */
export function noteBossFrontUnlockToast(world: World, bossEnemyId: string): void {
  const zoneId = WORLD_MAP_ZONE_IDS.find(
    (id) => ZONE_BOSS_FRONT[id]?.bossId === bossEnemyId,
  );
  if (!zoneId || !isBossFrontUnlocked(world, zoneId)) {
    return;
  }
  if (world.levelToastText.includes('解锁区域') || bossEnemyId === 'end-king') {
    return;
  }
  world.levelToastT = Math.max(world.levelToastT, 2.6);
  if (world.levelToastText.startsWith('击败')) {
    world.levelToastText = `${world.levelToastText} · 门前传送已开`;
    return;
  }
  const zone = ZONES[zoneId];
  world.levelToastText = `解锁 ${(zone?.name ?? zoneId)} 门前传送`;
}

/** 全 12 区节点图：解锁 / BOSS / 当前区状态。 */
export function listWorldMapNodes(world: World): WorldMapNode[] {
  return WORLD_MAP_ZONE_IDS.map((zoneId) => {
    const zone = ZONES[zoneId]!;
    const unlocked = isZoneUnlocked(world, zoneId);
    const bossId = zone.bossId;
    const bossCleared = Boolean(bossId && world.bossKills[bossId]);
    const reqBoss = ZONE_REQUIRE_BOSS[zoneId];
    const reqName = reqBoss ? ENEMY_DEFS[reqBoss as keyof typeof ENEMY_DEFS]?.name : null;
    return {
      zoneId,
      name: zone.name,
      levelMin: zone.levelMin,
      levelMax: zone.levelMax,
      unlocked,
      bossCleared,
      current: world.zoneId === zoneId,
      travelId: unlocked ? (ZONE_ENTRY_TRAVEL[zoneId] ?? null) : null,
      lockHint: unlocked
        ? bossCleared
          ? 'BOSS 已击败 · 可传门前'
          : '已解锁'
        : reqName
          ? `击败 ${reqName}`
          : '尚未解锁',
    };
  });
}

export function listTravelNodes(world: World): TravelNode[] {
  const nodes: TravelNode[] = [];
  if (isZoneUnlocked(world, 'a01')) {
    nodes.push(
      { id: 'a01-camp', label: '烬营出生点', zoneId: 'a01', x: WORLD.spawnX, y: WORLD.spawnY },
      { id: 'a01-mid', label: '林地中段', zoneId: 'a01', x: 34.0, y: WORLD.spawnY, localOnly: true },
    );
  }
  if (isZoneUnlocked(world, 'a02')) {
    nodes.push(
      {
        id: 'a02-entry',
        label: '荒石矿坑',
        zoneId: 'a02',
        x: 1.2,
        y: WORLD.spawnY,
      },
      {
        id: 'a02-mid',
        label: '矿坑中段',
        zoneId: 'a02',
        x: 42.4,
        y: WORLD.spawnY,
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
        y: WORLD.spawnY,
      },
      {
        id: 'a03-mid',
        label: '礁石带',
        zoneId: 'a03',
        x: 42.4,
        y: WORLD.spawnY,
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
        y: WORLD.spawnY,
      },
      {
        id: 'a04-mid',
        label: '灰烬脊',
        zoneId: 'a04',
        x: 42.4,
        y: WORLD.spawnY,
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
        y: WORLD.spawnY,
      },
      {
        id: 'a05-mid',
        label: '泥沼深处',
        zoneId: 'a05',
        x: 42.4,
        y: WORLD.spawnY,
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
        y: WORLD.spawnY,
      },
      {
        id: 'a06-mid',
        label: '雪脊',
        zoneId: 'a06',
        x: 42.4,
        y: WORLD.spawnY,
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
        y: WORLD.spawnY,
      },
      {
        id: 'a07-mid',
        label: '峡谷中段',
        zoneId: 'a07',
        x: 42.4,
        y: WORLD.spawnY,
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
        y: WORLD.spawnY,
      },
      {
        id: 'a08-mid',
        label: '庭院',
        zoneId: 'a08',
        x: 42.4,
        y: WORLD.spawnY,
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
        y: WORLD.spawnY,
      },
      {
        id: 'a09-mid',
        label: '隧洞深处',
        zoneId: 'a09',
        x: 42.4,
        y: WORLD.spawnY,
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
        y: WORLD.spawnY,
      },
      {
        id: 'a10-mid',
        label: '山脊隘口',
        zoneId: 'a10',
        x: 42.4,
        y: WORLD.spawnY,
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
        y: WORLD.spawnY,
      },
      {
        id: 'a11-mid',
        label: '裂隙中段',
        zoneId: 'a11',
        x: 42.4,
        y: WORLD.spawnY,
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
        y: WORLD.spawnY,
      },
      {
        id: 'a12-mid',
        label: '王座前厅',
        zoneId: 'a12',
        x: 42.4,
        y: WORLD.spawnY,
        localOnly: true,
      },
    );
  }
  if (isZoneUnlocked(world, 'a13')) {
    nodes.push(
      {
        id: 'a13-entry',
        label: '余烬祭坛',
        zoneId: 'a13',
        x: 1.2,
        y: WORLD.spawnY,
      },
      {
        id: 'a13-mid',
        label: '祭坛前庭',
        zoneId: 'a13',
        x: 42.4,
        y: WORLD.spawnY,
        localOnly: true,
      },
    );
  }
  for (const zoneId of WORLD_MAP_ZONE_IDS) {
    if (!isZoneUnlocked(world, zoneId) || !isBossFrontUnlocked(world, zoneId)) {
      continue;
    }
    const front = ZONE_BOSS_FRONT[zoneId]!;
    const zone = ZONES[zoneId];
    nodes.push({
      id: front.travelId,
      label: zone ? `${zone.name} · 门前` : 'BOSS 门前',
      zoneId,
      x: front.x,
      y: front.y,
    });
  }
  return nodes.filter((n) => {
    if (n.localOnly && world.zoneId !== n.zoneId) {
      return false;
    }
    return true;
  });
}

/** 切换区域内容（保留玩家成长与背包）。 */
export function enterZone(
  world: World,
  zoneId: string,
  spawnX?: number,
  spawnY?: number,
  opts?: { keepToast?: boolean },
): boolean {
  const zone = ZONES[zoneId];
  if (!zone || !isZoneUnlocked(world, zoneId)) {
    sfx.play('deny');
    return false;
  }
  const abandonedChallenge = world.challengeActive && zoneId !== 'challenge';
  if (abandonedChallenge) {
    world.challengeActive = false;
    world.challengeT = 0;
    world.challengeFloor = 0;
    world.challengeRunAffixes = [];
  }
  populateZone(world, zone, spawnX, spawnY);
  closeCamp(world);
  world.invOpen = false;
  world.charOpen = false;
  world.skillOpen = false;
  world.catalogOpen = false;
  world.levelUpOpen = false;
  world.specPickOpen = false;
  clearAttrDraft(world);
  sfx.play('jump');
  if (opts?.keepToast) {
    // 保留调用方已写好的结果提示（如试炼成功/失败）
  } else if (abandonedChallenge) {
    world.levelToastT = 2.2;
    world.levelToastText = '已放弃词缀试炼';
    world.zoneAnnounceT = 0;
  } else if (zoneId === START_ZONE_ID && world.offerNgPlusHint) {
    world.levelToastT = 2.8;
    world.levelToastText = '通关奖励 · 打开传送阵可开启 NG+';
    world.zoneAnnounceT = 0;
  } else {
    world.zoneAnnounceT = 3.4;
    world.zoneAnnounceName = zone.name;
    world.zoneAnnounceSub = `推荐等级 ${zone.levelMin}–${zone.levelMax}`;
    world.levelToastT = 0;
    world.levelToastText = '';
  }
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
  world.banners = zone.banners.map((b) => ({ ...b, y: alignLegacyY(b.y) }));
  world.dummies = zone.spawns.map((spawn, i) =>
    createDummyFromSpawn(
      i + 1,
      spawn.enemyId,
      spawn.x,
      alignLegacyY(spawn.y),
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
  world.traps = [];
  world.trapId = 0;
  world.blizzards = [];
  world.blizzardId = 0;
  world.loots = [];
  world.lootFlies = [];
  world.nearbyLootName = null;
  world.nearbyLootCompare = null;
  world.nearbyLootTone = null;
  world.nearbySecretId = null;
  world.nearbyCamp = null;
  world.nearbyHubPortal = false;
  world.campMessage = '';
  world.bossGateClosed = false;
  world.bossGateX = 0;
  world.slowMoT = 0;
  world.exploreTrail = [];

  const x = spawnX ?? zone.spawns[0]?.x ?? WORLD.spawnX;
  const y = spawnY ?? WORLD.spawnY;
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
    p.bannerY = alignLegacyY(zone.banners[0].y);
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
