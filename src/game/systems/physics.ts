import type { Player, Rect } from '../types';

export function moveAndCollide(player: Player, platforms: Rect[], dt: number): void {
  player.x += player.vx * dt;
  resolveAxis(player, platforms, 'x');
  player.y += player.vy * dt;
  player.onGround = false;
  resolveAxis(player, platforms, 'y');
}

function resolveAxis(player: Player, platforms: Rect[], axis: 'x' | 'y'): void {
  for (const plat of platforms) {
    if (!overlaps(player, plat)) {
      continue;
    }
    if (axis === 'x') {
      if (player.vx > 0) {
        player.x = plat.x - player.w / 2;
      } else if (player.vx < 0) {
        player.x = plat.x + plat.w + player.w / 2;
      }
      player.vx = 0;
    } else {
      if (player.vy > 0) {
        player.y = plat.y - player.h;
        player.vy = 0;
      } else if (player.vy <= 0) {
        player.y = plat.y + plat.h;
        player.vy = 0;
        player.onGround = true;
      }
    }
  }
}

export function overlaps(player: Player, plat: Rect): boolean {
  const left = player.x - player.w / 2;
  const right = player.x + player.w / 2;
  const bottom = player.y;
  const top = player.y + player.h;
  return left < plat.x + plat.w && right > plat.x && bottom < plat.y + plat.h && top > plat.y;
}

export function hitboxOverlaps(
  hx: number,
  hy: number,
  hw: number,
  hh: number,
  target: { x: number; y: number; w: number; h: number },
): boolean {
  const left = hx - hw / 2;
  const right = hx + hw / 2;
  const bottom = hy;
  const top = hy + hh;
  const tLeft = target.x - target.w / 2;
  const tRight = target.x + target.w / 2;
  const tBottom = target.y;
  const tTop = target.y + target.h;
  return left < tRight && right > tLeft && bottom < tTop && top > tBottom;
}
