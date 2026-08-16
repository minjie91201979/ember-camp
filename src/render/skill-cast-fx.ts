import type { AttackKind } from '../game/types';
import { PALETTE } from './palette';

export type SkillCastMode = 'arc' | 'burst' | 'ring' | 'none';

export type SkillCastFx = {
  mode: SkillCastMode;
  color: number;
  /** 相对基础尺寸的放大 */
  grow: number;
  /** arc 竖直拉伸倍率 */
  tall: number;
  /** impact 时抬高玩家灯 */
  lightBoost: number;
};

const DEFAULT_ARC: SkillCastFx = {
  mode: 'arc',
  color: 0xffffff,
  grow: 1.05,
  tall: 1,
  lightBoost: 1.1,
};

const TABLE: Partial<Record<AttackKind, SkillCastFx>> = {
  basic: DEFAULT_ARC,
  slam: { mode: 'arc', color: PALETTE.gold, grow: 1.55, tall: 1.4, lightBoost: 1.35 },
  bash: { mode: 'burst', color: PALETTE.moonlight, grow: 1.35, tall: 1, lightBoost: 1.25 },
  charge: { mode: 'arc', color: PALETTE.ember, grow: 1.65, tall: 1.15, lightBoost: 1.3 },
  whirlwind: { mode: 'ring', color: PALETTE.ember, grow: 1.55, tall: 1, lightBoost: 1.28 },
  cleave: { mode: 'arc', color: PALETTE.gold, grow: 1.45, tall: 1.25, lightBoost: 1.22 },
  execute: { mode: 'burst', color: PALETTE.gold, grow: 1.4, tall: 1, lightBoost: 1.32 },
  sunder: { mode: 'arc', color: PALETTE.ember, grow: 1.2, tall: 1.1, lightBoost: 1.15 },
  'battle-shout': { mode: 'burst', color: PALETTE.gold, grow: 1.1, tall: 1, lightBoost: 1.12 },

  fireball: { mode: 'arc', color: PALETTE.ember, grow: 1.55, tall: 1.4, lightBoost: 1.35 },
  pyroblast: { mode: 'arc', color: PALETTE.ember, grow: 1.7, tall: 1.5, lightBoost: 1.4 },
  'frost-nova': { mode: 'ring', color: PALETTE.mage, grow: 1.05, tall: 1, lightBoost: 1.25 },
  blizzard: { mode: 'ring', color: PALETTE.moonlight, grow: 1.35, tall: 1, lightBoost: 1.22 },
  'ice-lance': { mode: 'arc', color: PALETTE.moonlight, grow: 1.25, tall: 1.2, lightBoost: 1.2 },
  'arcane-missiles': { mode: 'arc', color: PALETTE.mage, grow: 1.2, tall: 1.1, lightBoost: 1.18 },
  blink: { mode: 'burst', color: PALETTE.mage, grow: 1.3, tall: 1, lightBoost: 1.28 },
  'mana-shield': { mode: 'ring', color: PALETTE.mage, grow: 0.85, tall: 1, lightBoost: 1.1 },

  'aimed-shot': { mode: 'arc', color: PALETTE.hunter, grow: 1.35, tall: 1.05, lightBoost: 1.2 },
  'multi-shot': { mode: 'arc', color: PALETTE.gold, grow: 1.45, tall: 1.15, lightBoost: 1.22 },
  'concussive-shot': { mode: 'arc', color: PALETTE.moonlight, grow: 1.25, tall: 1.05, lightBoost: 1.15 },
  'serpent-sting': { mode: 'burst', color: PALETTE.moss, grow: 1.25, tall: 1, lightBoost: 1.18 },
  trap: { mode: 'ring', color: PALETTE.hunter, grow: 0.95, tall: 1, lightBoost: 1.12 },
  'explosive-trap': { mode: 'ring', color: PALETTE.ember, grow: 1.1, tall: 1, lightBoost: 1.2 },
  disengage: { mode: 'burst', color: PALETTE.hunter, grow: 1.15, tall: 1, lightBoost: 1.15 },
  'rapid-fire': { mode: 'arc', color: PALETTE.gold, grow: 1.2, tall: 1, lightBoost: 1.15 },

  'shadow-strike': { mode: 'arc', color: PALETTE.rogue, grow: 1.25, tall: 1.1, lightBoost: 1.18 },
  eviscerate: { mode: 'arc', color: PALETTE.ember, grow: 1.4, tall: 1.2, lightBoost: 1.25 },
  'poison-blade': { mode: 'arc', color: PALETTE.moss, grow: 1.2, tall: 1.05, lightBoost: 1.15 },
  'kidney-shot': { mode: 'burst', color: PALETTE.moonlight, grow: 1.3, tall: 1, lightBoost: 1.22 },
  'fan-of-knives': { mode: 'ring', color: PALETTE.rogue, grow: 1.4, tall: 1, lightBoost: 1.25 },
  'slice-and-dice': { mode: 'arc', color: PALETTE.gold, grow: 1.15, tall: 1, lightBoost: 1.12 },
  sprint: { mode: 'burst', color: PALETTE.gold, grow: 1.05, tall: 1, lightBoost: 1.1 },
  vanish: { mode: 'burst', color: PALETTE.moonlight, grow: 1.2, tall: 1, lightBoost: 1.15 },
};

export function skillCastFxOf(kind: AttackKind): SkillCastFx {
  return TABLE[kind] ?? DEFAULT_ARC;
}
