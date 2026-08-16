import { START_ZONE_ID, ZONES } from '../data/zones';
import type { World } from '../types';
import { addItemToBag } from './inventory';
import { closeCamp } from './camp';
import { enterZone } from './zone-travel';
import { sfx } from '../../audio/sfx';

export {
  ngPlusEnemyAtkMult,
  ngPlusEnemyDefMult,
  ngPlusEnemyHpMult,
  ngPlusEnemyXpMult,
  ngPlusLootGoldMult,
  ngPlusWeaponAtkMult,
} from './ng-plus-scale';

/** 通关终焉君王后可开启下一周目。 */
export function canStartNgPlus(world: World): boolean {
  return Boolean(world.bossKills['end-king']);
}

/**
 * 开启 NG+：保留成长与背包，清空本周 Boss 击杀记录，
 * 怪物与掉落按周目强化，送回 A01。
 */
export function startNgPlus(world: World): boolean {
  if (!canStartNgPlus(world)) {
    sfx.play('deny');
    world.campMessage = '需先击败终焉君王';
    return false;
  }
  world.ngPlusLevel += 1;
  world.bossKills = {};
  world.secretsClaimed = {};
  world.offerNgPlusHint = false;
  closeCamp(world);

  const crestQty = Math.min(3, world.ngPlusLevel);
  addItemToBag(world, 'ashen-crest', crestQty);

  const zone = ZONES[START_ZONE_ID];
  enterZone(world, START_ZONE_ID, zone?.spawns[0]?.x ?? 2.2, 1.15);
  world.levelToastT = 2.8;
  world.levelToastText = `新周目 · NG+${world.ngPlusLevel} · 烬灰披风点亮`;
  sfx.play('levelup');
  return true;
}
