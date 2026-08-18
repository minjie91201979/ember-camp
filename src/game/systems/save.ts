import type { InventoryItem, World } from '../types';
import { CLASS_DEFS, isPlayerClassId } from '../data/classes';
import { START_ZONE_ID, ZONES } from '../data/zones';
import { applyGearStats } from './inventory';
import { WEAPON_ENHANCE_MAX } from './camp';
import { POTION } from '../config';
import { ITEM_DEFS } from '../data/item-defs';
import { clearAttrDraft } from './attributes';
import { rebuildWorldPlatforms } from './breakables';
import { xpToNextLevel, PLAYER_LEVEL_CAP } from './stats';
import { normalizeSkillBar } from './skills';
import { maybePromptSpecNode } from './specialization';
import { BOSS_UNLOCKS, defaultUnlockedZones, populateZone, unlockZone } from './zone-travel';

const SAVE_KEY = 'ember-camp-save-v1';

export type SaveBlob = {
  version: 1 | 2;
  gold: number;
  bag: InventoryItem[];
  itemUid: number;
  mainhandUid: number | null;
  skills: Record<string, number>;
  skillBar?: (string | null)[];
  /** 专精节点：档位 → 节点 id */
  specNodes?: Record<number, string>;
  zoneId?: string;
  unlockedZones?: string[];
  bossKills?: Record<string, boolean>;
  secretsClaimed?: Record<string, boolean>;
  ngPlusLevel?: number;
  challengeBestFloor?: number;
  discoveredLegendaries?: string[];
  tutorialDone?: boolean;
  tutorialStep?:
    | 'move'
    | 'jump'
    | 'attack'
    | 'roll'
    | 'potion'
    | 'loot'
    | 'minimap'
    | 'secret'
    | 'done';
  tutorialAttrHint?: boolean;
  tutorialSkillHint?: boolean;
  brokenProps?: string[];
  player: {
    classId?: string;
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
    /** 怒气/法力；旧档字段名 rage。 */
    rage: number;
  };
};

