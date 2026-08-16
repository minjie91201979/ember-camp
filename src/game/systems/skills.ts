import type { AttackKind, World } from '../types';

/** 技能等级倍率：1→5 级。 */
const LEVEL_MULT = [1, 1.12, 1.24, 1.4, 1.6] as const;

/** 升到该级所需技能点（从上一档）。index = 目标等级。 */
const UPGRADE_COST = [0, 0, 1, 1, 2, 2, 3] as const;

export type SkillId = 'slam' | 'bash';

export const SKILL_DEFS: Record<
  SkillId,
  { name: string; reqLevel: number; kind: AttackKind; desc: string }
> = {
  slam: {
    name: '猛击',
    reqLevel: 1,
    kind: 'slam',
    desc: '强化近战，生成怒气',
  },
  bash: {
    name: '盾击',
    reqLevel: 1,
    kind: 'bash',
    desc: '消耗怒气，短硬直',
  },
};

export function skillLevelMult(level: number): number {
  const idx = Math.max(1, Math.min(5, level)) - 1;
  return LEVEL_MULT[idx] ?? 1;
}

export function skillLevelOf(world: World, id: SkillId): number {
  return world.skills[id] ?? 0;
}

export function skillMultForAttack(world: World, kind: AttackKind): number {
  if (kind === 'slam') {
    return skillLevelMult(skillLevelOf(world, 'slam'));
  }
  if (kind === 'bash') {
    return skillLevelMult(skillLevelOf(world, 'bash'));
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

export function toggleSkills(world: World): void {
  if (world.player.hp <= 0) {
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

export function createStarterSkills(): Record<SkillId, number> {
  return { slam: 1, bash: 1 };
}
