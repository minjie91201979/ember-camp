import { sfx } from '../../audio/sfx';
import { PLAYER } from '../config';
import type { AttackKind, Dummy, Player, World } from '../types';
import { tryHitBreakables } from './breakables';
import { applyDeathLootLoss, spawnKillLoot } from './loot';
import { skillLevelOf, skillMultForAttack } from './skills';
import {
  critMultOf,
  fireballCritBonus,
  frostNovaStunOf,
  energyRegenMult,
  incomingDamageMult,
  outgoingDamageMult,
  rageGainMult,
  disengageRangeOf,
  trapCapOf,
  rapidFireIntervalOf,
  executeThreshOf,
  whirlwindRadiusOf,
  poisonDmgNodeMult,
} from './specialization';
import { overlaps } from './physics';
import { physicalDamage, spellDamage } from './stats';
import { grantKillXp } from './attributes';
import { noteBossKill } from './boss';
import { onEliteDeath, onEliteHitPlayer } from './elite-affixes';
import {
  legendaryBashStun,
  legendaryCritMultBonus,
  legendaryDamageMult,
  legendaryExplosiveBlastRadiusMult,
  legendaryFireballDamageMult,
  legendaryFireballRadiusMult,
  legendaryKidneyStunMult,
  legendarySerpentDotMult,
  legendarySlamStun,
} from './legendary';
import {
  playerHitChanceVsDummy,
  playerIncomingFromDummy,
  playerIncomingFromZone,
  playerOutgoingVsDummy,
} from './level-gap';
import { getGameplayPrefs } from '../prefs/gameplay-prefs';
import { applyDeathDurabilityLoss } from './gear-durability';
import { applyGearStats } from './inventory';

export const POPUP_LIFE = 0.8;
export const LEVEL_POPUP_LIFE = 1.35;
export const DUST_LIFE = 0.35;

function spawnPopup(
  world: World,
  x: number,
  y: number,
  value: number,
  lethal: boolean,
  crit: boolean,
): void {
  if (!getGameplayPrefs().showDamageNumbers) {
    return;
  }
  world.popupId += 1;
  world.popups.push({
    id: world.popupId,
    x,
    y,
    value,
    age: 0,
    lethal,
    crit,
    kind: 'damage',
  });
}

function spawnMissPopup(world: World, x: number, y: number): void {
  if (!getGameplayPrefs().showDamageNumbers) {
    return;
  }
  world.popupId += 1;
  world.popups.push({
    id: world.popupId,
    x,
    y,
    value: 0,
    age: 0,
    lethal: false,
    crit: false,
    kind: 'miss',
  });
}

/** 越级未命中则返回 true（已写入飘字）。 */
function rollOverlevelMiss(world: World, dummy: Dummy): boolean {
  const chance = playerHitChanceVsDummy(world, dummy);
  if (chance >= 0.999 || Math.random() < chance) {
    return false;
  }
  spawnMissPopup(world, dummy.x, dummy.y + dummy.h + 0.22);
  dummy.flash = Math.max(dummy.flash, 0.1);
  spawnDust(world, dummy.x, dummy.y + 0.28);
  return true;
}

export function addRage(player: Player, amount: number): void {
  if (player.classId === 'mage') {
    player.combatT = PLAYER.combatLock;
    return;
  }
  player.rage = Math.min(player.maxRage, player.rage + amount);
  player.combatT = PLAYER.combatLock;
}

export function spendRage(player: Player, amount: number): boolean {
  if (player.rage < amount) {
    return false;
  }
  player.rage -= amount;
  player.combatT = PLAYER.combatLock;
  return true;
}

/** 怒气衰减 / 法力回复 / 集中静止回复与移动消耗 / 能量回复。 */
export function stepRage(world: World, dt: number): void {
  const player = world.player;
  player.combatT = Math.max(0, player.combatT - dt);
  if (player.classId === 'mage') {
    const regen = player.combatT > 0 ? PLAYER.manaRegenCombat : PLAYER.manaRegenOoc;
    const spiBonus = 1 + player.spi * 0.01;
    player.rage = Math.min(player.maxRage, player.rage + regen * spiBonus * dt);
    return;
  }
  if (player.classId === 'hunter') {
    const spiBonus = 1 + player.spi * 0.008;
    const moving = Math.abs(player.vx) > 1.2 && player.state === 'run';
    if (player.state === 'attack') {
      player.rage = Math.min(
        player.maxRage,
        player.rage + PLAYER.focusRegenAttack * spiBonus * dt,
      );
    } else if (moving) {
      player.rage = Math.max(0, player.rage - PLAYER.focusDrainMove * dt);
    } else if (Math.abs(player.vx) < 0.35) {
      player.rage = Math.min(
        player.maxRage,
        player.rage + PLAYER.focusRegenStill * spiBonus * dt,
      );
    }
    return;
  }
  if (player.classId === 'rogue') {
    const spiBonus = 1 + player.spi * 0.01;
    const sliceMult =
      player.sliceT > 0 && skillLevelOf(world, 'slice-and-dice') >= 5
        ? PLAYER.sliceAndDiceEnergyMult
        : 1;
    const regen =
      (player.combatT > 0 ? PLAYER.energyRegenCombat : PLAYER.energyRegen) *
      energyRegenMult(world) *
      spiBonus *
      sliceMult;
    player.rage = Math.min(player.maxRage, player.rage + regen * dt);
    return;
  }
  if (player.combatT > 0 || player.rage <= 0) {
    return;
  }
  player.rage = Math.max(0, player.rage - PLAYER.rageDecay * dt);
}

function finishKill(world: World, dummy: Dummy, wasAlive: boolean): void {
  if (wasAlive && dummy.hp <= 0) {
    onEliteDeath(world, dummy);
    spawnKillLoot(world, dummy);
    grantKillXp(world, dummy);
    noteBossKill(world, dummy);
  }
}

/** 远端/法术命中短顿挫，与近战共用 hitStop 闸门。 */
function notePlayerHitStop(world: World, base: number, crit = false): void {
  const player = world.player;
  if (player.hp <= 0) {
    return;
  }
  player.hitStop = Math.max(player.hitStop, crit ? base + 0.012 : base);
}

