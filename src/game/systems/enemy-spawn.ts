import { ENEMY_DEFS, type EnemyDefId } from '../data/enemy-defs';
import type { Dummy, World } from '../types';
import { rollAndApplyEliteAffixes } from './elite-affixes';
import {
  ngPlusEnemyAtkMult,
  ngPlusEnemyDefMult,
  ngPlusEnemyHpMult,
  ngPlusEnemyXpMult,
} from './ng-plus-scale';
import { sfx } from '../../audio/sfx';

export type SpawnDummyOpts = {
  /** 默认对精英 roll 词缀；召唤物应关掉 */
  rollAffixes?: boolean;
  /** 周目层数，影响数值与词缀密度 */
  ngPlusLevel?: number;
};

export function createDummyFromSpawn(
  id: number,
  enemyId: EnemyDefId,
  x: number,
  y: number,
  patrolMin: number,
  patrolMax: number,
  opts?: SpawnDummyOpts,
): Dummy {
  const def = ENEMY_DEFS[enemyId];
  const ng = opts?.ngPlusLevel ?? 0;
  const dummy: Dummy = {
    id,
    x,
    y,
    w: def.w,
    h: def.h,
    hp: def.hp,
    maxHp: def.hp,
    atk: def.atk,
    def: def.def,
    flash: 0,
    deadT: 0,
    stunT: 0,
    kind: def.kind,
    enemyId: def.id,
    name: def.name,
    behavior: def.behavior,
    elite: def.elite,
    boss: def.boss,
    noRespawn: Boolean(def.noRespawn),
    lootTable: def.lootTable,
    xpReward: def.xp,
    moveSpeed: def.moveSpeed,
    visualScale: def.visualScale,
    facing: -1,
    vx: def.moveSpeed,
    patrolMin,
    patrolMax,
    attackT: 0,
    struck: false,
    looted: false,
    state: 'walk',
    castT: 0,
    castMax: 0,
    castId: null,
    phase: 1,
    fightT: 0,
    skillCd: 2.2,
    chargeDashT: 0,
    fuseT: 0,
    affixes: [],
    affixCd: 0,
  };
  if (ng > 0) {
    dummy.hp = Math.round(dummy.hp * ngPlusEnemyHpMult(ng));
    dummy.maxHp = dummy.hp;
    dummy.atk = Math.round(dummy.atk * ngPlusEnemyAtkMult(ng));
    dummy.def = Math.round(dummy.def * ngPlusEnemyDefMult(ng));
    dummy.xpReward = Math.round(dummy.xpReward * ngPlusEnemyXpMult(ng));
  }
  if (opts?.rollAffixes !== false) {
    rollAndApplyEliteAffixes(dummy, ng);
  }
  return dummy;
}

/** 召唤词缀：放出虚弱无词缀分身。 */
export function spawnEliteAffixAdd(world: World, parent: Dummy): void {
  const side = Math.random() < 0.5 ? -1 : 1;
  const add = createDummyFromSpawn(
    ++world.dummyId,
    parent.enemyId as EnemyDefId,
    parent.x + side * 1.8,
    parent.y,
    parent.patrolMin,
    parent.patrolMax,
    { rollAffixes: false, ngPlusLevel: world.ngPlusLevel },
  );
  add.elite = false;
  add.affixes = [];
  add.affixCd = 0;
  add.noRespawn = true;
  add.hp = Math.max(8, Math.round(add.maxHp * 0.32));
  add.maxHp = add.hp;
  add.atk = Math.round(add.atk * 0.7);
  const baseName = parent.name.split(' · ')[0] ?? parent.name;
  add.name = `${baseName}·影`;
  add.visualScale *= 0.85;
  world.dummies.push(add);
  world.shake = Math.max(world.shake, 0.35);
  sfx.play('deny');
}
