import type { World } from '../types';
import { activeBoss } from './boss';
import { sfx } from '../../audio/sfx';

const ENGAGE_RANGE = 10;
export const BOSS_GATE_W = 0.6;
export const BOSS_GATE_H = 2.2;
const GATE_OFFSET = 8;

function removeBossGatePlatform(world: World): void {
  if (!world.bossGateClosed) {
    return;
  }
  const gx = world.bossGateX;
  world.platforms = world.platforms.filter(
    (p) =>
      Math.abs(p.x - gx) > 0.05 ||
      Math.abs(p.w - BOSS_GATE_W) > 0.05 ||
      Math.abs(p.h - BOSS_GATE_H) > 0.05,
  );
  world.bossGateClosed = false;
  world.bossGateX = 0;
}

function sealBossGate(world: World, bossX: number): void {
  if (world.bossGateClosed) {
    return;
  }
  const p = world.player;
  let gateX = bossX - GATE_OFFSET;
  if (p.x < gateX) {
    gateX = p.x - 1.2;
  }
  world.bossGateX = gateX;
  world.bossGateClosed = true;
  world.platforms.push({
    x: gateX,
    y: 0,
    w: BOSS_GATE_W,
    h: BOSS_GATE_H,
  });
  world.shake = Math.max(world.shake, 0.75);
  world.levelToastT = 1.6;
  world.levelToastText = '禁锢已落';
  sfx.play('bash');
}

/** 换区时清关门与慢动作。 */
export function clearBossEncounter(world: World): void {
  removeBossGatePlatform(world);
  world.slowMoT = 0;
}

/** 靠近 BOSS 关门；BOSS 死 / 玩家倒地则开门。 */
export function stepBossEncounter(world: World): void {
  if (world.zoneId === 'challenge' || world.zoneId === 'a01') {
    if (world.bossGateClosed) {
      removeBossGatePlatform(world);
    }
    return;
  }

  const boss = activeBoss(world);
  const playerDown =
    world.player.hp <= 0 ||
    world.player.state === 'dead' ||
    world.player.awaitRespawn;

  if (!boss || playerDown) {
    if (world.bossGateClosed) {
      removeBossGatePlatform(world);
    }
    return;
  }

  if (!world.bossGateClosed) {
    const dist = Math.abs(world.player.x - boss.x);
    const dy = Math.abs(world.player.y - boss.y);
    if (dist < ENGAGE_RANGE && dy < 3.2) {
      sealBossGate(world, boss.x);
    }
  }
}
