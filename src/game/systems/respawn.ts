import { sfx } from '../../audio/sfx';
import { PLAYER, WORLD } from '../config';
import { START_ZONE_ID } from '../data/zones';
import type { Player, RespawnChoice, World } from '../types';
import { closeAllPanels } from './ui-panels';
import { enterZone } from './zone-travel';

export const BANNER_TOUCH_RANGE = 1.6;

export function syncBannerCheckpoint(world: World): void {
  const player = world.player;
  if (player.hp <= 0) {
    return;
  }
  for (const banner of world.banners) {
    if (Math.abs(player.x - banner.x) <= BANNER_TOUCH_RANGE && Math.abs(player.y - banner.y) < 1.4) {
      const wasLit = player.hasBanner;
      const moved =
        Math.abs(player.bannerX - banner.x) > 0.25 || Math.abs(player.bannerY - banner.y) > 0.25;
      player.bannerX = banner.x;
      player.bannerY = banner.y;
      player.hasBanner = true;
      if (!wasLit || moved) {
        world.levelToastT = 1.55;
        world.levelToastText = wasLit ? '旗帜检查点已更新' : '旗帜已激活 · 可在此复活';
        world.shake = Math.max(world.shake, 0.28);
        sfx.play('loot');
      }
      return;
    }
  }
}

export function chooseRespawn(world: World, choice: RespawnChoice): void {
  const player = world.player;
  if (player.hp > 0 || !player.awaitRespawn) {
    return;
  }
  closeAllPanels(world);
  if (choice === 'banner' && player.hasBanner) {
    placePlayer(player, player.bannerX, player.bannerY);
  } else {
    // 回营：真正回到烬营，而不是只改坐标留在当前区
    if (world.zoneId !== START_ZONE_ID) {
      enterZone(world, START_ZONE_ID, WORLD.spawnX, WORLD.spawnY);
    } else {
      placePlayer(player, WORLD.spawnX, WORLD.spawnY);
    }
  }
  finishRespawn(player);
}

function placePlayer(player: Player, x: number, y: number): void {
  player.x = x;
  player.y = y;
  player.prevX = x;
  player.prevY = y;
}

function finishRespawn(player: Player): void {
  player.vx = 0;
  player.vy = 0;
  player.hp = player.maxHp;
  player.rage =
    player.classId === 'mage' || player.classId === 'hunter' || player.classId === 'rogue'
      ? Math.round(player.maxRage * 0.55)
      : PLAYER.bashCost;
  player.combatT = 0;
  player.rageWarnT = 0;
  player.deadT = 0;
  player.deathCause = 'none';
  player.fallWarnT = 0;
  player.hurtT = 0;
  player.iFrame = 0.9;
  player.attackT = 0;
  player.attackKind = 'basic';
  player.rollT = 0;
  player.slamCd = 0;
  player.bashCd = 0;
  player.skillCd2 = 0;
  player.skillCd3 = 0;
  player.missileBurstLeft = 0;
  player.missileBurstAcc = 0;
  player.comboPoints = 0;
  player.sprintT = 0;
  player.vanishT = 0;
  player.openerBonusT = 0;
  player.rapidFireT = 0;
  player.rapidFireAcc = 0;
  player.skillShotArmed = false;
  player.manaShieldOn = false;
  player.manaShieldHp = 0;
  player.chargeDrT = 0;
  player.warShoutT = 0;
  player.sliceT = 0;
  player.awaitRespawn = false;
  player.state = 'idle';
}
