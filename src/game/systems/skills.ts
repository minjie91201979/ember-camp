import type { AttackKind, ItemCompareLine, World } from '../types';
import type { PlayerClassId } from '../data/classes';
import { PLAYER } from '../config';
import { canOpenBuildPanel, denyBuildPanel } from './attributes';

/** 技能等级倍率：1→5 级。 */
const LEVEL_MULT = [1, 1.12, 1.24, 1.4, 1.6] as const;

/** 升到该级所需技能点（从上一档）。index = 目标等级。 */
const UPGRADE_COST = [0, 0, 1, 1, 2, 2, 3] as const;

export type SkillId =
  | 'slam'
  | 'bash'
  | 'charge'
  | 'whirlwind'
  | 'execute'
  | 'battle-shout'
  | 'sunder'
  | 'cleave'
  | 'fireball'
  | 'frost-nova'
  | 'arcane-missiles'
  | 'blink'
  | 'blizzard'
  | 'pyroblast'
  | 'ice-lance'
  | 'mana-shield'
  | 'aimed-shot'
  | 'disengage'
  | 'multi-shot'
  | 'trap'
  | 'rapid-fire'
  | 'explosive-trap'
  | 'concussive-shot'
  | 'serpent-sting'
  | 'shadow-strike'
  | 'eviscerate'
  | 'poison-blade'
  | 'sprint'
  | 'vanish'
  | 'kidney-shot'
  | 'slice-and-dice'
  | 'fan-of-knives';

export type SkillDef = {
  name: string;
  reqLevel: number;
  kind: AttackKind | 'utility';
  desc: string;
  classId: PlayerClassId;
  /** false = 面板占位，不可学习 */
  implemented: boolean;
};