export function applyPlayerHit(world: World, dummy: Dummy, kind: AttackKind = 'basic'): void {
  const player = world.player;
  if (kind === 'fireball' || kind === 'frost-nova') {
    applySpellHit(world, dummy, kind);
    return;
  }
  if (rollOverlevelMiss(world, dummy)) {
    return;
  }
  const crit = Math.random() < player.critChance;
  let baseMult = 1;
  if (kind === 'slam') {
    baseMult = PLAYER.slamDamageMult;
  } else if (kind === 'bash') {
    baseMult = PLAYER.bashDamageMult;
  } else if (kind === 'shadow-strike') {
    baseMult = PLAYER.shadowStrikeDamageMult;
  } else if (kind === 'eviscerate') {
    const pts = Math.max(1, player.comboPoints);
    baseMult = PLAYER.eviscerateDamageMult * (1 + pts * 0.85);
    if (pts >= 5 && skillMultForAttack(world, 'eviscerate') >= 1.24) {
      baseMult *= 1.15;
    }
  } else if (kind === 'poison-blade') {
    baseMult = PLAYER.poisonBladeDamageMult;
  } else if (kind === 'execute') {
    const ratio = dummy.maxHp > 0 ? dummy.hp / dummy.maxHp : 1;
    const thresh = executeThreshOf(world, skillLevelOf(world, 'execute') >= 5);
    baseMult = ratio <= thresh ? PLAYER.executeDamageMult : PLAYER.executeDamageMult * 0.38;
  } else if (kind === 'sunder') {
    baseMult = PLAYER.sunderDamageMult;
  } else if (kind === 'cleave') {
    baseMult = PLAYER.cleaveDamageMult;
  } else if (kind === 'charge') {
    baseMult = PLAYER.chargeDamageMult;
  } else if (kind === 'whirlwind') {
    baseMult = PLAYER.whirlwindDamageMult;
  } else if (kind === 'kidney-shot') {
    baseMult = PLAYER.kidneyShotDamageMult;
  } else if (kind === 'fan-of-knives') {
    baseMult = PLAYER.fanOfKnivesDamageMult;
  }
  const skillMult =
    baseMult *
    skillMultForAttack(world, kind) *
    outgoingDamageMult(world, kind, dummy) *
    legendaryDamageMult(world, kind, dummy) *
    (1 + Math.max(0, dummy.sunderStacks) * PLAYER.sunderDefPerStack);
  let critMult = critMultOf(player, world) * (1 + legendaryCritMultBonus(world));
  if (kind === 'eviscerate' && player.comboPoints >= 5 && crit) {
    critMult *= 1.12;
  }
  const value = Math.max(
    1,
    Math.round(physicalDamage(player.atk, dummy.def, skillMult, crit, critMult) * playerOutgoingVsDummy(world, dummy)),
  );
  const wasAlive = dummy.hp > 0;
  dummy.hp = Math.max(0, dummy.hp - value);
  dummy.flash = kind === 'slam' ? 0.24 : kind === 'bash' ? 0.22 : 0.18;
  const push =
    player.facing *
    (kind === 'slam' ? 0.62 : kind === 'bash' ? 0.95 : kind === 'eviscerate' ? 0.35 : 0.18);
  dummy.x += push;
  if (kind === 'bash') {
    dummy.stunT = legendaryBashStun(world);
    dummy.attackT = 0;
    dummy.state = 'idle';
  } else if (kind === 'slam') {
    dummy.stunT = Math.max(dummy.stunT, legendarySlamStun(world));
    dummy.attackT = 0;
    dummy.state = 'idle';
  } else if (kind === 'poison-blade') {
    applyPoison(world, dummy);
  } else if (kind === 'sunder') {
    applySunder(world, dummy);
  } else if (kind === 'execute') {
    dummy.stunT = Math.max(dummy.stunT, 0.2);
    dummy.attackT = 0;
    dummy.state = 'idle';
  } else if (kind === 'kidney-shot') {
    const pts = Math.max(1, player.comboPoints);
    const perPt =
      skillLevelOf(world, 'kidney-shot') >= 3
        ? PLAYER.kidneyShotStunPerPt3
        : PLAYER.kidneyShotStunPerPt;
    const subtleBonus = world.specId === 'subtlety' ? 1.12 : 1;
    dummy.stunT = Math.max(
      dummy.stunT,
      (PLAYER.kidneyShotStunBase + pts * perPt) *
        subtleBonus *
        legendaryKidneyStunMult(world),
    );
    dummy.attackT = 0;
    dummy.state = 'idle';
  }
  if (kind === 'shadow-strike' || kind === 'poison-blade') {
    addComboPoint(player, 1);
    if (
      kind === 'shadow-strike' &&
      skillMultForAttack(world, 'shadow-strike') >= 1.6 &&
      Math.random() < 0.15
    ) {
      addComboPoint(player, 1);
    }
  }
  if (kind === 'eviscerate' || kind === 'kidney-shot') {
    player.comboPoints = 0;
  }
  if (player.openerBonusT > 0) {
    player.openerBonusT = 0;
  }
  const shake =
    kind === 'slam' ? 1.25 : kind === 'bash' || kind === 'eviscerate' ? 1.05 : 0.45;
  world.shake = Math.max(world.shake, crit ? Math.max(shake, 1.1) : shake);
  spawnPopup(world, dummy.x, dummy.y + dummy.h + 0.2, value, dummy.hp <= 0, crit);
  if (player.classId === 'warrior') {
    const rageBase = kind === 'slam' ? PLAYER.rageOnSlam : PLAYER.rageOnHit;
    const rageSrc = kind === 'slam' ? 'slam' : 'hit';
    addRage(player, rageBase * rageGainMult(world, rageSrc));
    if (
      kind === 'execute' &&
      dummy.hp <= 0 &&
      skillLevelOf(world, 'execute') >= 5
    ) {
      addRage(player, PLAYER.executeRageOnKill * rageGainMult(world, 'hit'));
    }
  }
  spawnDust(world, dummy.x - player.facing * 0.2, dummy.y + 0.12);
  if (kind !== 'basic') {
    spawnDust(world, dummy.x, dummy.y + 0.05);
  }
  if (kind === 'slam' || kind === 'bash') {
    sfx.play(kind);
  } else {
    sfx.play(crit ? 'crit' : 'hit');
  }
  finishKill(world, dummy, wasAlive);
}

export function addComboPoint(player: Player, amount = 1): void {
  player.comboPoints = Math.min(PLAYER.comboMax, player.comboPoints + amount);
}

export function applyPoison(world: World, dummy: Dummy): void {
  const player = world.player;
  const poisonMult = (world.specId === 'assassination' ? 1.25 : 1) * poisonDmgNodeMult(world);
  dummy.poisonT = PLAYER.poisonDuration;
  dummy.poisonDps = Math.max(
    1,
    player.atk * PLAYER.poisonDpsMult * poisonMult * skillMultForAttack(world, 'poison-blade'),
  );
}

export function activateManaShield(world: World): void {
  const player = world.player;
  if (player.manaShieldOn) {
    player.manaShieldOn = false;
    player.manaShieldHp = 0;
    world.levelToastT = 1;
    world.levelToastText = '法力护盾关闭';
    sfx.play('deny');
    return;
  }
  const poolMult =
    skillLevelOf(world, 'mana-shield') >= 3
      ? PLAYER.manaShieldPoolMult3
      : PLAYER.manaShieldPoolMult;
  const arcaneBonus = world.specId === 'arcane' ? 1.12 : 1;
  player.manaShieldOn = true;
  player.manaShieldHp = Math.max(
    8,
    Math.round(player.maxRage * poolMult * skillMultForAttack(world, 'mana-shield') * arcaneBonus),
  );
  player.combatT = PLAYER.combatLock;
  spawnDust(world, player.x, player.y + 0.35);
  world.shake = Math.max(world.shake, 0.25);
  world.levelToastT = 1.1;
  world.levelToastText = '法力护盾';
  sfx.play('bash');
}

export function stepManaShield(world: World, dt: number): void {
  const player = world.player;
  if (!player.manaShieldOn) {
    return;
  }
  if (player.hp <= 0 || player.classId !== 'mage') {
    player.manaShieldOn = false;
    player.manaShieldHp = 0;
    return;
  }
  const drain =
    PLAYER.manaShieldDrain * dt * (world.specId === 'arcane' ? 0.85 : 1);
  if (player.rage < drain) {
    player.manaShieldOn = false;
    player.manaShieldHp = 0;
    player.rage = 0;
    world.levelToastT = 1;
    world.levelToastText = '法力护盾耗尽';
    sfx.play('deny');
    return;
  }
  player.rage = Math.max(0, player.rage - drain);
  if (player.manaShieldHp <= 0) {
    player.manaShieldOn = false;
    world.levelToastT = 1;
    world.levelToastText = '法力护盾破碎';
    sfx.play('hurt');
  }
}

export function applySerpentSting(world: World, dummy: Dummy): void {
  const player = world.player;
  const maxStacks =
    skillLevelOf(world, 'serpent-sting') >= 3
      ? PLAYER.serpentStingMaxStacks3
      : PLAYER.serpentStingMaxStacks;
  const stacks = Math.min(maxStacks, (dummy.serpentStacks || 0) + 1);
  const markBonus = world.specId === 'marksmanship' ? 1.12 : 1;
  const survivalBonus = world.specId === 'survival' ? 1.08 : 1;
  dummy.serpentStacks = stacks;
  dummy.serpentT = PLAYER.serpentStingDot;
  dummy.serpentDps = Math.max(
    1,
    player.atk *
      PLAYER.serpentStingDpsMult *
      stacks *
      markBonus *
      survivalBonus *
      skillMultForAttack(world, 'serpent-sting') *
      legendarySerpentDotMult(world),
  );
}

