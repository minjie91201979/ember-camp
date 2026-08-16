import { PLAYER } from '../config';
import type { AttackKind, Dummy, Player, World } from '../types';
import { sfx } from '../../audio/sfx';

export type WarriorSpecId = 'guard' | 'fury' | 'arms';

export type SpecDef = {
  id: WarriorSpecId;
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
    effects: ['怒气获取 +25%', '猛击伤害 +15%', '低血时攻击提高'],
  },
  {
    id: 'arms',
    name: '武器',
    tag: '单体',
    effects: ['斩杀伤害提高', '暴击伤害 +20%', '猛击冷却 −20%'],
  },
];

export function specDef(id: WarriorSpecId | null): SpecDef | null {
  if (!id) {
    return null;
  }
  return WARRIOR_SPECS.find((s) => s.id === id) ?? null;
}

export function needsSpecPick(world: World): boolean {
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
  }
}

export function closeSpecPick(world: World): void {
  world.specPickOpen = false;
}

export function pickSpecialization(world: World, id: WarriorSpecId): boolean {
  if (world.player.level < 10) {
    return false;
  }
  if (world.specId) {
    return false;
  }
  if (!WARRIOR_SPECS.some((s) => s.id === id)) {
    return false;
  }
  world.specId = id;
  world.specPickOpen = false;
  const def = specDef(id);
  world.levelToastT = 2;
  world.levelToastText = `专精 · ${def?.name ?? id}`;
  sfx.play('levelup');
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
  p.specResetCount += 1;
  sfx.play('levelup');
  openSpecPick(world);
  return cost === 0 ? '专精已取消（首次免费）' : `专精已取消（花费 ${cost} 金）`;
}

export function slamCooldownOf(world: World): number {
  const base = PLAYER.slamCooldown;
  return world.specId === 'arms' ? base * 0.8 : base;
}

export function bashCooldownOf(world: World): number {
  const base = PLAYER.bashCooldown;
  return world.specId === 'guard' ? base * 0.75 : base;
}

export function rageGainMult(world: World, source: 'hit' | 'hurt' | 'slam'): number {
  const id = world.specId;
  if (id === 'fury' && (source === 'hit' || source === 'slam')) {
    return 1.25;
  }
  if (id === 'guard' && source === 'hurt') {
    return 1.35;
  }
  return 1;
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
      m *= 1.15;
    }
    const hpRatio = p.maxHp > 0 ? p.hp / p.maxHp : 1;
    if (hpRatio < 0.45) {
      m *= 1.18;
    }
  }
  if (world.specId === 'arms') {
    const foeRatio = dummy.maxHp > 0 ? dummy.hp / dummy.maxHp : 1;
    if (foeRatio < 0.35) {
      m *= 1.22;
    }
  }
  return m;
}

export function incomingDamageMult(world: World): number {
  return world.specId === 'guard' ? 0.92 : 1;
}

export function critMultOf(player: Player, world: World): number {
  return world.specId === 'arms' ? player.critMult * 1.2 : player.critMult;
}