function persistBlob(world: World): boolean {
  const p = world.player;
  const blob: SaveBlob = {
    version: 2,
    gold: world.gold,
    bag: world.bag.map((it) => ({ ...it })),
    itemUid: world.itemUid,
    mainhandUid: world.mainhandUid,
    skills: { ...world.skills },
    skillBar: [...world.skillBar],
    specNodes: { ...(world.specNodes ?? {}) },
    zoneId: world.challengeActive ? START_ZONE_ID : world.zoneId,
    unlockedZones: [...world.unlockedZones],
    bossKills: { ...world.bossKills },
    secretsClaimed: { ...world.secretsClaimed },
    ngPlusLevel: world.ngPlusLevel,
    challengeBestFloor: world.challengeBestFloor,
    discoveredLegendaries: [...world.discoveredLegendaries],
    tutorialDone: world.tutorialDone,
    tutorialStep: world.tutorialStep,
    tutorialAttrHint: world.tutorialAttrHint,
    tutorialSkillHint: world.tutorialSkillHint,
    brokenProps: world.breakables.filter((b) => b.broken).map((b) => b.id),
    player: {
      classId: p.classId,
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

/** 换区 / 击败 BOSS / 复活后写入；短 toast 反馈（不覆盖更重要的提示）。 */
export function autoSaveWorld(world: World): boolean {
  try {
    const ok = persistBlob(world);
    if (ok && world.levelToastT < 0.45) {
      world.levelToastT = 1.1;
      world.levelToastText = '自动存档';
    }
    return ok;
  } catch {
    return false;
  }
}

/**
 * 存档版本迁移。未来结构变更在此集中处理，避免旧档因 version 不匹配被整档清空。
 * 返回 null 表示无法识别的版本（直接丢弃）。
 */
export function migrateSave(raw: unknown): SaveBlob | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const blob = raw as Partial<SaveBlob> & { version?: number };
  if (blob.version === 2) {
    return blob as SaveBlob;
  }
  if (blob.version === 1) {
    // v1 → v2：当前无结构差异，仅升版本号；后续在此补齐缺省字段。
    return { ...(blob as SaveBlob), version: 2 };
  }
  return null;
}

export function loadWorld(world: World): boolean {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      return false;
    }
    const blob = migrateSave(JSON.parse(raw));
    if (!blob) {
      return false;
    }
    const p = world.player;
    world.gold = blob.gold;
    world.bag = blob.bag.map((it) => {
      const copy = { ...it };
      if (ITEM_DEFS[copy.defId]?.kind === 'potion') {
        copy.qty = Math.max(1, Math.min(POTION.stackMax, copy.qty));
      }
      return copy;
    });
    world.itemUid = blob.itemUid;
    world.mainhandUid = blob.mainhandUid;
    world.skills = { ...blob.skills };
    world.bossKills = { ...(blob.bossKills ?? {}) };
    world.secretsClaimed = { ...(blob.secretsClaimed ?? {}) };
    world.ngPlusLevel = blob.ngPlusLevel ?? 0;
    world.challengeBestFloor = blob.challengeBestFloor ?? 0;
    world.discoveredLegendaries = [...(blob.discoveredLegendaries ?? [])];
    world.tutorialDone = Boolean(blob.tutorialDone);
    world.tutorialStep = blob.tutorialStep ?? (world.tutorialDone ? 'done' : 'move');
    world.tutorialAttrHint = Boolean(blob.tutorialAttrHint);
    world.tutorialSkillHint = Boolean(blob.tutorialSkillHint);
    world.unlockedZones = [...(blob.unlockedZones ?? defaultUnlockedZones())];
    p.classId = isPlayerClassId(blob.player.classId) ? blob.player.classId : 'warrior';
    world.skillBar = normalizeSkillBar(p.classId, blob.skillBar);
    world.traps = [];
    world.trapId = 0;
    world.blizzards = [];
    world.blizzardId = 0;
    // 数据驱动解锁：击败 BOSS 即解锁其后续区域（与 zone-travel.BOSS_UNLOCKS 同源）。
    for (const [bossId, nextZone] of Object.entries(BOSS_UNLOCKS)) {
      if (world.bossKills[bossId]) {
        unlockZone(world, nextZone);
      }
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
    p.level = Math.max(1, Math.min(PLAYER_LEVEL_CAP, Math.floor(blob.player.level)));
    p.xp = Math.max(0, blob.player.xp);
    p.xpToNext = xpToNextLevel(p.level);
    if (p.level >= PLAYER_LEVEL_CAP) {
      p.xp = 0;
    }
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
    p.weaponEnhance = Math.max(0, Math.min(WEAPON_ENHANCE_MAX, blob.player.weaponEnhance ?? 0));
    p.attrResetCount = blob.player.attrResetCount;
    p.skillResetCount = blob.player.skillResetCount;
    p.specResetCount = blob.player.specResetCount ?? 0;
    world.specId = blob.player.specId ?? null;
    world.specNodes = { ...(blob.specNodes ?? {}) };
    world.specNodePickTier = null;
    p.x = blob.player.x;
    p.y = blob.player.y;
    p.prevX = p.x;
    p.prevY = p.y;
    p.rage = blob.player.rage;
    p.comboPoints = 0;
    p.sprintT = 0;
    p.vanishT = 0;
    p.openerBonusT = 0;
    p.rapidFireT = 0;
    p.rapidFireAcc = 0;
    p.skillShotArmed = false;
    p.manaShieldOn = false;
    p.manaShieldHp = 0;
    p.chargeDrT = 0;
    p.warShoutT = 0;
    p.sliceT = 0;
    clearAttrDraft(world);
    world.campOpen = null;
    world.invOpen = false;
    world.charOpen = false;
    world.skillOpen = false;
    world.levelUpOpen = false;
    world.catalogOpen = false;
    world.settingsOpen = false;
    world.specPickOpen = false;
    applyGearStats(p, world);
    const loadedHp = blob.player.hp;
    p.hp = loadedHp <= 0 ? p.maxHp : Math.min(loadedHp, p.maxHp);
    p.awaitRespawn = false;
    p.state = 'idle';
    world.levelToastT = 1.8;
    world.levelToastText = '进度已读取';
    if (p.level >= 10 && !world.specId) {
      world.specPickOpen = true;
    } else {
      maybePromptSpecNode(world);
    }
    return true;
  } catch {
    return false;
  }
}

export function hasSave(): boolean {
  return Boolean(localStorage.getItem(SAVE_KEY));
}

/** 选职界面用：展示将要被覆盖的存档摘要。 */
export type SaveSummary = {
  className: string;
  level: number;
  zoneName: string;
  ngPlusLevel: number;
};

export function peekSaveSummary(): SaveSummary | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      return null;
    }
    const blob = JSON.parse(raw) as SaveBlob;
    const classId = blob.player?.classId;
    const className = isPlayerClassId(classId)
      ? CLASS_DEFS[classId].name
      : '战士';
    const zoneId = blob.zoneId ?? START_ZONE_ID;
    const zoneName = ZONES[zoneId]?.name ?? zoneId;
    return {
      className,
      level: Math.max(1, Math.floor(blob.player?.level ?? 1)),
      zoneName,
      ngPlusLevel: Math.max(0, Math.floor(blob.ngPlusLevel ?? 0)),
    };
  } catch {
    return null;
  }
}
