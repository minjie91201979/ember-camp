import { sfx } from '../../audio/sfx';
import { PLAYER, attackDurationOf } from '../config';
import type { InputFrame } from '../../input/keyboard';
import {
  activateSprint,
  activateVanish,
  activateRapidFire,
  activateManaShield,
  activateBattleShout,
  activateSliceAndDice,
  applyFrostNova,
  applyPlayerHit,
  applyWhirlwind,
  applyCleaveHits,
  applyFanOfKnives,
  beginArcaneMissiles,
  blinkPlayer,
  chargePlayer,
  disengagePlayer,
  placeBlizzard,
  placeHunterTrap,
  placeExplosiveTrap,
  spawnDust,
  spawnHunterArrow,
  spawnIceLance,
  spawnLandDust,
  spawnMultiShot,
  spawnPlayerFireball,
  spawnPyroblast,
  spawnSkillDust,
  spendRage,
  stepBlizzards,
  stepHunterTraps,
  stepManaShield,
  stepMissileBurst,
  stepPopups,
  stepRage,
  stepRapidFire,
  stepRogueTimers,
  stepWarriorBuffs,
} from './combat';
import { stepDummies } from './dummy-ai';
import { applyDeathDurabilityLoss } from './gear-durability';
import { toggleInventory, usePotion, applyGearStats } from './inventory';
import {
  equippedLegendaryEffect,
  legendaryBashCost,
  legendaryBashDash,
  legendaryBashIFrame,
  legendaryReachBonus,
  legendarySlamCooldownMult,
  legendarySlamDash,
  toggleCatalog,
} from './legendary';
import { toggleCharacter } from './attributes';
import { isSkillId, SKILL_DEFS, skillLevelOf, skillResourceCost, type SkillId, toggleSkills } from './skills';
import { applyDeathLootLoss, stepLoot, stepLootFlies } from './loot';
import { closeCamp, syncCampProximity, syncHubPortalProximity, tryOpenCamp, tryOpenHubPortal } from './camp';
import { closeAllPanels, isAnyPanelOpen } from './ui-panels';
import { hitboxOverlaps, moveAndCollide } from './physics';
import { chooseRespawn, syncBannerCheckpoint } from './respawn';
import { stepFallWarn } from './fall-warn';
import {
  bashCooldownOf,
  blinkCooldownOf,
  disengageCooldownOf,
  poisonBladeCooldownOf,
  rapidFireMoveMult,
  shadowStrikeCooldownOf,
  slamCooldownOf,
  sprintCooldownOf,
  trapCooldownOf,
  explosiveTrapCooldownOf,
  vanishCooldownOf,
  chargeCooldownOf,
} from './specialization';
import { syncSecretProximity, tryClaimSecret } from './secrets';
import { tryHitBreakables } from './breakables';
import { advanceTutorial, maybeGuidePoints } from './tutorial';
import type { AttackKind, Player, World } from '../types';

let footAcc = 0;

function toggleSettings(world: World): void {
  if (world.player.hp <= 0) {
    return;
  }
  world.settingsOpen = !world.settingsOpen;
  if (world.settingsOpen) {
    world.invOpen = false;
    world.charOpen = false;
    world.skillOpen = false;
    world.catalogOpen = false;
    world.campOpen = null;
    world.specPickOpen = false;
    world.specNodePickTier = null;
    world.levelUpOpen = false;
    sfx.play('ui');
  }
}