export function applySunder(world: World, dummy: Dummy): void {
  const maxStacks =
    skillLevelOf(world, 'sunder') >= 5 ? PLAYER.sunderMaxStacks5 : PLAYER.sunderMaxStacks;
  dummy.sunderStacks = Math.min(maxStacks, (dummy.sunderStacks || 0) + 1);
  dummy.sunderT = PLAYER.sunderLife;
  dummy.flash = Math.max(dummy.flash, 0.26);
  dummy.stunT = Math.max(dummy.stunT, 0.15);
  dummy.attackT = 0;
  dummy.state = 'idle';
}

export function activateBattleShout(world: World): void {
  const player = world.player;
  const dur =
    PLAYER.battleShoutBuff * (1 + (skillMultForAttack(world, 'battle-shout') - 1) * 0.35);
  player.warShoutT = Math.max(player.warShoutT, dur);
  player.combatT = PLAYER.combatLock;
  for (let i = 0; i < 5; i += 1) {
    const a = (i / 5) * Math.PI * 2;
    spawnDust(world, player.x + Math.cos(a) * 0.7, player.y + 0.25 + Math.sin(a) * 0.1);
  }
  world.shake = Math.max(world.shake, 0.55);
  world.levelToastT = 1.1;
  world.levelToastText = '战吼';
  sfx.play('bash');
}

export function chargePlayer(world: World): void {
  const player = world.player;
  stepDisplace(world, player, player.facing, PLAYER.chargeRange, PLAYER.chargeIFrame);
  for (const dummy of world.dummies) {
    if (dummy.hp <= 0) {
      continue;
    }
    const dx = dummy.x - player.x;
    const dy = dummy.y - player.y;
    if (Math.abs(dx) > 1.35 || Math.abs(dy) > 1.2) {
      continue;
    }
    applyPlayerHit(world, dummy, 'charge');
  }
  tryHitBreakables(world, player.x, player.y + 0.2, 1.2, 1.1);
  if (skillLevelOf(world, 'charge') >= 5) {
    player.chargeDrT = Math.max(player.chargeDrT, PLAYER.chargeDr);
  }
  player.vx = player.facing * 5.5;
  world.shake = Math.max(world.shake, 0.85);
  sfx.play('slam');
}

export function applyWhirlwind(world: World): void {
  const player = world.player;
  const r = whirlwindRadiusOf(world);
  let hits = 0;
  for (const dummy of world.dummies) {
    if (dummy.hp <= 0) {
      continue;
    }
    const dx = dummy.x - player.x;
    const dy = dummy.y - player.y;
    if (dx * dx + dy * dy > r * r) {
      continue;
    }
    applyPlayerHit(world, dummy, 'whirlwind');
    hits += 1;
  }
  tryHitBreakables(world, player.x, player.y + 0.25, r, r);
  for (let i = 0; i < 6; i += 1) {
    const a = (i / 6) * Math.PI * 2;
    spawnDust(world, player.x + Math.cos(a) * 1.1, player.y + 0.1 + Math.sin(a) * 0.15);
  }
  world.shake = Math.max(world.shake, hits > 0 ? 1.05 : 0.45);
  sfx.play(hits > 0 ? 'slam' : 'bash');
}

export function applyCleaveHits(world: World, player: Player): void {
  const reach = PLAYER.cleaveReach;
  const back =
    skillLevelOf(world, 'cleave') >= 3 ? PLAYER.cleaveBackReach3 : PLAYER.cleaveBackReach;
  const hx = player.x + player.facing * 0.85;
  const hy = player.y + 0.2;
  tryHitBreakables(world, hx, hy, reach, 1.15);
  for (const dummy of world.dummies) {
    if (dummy.hp <= 0 || dummy.flash > 0.12) {
      continue;
    }
    const dx = dummy.x - player.x;
    const dy = dummy.y - player.y;
    const forward = dx * player.facing >= -0.15 && Math.abs(dx) <= reach && Math.abs(dy) <= 1.15;
    const behind =
      dx * player.facing < 0 && Math.abs(dx) <= back && Math.abs(dy) <= 1.2;
    if (forward || behind) {
      applyPlayerHit(world, dummy, 'cleave');
    }
  }
}

export function stepWarriorBuffs(world: World, dt: number): void {
  const player = world.player;
  player.chargeDrT = Math.max(0, player.chargeDrT - dt);
  player.warShoutT = Math.max(0, player.warShoutT - dt);
  for (const dummy of world.dummies) {
    if (dummy.sunderT <= 0) {
      continue;
    }
    dummy.sunderT = Math.max(0, dummy.sunderT - dt);
    if (dummy.sunderT <= 0) {
      dummy.sunderStacks = 0;
    }
  }
}

export function activateSliceAndDice(world: World): void {
  const player = world.player;
  const pts = Math.max(1, player.comboPoints);
  const dur =
    (PLAYER.sliceAndDiceBuffBase + pts * PLAYER.sliceAndDiceBuffPerPt) *
    (1 + (skillMultForAttack(world, 'slice-and-dice') - 1) * 0.25);
  const combatBonus = world.specId === 'combat' ? 1.15 : 1;
  player.sliceT = Math.max(player.sliceT, dur * combatBonus);
  player.comboPoints = 0;
  player.combatT = PLAYER.combatLock;
  spawnDust(world, player.x + player.facing * 0.4, player.y + 0.25);
  spawnDust(world, player.x - player.facing * 0.25, player.y + 0.15);
  world.shake = Math.max(world.shake, 0.35);
  world.levelToastT = 1;
  world.levelToastText = '切割';
  sfx.play('bash');
}

export function applyFanOfKnives(world: World): void {
  const player = world.player;
  const r = PLAYER.fanOfKnivesRadius;
  let hits = 0;
  for (const dummy of world.dummies) {
    if (dummy.hp <= 0) {
      continue;
    }
    const dx = dummy.x - player.x;
    const dy = dummy.y - player.y;
    if (dx * dx + dy * dy > r * r) {
      continue;
    }
    applyPlayerHit(world, dummy, 'fan-of-knives');
    hits += 1;
  }
  tryHitBreakables(world, player.x, player.y + 0.25, r, r);
  addComboPoint(player, 1);
  if (skillLevelOf(world, 'fan-of-knives') >= 3 && hits >= 3) {
    addComboPoint(player, 1);
  }
  if (world.specId === 'combat' && hits >= 2) {
    addRage(player, 8);
  }
  for (let i = 0; i < 6; i += 1) {
    const a = (i / 6) * Math.PI * 2;
    spawnDust(world, player.x + Math.cos(a) * 0.95, player.y + 0.12 + Math.sin(a) * 0.12);
  }
  world.shake = Math.max(world.shake, hits > 0 ? 0.95 : 0.4);
  sfx.play(hits > 0 ? 'slam' : 'hit');
}

export function activateSprint(world: World): void {
  const player = world.player;
  player.sprintT = PLAYER.sprintBuff;
  player.iFrame = Math.max(player.iFrame, PLAYER.sprintIFrame);
  player.combatT = PLAYER.combatLock;
  spawnDust(world, player.x, player.y + 0.2);
  spawnDust(world, player.x - player.facing * 0.3, player.y + 0.15);
  world.shake = Math.max(world.shake, 0.3);
  sfx.play('roll');
}

