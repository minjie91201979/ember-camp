import { PLAYER } from '../config';
import type { AttackKind, Dummy, Player, World } from '../types';
import { sfx } from '../../audio/sfx';
import {
  nextSpecNodeTier,
  nodesForSpecTier,
  specNodeDef,
  type SpecNodeEffectId,
} from '../data/talents';
import { legendaryVanishCooldownMult } from './legendary';

export type WarriorSpecId = 'guard' | 'fury' | 'arms';
export type MageSpecId = 'fire' | 'frost' | 'arcane';
export type HunterSpecId = 'marksmanship' | 'survival' | 'mobility';
export type RogueSpecId = 'assassination' | 'combat' | 'subtlety';
export type PaladinSpecId = 'protection' | 'retribution' | 'holy';
export type SpecId = WarriorSpecId | MageSpecId | HunterSpecId | RogueSpecId | PaladinSpecId;

export type SpecDef = {
  id: SpecId;
  name: string;
  tag: string;
  effects: string[];
};

export const WARRIOR_SPECS: SpecDef[] = [
  {
    id: 'guard',
    name: '防护',
    tag: '抗压',
    effects: ['受伤降低 8%', '盾击冷却 −25%', '受击怒气 +35%'],
  },
  {
    id: 'fury',
    name: '狂怒',
    tag: '清怪',
    effects: ['怒气获取 +25%', '旋风 / 顺劈伤害提高', '低血时攻击提高'],
  },
  {
    id: 'arms',
    name: '武器',
    tag: '单体',
    effects: ['斩杀伤害提高', '猛击 / 普攻略强', '冲锋冷却 −20%'],
  },
];

export const MAGE_SPECS: SpecDef[] = [
  {
    id: 'fire',
    name: '火焰',
    tag: '爆发',
    effects: ['火球 / 炎爆暴击提高', '火球 / 炎爆伤害 +12%', '暴击附加灼烧感（震屏）'],
  },
  {
    id: 'frost',
    name: '冰霜',
    tag: '控制',
    effects: ['新星冻结更久', '冰枪 / 暴风雪伤害提高', '控场风筝'],
  },
  {
    id: 'arcane',
    name: '奥术',
    tag: '持续',
    effects: ['奥术飞弹伤害 +18%', '耗蓝技能伤害 +5%', '法力护盾更厚且耗蓝更省'],
  },
];

export const HUNTER_SPECS: SpecDef[] = [
  {
    id: 'marksmanship',
    name: '射击',
    tag: '单体',
    effects: ['瞄准射击伤害 +18%', '8 米外加成再提高', '急速射击间隔缩短'],
  },
  {
    id: 'survival',
    name: '生存',
    tag: '控场',
    effects: ['陷阱冷却 −25%', '可同时存在 2 个陷阱', '踩夹/爆炸目标受伤增加'],
  },
  {
    id: 'mobility',
    name: '机动',
    tag: '走位',
    effects: ['后跳冷却 −25% / 距离 +20%', '急速射击期间移速更高', '震荡击退更远'],
  },
];

export const ROGUE_SPECS: SpecDef[] = [
  {
    id: 'assassination',
    name: '刺杀',
    tag: 'DoT',
    effects: ['毒素伤害 +25%', '刺骨对中毒目标额外伤害', '毒刃冷却略缩短'],
  },
  {
    id: 'combat',
    name: '战斗',
    tag: '持续',
    effects: ['能量回复 +25%', '影袭 / 刀扇伤害提高', '切割时长略延长'],
  },
  {
    id: 'subtlety',
    name: '敏锐',
    tag: '切入',
    effects: ['消失冷却 −30%', '破隐一击伤害更高', '疾跑期间减伤'],
  },
];

export const PALADIN_SPECS: SpecDef[] = [
  {
    id: 'protection',
    name: '防护',
    tag: '抗压',
    effects: ['受伤降低 8%', '圣盾击冷却 −25%', '受击圣能 +35%'],
  },
  {
    id: 'retribution',
    name: '惩戒',
    tag: '爆发',
    effects: ['圣能获取 +25%', '审判 / 十字军伤害提高', '低血时攻击提高'],
  },
  {
    id: 'holy',
    name: '神圣',
    tag: '辅助',
    effects: ['护盾更厚', '圣光祝福减伤增强', '生命回复提升'],
  },
];

