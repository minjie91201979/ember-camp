import type { InventoryItem, World } from '../types';
import { START_ZONE_ID, ZONES } from '../data/zones';
import { applyGearStats } from './inventory';
import { clearAttrDraft } from './attributes';
import { rebuildWorldPlatforms } from './breakables';
import { xpToNextLevel } from './stats';
import { defaultUnlockedZones, populateZone, unlockZone } from './zone-travel';

const SAVE_KEY = 'ember-camp-save-v1';

export type SaveBlob = {
  version: 1;
  gold: number;
  bag: InventoryItem[];
  itemUid: number;
  mainhandUid: number | null;
  skills: Record<string, number>;
  zoneId?: string;
  unlockedZones?: string[];
  bossKills?: Record<string, boolean>;
  secretsClaimed?: Record<string, boolean>;
  ngPlusLevel?: number;
  discoveredLegendaries?: string[];
  tutorialDone?: boolean;
  tutorialStep?: 'move' | 'attack' | 'roll' | 'potion' | 'loot' | 'done';
  tutorialAttrHint?: boolean;
  tutorialSkillHint?: boolean;
  brokenProps?: string[];
  player: {
    level: number;
    xp: number;
    baseStr: number;
    baseAgi: number;
    baseInt: number;
    baseVit: number;
    baseSpi: number;
    spentStr: number;
    spentAgi: number;
    spentInt: number;
    spentVit: number;
    spentSpi: number;
    unspentAttr: number;
    unspentSkill: number;
    weaponEnhance: number;
    attrResetCount: number;
    skillResetCount: number;
    specResetCount: number;
    specId: string | null;
    x: number;
    y: number;
    hp: number;
    rage: number;
  };
};

function persistBlob(world: World): boolean {
  const p = world.player;
  const blob: SaveBlob = {
    version: 1,
    gold: world.gold,
    bag: world.bag.map((it) => ({ ...it })),
    itemUid: world.itemUid,
    mainhandUid: world.mainhandUid,
    skills: { ...world.skills },
    zoneId: world.challengeActive ? START_ZONE_ID : world.zoneId,
    unlockedZones: [...world.unlockedZones],
    bossKills: { ...world.bossKills },
    secretsClaimed: { ...world.secretsClaimed },
    ngPlusLevel: world.ngPlusLevel,
    discoveredLegendaries: [...world.discoveredLegendaries],
    tutorialDone: world.tutorialDone,
    tutorialStep: world.tutorialStep,
    tutorialAttrHint: world.tutorialAttrHint,
    tutorialSkillHint: world.tutorialSkillHint,
    brokenProps: world.breakables.filter((b) => b.broken).map((b) => b.id),
    player: {
      level: p.level,
      xp: p.xp,
      baseStr: p.baseStr,
      baseAgi: p.baseAgi,
      baseInt: p.baseInt,
      baseVit: p.baseVit,
      baseSpi: p.baseSpi,
      spentStr: p.spentStr,
      spentAgi: p.spentAgi,
      spentInt: p.spentInt,
      spentVit: p.spentVit,
      spentSpi: p.spentSpi,
      unspentAttr: p.unspentAttr,
      unspentSkill: p.unspentSkill,
      weaponEnhance: p.weaponEnhance,
      attrResetCount: p.attrResetCount,
      skillResetCount: p.skillResetCount,
      specResetCount: p.specResetCount,
      specId: world.specId,
      x: p.x,
      y: p.y,
      hp: p.hp,
      rage: p.rage,
    },
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(blob));
  return true;
}

export function saveWorld(world: World): boolean {
  try {
    persistBlob(world);
    world.levelToastT = 1.6;
    world.levelToastText = '进度已保存';
    return true;
  } catch {
    return false;
  }
}

/** 换区 / 击败 BOSS / 复活后写入；短 toast 反馈。 */
export function autoSaveWorld(world: World): boolean {
  try {
    const ok = persistBlob(world);
    if (ok) {
      world.levelToastT = 1.1;
      world.levelToastText = '自动存档';
    }
    return ok;
  } catch {
    return false;
  }
}