/** 消失：短无敌 + 脱战，结束后给予破隐加成。 */
export function activateVanish(world: World): void {
  const player = world.player;
  player.vanishT = PLAYER.vanishBuff;
  player.iFrame = Math.max(player.iFrame, PLAYER.vanishIFrame);
  player.combatT = 0;
  player.vx *= 0.2;
  for (const dummy of world.dummies) {
    if (dummy.hp <= 0) {
      continue;
    }
    dummy.attackT = 0;
    dummy.struck = false;
    if (dummy.state === 'attack' || dummy.state === 'charge' || dummy.state === 'fuse') {
      dummy.state = 'idle';
    }
  }
  for (let i = 0; i < 4; i += 1) {
    spawnDust(world, player.x + (Math.random() - 0.5) * 0.8, player.y + 0.1 + Math.random() * 0.4);
  }
  world.shake = Math.max(world.shake, 0.4);
  world.levelToastT = 1.1;
  world.levelToastText = '消失';
  sfx.play('roll');
}

export function placeBlizzard(world: World): void {
  const player = world.player;
  const dps =
    player.sp *
    PLAYER.blizzardDamageMult *
    skillMultForAttack(world, 'blizzard') *
    (world.specId === 'frost' ? 1.1 : 1) *
    (world.specId === 'arcane' ? 1.06 : 1);
  const slow =
    PLAYER.blizzardSlow *
    (world.specId === 'frost' ? 1.25 : 1) *
    (skillMultForAttack(world, 'blizzard') >= 1.6 ? 1.15 : 1);
  world.blizzardId += 1;
  world.blizzards.push({
    id: world.blizzardId,
    x: player.x + player.facing * 0.85,
    y: player.y + 0.05,
    radius: PLAYER.blizzardRadius,
    life: PLAYER.blizzardLife,
    tickAcc: 0,
    dps: Math.max(2, dps),
    slow,
  });
  for (let i = 0; i < 6; i += 1) {
    const a = (i / 6) * Math.PI * 2;
    spawnDust(
      world,
      player.x + player.facing * 0.85 + Math.cos(a) * 1.1,
      player.y + 0.15 + Math.sin(a) * 0.15,
    );
  }
  world.shake = Math.max(world.shake, 0.55);
  sfx.play('bash');
}

export function stepBlizzards(world: World, dt: number): void {
  if (!world.blizzards?.length) {
    return;
  }
  const keep = [];
  for (const zone of world.blizzards) {
    zone.life -= dt;
    if (zone.life <= 0) {
      continue;
    }
    zone.tickAcc -= dt;
    if (zone.tickAcc > 0) {
      keep.push(zone);
      continue;
    }
    zone.tickAcc = PLAYER.blizzardTick;
    for (const dummy of world.dummies) {
      if (dummy.hp <= 0) {
        continue;
      }
      const dx = dummy.x - zone.x;
      const dy = dummy.y + dummy.h * 0.35 - zone.y;
      if (dx * dx + dy * dy > zone.radius * zone.radius) {
        continue;
      }
      const wasAlive = dummy.hp > 0;
      const value = Math.max(
        1,
        Math.round(zone.dps * PLAYER.blizzardTick * playerOutgoingVsDummy(world, dummy)),
      );
      dummy.hp = Math.max(0, dummy.hp - value);
      dummy.flash = Math.max(dummy.flash, 0.16);
      dummy.vx *= 0.35;
      // 用 stun 短促模拟减速卡顿；不打断过久
      dummy.stunT = Math.max(dummy.stunT, Math.min(0.35, zone.slow * 0.22));
      spawnPopup(world, dummy.x, dummy.y + dummy.h + 0.15, value, dummy.hp <= 0, false);
      finishKill(world, dummy, wasAlive);
    }
    keep.push(zone);
  }
  world.blizzards = keep;
}

export function stepRogueTimers(world: World, dt: number): void {
  const player = world.player;
  const wasSprint = player.sprintT > 0;
  const wasVanish = player.vanishT > 0;
  player.sprintT = Math.max(0, player.sprintT - dt);
  player.vanishT = Math.max(0, (player.vanishT ?? 0) - dt);
  player.openerBonusT = Math.max(0, player.openerBonusT - dt);
  player.sliceT = Math.max(0, (player.sliceT ?? 0) - dt);
  if (player.sprintT > 0 || player.vanishT > 0) {
    player.iFrame = Math.max(player.iFrame, 0.05);
  }
  if (wasSprint && player.sprintT <= 0) {
    player.openerBonusT = Math.max(
      player.openerBonusT,
      world.specId === 'subtlety' ? 3 : 1.6,
    );
  }
  if (wasVanish && player.vanishT <= 0) {
    player.openerBonusT = Math.max(
      player.openerBonusT,
      world.specId === 'subtlety' ? 3.5 : 2.2,
    );
  }
  for (const dummy of world.dummies) {
    if (dummy.hp <= 0 || dummy.poisonT <= 0) {
      continue;
    }
    dummy.poisonT = Math.max(0, dummy.poisonT - dt);
    const tick = dummy.poisonDps * dt;
    if (tick <= 0) {
      continue;
    }
    const wasAlive = dummy.hp > 0;
    const gapOut = playerOutgoingVsDummy(world, dummy);
    dummy.hp = Math.max(0, dummy.hp - tick * gapOut);
    if (dummy.poisonT <= 0 || Math.floor(dummy.poisonT * 2) !== Math.floor((dummy.poisonT + dt) * 2)) {
      spawnPopup(
        world,
        dummy.x,
        dummy.y + dummy.h + 0.15,
        Math.max(1, Math.round(dummy.poisonDps * 0.5 * gapOut)),
        dummy.hp <= 0,
        false,
      );
    }
    finishKill(world, dummy, wasAlive);
  }
  for (const dummy of world.dummies) {
    if (dummy.hp <= 0 || dummy.serpentT <= 0) {
      continue;
    }
    dummy.serpentT = Math.max(0, dummy.serpentT - dt);
    const tick = dummy.serpentDps * dt;
    if (tick <= 0) {
      continue;
    }
    const wasAlive = dummy.hp > 0;
    const gapOut = playerOutgoingVsDummy(world, dummy);
    dummy.hp = Math.max(0, dummy.hp - tick * gapOut);
    if (
      dummy.serpentT <= 0 ||
      Math.floor(dummy.serpentT * 2) !== Math.floor((dummy.serpentT + dt) * 2)
    ) {
      spawnPopup(
        world,
        dummy.x,
        dummy.y + dummy.h + 0.18,
        Math.max(1, Math.round(dummy.serpentDps * 0.45 * gapOut)),
        dummy.hp <= 0,
        false,
      );
    }
    if (dummy.serpentT <= 0) {
      dummy.serpentStacks = 0;
      dummy.serpentDps = 0;
    }
    finishKill(world, dummy, wasAlive);
  }
}

export function applySpellHit(
  world: World,
  dummy: Dummy,
  kind: 'fireball' | 'frost-nova',
): void {
  if (rollOverlevelMiss(world, dummy)) {
    return;
  }
  const player = world.player;
  const critChance =
    player.critChance + (kind === 'fireball' ? fireballCritBonus(world) : 0);
  const crit = Math.random() < critChance;
  const baseMult =
    kind === 'fireball' ? PLAYER.fireballDamageMult : PLAYER.frostNovaDamageMult;
  const skillMult =
    baseMult *
    skillMultForAttack(world, kind) *
    outgoingDamageMult(world, kind, dummy) *
    (kind === 'fireball' ? legendaryFireballDamageMult(world) : 1);
  const critMult = critMultOf(player, world);
  const value = Math.max(
    1,
    Math.round(spellDamage(player.sp, dummy.def, skillMult, crit, critMult) * playerOutgoingVsDummy(world, dummy)),
  );
  const wasAlive = dummy.hp > 0;
  dummy.hp = Math.max(0, dummy.hp - value);
  dummy.flash = kind === 'fireball' ? 0.26 : 0.28;
  if (kind === 'frost-nova') {
    dummy.stunT = Math.max(dummy.stunT, frostNovaStunOf(world));
    dummy.attackT = 0;
    dummy.state = 'idle';
  }
  const push = player.facing * (kind === 'fireball' ? 0.28 : 0.12);
  dummy.x += push;
  world.shake = Math.max(world.shake, crit ? 0.95 : kind === 'frost-nova' ? 0.85 : 0.55);
  spawnPopup(world, dummy.x, dummy.y + dummy.h + 0.2, value, dummy.hp <= 0, crit);
  spawnDust(world, dummy.x, dummy.y + 0.1);
  sfx.play(crit ? 'crit' : 'hit');
  sfx.play(kind === 'frost-nova' ? 'bash' : 'slam');
  notePlayerHitStop(world, kind === 'frost-nova' ? 0.05 : 0.042, crit);
  finishKill(world, dummy, wasAlive);
}