export const SKILL_DEFS: Record<SkillId, SkillDef> = {
  slam: {
    name: '猛击',
    reqLevel: 1,
    kind: 'slam',
    desc: '强化近战，生成怒气',
    classId: 'warrior',
    implemented: true,
  },
  bash: {
    name: '盾击',
    reqLevel: 1,
    kind: 'bash',
    desc: '消耗怒气，短硬直',
    classId: 'warrior',
    implemented: true,
  },
  charge: {
    name: '冲锋',
    reqLevel: 4,
    kind: 'charge',
    desc: '向前冲刺撞击；5 级冲锋后减伤',
    classId: 'warrior',
    implemented: true,
  },
  whirlwind: {
    name: '旋风斩',
    reqLevel: 8,
    kind: 'whirlwind',
    desc: '身周多段清怪；3 级可缓慢移动',
    classId: 'warrior',
    implemented: true,
  },
  execute: {
    name: '斩杀',
    reqLevel: 12,
    kind: 'execute',
    desc: '目标低血时高伤；5 级阈值提高并回怒',
    classId: 'warrior',
    implemented: true,
  },
  'battle-shout': {
    name: '战吼',
    reqLevel: 16,
    kind: 'battle-shout',
    desc: '短时提高攻击与护甲；3 级兼增移速',
    classId: 'warrior',
    implemented: true,
  },
  sunder: {
    name: '破甲斩',
    reqLevel: 20,
    kind: 'sunder',
    desc: '降低目标防御；5 级可叠 2 层',
    classId: 'warrior',
    implemented: true,
  },
  cleave: {
    name: '顺劈',
    reqLevel: 24,
    kind: 'cleave',
    desc: '主目标 + 身后弧线；3 级弧线加宽',
    classId: 'warrior',
    implemented: true,
  },
  fireball: {
    name: '火球术',
    reqLevel: 1,
    kind: 'fireball',
    desc: '消耗法力，远程弹道',
    classId: 'mage',
    implemented: true,
  },
  'frost-nova': {
    name: '冰霜新星',
    reqLevel: 1,
    kind: 'frost-nova',
    desc: '消耗法力，近身范围硬直',
    classId: 'mage',
    implemented: true,
  },
  'arcane-missiles': {
    name: '奥术飞弹',
    reqLevel: 4,
    kind: 'arcane-missiles',
    desc: '连续弹幕打单体',
    classId: 'mage',
    implemented: true,
  },
  blink: {
    name: '闪现',
    reqLevel: 8,
    kind: 'blink',
    desc: '短距位移，躲避扫屏',
    classId: 'mage',
    implemented: true,
  },
  blizzard: {
    name: '暴风雪',
    reqLevel: 12,
    kind: 'blizzard',
    desc: '引导落冰：前方大范围持续伤害并施加寒冰减速；5 级减速加强',
    classId: 'mage',
    implemented: true,
  },
  pyroblast: {
    name: '炎爆术',
    reqLevel: 16,
    kind: 'pyroblast',
    desc: '短前摇高伤单体火球',
    classId: 'mage',
    implemented: true,
  },
  'ice-lance': {
    name: '冰枪术',
    reqLevel: 20,
    kind: 'ice-lance',
    desc: '对减速/冻结目标高伤；5 级可弹射',
    classId: 'mage',
    implemented: true,
  },
  'mana-shield': {
    name: '法力护盾',
    reqLevel: 24,
    kind: 'mana-shield',
    desc: '开启后伤害先打护盾，持续耗蓝；3 级吸收提高',
    classId: 'mage',
    implemented: true,
  },
  'aimed-shot': {
    name: '瞄准射击',
    reqLevel: 1,
    kind: 'aimed-shot',
    desc: '消耗集中，单体远程箭矢',
    classId: 'hunter',
    implemented: true,
  },
  disengage: {
    name: '后跳射击',
    reqLevel: 1,
    kind: 'disengage',
    desc: '向后跳并开火，核心走位',
    classId: 'hunter',
    implemented: true,
  },
  'multi-shot': {
    name: '多重射击',
    reqLevel: 4,
    kind: 'multi-shot',
    desc: '扇形三箭',
    classId: 'hunter',
    implemented: true,
  },
  trap: {
    name: '捕兽夹',
    reqLevel: 8,
    kind: 'trap',
    desc: '地面陷阱，定身小怪',
    classId: 'hunter',
    implemented: true,
  },
  'rapid-fire': {
    name: '急速射击',
    reqLevel: 12,
    kind: 'rapid-fire',
    desc: '短时间连射箭雨',
    classId: 'hunter',
    implemented: true,
  },
  'explosive-trap': {
    name: '爆炸陷阱',
    reqLevel: 16,
    kind: 'explosive-trap',
    desc: '延迟爆炸清堆；3 级击退增强',
    classId: 'hunter',
    implemented: true,
  },
  'concussive-shot': {
    name: '震荡射击',
    reqLevel: 20,
    kind: 'concussive-shot',
    desc: '击退并短暂打断；5 级击退更远',
    classId: 'hunter',
    implemented: true,
  },
  'serpent-sting': {
    name: '毒箭',
    reqLevel: 24,
    kind: 'serpent-sting',
    desc: '上毒 DoT；3 级叠层上限 +1',
    classId: 'hunter',
    implemented: true,
  },
  'shadow-strike': {
    name: '影袭',
    reqLevel: 1,
    kind: 'shadow-strike',
    desc: '近战打击，生成 1 连击点',
    classId: 'rogue',
    implemented: true,
  },
  eviscerate: {
    name: '刺骨',
    reqLevel: 1,
    kind: 'eviscerate',
    desc: '消耗全部连击点打爆发',
    classId: 'rogue',
    implemented: true,
  },
  'poison-blade': {
    name: '毒刃',
    reqLevel: 4,
    kind: 'poison-blade',
    desc: '上毒 DoT，生成 1 连击点',
    classId: 'rogue',
    implemented: true,
  },
  sprint: {
    name: '疾跑',
    reqLevel: 8,
    kind: 'sprint',
    desc: '短时间移速，穿过小怪',
    classId: 'rogue',
    implemented: true,
  },
  vanish: {
    name: '消失',
    reqLevel: 12,
    kind: 'vanish',
    desc: '约 1.5s 无敌并脱战',
    classId: 'rogue',
    implemented: true,
  },
  'kidney-shot': {
    name: '肾击',
    reqLevel: 16,
    kind: 'kidney-shot',
    desc: '消耗连击点晕控；3 级晕时长随点数提高更多',
    classId: 'rogue',
    implemented: true,
  },
  'slice-and-dice': {
    name: '切割',
    reqLevel: 20,
    kind: 'slice-and-dice',
    desc: '消耗连击点换攻速；5 级期间能量回复加快',
    classId: 'rogue',
    implemented: true,
  },
  'fan-of-knives': {
    name: '刀扇',
    reqLevel: 24,
    kind: 'fan-of-knives',
    desc: '身周 AoE，生成连击点；3 级命中≥3 再 +1',
    classId: 'rogue',
    implemented: true,
  },
};