export function specsForClass(classId: string): SpecDef[] {
  if (classId === 'mage') {
    return MAGE_SPECS;
  }
  if (classId === 'hunter') {
    return HUNTER_SPECS;
  }
  if (classId === 'rogue') {
    return ROGUE_SPECS;
  }
  if (classId === 'warrior') {
    return WARRIOR_SPECS;
  }
  if (classId === 'paladin') {
    return PALADIN_SPECS;
  }
  return [];
}

export function specDef(id: string | null): SpecDef | null {
  if (!id) {
    return null;
  }
  return (
    WARRIOR_SPECS.find((s) => s.id === id) ??
    MAGE_SPECS.find((s) => s.id === id) ??
    HUNTER_SPECS.find((s) => s.id === id) ??
    ROGUE_SPECS.find((s) => s.id === id) ??
    PALADIN_SPECS.find((s) => s.id === id) ??
    null
  );
}

export function needsSpecPick(world: World): boolean {
  const cls = world.player.classId;
  if (
    cls !== 'warrior' &&
    cls !== 'mage' &&
    cls !== 'hunter' &&
    cls !== 'rogue' &&
    cls !== 'paladin'
  ) {
    return false;
  }
  return world.player.level >= 10 && !world.specId;
}

export function openSpecPick(world: World): void {
  if (!needsSpecPick(world)) {
    return;
  }
  world.specPickOpen = true;
  world.invOpen = false;
  world.charOpen = false;
  world.skillOpen = false;
  world.campOpen = null;
}

export function maybePromptSpec(world: World): void {
  if (needsSpecPick(world)) {
    openSpecPick(world);
    world.levelToastT = Math.max(world.levelToastT, 2.2);
    world.levelToastText = '选择一条专精';
    return;
  }
  maybePromptSpecNode(world);
}

export function closeSpecPick(world: World): void {
  world.specPickOpen = false;
}

export function pickSpecialization(world: World, id: string): boolean {
  if (world.player.level < 10) {
    return false;
  }
  if (world.specId) {
    return false;
  }
  const allowed = specsForClass(world.player.classId);
  if (!allowed.some((s) => s.id === id)) {
    return false;
  }
  world.specId = id;
  world.specPickOpen = false;
  const def = specDef(id);
  world.levelToastT = 2;
  world.levelToastText = `专精 · ${def?.name ?? id}`;
  sfx.play('levelup');
  maybePromptSpecNode(world);
  return true;
}

export function resetSpecialization(world: World): string {
  if (!world.specId) {
    sfx.play('deny');
    return '尚未选择专精';
  }
  const p = world.player;
  const cost = p.specResetCount === 0 ? 0 : 20 * p.level * p.specResetCount;
  if (world.gold < cost) {
    sfx.play('deny');
    return `需要 ${cost} 金`;
  }
  world.gold -= cost;
  world.specId = null;
  world.specNodes = {};
  world.specNodePickTier = null;
  p.specResetCount += 1;
  sfx.play('levelup');
  openSpecPick(world);
  return cost === 0 ? '专精已取消（首次免费）' : `专精已取消（花费 ${cost} 金）`;
}

export function needsSpecNodePick(world: World): boolean {
  if (!world.specId || needsSpecPick(world)) {
    return false;
  }
  return nextSpecNodeTier(world.player.level, world.specNodes ?? {}) !== null;
}

export function openSpecNodePick(world: World, tier: number): void {
  if (!world.specId) {
    return;
  }
  if (nodesForSpecTier(world.specId, tier).length === 0) {
    return;
  }
  if (world.specNodes?.[tier]) {
    return;
  }
  world.specNodePickTier = tier;
  world.specPickOpen = false;
  world.invOpen = false;
  world.charOpen = false;
  world.skillOpen = false;
  world.campOpen = null;
}

export function maybePromptSpecNode(world: World): void {
  const tier = nextSpecNodeTier(world.player.level, world.specNodes ?? {});
  if (tier === null) {
    return;
  }
  openSpecNodePick(world, tier);
  world.levelToastT = Math.max(world.levelToastT, 2.2);
  world.levelToastText = `选择 ${tier} 级专精节点`;
}

export function closeSpecNodePick(world: World): void {
  world.specNodePickTier = null;
}