export function applyPlayerProjectileHit(
  world: World,
  shot: { damage: number; visual?: string; playerSkill?: AttackKind },
  dummy: Dummy,
): void {
  if (rollOverlevelMiss(world, dummy)) {
    return;
  }
  const player = world.player;
  if (shot.visual === 'arrow' || shot.visual === 'arrow-fan') {
    applyHunterArrowHit(world, shot, dummy);
    return;
  }
  if (shot.visual === 'pyroblast' || shot.playerSkill === 'pyroblast') {
    applyPyroblastHit(world, dummy);
    return;
  }
  if (shot.visual === 'ice-lance' || shot.playerSkill === 'ice-lance') {
    applyIceLanceHit(world, shot, dummy);
    return;
  }
  const isArcane = shot.visual === 'arcane';
  const kind: AttackKind = isArcane ? 'arcane-missiles' : 'fireball';
  const critChance = player.critChance + (kind === 'fireball' ? fireballCritBonus(world) : 0);
  const crit = Math.random() < critChance;
  const baseMult = isArcane ? PLAYER.arcaneMissilesDamageMult : PLAYER.fireballDamageMult;
  const skillMult =
    baseMult *
    skillMultForAttack(world, kind) *
    outgoingDamageMult(world, kind, dummy) *
    (kind === 'fireball' ? legendaryFireballDamageMult(world) : 1);
  const critMult = critMultOf(player, world);
  const value = Math.max(
    1,
    Math.round(
      spellDamage(Math.max(shot.damage, player.sp), dummy.def, skillMult, crit, critMult) *
        playerOutgoingVsDummy(world, dummy),
    ),
  );
  const wasAlive = dummy.hp > 0;
  dummy.hp = Math.max(0, dummy.hp - value);
  dummy.flash = isArcane ? 0.2 : 0.26;
  dummy.x += player.facing * (isArcane ? 0.12 : 0.28);
  world.shake = Math.max(
    world.shake,
    crit ? (world.specId === 'fire' && kind === 'fireball' ? 1.05 : 0.9) : 0.45,
  );
  spawnPopup(world, dummy.x, dummy.y + dummy.h + 0.2, value, dummy.hp <= 0, crit);
  spawnDust(world, dummy.x, dummy.y + 0.1);
  sfx.play(crit ? 'crit' : 'hit');
  notePlayerHitStop(world, isArcane ? 0.028 : 0.04, crit);
  finishKill(world, dummy, wasAlive);
}

function applyPyroblastHit(world: World, dummy: Dummy): void {
  const player = world.player;
  const critChance = player.critChance + fireballCritBonus(world);
  const crit = Math.random() < critChance;
  const skillMult =
    PLAYER.pyroblastDamageMult *
    skillMultForAttack(world, 'pyroblast') *
    outgoingDamageMult(world, 'pyroblast', dummy);
  const critMult = critMultOf(player, world);
  const value = Math.max(
    1,
    Math.round(spellDamage(player.sp, dummy.def, skillMult, crit, critMult) * playerOutgoingVsDummy(world, dummy)),
  );
  const wasAlive = dummy.hp > 0;
  dummy.hp = Math.max(0, dummy.hp - value);
  dummy.flash = 0.32;
  dummy.x += player.facing * 0.35;
  world.shake = Math.max(world.shake, crit ? 1.25 : 0.85);
  spawnPopup(world, dummy.x, dummy.y + dummy.h + 0.25, value, dummy.hp <= 0, crit);
  spawnDust(world, dummy.x, dummy.y + 0.1);
  spawnDust(world, dummy.x + 0.2, dummy.y + 0.15);
  sfx.play(crit ? 'crit' : 'slam');
  notePlayerHitStop(world, 0.055, crit);
  finishKill(world, dummy, wasAlive);
}

function applyHunterArrowHit(
  world: World,
  shot: { damage: number; visual?: string; playerSkill?: AttackKind },
  dummy: Dummy,
): void {
  const player = world.player;
  const kind: AttackKind =
    shot.playerSkill ?? (shot.visual === 'arrow-fan' ? 'multi-shot' : 'aimed-shot');
  const crit = Math.random() < player.critChance;
  const baseMult =
    kind === 'multi-shot'
      ? PLAYER.multiShotDamageMult
      : kind === 'disengage'
        ? PLAYER.disengageDamageMult
        : kind === 'concussive-shot'
          ? PLAYER.concussiveDamageMult
          : kind === 'serpent-sting'
            ? PLAYER.serpentStingDamageMult
            : PLAYER.aimedShotDamageMult;
  const skillMult =
    baseMult * skillMultForAttack(world, kind) * outgoingDamageMult(world, kind, dummy);
  const critMult =
    critMultOf(player, world) * (world.specId === 'marksmanship' && crit ? 1.08 : 1);
  const value = Math.max(
    1,
    Math.round(
      physicalDamage(Math.max(shot.damage, player.atk), dummy.def, skillMult, crit, critMult) *
        playerOutgoingVsDummy(world, dummy),
    ),
  );
  const wasAlive = dummy.hp > 0;
  dummy.hp = Math.max(0, dummy.hp - value);
  dummy.flash = 0.22;
  if (kind === 'concussive-shot') {
    const knock =
      skillLevelOf(world, 'concussive-shot') >= 5
        ? PLAYER.concussiveKnockbackMax
        : PLAYER.concussiveKnockback;
    const knockMult = world.specId === 'mobility' ? 1.2 : 1;
    dummy.x += player.facing * knock * knockMult;
    dummy.stunT = Math.max(dummy.stunT, PLAYER.concussiveInterrupt);
    dummy.attackT = 0;
    dummy.state = 'idle';
    world.shake = Math.max(world.shake, crit ? 1.05 : 0.72);
    sfx.play('bash');
  } else {
    dummy.x += player.facing * (kind === 'serpent-sting' ? 0.12 : 0.18);
    world.shake = Math.max(world.shake, crit ? 0.88 : 0.42);
  }
  if (kind === 'serpent-sting') {
    applySerpentSting(world, dummy);
  }
  spawnPopup(world, dummy.x, dummy.y + dummy.h + 0.2, value, dummy.hp <= 0, crit);
  spawnDust(world, dummy.x, dummy.y + 0.1);
  sfx.play(crit ? 'crit' : 'hit');
  if (player.classId === 'hunter') {
    addRage(player, PLAYER.focusOnHit * rageGainMult(world, 'hit'));
  }
  const stop =
    kind === 'multi-shot' || kind === 'disengage'
      ? 0.026
      : kind === 'concussive-shot'
        ? 0.045
        : kind === 'serpent-sting'
          ? 0.03
          : 0.036;
  notePlayerHitStop(world, stop, crit);
  finishKill(world, dummy, wasAlive);
}