export function loadWorld(world: World): boolean {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      return false;
    }
    const blob = JSON.parse(raw) as SaveBlob;
    if (blob.version !== 1) {
      return false;
    }
    const p = world.player;
    world.gold = blob.gold;
    world.bag = blob.bag.map((it) => ({ ...it }));
    world.itemUid = blob.itemUid;
    world.mainhandUid = blob.mainhandUid;
    world.skills = { ...blob.skills };
    world.bossKills = { ...(blob.bossKills ?? {}) };
    world.secretsClaimed = { ...(blob.secretsClaimed ?? {}) };
    world.ngPlusLevel = blob.ngPlusLevel ?? 0;
    world.discoveredLegendaries = [...(blob.discoveredLegendaries ?? [])];
    world.tutorialDone = Boolean(blob.tutorialDone);
    world.tutorialStep = blob.tutorialStep ?? (world.tutorialDone ? 'done' : 'move');
    world.tutorialAttrHint = Boolean(blob.tutorialAttrHint);
    world.tutorialSkillHint = Boolean(blob.tutorialSkillHint);
    world.unlockedZones = [...(blob.unlockedZones ?? defaultUnlockedZones())];
    if (world.bossKills.rotwood) {
      unlockZone(world, 'a02');
    }
    if (world.bossKills['rock-warden']) {
      unlockZone(world, 'a03');
    }
    if (world.bossKills['tide-crab']) {
      unlockZone(world, 'a04');
    }
    if (world.bossKills['cinder-lizard']) {
      unlockZone(world, 'a05');
    }
    if (world.bossKills['bog-mother']) {
      unlockZone(world, 'a06');
    }
    if (world.bossKills.frostfang) {
      unlockZone(world, 'a07');
    }
    if (world.bossKills['storm-scorpion']) {
      unlockZone(world, 'a08');
    }
    if (world.bossKills['golem-mage']) {
      unlockZone(world, 'a09');
    }
    if (world.bossKills['tide-lord']) {
      unlockZone(world, 'a10');
    }
    if (world.bossKills.rockwing) {
      unlockZone(world, 'a11');
    }
    if (world.bossKills['rift-warden']) {
      unlockZone(world, 'a12');
    }

    const zoneId = blob.zoneId ?? START_ZONE_ID;
    const zone = ZONES[zoneId] ?? ZONES[START_ZONE_ID];
    populateZone(world, zone, blob.player.x, blob.player.y);

    const broken = new Set(blob.brokenProps ?? []);
    for (const b of world.breakables) {
      if (broken.has(b.id)) {
        b.broken = true;
        b.hp = 0;
      }
    }
    rebuildWorldPlatforms(world);
    p.level = blob.player.level;
    p.xp = blob.player.xp;
    p.xpToNext = xpToNextLevel(p.level);
    p.baseStr = blob.player.baseStr;
    p.baseAgi = blob.player.baseAgi;
    p.baseInt = blob.player.baseInt;
    p.baseVit = blob.player.baseVit;
    p.baseSpi = blob.player.baseSpi;
    p.spentStr = blob.player.spentStr;
    p.spentAgi = blob.player.spentAgi;
    p.spentInt = blob.player.spentInt;
    p.spentVit = blob.player.spentVit;
    p.spentSpi = blob.player.spentSpi;
    p.unspentAttr = blob.player.unspentAttr;
    p.unspentSkill = blob.player.unspentSkill;
    p.weaponEnhance = blob.player.weaponEnhance;
    p.attrResetCount = blob.player.attrResetCount;
    p.skillResetCount = blob.player.skillResetCount;
    p.specResetCount = blob.player.specResetCount ?? 0;
    world.specId = blob.player.specId ?? null;
    p.x = blob.player.x;
    p.y = blob.player.y;
    p.prevX = p.x;
    p.prevY = p.y;
    p.rage = blob.player.rage;
    clearAttrDraft(world);
    world.campOpen = null;
    world.invOpen = false;
    world.charOpen = false;
    world.skillOpen = false;
    world.catalogOpen = false;
    world.settingsOpen = false;
    world.specPickOpen = false;
    applyGearStats(p, world);
    p.hp = Math.min(blob.player.hp, p.maxHp);
    world.levelToastT = 1.8;
    world.levelToastText = '进度已读取';
    if (p.level >= 10 && !world.specId) {
      world.specPickOpen = true;
    }
    return true;
  } catch {
    return false;
  }
}

export function hasSave(): boolean {
  return Boolean(localStorage.getItem(SAVE_KEY));
}
