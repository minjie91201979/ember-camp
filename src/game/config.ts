export const FIXED_DT = 1 / 60;
export const MAX_FRAME_STEPS = 5;

export const PLAYER = {
  width: 0.7,
  height: 1.7,
  moveSpeed: 6.4,
  jumpSpeed: 13.2,
  gravity: 26,
  maxFall: 22,
  rollSpeed: 11,
  rollDuration: 0.28,
  rollCooldown: 0.55,
  rollIFrame: 0.2,
  attackDuration: 0.4,
  attackCooldown: 0.12,
  critMult: 1.5,
  maxRage: 100,
  rageOnHit: 12,
  rageOnHurt: 10,
  rageOnSlam: 20,
  rageDecay: 16,
  combatLock: 2.4,
  slamDamageMult: 1.8,
  slamDuration: 0.52,
  slamCooldown: 0.85,
  slamReach: 1.55,
  bashCost: 20,
  bashDamageMult: 0.85,
  bashDuration: 0.44,
  bashCooldown: 1.35,
  bashStun: 1.05,
  bashReach: 1.35,
  hurtDuration: 0.22,
  hurtIFrame: 0.55,
  knockback: 5.6,
  coyoteTime: 0.12,
  jumpBuffer: 0.18,
} as const;

export const CAMERA = {
  frustum: 10,
  z: 18,
  lookY: 1.05,
  damp: 8,
} as const;

export const WORLD = {
  spawnX: 0.55,
  spawnY: 1.15,
} as const;

export const DAY_NIGHT = {
  period: 72,
} as const;

export function attackDurationOf(kind: 'basic' | 'slam' | 'bash'): number {
  if (kind === 'slam') {
    return PLAYER.slamDuration;
  }
  if (kind === 'bash') {
    return PLAYER.bashDuration;
  }
  return PLAYER.attackDuration;
}
