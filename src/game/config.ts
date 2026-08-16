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
  chargeCost: 30,
  chargeDamageMult: 1.25,
  chargeDuration: 0.36,
  chargeCooldown: 6.5,
  chargeRange: 3.4,
  chargeIFrame: 0.14,
  chargeDr: 2,
  chargeDrMult: 0.72,
  whirlwindCost: 50,
  whirlwindDamageMult: 0.72,
  whirlwindDuration: 0.62,
  whirlwindCooldown: 5.2,
  whirlwindRadius: 2.05,
  whirlwindTicks: 3,
  executeCost: 25,
  executeDamageMult: 2.65,
  executeDuration: 0.42,
  executeCooldown: 4.5,
  executeReach: 1.45,
  executeThresh: 0.3,
  executeThresh5: 0.35,
  executeRageOnKill: 18,
  battleShoutCost: 20,
  battleShoutDuration: 0.32,
  battleShoutCooldown: 12,
  battleShoutBuff: 8.5,
  battleShoutAtk: 1.18,
  battleShoutDef: 0.88,
  battleShoutMove: 1.14,
  sunderCost: 30,
  sunderDamageMult: 0.95,
  sunderDuration: 0.4,
  sunderCooldown: 3.6,
  sunderReach: 1.4,
  sunderLife: 12,
  sunderMaxStacks: 1,
  sunderMaxStacks5: 2,
  sunderDefPerStack: 0.14,
  cleaveCost: 35,
  cleaveDamageMult: 1.15,
  cleaveDuration: 0.46,
  cleaveCooldown: 3.8,
  cleaveReach: 1.55,
  cleaveBackReach: 1.65,
  cleaveBackReach3: 2.15,
  /** 法师法力 */
  manaRegenCombat: 5,
  manaRegenOoc: 22,
  fireballCost: 18,
  fireballDamageMult: 1.35,
  fireballDuration: 0.38,
  fireballCooldown: 0.9,
  fireballSpeed: 11.5,
  fireballLife: 1.15,
  fireballRadius: 0.32,
  frostNovaCost: 28,
  frostNovaDamageMult: 0.95,
  frostNovaDuration: 0.48,
  frostNovaCooldown: 4.2,
  frostNovaRadius: 2.15,
  frostNovaStun: 0.85,
  frostNovaSlow: 1.4,
  arcaneMissilesCost: 22,
  arcaneMissilesDamageMult: 0.55,
  arcaneMissilesDuration: 0.72,
  arcaneMissilesCooldown: 3.2,
  arcaneMissilesCount: 3,
  arcaneMissilesInterval: 0.18,
  arcaneMissilesSpeed: 12.5,
  arcaneMissilesLife: 1.05,
  arcaneMissilesRadius: 0.26,
  blinkCost: 24,
  blinkCooldown: 5.5,
  blinkRange: 2.85,
  blinkIFrame: 0.12,
  blinkDuration: 0.22,
  /** 猎人集中 */
  focusRegenStill: 18,
  focusRegenAttack: 12,
  focusDrainMove: 8,
  focusOnHit: 8,
  aimedShotCost: 20,
  aimedShotDamageMult: 1.45,
  aimedShotDuration: 0.42,
  aimedShotCooldown: 1.05,
  aimedShotSpeed: 14,
  aimedShotLife: 1.05,
  aimedShotRadius: 0.22,
  disengageCost: 15,
  disengageDamageMult: 0.95,
  disengageDuration: 0.36,
  disengageCooldown: 4.8,
  disengageRange: 2.4,
  disengageIFrame: 0.1,
  multiShotCost: 35,
  multiShotDamageMult: 0.72,
  multiShotDuration: 0.4,
  multiShotCooldown: 3.6,
  multiShotCount: 3,
  multiShotSpread: 1.35,
  trapCost: 25,
  trapDuration: 0.32,
  trapCooldown: 8.5,
  trapLife: 14,
  trapRoot: 1.65,
  trapRadius: 0.85,
  trapCap: 1,
  explosiveTrapCost: 30,
  explosiveTrapDuration: 0.34,
  explosiveTrapCooldown: 10,
  explosiveTrapLife: 8,
  explosiveTrapFuse: 1.05,
  explosiveTrapRadius: 0.95,
  explosiveTrapBlast: 2.15,
  explosiveTrapDamageMult: 1.55,
  explosiveTrapKnockback: 1.35,
  hunterRangeBonusDist: 8,
  hunterRangeBonusMult: 1.08,
  /** 盗贼能量 / 连击 */
  energyRegen: 28,
  energyRegenCombat: 22,
  shadowStrikeCost: 40,
  shadowStrikeDamageMult: 1.05,
  shadowStrikeDuration: 0.36,
  shadowStrikeCooldown: 0.55,
  shadowStrikeReach: 1.25,
  eviscerateCost: 35,
  eviscerateDamageMult: 0.55,
  eviscerateDuration: 0.4,
  eviscerateCooldown: 0.85,
  eviscerateReach: 1.2,
  poisonBladeCost: 25,
  poisonBladeDamageMult: 0.75,
  poisonBladeDuration: 0.34,
  poisonBladeCooldown: 2.4,
  poisonBladeReach: 1.2,
  poisonDuration: 5.5,
  poisonDpsMult: 0.22,
  sprintCost: 30,
  sprintDuration: 0.28,
  sprintBuff: 2.8,
  sprintCooldown: 7.5,
  sprintSpeedMult: 1.55,
  sprintIFrame: 0.15,
  comboMax: 5,
  vanishCost: 50,
  vanishDuration: 0.28,
  vanishBuff: 1.55,
  vanishCooldown: 16,
  vanishIFrame: 1.55,
  kidneyShotCost: 35,
  kidneyShotDamageMult: 0.45,
  kidneyShotDuration: 0.38,
  kidneyShotCooldown: 4.2,
  kidneyShotReach: 1.25,
  kidneyShotStunBase: 0.55,
  kidneyShotStunPerPt: 0.45,
  kidneyShotStunPerPt3: 0.62,
  sliceAndDiceCost: 25,
  sliceAndDiceDuration: 0.3,
  sliceAndDiceCooldown: 1.2,
  sliceAndDiceBuffBase: 4.5,
  sliceAndDiceBuffPerPt: 1.35,
  sliceAndDiceAtkHaste: 1.28,
  sliceAndDiceEnergyMult: 1.35,
  fanOfKnivesCost: 40,
  fanOfKnivesDamageMult: 0.68,
  fanOfKnivesDuration: 0.42,
  fanOfKnivesCooldown: 5.5,
  fanOfKnivesRadius: 2.0,
  /** 暴风雪：引导落冰 AoE（参考魔兽经典引导 + 寒冰减速） */
  blizzardCost: 48,
  blizzardDamageMult: 0.62,
  /** 引导时长：站桩落冰 */
  blizzardDuration: 2.35,
  blizzardCooldown: 8.5,
  /** 风暴残留略长于引导 */
  blizzardLife: 3.1,
  blizzardRadius: 3.2,
  blizzardTick: 0.4,
  /** 落点相对角色朝向的水平偏移 */
  blizzardPlaceRange: 2.55,
  /** 寒冰减速刷新时长 */
  blizzardChillRefresh: 1.25,
  /** 寒冰移速倍率（越小越慢）；5 级技能更强 */
  blizzardChillMove: 0.52,
  blizzardChillMoveL5: 0.36,
  /** 兼容旧字段：减速强度系数 */
  blizzardSlow: 1.15,
  rapidFireCost: 40,
  rapidFireDuration: 0.3,
  rapidFireBuff: 3.6,
  rapidFireCooldown: 14,
  rapidFireInterval: 0.28,
  rapidFireFocusDrain: 0,
  pyroblastCost: 36,
  pyroblastDamageMult: 2.15,
  pyroblastDuration: 0.72,
  pyroblastCooldown: 5.5,
  pyroblastSpeed: 10.5,
  pyroblastLife: 1.25,
  pyroblastRadius: 0.38,
  iceLanceCost: 22,
  iceLanceDamageMult: 1.05,
  iceLanceFrozenMult: 2.35,
  iceLanceDuration: 0.34,
  iceLanceCooldown: 2.8,
  iceLanceSpeed: 14.5,
  iceLanceLife: 0.95,
  iceLanceRadius: 0.22,
  iceLanceBounceRange: 7.5,
  concussiveCost: 20,
  concussiveDamageMult: 0.55,
  concussiveDuration: 0.36,
  concussiveCooldown: 5.5,
  concussiveKnockback: 1.55,
  concussiveKnockbackMax: 2.35,
  concussiveInterrupt: 0.75,
  manaShieldCost: 12,
  manaShieldDuration: 0.28,
  manaShieldCooldown: 1.2,
  manaShieldDrain: 8,
  manaShieldPoolMult: 0.45,
  manaShieldPoolMult3: 0.62,
  serpentStingCost: 25,
  serpentStingDamageMult: 0.35,
  serpentStingDuration: 0.34,
  serpentStingCooldown: 4.2,
  serpentStingDot: 6.5,
  serpentStingDpsMult: 0.28,
  serpentStingMaxStacks: 2,
  serpentStingMaxStacks3: 3,
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
  /** 沿朝向预瞄距离（世界单位）。 */
  lookAhead: 0.9,
  /** 叠加 |vx| 的预瞄系数（冲锋/疾跑更看前）。 */
  lookAheadVel: 0.08,
} as const;

