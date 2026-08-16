import { WORLD } from '../config';
import { START_ZONE_ID, ZONES } from '../data/zones';
import type { World } from '../types';
import { closeCamp } from './camp';
import { addItemToBag } from './inventory';
import { populateZone, enterZone } from './zone-travel';
import { sfx } from '../../audio/sfx';

export const CHALLENGE_DURATION = 90;

/** 营地开启词缀试炼：限时清光精英。 */
export function startChallenge(world: World): boolean {
  if (world.challengeActive) {
    sfx.play('deny');
    world.campMessage = '挑战进行中';
    return false;
  }
  const zone = ZONES.challenge;
  if (!zone) {
    return false;
  }
  closeCamp(world);
  populateZone(world, zone, 1.5, 1.15);
  world.challengeActive = true;
  world.challengeT = CHALLENGE_DURATION;
  const p = world.player;
  p.hp = p.maxHp;
  p.rage = Math.max(p.rage, 40);
  p.awaitRespawn = false;
  p.state = 'idle';
  p.iFrame = 0.8;
  world.levelToastT = 2.2;
  world.levelToastText = '词缀试炼 · 限时清精英！';
  sfx.play('levelup');
  return true;
}

export function stepChallenge(world: World, dt: number): void {
  if (!world.challengeActive) {
    return;
  }
  if (world.player.hp <= 0) {
    finishChallenge(world, false, '战败');
    return;
  }
  world.challengeT = Math.max(0, world.challengeT - dt);
  if (world.challengeT <= 0) {
    finishChallenge(world, false, '时间耗尽');
    return;
  }
  const elitesLeft = world.dummies.some((d) => d.elite && d.hp > 0);
  if (!elitesLeft) {
    finishChallenge(world, true);
  }
}

function finishChallenge(world: World, won: boolean, failReason?: string): void {
  world.challengeActive = false;
  world.challengeT = 0;
  const p = world.player;
  p.hp = p.maxHp;
  p.awaitRespawn = false;
  p.state = 'idle';
  p.deadT = 0;
  p.vx = 0;
  p.vy = 0;

  if (won) {
    const scrap = 3 + world.ngPlusLevel + Math.floor(Math.random() * 2);
    addItemToBag(world, 'woodland-scrap', scrap);
    if (Math.random() < 0.35 + world.ngPlusLevel * 0.08) {
      addItemToBag(world, 'ashen-crest', 1);
    }
    world.gold += 45 + 18 * world.ngPlusLevel;
    world.levelToastT = 2.6;
    world.levelToastText = `试炼成功 · +${scrap} 碎材`;
    sfx.play('levelup');
  } else {
    world.levelToastT = 2.2;
    world.levelToastText = `试炼失败 · ${failReason ?? '未完成'}`;
    sfx.play('deny');
  }

  enterZone(world, START_ZONE_ID, WORLD.spawnX, WORLD.spawnY);
}

/** 存档/读档时若卡在挑战中，强制回营。 */
export function sanitizeChallengeOnLoad(world: World): void {
  if (world.zoneId === 'challenge' || world.challengeActive) {
    world.challengeActive = false;
    world.challengeT = 0;
    if (world.zoneId === 'challenge') {
      enterZone(world, START_ZONE_ID, WORLD.spawnX, WORLD.spawnY);
    }
  }
}