export function stepPlayer(world: World, input: InputFrame, dt: number): void {
  const player = world.player;
  const wasGrounded = player.onGround;
  player.prevX = player.x;
  player.prevY = player.y;

  stepPopups(world, dt);
  stepLootFlies(world, dt);
  stepRage(world, dt);
  stepHunterTraps(world, dt);
  stepBlizzards(world, dt);
  stepRogueTimers(world, dt);
  stepRapidFire(world, dt);
  stepManaShield(world, dt);
  stepWarriorBuffs(world, dt);
  player.rollCd = Math.max(0, player.rollCd - dt);
  const sliceHaste = player.sliceT > 0 ? PLAYER.sliceAndDiceAtkHaste : 1;
  player.attackCd = Math.max(0, player.attackCd - dt * sliceHaste);
  player.slamCd = Math.max(0, player.slamCd - dt * sliceHaste);
  player.bashCd = Math.max(0, player.bashCd - dt * sliceHaste);
  player.skillCd2 = Math.max(0, player.skillCd2 - dt * sliceHaste);
  player.skillCd3 = Math.max(0, player.skillCd3 - dt * sliceHaste);
  stepMissileBurst(world, dt);
  player.rageWarnT = Math.max(0, player.rageWarnT - dt);
  player.iFrame = Math.max(0, player.iFrame - dt);
  player.drinkT = Math.max(0, player.drinkT - dt);
  player.potionCd = Math.max(0, player.potionCd - dt);
  player.slowT = Math.max(0, player.slowT - dt);
  player.petrifyT = Math.max(0, player.petrifyT - dt);
  player.coyote = player.onGround ? PLAYER.coyoteTime : Math.max(0, player.coyote - dt);
  if (input.jumpPressed) {
    player.jumpBuffer = PLAYER.jumpBuffer;
  } else {
    player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);
  }

  if (player.hp <= 0) {
    stepDead(world, player, input, dt);
    return;
  }

  if (input.escapePressed) {
    if (closeAllPanels(world)) {
      stepLoot(world, false);
      return;
    }
    toggleSettings(world);
    stepLoot(world, false);
    return;
  }

  if (input.inventoryPressed) {
    toggleInventory(world);
  }
  if (input.characterPressed) {
    toggleCharacter(world);
  }
  if (input.skillsPressed) {
    toggleSkills(world);
  }
  if (input.catalogPressed) {
    toggleCatalog(world);
  }
  if (input.settingsPressed) {
    toggleSettings(world);
  }

  if (player.hitStop > 0) {
    player.hitStop -= dt;
    stepLoot(world, false);
    stepDummies(world, dt);
    return;
  }

  if (world.campOpen) {
    if (input.interactPressed) {
      closeCamp(world);
    }
    stepLoot(world, false);
    return;
  }

  if (isAnyPanelOpen(world)) {
    stepLoot(world, false);
    return;
  }

  if (player.hurtT > 0) {
    player.hurtT -= dt;
    player.state = 'hurt';
    player.vy -= PLAYER.gravity * dt;
    player.vy = Math.max(player.vy, -PLAYER.maxFall);
    moveAndCollide(player, world.platforms, dt);
    if (player.y < -2.8) {
      killByFall(world);
    }
    stepLoot(world, false);
    syncBannerCheckpoint(world);
    stepFallWarn(world, dt);
    stepDummies(world, dt);
    return;
  }

  const jumped = tryJump(player);
  if (jumped) {
    advanceTutorial(world, 'jump');
  }
  const slowMult = player.petrifyT > 0 ? 0.22 : player.slowT > 0 ? 0.48 : 1;
  const sprintMult = player.sprintT > 0 ? PLAYER.sprintSpeedMult : 1;
  const rapidMult = rapidFireMoveMult(world);
  const shoutMult =
    player.warShoutT > 0 && skillLevelOf(world, 'battle-shout') >= 3
      ? PLAYER.battleShoutMove
      : 1;
  if (player.rollT > 0 && !jumped) {
    player.rollT -= dt;
    player.vx = PLAYER.rollSpeed * slowMult * player.facing;
    player.vy -= PLAYER.gravity * dt;
    player.vy = Math.max(player.vy, -PLAYER.maxFall);
    moveAndCollide(player, world.platforms, dt);
    player.state = 'roll';
    if (player.rollT <= 0) {
      player.rollCd = PLAYER.rollCooldown;
      advanceTutorial(world, 'roll');
    }
    noteLand(world, player, wasGrounded);
    if (player.y < -2.8) {
      killByFall(world);
    }
    stepLoot(world, false);
    syncBannerCheckpoint(world);
    stepFallWarn(world, dt);
    stepDummies(world, dt);
    return;
  }

  if (player.drinkT > 0 && !jumped) {
    player.vx *= 0.7;
    player.vy -= PLAYER.gravity * dt;
    player.vy = Math.max(player.vy, -PLAYER.maxFall);
    moveAndCollide(player, world.platforms, dt);
    player.state = 'drink';
    noteLand(world, player, wasGrounded);
    stepLoot(world, false);
    syncBannerCheckpoint(world);
    stepFallWarn(world, dt);
    stepDummies(world, dt);
    return;
  }

  if (player.attackT > 0 && !jumped) {
    if (input.rollPressed && player.rollCd <= 0) {
      player.attackT = 0;
      player.rollT = PLAYER.rollDuration;
      player.iFrame = PLAYER.rollIFrame;
      player.state = 'roll';
      if (input.moveX !== 0) {
        player.facing = input.moveX > 0 ? 1 : -1;
      }
      sfx.play('roll');
      stepLoot(world, false);
      stepDummies(world, dt);
      return;
    }
    if (tryStartSkill(world, player, input, false)) {
      stepLoot(world, false);
      stepDummies(world, dt);
      return;
    }
    const swing = 1 - player.attackT / attackDurationOf(player.attackKind);
    const inSwing = swing > 0.32 && swing < 0.72;
    player.attackT -= dt;
    if (player.attackKind === 'pyroblast' && player.skillShotArmed && swing > 0.55) {
      spawnPyroblast(world);
      player.skillShotArmed = false;
    }
    if (player.attackKind === 'slam') {
      player.vx = player.facing * (swing < 0.55 ? 5.2 : 2.4);
    } else if (player.attackKind === 'bash') {
      player.vx = player.facing * (swing < 0.5 ? 8.4 : 3.2);
    } else if (player.attackKind === 'blizzard') {
      // 引导站桩：不可走位（翻滚仍可打断）
      player.vx = 0;
    } else if (
      player.attackKind === 'whirlwind' &&
      skillLevelOf(world, 'whirlwind') >= 3 &&
      input.moveX !== 0
    ) {
      player.vx = PLAYER.moveSpeed * 0.45 * input.moveX;
    } else {
      player.vx *= 0.82;
    }
    player.vy -= PLAYER.gravity * dt;
    player.vy = Math.max(player.vy, -PLAYER.maxFall);
    moveAndCollide(player, world.platforms, dt);
    player.state = 'attack';
    if (inSwing) {
      tryHitDummies(world, player);
    }
    if (player.attackT <= 0) {
      player.attackCd = PLAYER.attackCooldown;
    }
    noteLand(world, player, wasGrounded);
    if (player.y < -2.8) {
      killByFall(world);
    }
    stepLoot(world, false);
    syncBannerCheckpoint(world);
    stepFallWarn(world, dt);
    stepDummies(world, dt);
    return;
  }

  if (!jumped && input.rollPressed && player.rollCd <= 0) {
    player.rollT = PLAYER.rollDuration;
    player.iFrame = PLAYER.rollIFrame;
    player.state = 'roll';
    if (input.moveX !== 0) {
      player.facing = input.moveX > 0 ? 1 : -1;
    }
    sfx.play('roll');
    stepLoot(world, false);
    stepDummies(world, dt);
    return;
  }

  if (!jumped && tryStartSkill(world, player, input, true)) {
    stepLoot(world, false);
    stepDummies(world, dt);
    return;
  }

  if (!jumped && input.potionPressed) {
    if (usePotion(world, undefined, 'life')) {
      spawnDust(world, player.x, player.y + 0.25);
      stepLoot(world, false);
      stepDummies(world, dt);
      return;
    }
  }

  if (!jumped && input.manaPotionPressed) {
    if (usePotion(world, undefined, 'mana')) {
      spawnDust(world, player.x, player.y + 0.25);
      stepLoot(world, false);
      stepDummies(world, dt);
      return;
    }
  }

  if (input.moveX !== 0) {
    player.facing = input.moveX > 0 ? 1 : -1;
    player.vx = PLAYER.moveSpeed * slowMult * sprintMult * rapidMult * shoutMult * input.moveX;
    advanceTutorial(world, 'move');
  } else {
    player.vx = 0;
  }

  player.vy -= PLAYER.gravity * dt;
  if (!jumped && !input.jumpHeld && player.vy > 0) {
    player.vy -= PLAYER.gravity * 1.1 * dt;
  }
  player.vy = Math.max(player.vy, -PLAYER.maxFall);
  moveAndCollide(player, world.platforms, dt);

  if (!player.onGround) {
    player.state = player.vy > 0.4 ? 'jump' : 'fall';
  } else if (input.moveX !== 0) {
    player.state = 'run';
  } else {
    player.state = 'idle';
  }

  noteLand(world, player, wasGrounded);
  noteStep(player, dt);
  if (player.y < -2.8) {
    killByFall(world);
  }

  syncCampProximity(world);
  syncHubPortalProximity(world);
  syncSecretProximity(world);
  if (input.interactPressed) {
    if (world.nearbyCamp && tryOpenCamp(world)) {
      // opened
    } else if (world.nearbyHubPortal && tryOpenHubPortal(world)) {
      // hub portal
    } else if (tryClaimSecret(world)) {
      // claimed
    } else {
      stepLoot(world, true);
    }
  } else {
    stepLoot(world, false);
  }
  syncBannerCheckpoint(world);
  stepFallWarn(world, dt);
  maybeGuidePoints(world);
  stepDummies(world, dt);
}