function applyIceLanceHit(
  world: World,
  shot: { bounceLeft?: number; damage?: number },
  dummy: Dummy,
): void {
  const player = world.player;
  const frozen = dummy.stunT > 0;
  const crit = Math.random() < player.critChance;
  const baseMult = frozen ? PLAYER.iceLanceFrozenMult : PLAYER.iceLanceDamageMult;
  const skillMult =
    baseMult * skillMultForAttack(world, 'ice-lance') * outgoingDamageMult(world, 'ice-lance', dummy);
  const critMult = critMultOf(player, world);
  const value = Math.max(
    1,
    Math.round(spellDamage(player.sp, dummy.def, skillMult, crit, critMult) * playerOutgoingVsDummy(world, dummy)),
  );
  const wasAlive = dummy.hp > 0;
  dummy.hp = Math.max(0, dummy.hp - value);
  dummy.flash = 0.28;
  dummy.x += player.facing * 0.16;
  if (!frozen) {
    dummy.stunT = Math.max(dummy.stunT, 0.35);
    dummy.attackT = 0;
    dummy.state = 'idle';
  }
  world.shake = Math.max(world.shake, frozen ? (crit ? 1.1 : 0.75) : crit ? 0.7 : 0.4);
  spawnPopup(world, dummy.x, dummy.y + dummy.h + 0.22, value, dummy.hp <= 0, crit);
  spawnDust(world, dummy.x, dummy.y + 0.1);
  sfx.play(crit ? 'crit' : 'hit');
  notePlayerHitStop(world, frozen ? 0.048 : 0.038, crit);
  finishKill(world, dummy, wasAlive);
  const bounceLeft = shot.bounceLeft ?? 0;
  if (bounceLeft > 0 && skillLevelOf(world, 'ice-lance') >= 5) {
    tryIceLanceBounce(world, dummy, bounceLeft - 1);
  }
}

function tryIceLanceBounce(world: World, from: Dummy, bounceLeft: number): void {
  const player = world.player;
  let best: Dummy | null = null;
  let bestDist: number = PLAYER.iceLanceBounceRange;
  for (const dummy of world.dummies) {
    if (dummy.hp <= 0 || dummy.id === from.id) {
      continue;
    }
    const dx = dummy.x - from.x;
    const dy = dummy.y - from.y;
    const dist = Math.hypot(dx, dy);
    if (dist < bestDist) {
      bestDist = dist;
      best = dummy;
    }
  }
  if (!best) {
    return;
  }
  const dx = best.x - from.x;
  const dir = dx === 0 ? player.facing : (Math.sign(dx) as 1 | -1);
  world.projectileId += 1;
  world.projectiles.push({
    id: world.projectileId,
    x: from.x + dir * 0.35,
    y: from.y + from.h * 0.45,
    vx: dir * PLAYER.iceLanceSpeed,
    damage: player.sp,
    age: 0,
    life: PLAYER.iceLanceLife * 0.85,
    radius: PLAYER.iceLanceRadius,
    owner: 'player',
    visual: 'ice-lance',
    playerSkill: 'ice-lance',
    bounceLeft,
  });
}

export function spawnIceLance(world: World): void {
  const player = world.player;
  const bounceLeft = skillLevelOf(world, 'ice-lance') >= 5 ? 1 : 0;
  world.projectileId += 1;
  world.projectiles.push({
    id: world.projectileId,
    x: player.x + player.facing * 0.68,
    y: player.y + player.h * 0.55,
    vx: player.facing * PLAYER.iceLanceSpeed,
    damage: player.sp,
    age: 0,
    life: PLAYER.iceLanceLife,
    radius: PLAYER.iceLanceRadius,
    owner: 'player',
    visual: 'ice-lance',
    playerSkill: 'ice-lance',
    bounceLeft,
  });
  player.combatT = PLAYER.combatLock;
}

export function spawnPlayerFireball(world: World): void {
  const player = world.player;
  world.projectileId += 1;
  world.projectiles.push({
    id: world.projectileId,
    x: player.x + player.facing * 0.65,
    y: player.y + player.h * 0.55,
    vx: player.facing * PLAYER.fireballSpeed,
    damage: player.sp,
    age: 0,
    life: PLAYER.fireballLife,
    radius: PLAYER.fireballRadius * legendaryFireballRadiusMult(world),
    owner: 'player',
    visual: 'fireball',
  });
  player.combatT = PLAYER.combatLock;
}

export function spawnPyroblast(world: World): void {
  const player = world.player;
  world.projectileId += 1;
  world.projectiles.push({
    id: world.projectileId,
    x: player.x + player.facing * 0.7,
    y: player.y + player.h * 0.58,
    vx: player.facing * PLAYER.pyroblastSpeed,
    damage: player.sp,
    age: 0,
    life: PLAYER.pyroblastLife,
    radius: PLAYER.pyroblastRadius,
    owner: 'player',
    visual: 'pyroblast',
    playerSkill: 'pyroblast',
  });
  player.combatT = PLAYER.combatLock;
  world.shake = Math.max(world.shake, 0.5);
  sfx.play('slam');
}

export function activateRapidFire(world: World): void {
  const player = world.player;
  player.rapidFireT = PLAYER.rapidFireBuff * (1 + (skillMultForAttack(world, 'rapid-fire') - 1) * 0.35);
  player.rapidFireAcc = 0.05;
  player.combatT = PLAYER.combatLock;
  spawnDust(world, player.x + player.facing * 0.4, player.y + 0.3);
  world.shake = Math.max(world.shake, 0.35);
  world.levelToastT = 1;
  world.levelToastText = '急速射击';
  sfx.play('slam');
}

export function stepRapidFire(world: World, dt: number): void {
  const player = world.player;
  if (player.rapidFireT <= 0) {
    return;
  }
  player.rapidFireT = Math.max(0, player.rapidFireT - dt);
  if (player.hp <= 0) {
    return;
  }
  // 急速期间技能 CD 略快
  const haste = 1.55;
  player.slamCd = Math.max(0, player.slamCd - dt * (haste - 1));
  player.bashCd = Math.max(0, player.bashCd - dt * (haste - 1));
  player.skillCd2 = Math.max(0, player.skillCd2 - dt * (haste - 1));
  player.skillCd3 = Math.max(0, player.skillCd3 - dt * (haste - 1));
  player.rapidFireAcc -= dt;
  if (player.rapidFireAcc > 0) {
    return;
  }
  player.rapidFireAcc = rapidFireIntervalOf(world);
  spawnHunterArrow(world, 'aimed-shot');
  sfx.play('hit');
}

export function spawnArcaneMissile(world: World): void {
  const player = world.player;
  world.projectileId += 1;
  world.projectiles.push({
    id: world.projectileId,
    x: player.x + player.facing * 0.55,
    y: player.y + player.h * 0.6 + (Math.random() - 0.5) * 0.15,
    vx: player.facing * PLAYER.arcaneMissilesSpeed,
    damage: player.sp,
    age: 0,
    life: PLAYER.arcaneMissilesLife,
    radius: PLAYER.arcaneMissilesRadius,
    owner: 'player',
    visual: 'arcane',
  });
  player.combatT = PLAYER.combatLock;
}

export function beginArcaneMissiles(world: World): void {
  spawnArcaneMissile(world);
  world.player.missileBurstLeft = PLAYER.arcaneMissilesCount - 1;
  world.player.missileBurstAcc = PLAYER.arcaneMissilesInterval;
}

export function stepMissileBurst(world: World, dt: number): void {
  const player = world.player;
  if (player.missileBurstLeft <= 0) {
    return;
  }
  player.missileBurstAcc -= dt;
  if (player.missileBurstAcc > 0) {
    return;
  }
  spawnArcaneMissile(world);
  player.missileBurstLeft -= 1;
  player.missileBurstAcc = PLAYER.arcaneMissilesInterval;
  sfx.play('hit');
}

/** 沿朝向步进闪现，遇平台阻挡则缩短。 */
export function blinkPlayer(world: World, player: Player): void {
  stepDisplace(world, player, player.facing, PLAYER.blinkRange, PLAYER.blinkIFrame);
}

