import { sfx } from '../../audio/sfx';
import { ZONES } from '../data/zones';
import type { Dummy, World } from '../types';
import {
  applyAttrDraft,
  fillRecommendDraft,
  forceLevelTo,
  grantKillXp,
} from './attributes';
import { noteBossKill } from './boss';
import { onEliteDeath } from './elite-affixes';
import { addItemToBag, applyGearStats } from './inventory';
import { spawnKillLoot } from './loot';
import { enterZone, unlockZone } from './zone-travel';
import { closeAllPanels } from './ui-panels';

/** 开发服默认开；正式构建需 URL ?qa=1 */
export function isQaBuildEnabled(): boolean {
  if (import.meta.env.DEV) {
    return true;
  }
  try {
    return new URLSearchParams(window.location.search).get('qa') === '1';
  } catch {
    return false;
  }
}

let qaSessionOn = isQaBuildEnabled();
let qaGod = false;

export function isQaSessionOn(): boolean {
  return isQaBuildEnabled() && qaSessionOn;
}

export function isQaGod(): boolean {
  return isQaSessionOn() && qaGod;
}

export type QaInput = {
  toggleSession: boolean;
  heal: boolean;
  syncLevel: boolean;
  clearFoes: boolean;
  warpBoss: boolean;
  unlockAll: boolean;
  nextZone: boolean;
  supply: boolean;
  toggleGod: boolean;
};

/** 处理 QA 快捷键；若换区返回 true，由 Game 重建场景。 */
export function stepQa(world: World, input: QaInput): boolean {
  if (!isQaBuildEnabled()) {
    return false;
  }
  if (input.toggleSession) {
    qaSessionOn = !qaSessionOn;
    toast(world, qaSessionOn ? 'QA 开启 · F1~F7 / F8 关' : 'QA 关闭');
    sfx.play('ui');
    return false;
  }
  if (!qaSessionOn) {
    return false;
  }

  if (input.toggleGod) {
    qaGod = !qaGod;
    toast(world, qaGod ? 'QA · 无敌开' : 'QA · 无敌关');
    sfx.play('ui');
  }
  if (qaGod && world.player.hp > 0) {
    world.player.iFrame = Math.max(world.player.iFrame, 0.35);
    world.player.hp = world.player.maxHp;
  }

  if (input.heal) {
    qaHeal(world);
  }
  if (input.syncLevel) {
    qaSyncLevel(world);
  }
  if (input.clearFoes) {
    qaClearFoes(world);
  }
  if (input.supply) {
    qaSupply(world);
  }
  if (input.unlockAll) {
    qaUnlockAll(world);
  }
  if (input.warpBoss) {
    return qaWarpBoss(world);
  }
  if (input.nextZone) {
    return qaNextZone(world);
  }
  return false;
}

function toast(world: World, text: string): void {
  world.levelToastT = 1.8;
  world.levelToastText = text;
}

function qaHeal(world: World): void {
  const p = world.player;
  p.hp = p.maxHp;
  p.rage = p.maxRage;
  p.awaitRespawn = false;
  p.state = 'idle';
  p.hurtT = 0;
  p.iFrame = 1.2;
  toast(world, 'QA · 满血满怒');
  sfx.play('drink');
}

function qaSyncLevel(world: World): void {
  const zone = ZONES[world.zoneId];
  const target = zone?.levelMax ?? world.player.level;
  forceLevelTo(world, target);
  fillRecommendDraft(world);
  applyAttrDraft(world);
  applyGearStats(world.player, world);
  world.player.hp = world.player.maxHp;
  toast(world, `QA · 升至 Lv.${world.player.level}（区域上限）`);
  sfx.play('levelup');
}

function qaClearFoes(world: World): void {
  let n = 0;
  for (const dummy of world.dummies) {
    if (dummy.hp <= 0) {
      continue;
    }
    killDummy(world, dummy);
    n += 1;
  }
  toast(world, n > 0 ? `QA · 清场 ${n}` : 'QA · 无可清目标');
  sfx.play(n > 0 ? 'crit' : 'deny');
}

function killDummy(world: World, dummy: Dummy): void {
  if (dummy.hp <= 0) {
    return;
  }
  dummy.hp = 0;
  dummy.flash = 0.2;
  onEliteDeath(world, dummy);
  spawnKillLoot(world, dummy);
  grantKillXp(world, dummy);
  noteBossKill(world, dummy);
}

function qaSupply(world: World): void {
  world.gold += 500;
  addItemToBag(world, 'life-potion-ultra', 3);
  addItemToBag(world, 'mana-potion-ultra', 3);
  addItemToBag(world, 'life-potion-greater', 3);
  addItemToBag(world, 'mana-potion-greater', 3);
  addItemToBag(world, 'woodland-scrap', 8);
  addItemToBag(world, 'ashen-crest', 2);
  toast(world, 'QA · +500金 / 特级药水 / 材料');
  sfx.play('loot');
}

function qaUnlockAll(world: World): void {
  for (const id of Object.keys(ZONES)) {
    if (id === 'challenge') {
      continue;
    }
    unlockZone(world, id);
  }
  // 标记全部 BOSS 击杀，避免传送/NG+ 逻辑卡死
  for (const zone of Object.values(ZONES)) {
    if (zone.bossId) {
      world.bossKills[zone.bossId] = true;
    }
  }
  toast(world, 'QA · 已解锁全部区域');
  sfx.play('levelup');
}

function qaWarpBoss(world: World): boolean {
  closeAllPanels(world);
  const boss = world.dummies.find((d) => d.boss && d.hp > 0);
  if (!boss) {
    toast(world, 'QA · 本区无存活 BOSS');
    sfx.play('deny');
    return false;
  }
  const p = world.player;
  p.x = boss.x - 2.2;
  p.y = Math.max(1.15, boss.y);
  p.prevX = p.x;
  p.prevY = p.y;
  p.vx = 0;
  p.vy = 0;
  p.iFrame = 1;
  toast(world, `QA · 传送至 ${boss.name}`);
  sfx.play('jump');
  return false;
}

function qaNextZone(world: World): boolean {
  closeAllPanels(world);
  const order = [
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
  ];
  const idx = order.indexOf(world.zoneId);
  const nextId = order[Math.min(order.length - 1, Math.max(0, idx) + 1)];
  if (!nextId || nextId === world.zoneId) {
    toast(world, 'QA · 已在终焉王座');
    sfx.play('deny');
    return false;
  }
  unlockZone(world, nextId);
  const zone = ZONES[nextId];
  const ok = enterZone(world, nextId, zone?.spawns[0]?.x ?? 1.2, 1.15);
  if (!ok) {
    toast(world, 'QA · 无法进入下一区');
    sfx.play('deny');
    return false;
  }
  forceLevelTo(world, zone?.levelMin ?? world.player.level);
  fillRecommendDraft(world);
  applyAttrDraft(world);
  applyGearStats(world.player, world);
  world.player.hp = world.player.maxHp;
  toast(world, `QA · 进入 ${zone?.name ?? nextId}`);
  sfx.play('levelup');
  return true;
}
