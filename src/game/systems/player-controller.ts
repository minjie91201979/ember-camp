import { sfx } from '../../audio/sfx';
import { PLAYER, attackDurationOf } from '../config';
import type { InputFrame } from '../../input/keyboard';
import {
  applyPlayerHit,
  spawnDust,
  spawnLandDust,
  spawnSkillDust,
  spendRage,
  stepPopups,
  stepRage,
} from './combat';
import { stepDummies } from './dummy-ai';
import { toggleInventory, usePotion } from './inventory';
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
import { toggleSkills } from './skills';
import { stepLoot, stepLootFlies } from './loot';
import { closeCamp, syncCampProximity, syncHubPortalProximity, tryOpenCamp, tryOpenHubPortal } from './camp';
import { closeAllPanels, isAnyPanelOpen } from './ui-panels';
import { hitboxOverlaps, moveAndCollide } from './physics';
import { chooseRespawn, syncBannerCheckpoint } from './respawn';
import { bashCooldownOf, slamCooldownOf } from './specialization';
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
  stepRage(player, dt);
  player.rollCd = Math.max(0, player.rollCd - dt);
  player.attackCd = Math.max(0, player.attackCd - dt);
  player.slamCd = Math.max(0, player.slamCd - dt);
  player.bashCd = Math.max(0, player.bashCd - dt);
  player.rageWarnT = Math.max(0, player.rageWarnT - dt);
  player.iFrame = Math.max(0, player.iFrame - dt);
  player.drinkT = Math.max(0, player.drinkT - dt);
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

  if (input.escapePressed && closeAllPanels(world)) {
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
      killByFall(player);
    }
    stepLoot(world, false);
    syncBannerCheckpoint(world);
    stepDummies(world, dt);
    return;
  }

  const jumped = tryJump(player);
  const slowMult = player.petrifyT > 0 ? 0.22 : player.slowT > 0 ? 0.48 : 1;
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
      killByFall(player);
    }
    stepLoot(world, false);
    syncBannerCheckpoint(world);
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
    if (player.attackKind === 'slam') {
      player.vx = player.facing * (swing < 0.55 ? 5.2 : 2.4);
    } else if (player.attackKind === 'bash') {
      player.vx = player.facing * (swing < 0.5 ? 8.4 : 3.2);
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
      killByFall(player);
    }
    stepLoot(world, false);
    syncBannerCheckpoint(world);
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
    if (usePotion(world)) {
      spawnDust(world, player.x, player.y + 0.25);
      stepLoot(world, false);
      stepDummies(world, dt);
      return;
    }
  }

  if (input.moveX !== 0) {
    player.facing = input.moveX > 0 ? 1 : -1;
    player.vx = PLAYER.moveSpeed * slowMult * input.moveX;
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
    killByFall(player);
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
  if (input.respawnBannerPressed) {
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

function tryStartSkill(
  world: World,
  player: Player,
  input: InputFrame,
  allowBasic: boolean,
): boolean {
  if (input.slamPressed && player.slamCd <= 0) {
    beginAttack(world, player, 'slam');
    return true;
  }
  if (input.bashPressed) {
    if (player.bashCd > 0) {
      return false;
    }
    if (!spendRage(player, legendaryBashCost(world))) {
      player.rageWarnT = 0.8;
      world.levelToastT = 1.2;
      world.levelToastText = '怒气不足，无法盾击';
      sfx.play('deny');
      return false;
    }
    beginAttack(world, player, 'bash');
    return true;
  }
  if (allowBasic && input.attackPressed && player.attackCd <= 0) {
    beginAttack(world, player, 'basic');
    return true;
  }
  return false;
}

function beginAttack(world: World, player: Player, kind: AttackKind): void {
  player.attackKind = kind;
  player.attackT = attackDurationOf(kind);
  player.state = 'attack';
  advanceTutorial(world, 'attack');
  if (kind === 'slam') {
    player.slamCd = slamCooldownOf(world) * legendarySlamCooldownMult(world);
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
    player.bashCd = bashCooldownOf(world);
    player.vx = player.facing * legendaryBashDash(world);
    player.iFrame = Math.max(player.iFrame, legendaryBashIFrame(world));
    world.shake = Math.max(world.shake, 0.55);
    spawnSkillDust(world, player, kind);
    sfx.play('bash');
  }
}

function tryHitDummies(world: World, player: Player): void {
  const kind = player.attackKind;
  const reach =
    (kind === 'slam' ? PLAYER.slamReach : kind === 'bash' ? PLAYER.bashReach : 1.1) +
    legendaryReachBonus(world, kind);
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

function killByFall(player: Player): void {
  if (player.hp > 0) {
    player.hp = 0;
    player.deadT = 0;
    player.awaitRespawn = true;
    player.state = 'dead';
    sfx.play('die');
  }
}