/** 后跳：背向位移并开火。 */
export function disengagePlayer(world: World, player: Player): void {
  stepDisplace(world, player, -player.facing, disengageRangeOf(world), PLAYER.disengageIFrame);
  spawnHunterArrow(world, 'disengage');
  if (world.specId === 'mobility') {
    player.vx = -player.facing * 4.5;
  }
}

function stepDisplace(
  world: World,
  player: Player,
  dir: number,
  maxDist: number,
  iFrame: number,
): void {
  const step = 0.12;
  let traveled = 0;
  const startX = player.x;
  const sign = dir >= 0 ? 1 : -1;
  spawnDust(world, player.x, player.y + 0.2);
  while (traveled + step <= maxDist) {
    player.x += sign * step;
    let blocked = false;
    for (const plat of world.platforms) {
      if (!overlaps(player, plat)) {
        continue;
      }
      const foot = player.y;
      const platTop = plat.y + plat.h;
      if (foot >= platTop - 0.08) {
        continue;
      }
      blocked = true;
      break;
    }
    if (blocked) {
      player.x -= sign * step;
      break;
    }
    traveled += step;
  }
  if (Math.abs(player.x - startX) < 0.2) {
    player.x = startX + sign * Math.min(0.8, maxDist);
  }
  player.prevX = player.x;
  player.vx = sign * 2.2;
  player.iFrame = Math.max(player.iFrame, iFrame);
  player.combatT = PLAYER.combatLock;
  spawnDust(world, player.x, player.y + 0.25);
  spawnDust(world, startX, player.y + 0.2);
  world.shake = Math.max(world.shake, 0.35);
  sfx.play('roll');
}

export function spawnHunterArrow(
  world: World,
  kind: 'aimed-shot' | 'disengage' | 'multi-shot' | 'concussive-shot' | 'serpent-sting',
  vy = 0,
): void {
  const player = world.player;
  const isFan = kind === 'multi-shot';
  const isConc = kind === 'concussive-shot';
  const isSerpent = kind === 'serpent-sting';
  world.projectileId += 1;
  world.projectiles.push({
    id: world.projectileId,
    x: player.x + player.facing * 0.7,
    y: player.y + player.h * 0.55,
    vx: player.facing * (isConc || isSerpent ? PLAYER.aimedShotSpeed * 1.05 : PLAYER.aimedShotSpeed),
    vy,
    damage: player.atk,
    age: 0,
    life: PLAYER.aimedShotLife,
    radius: isConc ? PLAYER.aimedShotRadius * 1.15 : PLAYER.aimedShotRadius,
    owner: 'player',
    visual: isFan ? 'arrow-fan' : 'arrow',
    playerSkill: kind,
  });
}

export function spawnMultiShot(world: World): void {
  const spread = PLAYER.multiShotSpread;
  const count = PLAYER.multiShotCount;
  for (let i = 0; i < count; i += 1) {
    const t = count <= 1 ? 0 : (i / (count - 1)) * 2 - 1;
    spawnHunterArrow(world, 'multi-shot', t * spread);
  }
}

export function placeHunterTrap(world: World): void {
  pushTrap(world, {
    kind: 'snare',
    life: PLAYER.trapLife,
    radius: PLAYER.trapRadius,
    fuse: 0,
  });
}

export function placeExplosiveTrap(world: World): void {
  pushTrap(world, {
    kind: 'explosive',
    life: PLAYER.explosiveTrapLife,
    radius: PLAYER.explosiveTrapRadius,
    fuse: PLAYER.explosiveTrapFuse,
  });
}

function pushTrap(
  world: World,
  opts: { kind: 'snare' | 'explosive'; life: number; radius: number; fuse: number },
): void {
  const player = world.player;
  const cap = trapCapOf(world);
  while (world.traps.length >= cap) {
    world.traps.shift();
  }
  world.trapId += 1;
  world.traps.push({
    id: world.trapId,
    x: player.x,
    y: player.y + 0.05,
    life: opts.life,
    radius: opts.radius,
    kind: opts.kind,
    fuse: opts.fuse,
  });
  spawnDust(world, player.x, player.y + 0.05);
  spawnDust(world, player.x + 0.2, player.y + 0.05);
  world.shake = Math.max(world.shake, opts.kind === 'explosive' ? 0.38 : 0.28);
  sfx.play('land');
}

export function stepHunterTraps(world: World, dt: number): void {
  if (!world.traps?.length) {
    return;
  }
  const keep = [];
  for (const trap of world.traps) {
    trap.life -= dt;
    if (trap.kind === 'explosive') {
      trap.fuse -= dt;
      if (trap.life <= 0) {
        detonateExplosiveTrap(world, trap);
        continue;
      }
      if (trap.fuse > 0) {
        keep.push(trap);
        continue;
      }
      let touched = false;
      for (const dummy of world.dummies) {
        if (dummy.hp <= 0) {
          continue;
        }
        const dx = dummy.x - trap.x;
        const dy = dummy.y + dummy.h * 0.2 - trap.y;
        if (dx * dx + dy * dy <= trap.radius * trap.radius) {
          touched = true;
          break;
        }
      }
      if (touched) {
        detonateExplosiveTrap(world, trap);
      } else {
        keep.push(trap);
      }
      continue;
    }
    if (trap.life <= 0) {
      continue;
    }
    let triggered = false;
    for (const dummy of world.dummies) {
      if (dummy.hp <= 0) {
        continue;
      }
      const dx = dummy.x - trap.x;
      const dy = dummy.y + dummy.h * 0.2 - trap.y;
      if (dx * dx + dy * dy <= trap.radius * trap.radius) {
        dummy.stunT = Math.max(dummy.stunT, PLAYER.trapRoot);
        dummy.attackT = 0;
        dummy.state = 'idle';
        dummy.flash = Math.max(dummy.flash, 0.3);
        spawnDust(world, dummy.x, dummy.y + 0.1);
        sfx.play('bash');
        triggered = true;
        break;
      }
    }
    if (!triggered) {
      keep.push(trap);
    }
  }
  world.traps = keep;
}

function detonateExplosiveTrap(
  world: World,
  trap: { x: number; y: number },
): void {
  const player = world.player;
  const blast = PLAYER.explosiveTrapBlast * legendaryExplosiveBlastRadiusMult(world);
  const knock =
    skillLevelOf(world, 'explosive-trap') >= 3 ? PLAYER.explosiveTrapKnockback : 0.55;
  tryHitBreakables(world, trap.x, trap.y + 0.2, blast, blast);
  for (const dummy of world.dummies) {
    if (dummy.hp <= 0) {
      continue;
    }
    const dx = dummy.x - trap.x;
    const dy = dummy.y + dummy.h * 0.2 - trap.y;
    if (dx * dx + dy * dy > blast * blast) {
      continue;
    }
    const crit = Math.random() < player.critChance;
    const skillMult =
      PLAYER.explosiveTrapDamageMult *
      skillMultForAttack(world, 'explosive-trap') *
      outgoingDamageMult(world, 'explosive-trap', dummy);
    const critMult = critMultOf(player, world);
    const value = Math.max(
      1,
      Math.round(
        physicalDamage(player.atk, dummy.def, skillMult, crit, critMult) *
          playerOutgoingVsDummy(world, dummy),
      ),
    );
    const wasAlive = dummy.hp > 0;
    dummy.hp = Math.max(0, dummy.hp - value);
    dummy.flash = Math.max(dummy.flash, 0.34);
    dummy.stunT = Math.max(dummy.stunT, world.specId === 'survival' ? 0.55 : 0.28);
    dummy.attackT = 0;
    dummy.state = 'idle';
    const dir = dx === 0 ? player.facing : Math.sign(dx);
    dummy.x += dir * knock;
    spawnPopup(world, dummy.x, dummy.y + dummy.h + 0.2, value, dummy.hp <= 0, crit);
    spawnDust(world, dummy.x, dummy.y + 0.1);
    sfx.play(crit ? 'crit' : 'hit');
    finishKill(world, dummy, wasAlive);
  }
  for (let i = 0; i < 6; i += 1) {
    const a = (i / 6) * Math.PI * 2;
    spawnDust(world, trap.x + Math.cos(a) * 0.85, trap.y + 0.08 + Math.sin(a) * 0.12);
  }
  world.shake = Math.max(world.shake, 1.05);
  sfx.play('slam');
}