export const SKILL_BAR_SIZE = 4;

export function skillsForClass(classId: PlayerClassId): SkillId[] {
  return (Object.keys(SKILL_DEFS) as SkillId[]).filter(
    (id) => SKILL_DEFS[id].classId === classId,
  );
}

export function starterSkillIds(classId: PlayerClassId): SkillId[] {
  if (classId === 'mage') {
    return ['fireball', 'frost-nova'];
  }
  if (classId === 'hunter') {
    return ['aimed-shot', 'disengage'];
  }
  if (classId === 'rogue') {
    return ['shadow-strike', 'eviscerate'];
  }
  return ['slam', 'bash'];
}

export function createStarterSkillBar(classId: PlayerClassId): (SkillId | null)[] {
  const starters = starterSkillIds(classId);
  const bar: (SkillId | null)[] = [null, null, null, null];
  bar[0] = starters[0] ?? null;
  bar[1] = starters[1] ?? null;
  return bar;
}

export function skillLevelMult(level: number): number {
  const idx = Math.max(1, Math.min(5, level)) - 1;
  return LEVEL_MULT[idx] ?? 1;
}

export function skillLevelOf(world: World, id: SkillId): number {
  return world.skills[id] ?? 0;
}

export function isSkillLearned(world: World, id: SkillId): boolean {
  return skillLevelOf(world, id) > 0;
}

export function skillMultForAttack(world: World, kind: AttackKind): number {
  if (kind === 'slam') {
    return skillLevelMult(skillLevelOf(world, 'slam'));
  }
  if (kind === 'bash') {
    return skillLevelMult(skillLevelOf(world, 'bash'));
  }
  if (kind === 'fireball') {
    return skillLevelMult(skillLevelOf(world, 'fireball'));
  }
  if (kind === 'frost-nova') {
    return skillLevelMult(skillLevelOf(world, 'frost-nova'));
  }
  if (kind === 'arcane-missiles') {
    return skillLevelMult(skillLevelOf(world, 'arcane-missiles'));
  }
  if (kind === 'aimed-shot' || kind === 'disengage') {
    return skillLevelMult(
      skillLevelOf(world, kind === 'aimed-shot' ? 'aimed-shot' : 'disengage'),
    );
  }
  if (kind === 'multi-shot') {
    return skillLevelMult(skillLevelOf(world, 'multi-shot'));
  }
  if (kind === 'trap') {
    return skillLevelMult(skillLevelOf(world, 'trap'));
  }
  if (kind === 'shadow-strike') {
    return skillLevelMult(skillLevelOf(world, 'shadow-strike'));
  }
  if (kind === 'eviscerate') {
    return skillLevelMult(skillLevelOf(world, 'eviscerate'));
  }
  if (kind === 'poison-blade') {
    return skillLevelMult(skillLevelOf(world, 'poison-blade'));
  }
  if (kind === 'blizzard') {
    return skillLevelMult(skillLevelOf(world, 'blizzard'));
  }
  if (kind === 'rapid-fire') {
    return skillLevelMult(skillLevelOf(world, 'rapid-fire'));
  }
  if (kind === 'pyroblast') {
    return skillLevelMult(skillLevelOf(world, 'pyroblast'));
  }
  if (kind === 'explosive-trap') {
    return skillLevelMult(skillLevelOf(world, 'explosive-trap'));
  }
  if (kind === 'ice-lance') {
    return skillLevelMult(skillLevelOf(world, 'ice-lance'));
  }
  if (kind === 'concussive-shot') {
    return skillLevelMult(skillLevelOf(world, 'concussive-shot'));
  }
  if (kind === 'mana-shield') {
    return skillLevelMult(skillLevelOf(world, 'mana-shield'));
  }
  if (kind === 'serpent-sting') {
    return skillLevelMult(skillLevelOf(world, 'serpent-sting'));
  }
  if (kind === 'charge') {
    return skillLevelMult(skillLevelOf(world, 'charge'));
  }
  if (kind === 'whirlwind') {
    return skillLevelMult(skillLevelOf(world, 'whirlwind'));
  }
  if (kind === 'execute') {
    return skillLevelMult(skillLevelOf(world, 'execute'));
  }
  if (kind === 'battle-shout') {
    return skillLevelMult(skillLevelOf(world, 'battle-shout'));
  }
  if (kind === 'sunder') {
    return skillLevelMult(skillLevelOf(world, 'sunder'));
  }
  if (kind === 'cleave') {
    return skillLevelMult(skillLevelOf(world, 'cleave'));
  }
  if (kind === 'kidney-shot') {
    return skillLevelMult(skillLevelOf(world, 'kidney-shot'));
  }
  if (kind === 'slice-and-dice') {
    return skillLevelMult(skillLevelOf(world, 'slice-and-dice'));
  }
  if (kind === 'fan-of-knives') {
    return skillLevelMult(skillLevelOf(world, 'fan-of-knives'));
  }
  return 1;
}