/** 橙装掉率（GAME_DESIGN §15）：区域 BOSS / 精英可调。 */
export const LOOT = {
  legendaryBossChance: 0.015,
  legendaryEliteChance: 0.004,
} as const;

/** HUD 反馈阈值。 */
export const HUD_FEEDBACK = {
  /** 生命比例 ≤ 此值时视为危急（闪烁 / 喝药提示） */
  lowHpRatio: 0.35,
  /** 资源比例 ≤ 此值且有法力药时催促喝药 */
  lowResourceRatio: 0.35,
} as const;

/** 药水：喝药动作与战斗内公共冷却（设计约 1.2s）。 */
export const POTION = {
  drinkAnim: 0.42,
  sharedCd: 1.2,
  /** 单种药水堆叠上限（设计 §7.2） */
  stackMax: 20,
} as const;

export const WORLD = {
  spawnX: 0.55,
  spawnY: 1.15,
} as const;

export const DAY_NIGHT = {
  period: 72,
} as const;

type AttackKind =
  | 'basic'
  | 'slam'
  | 'bash'
  | 'fireball'
  | 'frost-nova'
  | 'arcane-missiles'
  | 'blink'
  | 'aimed-shot'
  | 'disengage'
  | 'multi-shot'
  | 'trap'
  | 'shadow-strike'
  | 'eviscerate'
  | 'poison-blade'
  | 'sprint'
  | 'vanish'
  | 'blizzard'
  | 'rapid-fire'
  | 'pyroblast'
  | 'explosive-trap'
  | 'ice-lance'
  | 'concussive-shot'
  | 'mana-shield'
  | 'serpent-sting'
  | 'charge'
  | 'whirlwind'
  | 'execute'
  | 'battle-shout'
  | 'sunder'
  | 'cleave'
  | 'kidney-shot'
  | 'slice-and-dice'
  | 'fan-of-knives';