export function applyFrostNova(world: World): void {
  const player = world.player;
  const r = PLAYER.frostNovaRadius;
  for (const dummy of world.dummies) {
    if (dummy.hp <= 0) {
      continue;
    }
    const dx = dummy.x - player.x;
    const dy = dummy.y - player.y;
    if (dx * dx + dy * dy <= r * r) {
      applySpellHit(world, dummy, 'frost-nova');
    }
  }
  tryHitBreakables(world, player.x, player.y + 0.25, r, r);
  for (let i = 0; i < 5; i += 1) {
    const a = (i / 5) * Math.PI * 2;
    spawnDust(world, player.x + Math.cos(a) * 0.9, player.y + 0.1 + Math.sin(a) * 0.2);
  }
  world.shake = Math.max(world.shake, 0.72);
}

export function spawnSkillDust(world: World, player: Player, kind: AttackKind): void {
  const ahead =
    player.facing *
    (kind === 'bash' || kind === 'frost-nova' ? 0.55 : kind === 'fireball' ? 0.7 : 0.35);
  spawnDust(world, player.x + ahead, player.y + 0.08);
  spawnDust(world, player.x - player.facing * 0.2, player.y + 0.06);
}

export function applyEnemyHit(world: World, dummy: Dummy): boolean {
  const before = world.player.hp;
  const ok = hurtPlayer(world, dummy.atk, {
    knockbackFromX: dummy.x,
    shake: 0.9,
    sourceDummy: dummy,
  });
  if (ok) {
    dummy.struck = true;
    const dealt = Math.max(0, before - world.player.hp);
    onEliteHitPlayer(dummy, dealt);
  }
  return ok;
}

export function hurtPlayer(
  world: World,
  rawAtk: number,
  opts?: {
    knockbackFromX?: number;
    shake?: number;
    skillMult?: number;
    /** 已算好的直接伤害（跳过 ATK 公式） */
    flatDamage?: number;
    /** 来源敌人（越级受伤加成） */
    sourceDummy?: Dummy;
  },
): boolean {
  const player = world.player;
  if (player.hp <= 0 || player.iFrame > 0 || player.state === 'roll' || player.state === 'dead') {
    return false;
  }
  const gapIn = opts?.sourceDummy
    ? playerIncomingFromDummy(world, opts.sourceDummy)
    : playerIncomingFromZone(world);
  const value =
    opts?.flatDamage != null
      ? Math.max(1, Math.round(opts.flatDamage * gapIn))
      : Math.round(
          physicalDamage(rawAtk, player.def, opts?.skillMult ?? 1, false, 1.5) *
            incomingDamageMult(world) *
            gapIn,
        );
  let remaining = value;
  if (player.manaShieldOn && player.manaShieldHp > 0 && remaining > 0) {
    const absorbed = Math.min(player.manaShieldHp, remaining);
    player.manaShieldHp -= absorbed;
    remaining -= absorbed;
    if (absorbed > 0) {
      spawnPopup(world, player.x, player.y + player.h + 0.28, Math.round(absorbed), false, false);
      spawnDust(world, player.x, player.y + 0.4);
      sfx.play('bash');
    }
    if (player.manaShieldHp <= 0) {
      player.manaShieldOn = false;
      world.levelToastT = 1;
      world.levelToastText = '法力护盾破碎';
    }
  }
  if (remaining <= 0) {
    player.hurtT = PLAYER.hurtDuration * 0.45;
    player.iFrame = PLAYER.hurtIFrame * 0.55;
    player.combatT = PLAYER.combatLock;
    world.shake = Math.max(world.shake, (opts?.shake ?? 0.7) * 0.45);
    return true;
  }
  player.hp = Math.max(0, player.hp - remaining);
  player.hurtT = PLAYER.hurtDuration;
  player.iFrame = PLAYER.hurtIFrame;
  player.attackT = 0;
  player.rollT = 0;
  addRage(player, PLAYER.rageOnHurt * rageGainMult(world, 'hurt'));
  if (opts?.knockbackFromX !== undefined) {
    player.facing = opts.knockbackFromX >= player.x ? 1 : -1;
    player.vx = -player.facing * PLAYER.knockback;
    player.vy = 3.4;
  }
  player.hitStop = 0.06;
  player.state = player.hp <= 0 ? 'dead' : 'hurt';
  if (player.hp <= 0) {
    player.awaitRespawn = true;
    player.deadT = 0;
    player.deathCause = 'combat';
    player.manaShieldOn = false;
    player.manaShieldHp = 0;
    applyDeathDurabilityLoss(world);
    applyDeathLootLoss(world);
    applyGearStats(player, world);
  }
  world.shake = Math.max(world.shake, opts?.shake ?? 0.7);
  spawnPopup(world, player.x, player.y + player.h + 0.15, remaining, player.hp <= 0, false);
  spawnHurtDust(world, player);
  sfx.play(player.hp <= 0 ? 'die' : 'hurt');
  return true;
}

export function spawnDust(world: World, x: number, y: number): void {
  world.dustId += 1;
  world.dusts.push({
    id: world.dustId,
    x,
    y,
    age: 0,
  });
}

export function spawnLandDust(world: World, player: Player): void {
  spawnDust(world, player.x, player.y + 0.08);
}

export function playLevelUpFx(world: World, opts?: { levels?: number }): void {
  const player = world.player;
  const levels = Math.max(1, opts?.levels ?? 1);
  player.levelFxT = 1.4;
  world.shake = Math.max(world.shake, 1.15);
  world.levelToastT = 2.4;
  world.levelToastText = `升级！Lv.${player.level}`;
  world.levelUpOpen = player.hp > 0;
  world.levelUpGainAttr = levels * 4;
  world.levelUpGainSkill = levels;
  world.popupId += 1;
  world.popups.push({
    id: world.popupId,
    x: player.x,
    y: player.y + player.h + 0.35,
    value: player.level,
    age: 0,
    lethal: false,
    crit: true,
    kind: 'level',
  });
  for (let i = 0; i < 6; i += 1) {
    const ang = (i / 6) * Math.PI * 2;
    spawnDust(world, player.x + Math.cos(ang) * 0.55, player.y + 0.1 + Math.sin(ang) * 0.15);
  }
  sfx.play('levelup');
}

function spawnHurtDust(world: World, player: Player): void {
  spawnDust(world, player.x, player.y + 0.1);
  spawnDust(world, player.x - player.facing * 0.38, player.y + 0.06);
}

export function stepPopups(world: World, dt: number): void {
  const keep = [];
  for (const popup of world.popups) {
    popup.age += dt;
    const life = popup.kind === 'level' ? LEVEL_POPUP_LIFE : POPUP_LIFE;
    if (popup.age < life) {
      keep.push(popup);
    }
  }
  world.popups = keep;
  const dustKeep = [];
  for (const dust of world.dusts) {
    dust.age += dt;
    if (dust.age < DUST_LIFE) {
      dustKeep.push(dust);
    }
  }
  world.dusts = dustKeep;
  world.shake = Math.max(0, world.shake - dt * 4.2);
  world.player.levelFxT = Math.max(0, world.player.levelFxT - dt);
  world.levelToastT = Math.max(0, world.levelToastT - dt);
  world.zoneAnnounceT = Math.max(0, world.zoneAnnounceT - dt);
}