function stepDead(world: World, player: Player, input: InputFrame, dt: number): void {
  player.state = 'dead';
  player.awaitRespawn = true;
  closeAllPanels(world);
  player.deadT += dt;
  player.vx *= 0.9;
  player.vy -= PLAYER.gravity * dt;
  player.vy = Math.max(player.vy, -PLAYER.maxFall);
  moveAndCollide(player, world.platforms, dt);
  // 坠落死亡时夹住高度，避免镜头掉进虚空
  if (player.y < -0.85) {
    player.y = -0.85;
    player.prevY = -0.85;
    player.vy = 0;
  }
  if (input.respawnBannerPressed) {
    if (!player.hasBanner) {
      world.levelToastT = 1.4;
      world.levelToastText = '尚未激活旗帜 · 请回营复活';
      return;
    }
    chooseRespawn(world, 'banner');
  } else if (input.respawnCampPressed) {
    chooseRespawn(world, 'camp');
  }
}

function tryJump(player: Player): boolean {
  if (player.coyote <= 0 || player.jumpBuffer <= 0) {
    return false;
  }
  player.vy = PLAYER.jumpSpeed;
  player.onGround = false;
  player.coyote = 0;
  player.jumpBuffer = 0;
  player.rollT = 0;
  player.attackT = 0;
  player.state = 'jump';
  sfx.play('jump');
  return true;
}