export function upgradeCost(currentLevel: number): number {
  const next = currentLevel + 1;
  if (next < 2 || next > 5) {
    return 0;
  }
  return UPGRADE_COST[next] ?? 0;
}

export function canUpgradeSkill(world: World, id: SkillId): boolean {
  const def = SKILL_DEFS[id];
  if (!def?.implemented) {
    return false;
  }
  const level = skillLevelOf(world, id);
  if (level <= 0 || level >= 5) {
    return false;
  }
  const cost = upgradeCost(level);
  return cost > 0 && world.player.unspentSkill >= cost;
}

export function upgradeSkill(world: World, id: SkillId): boolean {
  if (!canUpgradeSkill(world, id)) {
    return false;
  }
  const level = skillLevelOf(world, id);
  const cost = upgradeCost(level);
  world.player.unspentSkill -= cost;
  world.skills[id] = level + 1;
  return true;
}

export function canLearnSkill(world: World, id: SkillId): boolean {
  const def = SKILL_DEFS[id];
  if (!def?.implemented) {
    return false;
  }
  if (def.classId !== world.player.classId) {
    return false;
  }
  if (skillLevelOf(world, id) > 0) {
    return false;
  }
  if (world.player.level < def.reqLevel) {
    return false;
  }
  return world.player.unspentSkill >= 1;
}

/** 学会技能（耗 1 点），自动填入技能栏空位。 */
export function learnSkill(world: World, id: SkillId): boolean {
  if (!canLearnSkill(world, id)) {
    return false;
  }
  world.player.unspentSkill -= 1;
  world.skills[id] = 1;
  assignSkillToBar(world, id);
  return true;
}

export function assignSkillToBar(world: World, id: SkillId): void {
  if (!world.skillBar) {
    world.skillBar = createStarterSkillBar(world.player.classId);
  }
  if (world.skillBar.includes(id)) {
    return;
  }
  const empty = world.skillBar.findIndex((s) => s === null);
  if (empty >= 0) {
    world.skillBar[empty] = id;
  }
}

const BAR_LABELS = ['Q', 'E', '1', '2'] as const;

export function skillBarSlotOf(world: World, id: string): number {
  if (!world.skillBar) {
    return -1;
  }
  return world.skillBar.findIndex((s) => s === id);
}

export function skillBarLabelOf(slot: number): string {
  return BAR_LABELS[slot] ?? '?';
}