export function pickSpecNode(world: World, nodeId: string): boolean {
  const tier = world.specNodePickTier;
  if (tier === null || !world.specId) {
    return false;
  }
  const options = nodesForSpecTier(world.specId, tier);
  const node = options.find((n) => n.id === nodeId);
  if (!node) {
    return false;
  }
  if (world.specNodes?.[tier]) {
    return false;
  }
  world.specNodes = { ...(world.specNodes ?? {}), [tier]: nodeId };
  world.specNodePickTier = null;
  world.levelToastT = 2;
  world.levelToastText = `节点 · ${node.name}`;
  sfx.play('levelup');
  return true;
}

export function nodeEffectValue(world: World, effect: SpecNodeEffectId): number {
  let total = 0;
  for (const id of Object.values(world.specNodes ?? {})) {
    const def = specNodeDef(id);
    if (def?.effect === effect) {
      total += def.value;
    }
  }
  return total;
}

/** 节点同效果叠加上限，避免五档全堆同一轴时数字碾压。 */
const NODE_EFFECT_CAP: Partial<Record<SpecNodeEffectId, number>> = {
  incoming_dr: 0.18,
  rage_on_hit: 0.4,
  whirlwind_radius: 0.35,
  crit_mult: 0.32,
  charge_cd: 0.35,
  frost_nova_stun: 0.35,
  poison_dmg: 0.4,
  energy_regen: 0.4,
  vanish_cd: 0.35,
  blink_cd: 0.35,
  trap_cd: 0.35,
  disengage_cd: 0.35,
  rapid_fire_interval: 0.32,
  opener_bonus: 0.28,
  pyroblast_dmg: 0.4,
  ice_lance_dmg: 0.4,
  arcane_missile_dmg: 0.4,
  aimed_dmg: 0.4,
  explosive_dmg: 0.4,
  fireball_crit: 0.2,
  eviscerate_poison: 0.35,
  shadow_strike_cd: 0.35,
  disengage_range: 0.35,
};

export function cappedNodeEffect(world: World, effect: SpecNodeEffectId): number {
  const raw = nodeEffectValue(world, effect);
  const cap = NODE_EFFECT_CAP[effect];
  return cap === undefined ? raw : Math.min(cap, raw);
}

export function hasNodeEffect(world: World, effect: SpecNodeEffectId): boolean {
  return nodeEffectValue(world, effect) > 0;
}

export function slamCooldownOf(_world: World): number {
  return PLAYER.slamCooldown;
}

export function chargeCooldownOf(world: World): number {
  const base = PLAYER.chargeCooldown;
  let m = world.specId === 'arms' ? 0.8 : 1;
  m *= 1 - cappedNodeEffect(world, 'charge_cd');
  return base * Math.max(0.5, m);
}

export function bashCooldownOf(world: World): number {
  const base = PLAYER.bashCooldown;
  return world.specId === 'guard' || world.specId === 'protection' ? base * 0.75 : base;
}

export function blinkCooldownOf(world: World): number {
  const base = PLAYER.blinkCooldown;
  let m = world.specId === 'arcane' ? 0.8 : 1;
  m *= 1 - cappedNodeEffect(world, 'blink_cd');
  return base * Math.max(0.5, m);
}

export function disengageCooldownOf(world: World): number {
  const base = PLAYER.disengageCooldown;
  let m = world.specId === 'mobility' ? 0.75 : 1;
  m *= 1 - cappedNodeEffect(world, 'disengage_cd');
  return base * Math.max(0.5, m);
}

export function disengageRangeOf(world: World): number {
  const base = PLAYER.disengageRange;
  let m = world.specId === 'mobility' ? 1.2 : 1;
  m *= 1 + cappedNodeEffect(world, 'disengage_range');
  return base * m;
}

export function trapCooldownOf(world: World): number {
  const base = PLAYER.trapCooldown;
  let m = world.specId === 'survival' ? 0.75 : 1;
  m *= 1 - cappedNodeEffect(world, 'trap_cd');
  return base * Math.max(0.5, m);
}

export function explosiveTrapCooldownOf(world: World): number {
  const base = PLAYER.explosiveTrapCooldown;
  let m = world.specId === 'survival' ? 0.75 : 1;
  m *= 1 - cappedNodeEffect(world, 'trap_cd');
  return base * Math.max(0.5, m);
}

export function trapCapOf(world: World): number {
  return world.specId === 'survival' ? 2 : PLAYER.trapCap;
}

