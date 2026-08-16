import type { World } from '../types';

/** 关闭升级加点弹窗（稍后）。 */
export function dismissLevelUp(world: World): void {
  world.levelUpOpen = false;
}

/** 打开角色面板并关闭升级弹窗。 */
export function openAttrsFromLevelUp(world: World): void {
  world.levelUpOpen = false;
  world.invOpen = false;
  world.skillOpen = false;
  world.catalogOpen = false;
  world.settingsOpen = false;
  world.campOpen = null;
  world.charOpen = true;
}

/** 打开技能面板并关闭升级弹窗。 */
export function openSkillsFromLevelUp(world: World): void {
  world.levelUpOpen = false;
  world.invOpen = false;
  world.charOpen = false;
  world.catalogOpen = false;
  world.settingsOpen = false;
  world.campOpen = null;
  world.skillOpen = true;
}