/** 资源消耗（怒气/法力/集中/能量，按职业解释）。 */
export function skillResourceCost(id: SkillId): number {
  const map: Partial<Record<SkillId, number>> = {
    bash: PLAYER.bashCost,
    charge: PLAYER.chargeCost,
    whirlwind: PLAYER.whirlwindCost,
    execute: PLAYER.executeCost,
    'battle-shout': PLAYER.battleShoutCost,
    sunder: PLAYER.sunderCost,
    cleave: PLAYER.cleaveCost,
    fireball: PLAYER.fireballCost,
    'frost-nova': PLAYER.frostNovaCost,
    'arcane-missiles': PLAYER.arcaneMissilesCost,
    blink: PLAYER.blinkCost,
    blizzard: PLAYER.blizzardCost,
    pyroblast: PLAYER.pyroblastCost,
    'ice-lance': PLAYER.iceLanceCost,
    'mana-shield': PLAYER.manaShieldCost,
    'aimed-shot': PLAYER.aimedShotCost,
    disengage: PLAYER.disengageCost,
    'multi-shot': PLAYER.multiShotCost,
    trap: PLAYER.trapCost,
    'explosive-trap': PLAYER.explosiveTrapCost,
    'rapid-fire': PLAYER.rapidFireCost,
    'concussive-shot': PLAYER.concussiveCost,
    'serpent-sting': PLAYER.serpentStingCost,
    'shadow-strike': PLAYER.shadowStrikeCost,
    eviscerate: PLAYER.eviscerateCost,
    'poison-blade': PLAYER.poisonBladeCost,
    sprint: PLAYER.sprintCost,
    vanish: PLAYER.vanishCost,
    'kidney-shot': PLAYER.kidneyShotCost,
    'slice-and-dice': PLAYER.sliceAndDiceCost,
    'fan-of-knives': PLAYER.fanOfKnivesCost,
  };
  return map[id] ?? 0;
}

export function skillCooldownSec(id: SkillId): number {
  const map: Partial<Record<SkillId, number>> = {
    slam: PLAYER.slamCooldown,
    bash: PLAYER.bashCooldown,
    charge: PLAYER.chargeCooldown,
    whirlwind: PLAYER.whirlwindCooldown,
    execute: PLAYER.executeCooldown,
    'battle-shout': PLAYER.battleShoutCooldown,
    sunder: PLAYER.sunderCooldown,
    cleave: PLAYER.cleaveCooldown,
    fireball: PLAYER.fireballCooldown,
    'frost-nova': PLAYER.frostNovaCooldown,
    'arcane-missiles': PLAYER.arcaneMissilesCooldown,
    blink: PLAYER.blinkCooldown,
    blizzard: PLAYER.blizzardCooldown,
    pyroblast: PLAYER.pyroblastCooldown,
    'ice-lance': PLAYER.iceLanceCooldown,
    'mana-shield': PLAYER.manaShieldCooldown,
    'aimed-shot': PLAYER.aimedShotCooldown,
    disengage: PLAYER.disengageCooldown,
    'multi-shot': PLAYER.multiShotCooldown,
    trap: PLAYER.trapCooldown,
    'explosive-trap': PLAYER.explosiveTrapCooldown,
    'rapid-fire': PLAYER.rapidFireCooldown,
    'concussive-shot': PLAYER.concussiveCooldown,
    'serpent-sting': PLAYER.serpentStingCooldown,
    'shadow-strike': PLAYER.shadowStrikeCooldown,
    eviscerate: PLAYER.eviscerateCooldown,
    'poison-blade': PLAYER.poisonBladeCooldown,
    sprint: PLAYER.sprintCooldown,
    vanish: PLAYER.vanishCooldown,
    'kidney-shot': PLAYER.kidneyShotCooldown,
    'slice-and-dice': PLAYER.sliceAndDiceCooldown,
    'fan-of-knives': PLAYER.fanOfKnivesCooldown,
  };
  return map[id] ?? 0;
}

/**
 * 将已学技能放到栏位；若该技能已在其他栏则互换；覆盖目标栏原技能。
 */
export function placeSkillOnBar(world: World, id: SkillId, slot: number): boolean {
  if (slot < 0 || slot > 3) {
    return false;
  }
  if (!SKILL_DEFS[id]?.implemented || skillLevelOf(world, id) <= 0) {
    return false;
  }
  if (!world.skillBar) {
    world.skillBar = createStarterSkillBar(world.player.classId);
  }
  const from = skillBarSlotOf(world, id);
  if (from === slot) {
    return true;
  }
  const displaced = world.skillBar[slot] ?? null;
  world.skillBar[slot] = id;
  if (from >= 0) {
    world.skillBar[from] = displaced;
  }
  return true;
}