export function attackDurationOf(kind: AttackKind): number {
  if (kind === 'slam') {
    return PLAYER.slamDuration;
  }
  if (kind === 'bash') {
    return PLAYER.bashDuration;
  }
  if (kind === 'fireball') {
    return PLAYER.fireballDuration;
  }
  if (kind === 'frost-nova') {
    return PLAYER.frostNovaDuration;
  }
  if (kind === 'arcane-missiles') {
    return PLAYER.arcaneMissilesDuration;
  }
  if (kind === 'blink') {
    return PLAYER.blinkDuration;
  }
  if (kind === 'aimed-shot') {
    return PLAYER.aimedShotDuration;
  }
  if (kind === 'disengage') {
    return PLAYER.disengageDuration;
  }
  if (kind === 'multi-shot') {
    return PLAYER.multiShotDuration;
  }
  if (kind === 'trap') {
    return PLAYER.trapDuration;
  }
  if (kind === 'shadow-strike') {
    return PLAYER.shadowStrikeDuration;
  }
  if (kind === 'eviscerate') {
    return PLAYER.eviscerateDuration;
  }
  if (kind === 'poison-blade') {
    return PLAYER.poisonBladeDuration;
  }
  if (kind === 'sprint') {
    return PLAYER.sprintDuration;
  }
  if (kind === 'vanish') {
    return PLAYER.vanishDuration;
  }
  if (kind === 'blizzard') {
    return PLAYER.blizzardDuration;
  }
  if (kind === 'rapid-fire') {
    return PLAYER.rapidFireDuration;
  }
  if (kind === 'pyroblast') {
    return PLAYER.pyroblastDuration;
  }
  if (kind === 'explosive-trap') {
    return PLAYER.explosiveTrapDuration;
  }
  if (kind === 'ice-lance') {
    return PLAYER.iceLanceDuration;
  }
  if (kind === 'concussive-shot') {
    return PLAYER.concussiveDuration;
  }
  if (kind === 'mana-shield') {
    return PLAYER.manaShieldDuration;
  }
  if (kind === 'serpent-sting') {
    return PLAYER.serpentStingDuration;
  }
  if (kind === 'charge') {
    return PLAYER.chargeDuration;
  }
  if (kind === 'whirlwind') {
    return PLAYER.whirlwindDuration;
  }
  if (kind === 'execute') {
    return PLAYER.executeDuration;
  }
  if (kind === 'battle-shout') {
    return PLAYER.battleShoutDuration;
  }
  if (kind === 'sunder') {
    return PLAYER.sunderDuration;
  }
  if (kind === 'cleave') {
    return PLAYER.cleaveDuration;
  }
  if (kind === 'kidney-shot') {
    return PLAYER.kidneyShotDuration;
  }
  if (kind === 'slice-and-dice') {
    return PLAYER.sliceAndDiceDuration;
  }
  if (kind === 'fan-of-knives') {
    return PLAYER.fanOfKnivesDuration;
  }
  return PLAYER.attackDuration;
}
