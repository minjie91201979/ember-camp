import type { World } from '../types';

const STEPS = ['move', 'jump', 'attack', 'roll', 'potion', 'loot', 'minimap', 'secret'] as const;
export type TutorialStep = (typeof STEPS)[number] | 'done';

const HINTS: Record<(typeof STEPS)[number], string> = {
  move: '教学 · A / D 左右移动',
  jump: '教学 · Space / W 跳跃',
  attack: '教学 · J 或鼠标左键攻击',
  roll: '教学 · Shift 翻滚（无敌帧）',
  potion: '教学 · R 红药回复生命',
  loot: '教学 · 靠近掉落按 F 拾取',
  minimap: '教学 · 看右上角小地图 · 走动留下足迹',
  secret: '教学 · 探索高台与伪装墙 · 靠近秘密会在小地图标出',
};

export function tutorialHint(world: World): string | null {
  if (world.tutorialDone) {
    return null;
  }
  if (world.zoneId !== 'a01') {
    return null;
  }
  const step = world.tutorialStep;
  if (step === 'done') {
    return null;
  }
  return HINTS[step as (typeof STEPS)[number]] ?? null;
}

export function advanceTutorial(world: World, event: (typeof STEPS)[number]): void {
  if (world.tutorialDone || world.zoneId !== 'a01') {
    return;
  }
  const idx = STEPS.indexOf(world.tutorialStep as (typeof STEPS)[number]);
  const eventIdx = STEPS.indexOf(event);
  if (idx < 0 || eventIdx !== idx) {
    return;
  }
  const next = STEPS[idx + 1];
  if (!next) {
    world.tutorialStep = 'done';
    world.tutorialDone = true;
    world.levelToastT = 2.0;
    world.levelToastText = '教学完成 · 继续探索秘密与 BOSS';
    return;
  }
  world.tutorialStep = next;
  world.levelToastT = 2.2;
  world.levelToastText = HINTS[next];
}

/** 足迹 / 秘密接近时推进后两步教学。 */
export function stepTutorialExplore(world: World): void {
  if (world.tutorialDone || world.zoneId !== 'a01') {
    return;
  }
  if (world.tutorialStep === 'minimap' && world.exploreTrail.length >= 5) {
    advanceTutorial(world, 'minimap');
    return;
  }
  if (
    world.tutorialStep === 'secret' &&
    (Boolean(world.nearbySecretId) || Object.keys(world.secretsClaimed).length > 0)
  ) {
    advanceTutorial(world, 'secret');
  }
}

export function maybeGuidePoints(world: World): void {
  const p = world.player;
  if (!world.tutorialAttrHint && p.unspentAttr > 0 && p.level >= 2) {
    world.tutorialAttrHint = true;
    world.levelToastT = 2.4;
    world.levelToastText = '获得属性点 · 按 C 打开加点';
    return;
  }
  if (!world.tutorialSkillHint && p.unspentSkill > 0 && p.level >= 2) {
    world.tutorialSkillHint = true;
    world.levelToastT = 2.4;
    world.levelToastText = '获得技能点 · 按 K 升级技能';
  }
}

export function bootTutorialToast(world: World): void {
  if (world.tutorialDone || world.zoneId !== 'a01') {
    return;
  }
  if (world.tutorialStep === 'move') {
    world.levelToastT = 2.6;
    world.levelToastText = HINTS.move;
  }
}