function toneOfDelta(delta: number): ItemCompareLine['tone'] {
  if (delta > 0) {
    return 'better';
  }
  if (delta < 0) {
    return 'worse';
  }
  return 'equal';
}

function formatSigned(delta: number): string {
  return delta > 0 ? `+${delta}` : `${delta}`;
}

/** 相对技能栏某槽（默认 Q）的对比；已在栏则提示键位。 */
export function skillCompareLines(
  world: World,
  candidateId: SkillId,
  vsSlot = 0,
): ItemCompareLine[] {
  const cand = SKILL_DEFS[candidateId];
  if (!cand || skillLevelOf(world, candidateId) <= 0) {
    return [];
  }
  const slot = skillBarSlotOf(world, candidateId);
  if (slot >= 0) {
    return [{ text: `已在技能栏 ${skillBarLabelOf(slot)}`, tone: 'note' }];
  }
  const otherId = world.skillBar?.[vsSlot] ?? null;
  if (!otherId || !isSkillId(otherId)) {
    return [
      { text: `栏位 ${skillBarLabelOf(vsSlot)} 空闲`, tone: 'note' },
      { text: `消耗 ${skillResourceCost(candidateId)} · CD ${skillCooldownSec(candidateId).toFixed(1)}s`, tone: 'equal' },
    ];
  }
  const other = SKILL_DEFS[otherId];
  const candLv = skillLevelOf(world, candidateId);
  const otherLv = skillLevelOf(world, otherId);
  const lines: ItemCompareLine[] = [
    { text: `对比 ${skillBarLabelOf(vsSlot)} · ${other.name}`, tone: 'note' },
  ];
  const lvDelta = candLv - otherLv;
  lines.push({
    text: `等级 ${candLv}（${formatSigned(lvDelta)}）`,
    tone: toneOfDelta(lvDelta),
  });
  const costDelta = skillResourceCost(otherId) - skillResourceCost(candidateId);
  lines.push({
    text: `消耗 ${skillResourceCost(candidateId)}（${formatSigned(costDelta)} 更省为正）`,
    tone: toneOfDelta(costDelta),
  });
  const cdDelta = skillCooldownSec(otherId) - skillCooldownSec(candidateId);
  lines.push({
    text: `冷却 ${skillCooldownSec(candidateId).toFixed(1)}s（${formatSigned(Number(cdDelta.toFixed(1)))} 更短为正）`,
    tone: toneOfDelta(cdDelta),
  });
  return lines;
}

export function toggleSkills(world: World): void {
  if (world.player.hp <= 0) {
    return;
  }
  if (!world.skillOpen && !canOpenBuildPanel(world)) {
    denyBuildPanel(world);
    return;
  }
  world.skillOpen = !world.skillOpen;
  if (world.skillOpen) {
    world.invOpen = false;
    world.charOpen = false;
    world.catalogOpen = false;
    world.campOpen = null;
    world.specPickOpen = false;
  }
}

export function createStarterSkills(classId: PlayerClassId): Record<string, number> {
  const out: Record<string, number> = {};
  for (const id of skillsForClass(classId)) {
    out[id] = 0;
  }
  for (const id of starterSkillIds(classId)) {
    out[id] = 1;
  }
  return out;
}

export function isSkillId(value: unknown): value is SkillId {
  return typeof value === 'string' && value in SKILL_DEFS;
}

export function normalizeSkillBar(
  classId: PlayerClassId,
  raw: unknown,
): (SkillId | null)[] {
  const fallback = createStarterSkillBar(classId);
  if (!Array.isArray(raw) || raw.length === 0) {
    return fallback;
  }
  const bar: (SkillId | null)[] = [null, null, null, null];
  for (let i = 0; i < SKILL_BAR_SIZE; i += 1) {
    const v = raw[i];
    if (v === null || v === undefined || v === '') {
      bar[i] = null;
    } else if (isSkillId(v) && SKILL_DEFS[v].classId === classId) {
      bar[i] = v;
    } else {
      bar[i] = fallback[i] ?? null;
    }
  }
  if (!bar[0] && !bar[1]) {
    return fallback;
  }
  return bar;
}
