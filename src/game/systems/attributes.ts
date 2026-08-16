import { sfx } from '../../audio/sfx';
import type { AttrKey, Dummy, Player, World } from '../types';
import { ZONES } from '../data/zones';
import { CLASS_DEFS } from '../data/classes';
import { applyGearStats } from './inventory';
import { playLevelUpFx } from './combat';
import {
  attrLabelsForClass,
  previewStats,
  PLAYER_LEVEL_CAP,
  xpForKill,
  xpToNextLevel,
} from './stats';
import { maybePromptSpec } from './specialization';

/** 战斗中锁 C/K；暂停、营地、a01 安全区放行；脱战野外仍可开。 */
export function canOpenBuildPanel(world: World): boolean {
  if (world.settingsOpen || world.nearbyCamp || world.zoneId === 'a01') {
    return true;
  }
  return world.player.combatT <= 0;
}

export function denyBuildPanel(world: World): void {
  sfx.play('deny');
  world.levelToastT = 1.4;
  world.levelToastText = '战斗中无法打开';
}

export function toggleCharacter(world: World): void {
  if (world.player.hp <= 0) {
    return;
  }
  if (!world.charOpen && !canOpenBuildPanel(world)) {
    denyBuildPanel(world);
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

/** 用剩余未分配点按职业推荐填入草稿。 */
export function fillRecommendDraft(world: World): void {
  clearAttrDraft(world);
  let left = world.player.unspentAttr;
  const cycle = CLASS_DEFS[world.player.classId].recommendCycle;
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

/** 相对区域等级：越级经验衰减，过低略增（便于追进度）。后期区扫图：超区中位 3 级起衰减，8 级起大幅衰减。 */
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
  if (delta <= 3) {
    return 1;
  }
  if (delta >= 8) {
    return Math.max(0.08, 0.28 - (delta - 8) * 0.04);
  }
  return Math.max(0.12, 1 - (delta - 3) * 0.11);
}

export function grantKillXp(world: World, dummy: Dummy): void {
  const p = world.player;
  const raw = Math.max(1, Math.round(xpForKill(dummy) * zoneXpMult(p.level, world.zoneId)));
  if (p.level >= PLAYER_LEVEL_CAP) {
    // 满级：经验折算少量金币，避免白打
    const gold = Math.max(1, Math.round(raw * 0.18));
    world.gold += gold;
    world.popupId += 1;
    world.popups.push({
      id: world.popupId,
      x: p.x,
      y: p.y + p.h + 0.2,
      value: gold,
      age: 0,
      lethal: false,
      crit: false,
      kind: 'gold',
    });
    return;
  }
  p.xp += raw;
  world.popupId += 1;
  world.popups.push({
    id: world.popupId,
    x: dummy.x,
    y: dummy.y + dummy.h + 0.25,
    value: raw,
    age: 0,
    lethal: false,
    crit: false,
    kind: 'xp',
  });
  let leveled = 0;
  while (p.xp >= p.xpToNext && p.level < PLAYER_LEVEL_CAP) {
    p.xp -= p.xpToNext;
    if (!levelUp(p)) {
      break;
    }
    leveled += 1;
  }
  if (p.level >= PLAYER_LEVEL_CAP) {
    p.level = PLAYER_LEVEL_CAP;
    p.xp = 0;
    p.xpToNext = xpToNextLevel(PLAYER_LEVEL_CAP);
  }
  if (leveled > 0) {
    applyGearStats(p, world);
    p.hp = p.maxHp;
    playLevelUpFx(world, { levels: leveled });
    maybePromptSpec(world);
  }
}

/** QA / 调试：将等级推到目标（不降级）。 */
export function forceLevelTo(world: World, targetLevel: number): void {
  const p = world.player;
  const from = p.level;
  const cap = Math.max(1, Math.min(PLAYER_LEVEL_CAP, Math.floor(targetLevel)));
  while (p.level < cap) {
    if (!levelUp(p)) {
      break;
    }
  }
  p.xp = 0;
  p.xpToNext = xpToNextLevel(p.level);
  applyGearStats(p, world);
  const gained = p.level - from;
  if (gained > 0) {
    playLevelUpFx(world, { levels: gained });
  }
  maybePromptSpec(world);
}

function levelUp(player: Player): boolean {
  if (player.level >= PLAYER_LEVEL_CAP) {
    return false;
  }
  player.level += 1;
  const growth = CLASS_DEFS[player.classId].growth;
  player.baseStr += growth.str;
  player.baseAgi += growth.agi;
  player.baseInt += growth.int;
  player.baseVit += growth.vit;
  player.baseSpi += growth.spi;
  player.unspentAttr += 4;
  player.unspentSkill += 1;
  player.xpToNext = xpToNextLevel(player.level);
  return true;
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
  const labels = attrLabelsForClass(world.player.classId);
  return (Object.keys(labels) as AttrKey[]).map((key) => {
    const meta = labels[key];
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
