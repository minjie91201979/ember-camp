import type { World } from '../types';
import { ITEM_DEFS } from '../data/item-defs';
import { ZONES } from '../data/zones';

export type MiniMapMarkKind =
  | 'player'
  | 'elite'
  | 'boss'
  | 'banner'
  | 'trail'
  | 'secret'
  | 'secretNear'
  | 'portal'
  | 'loot';

export type MiniMapMark = {
  /** 0～1，相对关卡包围盒 */
  u: number;
  v: number;
  kind: MiniMapMarkKind;
};

export type MiniMapSnap = {
  zoneId: string;
  marks: MiniMapMark[];
  secretsClaimed: number;
  secretsTotal: number;
};

const TRAIL_GAP = 0.95;
const TRAIL_MAX = 96;

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/** 玩家走过处采样足迹（换区清空）。 */
export function stepExploreTrail(world: World): void {
  if (world.player.hp <= 0 || world.player.state === 'dead') {
    return;
  }
  const x = world.player.x;
  const y = world.player.y + 0.35;
  const last = world.exploreTrail[world.exploreTrail.length - 1];
  if (last) {
    const dx = x - last.x;
    const dy = y - last.y;
    if (dx * dx + dy * dy < TRAIL_GAP * TRAIL_GAP) {
      return;
    }
  }
  world.exploreTrail.push({ x, y });
  if (world.exploreTrail.length > TRAIL_MAX) {
    world.exploreTrail.splice(0, world.exploreTrail.length - TRAIL_MAX);
  }
}

/** 当前区缩略：足迹 / 秘密 / 旗帜 / 地上装备 / 精英 / BOSS / 玩家。 */
export function buildMiniMap(world: World): MiniMapSnap {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of world.platforms) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x + p.w);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y + p.h);
  }
  if (!Number.isFinite(minX)) {
    minX = world.player.x - 8;
    maxX = world.player.x + 8;
    minY = 0;
    maxY = 4;
  }
  const padX = Math.max(2, (maxX - minX) * 0.06);
  const padY = Math.max(1, (maxY - minY) * 0.2);
  minX -= padX;
  maxX += padX;
  minY -= padY;
  maxY += padY;
  const spanX = Math.max(1, maxX - minX);
  const spanY = Math.max(1, maxY - minY);

  const toUv = (x: number, y: number): { u: number; v: number } => ({
    u: clamp01((x - minX) / spanX),
    v: clamp01(1 - (y - minY) / spanY),
  });

  const zone = ZONES[world.zoneId];
  const secrets = zone?.secrets ?? [];
  let secretsClaimed = 0;
  for (const s of secrets) {
    if (world.secretsClaimed[s.id]) {
      secretsClaimed += 1;
    }
  }

  const marks: MiniMapMark[] = [];
  for (const t of world.exploreTrail) {
    const uv = toUv(t.x, t.y);
    marks.push({ ...uv, kind: 'trail' });
  }
  for (const secret of secrets) {
    const claimed = Boolean(world.secretsClaimed[secret.id]);
    const near = world.nearbySecretId === secret.id;
    if (!claimed && !near) {
      continue;
    }
    const uv = toUv(secret.x, secret.y + 0.4);
    marks.push({ ...uv, kind: claimed ? 'secret' : 'secretNear' });
  }
  for (const b of world.banners) {
    const uv = toUv(b.x, b.y + 0.5);
    marks.push({ ...uv, kind: 'banner' });
  }
  if (zone?.hubPortal) {
    const uv = toUv(zone.hubPortal.x, zone.hubPortal.y + 0.6);
    marks.push({ ...uv, kind: 'portal' });
  } else if (world.zoneId === 'a01') {
    const uv = toUv(-5.6, 1.6);
    marks.push({ ...uv, kind: 'portal' });
  }
  for (const d of world.dummies) {
    if (d.hp <= 0) {
      continue;
    }
    const uv = toUv(d.x, d.y + d.h * 0.4);
    if (d.boss) {
      marks.push({ ...uv, kind: 'boss' });
    } else if (d.elite) {
      marks.push({ ...uv, kind: 'elite' });
    }
  }
  // 地上装备（材料/药水默认自动拾取，仅标需 F 的主手等）
  const LOOT_MARK_MAX = 12;
  let lootMarks = 0;
  for (const loot of world.loots) {
    if (lootMarks >= LOOT_MARK_MAX) {
      break;
    }
    if (loot.kind !== 'item' || !loot.defId) {
      continue;
    }
    const def = ITEM_DEFS[loot.defId];
    if (!def || def.kind !== 'gear') {
      continue;
    }
    const uv = toUv(loot.x, loot.y + 0.35);
    marks.push({ ...uv, kind: 'loot' });
    lootMarks += 1;
  }
  const playerUv = toUv(world.player.x, world.player.y + 0.6);
  marks.push({ ...playerUv, kind: 'player' });

  return {
    zoneId: world.zoneId,
    marks,
    secretsClaimed,
    secretsTotal: secrets.length,
  };
}