export function sprintCooldownOf(world: World): number {
  const base = PLAYER.sprintCooldown;
  return world.specId === 'subtlety' ? base * 0.85 : base;
}

export function vanishCooldownOf(world: World): number {
  const base = PLAYER.vanishCooldown;
  let m = world.specId === 'subtlety' ? 0.7 : 1;
  m *= 1 - cappedNodeEffect(world, 'vanish_cd');
  m *= legendaryVanishCooldownMult(world);
  return base * Math.max(0.45, m);
}

export function poisonBladeCooldownOf(world: World): number {
  const base = PLAYER.poisonBladeCooldown;
  return world.specId === 'assassination' ? base * 0.85 : base;
}

export function shadowStrikeCooldownOf(world: World): number {
  const base = PLAYER.shadowStrikeCooldown;
  let m = world.specId === 'combat' ? 0.85 : 1;
  m *= 1 - cappedNodeEffect(world, 'shadow_strike_cd');
  return base * Math.max(0.5, m);
}

export function energyRegenMult(world: World): number {
  let m = world.specId === 'combat' ? 1.25 : 1;
  m *= 1 + cappedNodeEffect(world, 'energy_regen');
  return m;
}

export function frostNovaStunOf(world: World): number {
  const base = PLAYER.frostNovaStun;
  let m = world.specId === 'frost' ? 1.35 : 1;
  m *= 1 + cappedNodeEffect(world, 'frost_nova_stun');
  return base * m;
}

export function rageGainMult(world: World, source: 'hit' | 'hurt' | 'slam'): number {
  const id = world.specId;
  let m = 1;
  if ((id === 'fury' || id === 'retribution') && (source === 'hit' || source === 'slam')) {
    m *= 1.25;
  }
  if ((id === 'guard' || id === 'protection') && source === 'hurt') {
    m *= 1.35;
  }
  if (source === 'hit' || source === 'slam' || source === 'hurt') {
    m *= 1 + cappedNodeEffect(world, 'rage_on_hit');
  }
  return m;
}

export function outgoingDamageMult(
  world: World,
  kind: AttackKind,
  dummy: Dummy,
): number {
  let m = 1;
  const p = world.player;
  if (world.specId === 'fury') {
    if (kind === 'slam') {
      m *= 1.12;
    }
    if (kind === 'whirlwind' || kind === 'cleave') {
      m *= 1.18;
    }
    const hpRatio = p.maxHp > 0 ? p.hp / p.maxHp : 1;
    if (hpRatio < 0.45) {
      m *= 1.16;
    }
  }
  if (world.specId === 'arms') {
    const foeRatio = dummy.maxHp > 0 ? dummy.hp / dummy.maxHp : 1;
    if (foeRatio < 0.35) {
      m *= 1.22;
    }
    if (kind === 'execute') {
      m *= 1.28;
    }
    if (kind === 'slam' || kind === 'basic') {
      m *= 1.06;
    }
  }
  if (p.warShoutT > 0) {
    m *= PLAYER.battleShoutAtk;
  }
  if (world.specId === 'fire' && (kind === 'fireball' || kind === 'pyroblast')) {
    m *= 1.12;
  }
  if (world.specId === 'frost' && kind === 'frost-nova') {
    m *= 1.12;
  }
  if (world.specId === 'frost' && kind === 'ice-lance') {
    m *= 1.2;
  }
  m *= 1 + cappedNodeEffect(world, 'ice_lance_dmg') * (kind === 'ice-lance' ? 1 : 0);
  m *= 1 + cappedNodeEffect(world, 'pyroblast_dmg') * (kind === 'pyroblast' ? 1 : 0);
  m *= 1 + cappedNodeEffect(world, 'arcane_missile_dmg') * (kind === 'arcane-missiles' ? 1 : 0);
  m *= 1 + cappedNodeEffect(world, 'aimed_dmg') * (kind === 'aimed-shot' ? 1 : 0);
  m *= 1 + cappedNodeEffect(world, 'explosive_dmg') * (kind === 'explosive-trap' ? 1 : 0);
  if (world.specId === 'assassination') {
    if (kind === 'poison-blade') {
      m *= 1.1;
    }
    if (kind === 'eviscerate' && dummy.poisonT > 0) {
      m *= 1.18 * (1 + cappedNodeEffect(world, 'eviscerate_poison'));
    }
  } else if (kind === 'eviscerate' && dummy.poisonT > 0) {
    m *= 1 + cappedNodeEffect(world, 'eviscerate_poison');
  }
  if (world.specId === 'arcane') {
    if (kind === 'arcane-missiles') {
      m *= 1.18;
    }
    if (
      kind === 'fireball' ||
      kind === 'frost-nova' ||
      kind === 'arcane-missiles' ||
      kind === 'blizzard' ||
      kind === 'pyroblast' ||
      kind === 'ice-lance'
    ) {
      m *= 1.05;
    }
  }
  if (world.specId === 'frost' && kind === 'blizzard') {
    m *= 1.12;
  }
  if (world.specId === 'marksmanship' && kind === 'aimed-shot') {
    m *= 1.18;
  }
  if (world.specId === 'marksmanship' && kind === 'concussive-shot') {
    m *= 1.08;
  }
  if (world.specId === 'survival' && (dummy.stunT > 0 || kind === 'explosive-trap')) {
    m *= kind === 'explosive-trap' ? 1.22 : 1.14;
  }
  if (world.specId === 'combat' && kind === 'shadow-strike') {
    m *= 1.14;
  }
  if (world.specId === 'combat' && kind === 'fan-of-knives') {
    m *= 1.16;
  }
  if (world.specId === 'assassination' && kind === 'kidney-shot') {
    m *= 1.08;
  }
  if (p.classId === 'hunter') {
    const dist = Math.abs(dummy.x - p.x);
    if (dist >= PLAYER.hunterRangeBonusDist) {
      m *= PLAYER.hunterRangeBonusMult;
      if (world.specId === 'marksmanship') {
        m *= 1.08;
      }
    }
  }
  if (p.openerBonusT > 0 && (kind === 'shadow-strike' || kind === 'eviscerate' || kind === 'poison-blade' || kind === 'kidney-shot' || kind === 'basic')) {
    let opener = world.specId === 'subtlety' ? 1.32 : 1.1;
    opener *= 1 + cappedNodeEffect(world, 'opener_bonus');
    m *= opener;
  }
  return m;
}