function slotPressed(input: InputFrame, slot: number): boolean {
  if (slot === 0) {
    return input.slamPressed;
  }
  if (slot === 1) {
    return input.bashPressed;
  }
  if (slot === 2) {
    return input.skill3Pressed;
  }
  return input.skill4Pressed;
}

function getSlotCd(player: Player, slot: number): number {
  if (slot === 0) {
    return player.slamCd;
  }
  if (slot === 1) {
    return player.bashCd;
  }
  if (slot === 2) {
    return player.skillCd2;
  }
  return player.skillCd3;
}

function setSlotCd(player: Player, slot: number, value: number): void {
  if (slot === 0) {
    player.slamCd = value;
  } else if (slot === 1) {
    player.bashCd = value;
  } else if (slot === 2) {
    player.skillCd2 = value;
  } else {
    player.skillCd3 = value;
  }
}

function tryStartSkill(
  world: World,
  player: Player,
  input: InputFrame,
  allowBasic: boolean,
): boolean {
  for (let slot = 0; slot < 4; slot += 1) {
    if (!slotPressed(input, slot)) {
      continue;
    }
    if (tryCastBarSlot(world, player, slot)) {
      return true;
    }
  }
  if (allowBasic && input.attackPressed && player.attackCd <= 0) {
    beginAttack(world, player, 'basic', -1);
    return true;
  }
  return false;
}

function tryCastBarSlot(world: World, player: Player, slot: number): boolean {
  const raw = world.skillBar[slot];
  if (!raw || !isSkillId(raw) || skillLevelOf(world, raw) <= 0) {
    return false;
  }
  if (getSlotCd(player, slot) > 0) {
    return false;
  }
  const id: SkillId = raw;
  const def = SKILL_DEFS[id];
  const kind = def.kind;
  // 占位技能（utility）不可施放
  if (kind === 'utility') {
    world.levelToastT = 1.2;
    world.levelToastText = '该技能即将开放';
    sfx.play('deny');
    return false;
  }
  // 连击点前置：盗贼部分技能
  if (
    (kind === 'eviscerate' || kind === 'kidney-shot' || kind === 'slice-and-dice') &&
    player.comboPoints <= 0
  ) {
    world.levelToastT = 1.2;
    world.levelToastText = `需要连击点才能${def.name}`;
    sfx.play('deny');
    return false;
  }
  // 法力护盾：已开启则切换关闭，不耗资源
  if (kind === 'mana-shield' && player.manaShieldOn) {
    beginAttack(world, player, 'mana-shield', slot);
    return true;
  }
  const cost = kind === 'bash' ? legendaryBashCost(world) : skillResourceCost(id);
  if (!spendRage(player, cost)) {
    denyResource(world, player, def.name);
    return false;
  }
  beginAttack(world, player, kind, slot);
  return true;
}

