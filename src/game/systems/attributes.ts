import type { AttrKey, Dummy, Player, World } from '../types';
import { ZONES } from '../data/zones';
import { applyGearStats } from './inventory';
import { playLevelUpFx } from './combat';
import {
  ATTR_LABELS,
  WARRIOR_GROWTH,
  previewStats,
  xpForKill,
  xpToNextLevel,
} from './stats';
import { maybePromptSpec } from './specialization';

export function toggleCharacter(world: World): void {
  if (world.player.hp <= 0) {
    return;
  }
  world.charOpen = !world.charOpen;
  if (world.charOpen) {
    world.invOpen = false;
    world.skillOpen = false;
    world.catalogOpen = false;
    world.campOpen = null;
    world.specPickOpen = false;
    clearAttrDraft(world);
  }
}

export function clearAttrDraft(world: World): void {
  world.attrDraft = { str: 0, agi: 0, int: 0, vit: 0, spi: 0 };
}

export function draftTotal(world: World): number {
  const d = world.attrDraft;
  return d.str + d.agi + d.int + d.vit + d.spi;
}

export function addAttrDraft(world: World, key: AttrKey): boolean {
  if (world.player.unspentAttr - draftTotal(world) <= 0) {
    return false;
  }
  world.attrDraft[key] += 1;
  return true;
}

export function removeAttrDraft(world: World, key: AttrKey): boolean {
  if (world.attrDraft[key] <= 0) {
    return false;
  }
  world.attrDraft[key] -= 1;
  return true;
}

/** 用剩余未分配点按战士推荐（3 力 1 体循环）填入草稿。 */
export function fillRecommendDraft(world: World): void {
  clearAttrDraft(world);
  let left = world.player.unspentAttr;
  const cycle: AttrKey[] = ['str', 'str', 'str', 'vit'];
  let i = 0;
  while (left > 0) {
    const key = cycle[i % cycle.length]!;
    world.attrDraft[key] += 1;
    left -= 1;
    i += 1;
  }
}

export function applyAttrDraft(world: World): boolean {
  const total = draftTotal(world);
  if (total <= 0 || total > world.player.unspentAttr) {
    return false;
  }
  const p = world.player;
  p.spentStr += world.attrDraft.str;
  p.spentAgi += world.attrDraft.agi;
  p.spentInt += world.attrDraft.int;
  p.spentVit += world.attrDraft.vit;
  p.spentSpi += world.attrDraft.spi;
  p.unspentAttr -= total;
  clearAttrDraft(world);
  applyGearStats(p, world);
  return true;
}

/** 相对区域等级：越级经验衰减，过低略增（便于追进度）。 */
export function zoneXpMult(playerLevel: number, zoneId: string): number {
  const zone = ZONES[zoneId];
  if (!zone) {
    return 1;
  }
  const mid = (zone.levelMin + zone.levelMax) / 2;
  const delta = playerLevel - mid;
  if (delta <= 0) {
    return Math.min(1.25, 1 + Math.abs(delta) * 0.04);
  }
  if (delta <= 4) {
    return 1;
  }
  return Math.max(0.15, 1 - (delta - 4) * 0.12);
}

export function grantKillXp(world: World, dummy: Dummy): void {
  const p = world.player;
  const raw = xpForKill(dummy);
  p.xp += Math.max(1, Math.round(raw * zoneXpMult(p.level, world.zoneId)));
  let leveled = false;
  while (p.xp >= p.xpToNext) {
    p.xp -= p.xpToNext;
    levelUp(p);
    leveled = true;
  }
  if (leveled) {
    applyGearStats(p, world);
    p.hp = p.maxHp;
    playLevelUpFx(world);
    maybePromptSpec(world);
  }
}

function levelUp(player: Player): void {
  player.level += 1;
  player.baseStr += WARRIOR_GROWTH.str;
  player.baseAgi += WARRIOR_GROWTH.agi;
  player.baseInt += WARRIOR_GROWTH.int;
  player.baseVit += WARRIOR_GROWTH.vit;
  player.baseSpi += WARRIOR_GROWTH.spi;
  player.unspentAttr += 4;
  player.unspentSkill += 1;
  player.xpToNext = xpToNextLevel(player.level);
}

export function attrPanelRows(world: World): {
  key: AttrKey;
  name: string;
  tag: string;
  note: string;
  value: number;
  draft: number;
  preview: number;
}[] {
  return (Object.keys(ATTR_LABELS) as AttrKey[]).map((key) => {
    const meta = ATTR_LABELS[key];
    const baseSpent =
      key === 'str'
        ? world.player.baseStr + world.player.spentStr
        : key === 'agi'
          ? world.player.baseAgi + world.player.spentAgi
          : key === 'int'
            ? world.player.baseInt + world.player.spentInt
            : key === 'vit'
              ? world.player.baseVit + world.player.spentVit
              : world.player.baseSpi + world.player.spentSpi;
    const draft = world.attrDraft[key];
    return {
      key,
      name: meta.name,
      tag: meta.tag,
      note: meta.note,
      value: baseSpent,
      draft,
      preview: baseSpent + draft,
    };
  });
}

export function combatPreview(world: World): {
  now: ReturnType<typeof previewStats>;
  next: ReturnType<typeof previewStats>;
} {
  return {
    now: previewStats(world.player, {}),
    next: previewStats(world.player, world.attrDraft),
  };
}
