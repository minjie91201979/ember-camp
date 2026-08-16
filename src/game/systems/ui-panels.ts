import type { World } from '../types';
import { closeCamp } from './camp';
import { clearAttrDraft } from './attributes';
import { closeSpecPick } from './specialization';

/** 关闭所有叠加面板（死亡 / Esc / 复活时共用）。 */
export function closeAllPanels(world: World): boolean {
  const had =
    world.invOpen ||
    world.charOpen ||
    world.skillOpen ||
    world.catalogOpen ||
    world.settingsOpen ||
    world.specPickOpen ||
    Boolean(world.campOpen);
  if (!had) {
    return false;
  }
  world.invOpen = false;
  world.charOpen = false;
  world.skillOpen = false;
  world.catalogOpen = false;
  world.settingsOpen = false;
  closeSpecPick(world);
  closeCamp(world);
  clearAttrDraft(world);
  return true;
}

export function isAnyPanelOpen(world: World): boolean {
  return (
    world.invOpen ||
    world.charOpen ||
    world.skillOpen ||
    world.catalogOpen ||
    world.settingsOpen ||
    world.specPickOpen ||
    Boolean(world.campOpen)
  );
}