function denyResource(world: World, player: Player, name: string): void {
  player.rageWarnT = 0.8;
  world.levelToastT = 1.2;
  const label =
    player.classId === 'mage'
      ? '法力'
      : player.classId === 'hunter'
        ? '集中'
        : player.classId === 'rogue'
          ? '能量'
          : player.classId === 'paladin'
            ? '圣能'
            : '怒气';
  world.levelToastText = `${label}不足，无法施放${name}`;
  sfx.play('deny');
}

function beginAttack(world: World, player: Player, kind: AttackKind, slot: number): void {
  player.attackKind = kind;
  player.attackT = attackDurationOf(kind);
  player.state = 'attack';
  advanceTutorial(world, 'attack');
  if (kind === 'slam') {
    setSlotCd(player, slot >= 0 ? slot : 0, slamCooldownOf(world) * legendarySlamCooldownMult(world));
    player.vx = player.facing * legendarySlamDash(world);
    if (player.onGround) {
      player.vy = 2.4;
      player.onGround = false;
    }
    world.shake = Math.max(
      world.shake,
      equippedLegendaryEffect(world) === 'ember-maul' ? 0.55 : 0.42,
    );
    spawnSkillDust(world, player, kind);
    sfx.play('slam');
  } else if (kind === 'bash') {
    setSlotCd(player, slot >= 0 ? slot : 1, bashCooldownOf(world));
    player.vx = player.facing * legendaryBashDash(world);
    player.iFrame = Math.max(player.iFrame, legendaryBashIFrame(world));
    world.shake = Math.max(world.shake, 0.55);
    spawnSkillDust(world, player, kind);
    sfx.play('bash');
  } else if (kind === 'fireball') {
    setSlotCd(player, slot >= 0 ? slot : 0, PLAYER.fireballCooldown);
    spawnPlayerFireball(world);
    spawnSkillDust(world, player, kind);
    sfx.play('slam');
  } else if (kind === 'frost-nova') {
    setSlotCd(player, slot >= 0 ? slot : 1, PLAYER.frostNovaCooldown);
    applyFrostNova(world);
    spawnSkillDust(world, player, kind);
    sfx.play('bash');
  } else if (kind === 'arcane-missiles') {
    setSlotCd(player, slot >= 0 ? slot : 2, PLAYER.arcaneMissilesCooldown);
    beginArcaneMissiles(world);
    spawnSkillDust(world, player, kind);
    sfx.play('slam');
  } else if (kind === 'blink') {
    setSlotCd(player, slot >= 0 ? slot : 3, blinkCooldownOf(world));
    blinkPlayer(world, player);
    spawnSkillDust(world, player, kind);
  } else if (kind === 'aimed-shot') {
    setSlotCd(player, slot >= 0 ? slot : 0, PLAYER.aimedShotCooldown);
    spawnHunterArrow(world, 'aimed-shot');
    spawnSkillDust(world, player, kind);
    sfx.play('slam');
  } else if (kind === 'disengage') {
    setSlotCd(player, slot >= 0 ? slot : 1, disengageCooldownOf(world));
    disengagePlayer(world, player);
    spawnSkillDust(world, player, kind);
  } else if (kind === 'multi-shot') {
    setSlotCd(player, slot >= 0 ? slot : 2, PLAYER.multiShotCooldown);
    spawnMultiShot(world);
    spawnSkillDust(world, player, kind);
    sfx.play('slam');
  } else if (kind === 'trap') {
    setSlotCd(player, slot >= 0 ? slot : 3, trapCooldownOf(world));
    placeHunterTrap(world);
    spawnSkillDust(world, player, kind);
  } else if (kind === 'shadow-strike') {
    setSlotCd(player, slot >= 0 ? slot : 0, shadowStrikeCooldownOf(world));
    player.vx = player.facing * 3.2;
    spawnSkillDust(world, player, kind);
    sfx.play('slam');
  } else if (kind === 'eviscerate') {
    setSlotCd(player, slot >= 0 ? slot : 1, PLAYER.eviscerateCooldown);
    player.vx = player.facing * 2.4;
    spawnSkillDust(world, player, kind);
    sfx.play('bash');
  } else if (kind === 'poison-blade') {
    setSlotCd(player, slot >= 0 ? slot : 2, poisonBladeCooldownOf(world));
    player.vx = player.facing * 2.8;
    spawnSkillDust(world, player, kind);
    sfx.play('hit');
  } else if (kind === 'sprint') {
    setSlotCd(player, slot >= 0 ? slot : 3, sprintCooldownOf(world));
    activateSprint(world);
    spawnSkillDust(world, player, kind);
  } else if (kind === 'vanish') {
    setSlotCd(player, slot >= 0 ? slot : 3, vanishCooldownOf(world));
    activateVanish(world);
    spawnSkillDust(world, player, kind);
  } else if (kind === 'blizzard') {
    setSlotCd(player, slot >= 0 ? slot : 2, PLAYER.blizzardCooldown);
    placeBlizzard(world);
    spawnSkillDust(world, player, kind);
  } else if (kind === 'rapid-fire') {
    setSlotCd(player, slot >= 0 ? slot : 2, PLAYER.rapidFireCooldown);
    activateRapidFire(world);
    spawnSkillDust(world, player, kind);
  } else if (kind === 'pyroblast') {
    setSlotCd(player, slot >= 0 ? slot : 3, PLAYER.pyroblastCooldown);
    player.skillShotArmed = true;
    spawnSkillDust(world, player, kind);
    sfx.play('slam');
  } else if (kind === 'explosive-trap') {
    setSlotCd(player, slot >= 0 ? slot : 3, explosiveTrapCooldownOf(world));
    placeExplosiveTrap(world);
    spawnSkillDust(world, player, kind);
  } else if (kind === 'ice-lance') {
    setSlotCd(player, slot >= 0 ? slot : 2, PLAYER.iceLanceCooldown);
    spawnIceLance(world);
    spawnSkillDust(world, player, kind);
    sfx.play('slam');
  } else if (kind === 'concussive-shot') {
    setSlotCd(player, slot >= 0 ? slot : 3, PLAYER.concussiveCooldown);
    spawnHunterArrow(world, 'concussive-shot');
    spawnSkillDust(world, player, kind);
    sfx.play('slam');
  } else if (kind === 'mana-shield') {
    setSlotCd(player, slot >= 0 ? slot : 3, PLAYER.manaShieldCooldown);
    activateManaShield(world);
    spawnSkillDust(world, player, kind);
  } else if (kind === 'serpent-sting') {
    setSlotCd(player, slot >= 0 ? slot : 3, PLAYER.serpentStingCooldown);
    spawnHunterArrow(world, 'serpent-sting');
    spawnSkillDust(world, player, kind);
    sfx.play('slam');
  } else if (kind === 'charge') {
    setSlotCd(player, slot >= 0 ? slot : 2, chargeCooldownOf(world));
    chargePlayer(world);
    spawnSkillDust(world, player, kind);
  } else if (kind === 'whirlwind') {
    setSlotCd(player, slot >= 0 ? slot : 3, PLAYER.whirlwindCooldown);
    applyWhirlwind(world);
    spawnSkillDust(world, player, kind);
  } else if (kind === 'battle-shout') {
    setSlotCd(player, slot >= 0 ? slot : 2, PLAYER.battleShoutCooldown);
    activateBattleShout(world);
    spawnSkillDust(world, player, kind);
  } else if (kind === 'execute') {
    setSlotCd(player, slot >= 0 ? slot : 2, PLAYER.executeCooldown);
    player.vx = player.facing * 4.2;
    spawnSkillDust(world, player, kind);
    sfx.play('slam');
  } else if (kind === 'sunder') {
    setSlotCd(player, slot >= 0 ? slot : 3, PLAYER.sunderCooldown);
    player.vx = player.facing * 3.6;
    spawnSkillDust(world, player, kind);
    sfx.play('bash');
  } else if (kind === 'cleave') {
    setSlotCd(player, slot >= 0 ? slot : 3, PLAYER.cleaveCooldown);
    player.vx = player.facing * 3.8;
    spawnSkillDust(world, player, kind);
    sfx.play('slam');
  } else if (kind === 'kidney-shot') {
    setSlotCd(player, slot >= 0 ? slot : 2, PLAYER.kidneyShotCooldown);
    player.vx = player.facing * 3.5;
    spawnSkillDust(world, player, kind);
    sfx.play('bash');
  } else if (kind === 'slice-and-dice') {
    setSlotCd(player, slot >= 0 ? slot : 3, PLAYER.sliceAndDiceCooldown);
    activateSliceAndDice(world);
    spawnSkillDust(world, player, kind);
  } else if (kind === 'fan-of-knives') {
    setSlotCd(player, slot >= 0 ? slot : 3, PLAYER.fanOfKnivesCooldown);
    applyFanOfKnives(world);
    spawnSkillDust(world, player, kind);
  }
}