export function fireballCritBonus(world: World): number {
  let bonus = world.specId === 'fire' ? 0.08 : 0;
  bonus += cappedNodeEffect(world, 'fireball_crit');
  return bonus;
}

export function rapidFireIntervalOf(world: World): number {
  const base = PLAYER.rapidFireInterval;
  let m = world.specId === 'marksmanship' ? 0.85 : 1;
  m *= 1 - cappedNodeEffect(world, 'rapid_fire_interval');
  return base * Math.max(0.55, m);
}

export function rapidFireMoveMult(world: World): number {
  return world.specId === 'mobility' && world.player.rapidFireT > 0 ? 1.28 : 1;
}

export function incomingDamageMult(world: World): number {
  let m = 1;
  if (world.specId === 'guard') {
    m *= 0.92;
  }
  if (world.specId === 'subtlety' && (world.player.sprintT > 0 || world.player.vanishT > 0)) {
    m *= 0.75;
  }
  if (world.player.chargeDrT > 0) {
    m *= PLAYER.chargeDrMult;
  }
  if (world.player.warShoutT > 0) {
    m *= PLAYER.battleShoutDef;
  }
  m *= 1 - cappedNodeEffect(world, 'incoming_dr');
  return Math.max(0.45, m);
}

export function critMultOf(player: Player, world: World): number {
  let m = world.specId === 'arms' ? player.critMult * 1.2 : player.critMult;
  m *= 1 + cappedNodeEffect(world, 'crit_mult');
  return m;
}

/** 斩杀血量阈值；多档节点取最高阈值，不叠加。 */
export function executeThreshOf(world: World, skillAtLeast5: boolean): number {
  let best = 0;
  for (const id of Object.values(world.specNodes ?? {})) {
    const def = specNodeDef(id);
    if (def?.effect === 'execute_thresh') {
      best = Math.max(best, def.value);
    }
  }
  if (best > 0) {
    return best;
  }
  return skillAtLeast5 ? PLAYER.executeThresh5 : PLAYER.executeThresh;
}

export function whirlwindRadiusOf(world: World): number {
  return PLAYER.whirlwindRadius * (1 + cappedNodeEffect(world, 'whirlwind_radius'));
}

export function poisonDmgNodeMult(world: World): number {
  return 1 + cappedNodeEffect(world, 'poison_dmg');
}
