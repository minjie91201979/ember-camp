import { isZoneEndWall } from '../data/zones';
import type { Player, Rect, World } from '../types';

/** 脚底附近是否有可站立地面（含抬高平台）。 */
function hasSupportAt(platforms: Rect[], x: number, feetY: number): boolean {
  for (const plat of platforms) {
    if (isZoneEndWall(plat) || plat.h < 0.28) {
      continue;
    }
    const top = plat.y + plat.h;
    if (x < plat.x - 0.08 || x > plat.x + plat.w + 0.08) {
      continue;
    }
    if (feetY >= top - 0.2 && feetY <= top + 0.65) {
      return true;
    }
  }
  return false;
}

/** 朝向侧前方无地面，或已坠入坑上方。 */
export function isNearPitHazard(player: Player, platforms: Rect[]): boolean {
  if (player.hp <= 0) {
    return false;
  }
  if (player.onGround) {
    const ahead = player.x + player.facing * 0.82;
    return !hasSupportAt(platforms, ahead, player.y);
  }
  if (player.vy < -2.2 && player.y < 0.85) {
    return !hasSupportAt(platforms, player.x, Math.min(player.y, 0.05));
  }
  return false;
}

export function stepFallWarn(world: World, dt: number): void {
  const player = world.player;
  player.fallWarnT = Math.max(0, player.fallWarnT - dt);
  if (isNearPitHazard(player, world.platforms)) {
    player.fallWarnT = Math.max(player.fallWarnT, 0.4);
  }
}