function tryHitDummies(world: World, player: Player): void {
  const kind = player.attackKind;
  if (
    kind === 'fireball' ||
    kind === 'frost-nova' ||
    kind === 'arcane-missiles' ||
    kind === 'blink' ||
    kind === 'aimed-shot' ||
    kind === 'disengage' ||
    kind === 'multi-shot' ||
    kind === 'trap' ||
    kind === 'sprint' ||
    kind === 'vanish' ||
    kind === 'blizzard' ||
    kind === 'rapid-fire' ||
    kind === 'pyroblast' ||
    kind === 'explosive-trap' ||
    kind === 'ice-lance' ||
    kind === 'concussive-shot' ||
    kind === 'mana-shield' ||
    kind === 'serpent-sting' ||
    kind === 'charge' ||
    kind === 'whirlwind' ||
    kind === 'battle-shout' ||
    kind === 'slice-and-dice' ||
    kind === 'fan-of-knives'
  ) {
    return;
  }
  if (kind === 'cleave') {
    applyCleaveHits(world, player);
    player.hitStop = Math.max(player.hitStop, 0.08);
    return;
  }
  const reach =
    (kind === 'slam'
      ? PLAYER.slamReach
      : kind === 'bash'
        ? PLAYER.bashReach
        : kind === 'execute'
          ? PLAYER.executeReach
          : kind === 'sunder'
            ? PLAYER.sunderReach
            : kind === 'kidney-shot'
              ? PLAYER.kidneyShotReach
              : kind === 'shadow-strike'
                ? PLAYER.shadowStrikeReach
                : kind === 'eviscerate'
                  ? PLAYER.eviscerateReach
                  : kind === 'poison-blade'
                    ? PLAYER.poisonBladeReach
                    : 1.1) + legendaryReachBonus(world, kind);
  const hx = player.x + player.facing * (kind === 'bash' ? 0.7 : 0.85);
  const hy = player.y + 0.2;
  if (tryHitBreakables(world, hx, hy, reach, 1.15)) {
    player.hitStop = Math.max(player.hitStop, kind === 'slam' ? 0.06 : 0.04);
  }
  for (const dummy of world.dummies) {
    if (dummy.hp <= 0 || dummy.flash > 0.12) {
      continue;
    }
    if (hitboxOverlaps(hx, hy, reach, 1.15, dummy)) {
      applyPlayerHit(world, dummy, kind);
      player.hitStop = kind === 'slam' ? 0.1 : kind === 'bash' ? 0.085 : 0.045;
    }
  }
}

function noteLand(world: World, player: Player, wasGrounded: boolean): void {
  if (!wasGrounded && player.onGround) {
    spawnLandDust(world, player);
    sfx.play('land');
  }
}

function noteStep(player: Player, dt: number): void {
  if (player.state !== 'run' || !player.onGround) {
    footAcc = 0;
    return;
  }
  footAcc += dt;
  if (footAcc < 0.3) {
    return;
  }
  footAcc = 0;
  sfx.play('step');
}

function killByFall(world: World): void {
  const player = world.player;
  if (player.awaitRespawn || player.hp <= 0) {
    player.y = Math.max(player.y, -0.85);
    player.prevY = player.y;
    player.vy = 0;
    return;
  }
  player.hp = 0;
  player.deadT = 0;
  player.deathCause = 'fall';
  player.awaitRespawn = true;
  player.state = 'dead';
  player.y = Math.max(player.y, -0.85);
  player.prevY = player.y;
  player.vy = 0;
  player.fallWarnT = 0;
  world.shake = Math.max(world.shake, 0.6);
  world.levelToastT = 1.6;
  world.levelToastText = '坠落身亡';
  applyDeathDurabilityLoss(world);
  applyDeathLootLoss(world);
  applyGearStats(player, world);
  sfx.play('die');
}
