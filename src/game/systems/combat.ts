import { sfx } from '../../audio/sfx';
import { PLAYER } from '../config';
import type { AttackKind, Dummy, Player, World } from '../types';
import { spawnKillLoot } from './loot';
import { skillMultForAttack } from './skills';
import {
  critMultOf,
  incomingDamageMult,
  outgoingDamageMult,
  rageGainMult,
} from './specialization';
import { physicalDamage } from './stats';
import { grantKillXp } from './attributes';
import { noteBossKill } from './boss';
import { onEliteDeath, onEliteHitPlayer } from './elite-affixes';
import {
  legendaryBashStun,
  legendaryCritMultBonus,
  legendaryDamageMult,
  legendarySlamStun,
} from './legendary';

export const POPUP_LIFE = 0.8;
export const LEVEL_POPUP_LIFE = 1.35;
export const DUST_LIFE = 0.35;

function spawnPopup(
  world: World,
  x: number,
  y: number,
  value: number,
  lethal: boolean,
  crit: boolean,
): void {
  world.popupId += 1;
  world.popups.push({
    id: world.popupId,
    x,
    y,
    value,
    age: 0,
    lethal,
    crit,
    kind: 'damage',
  });
}

export function addRage(player: Player, amount: number): void {
  player.rage = Math.min(player.maxRage, player.rage + amount);
  player.combatT = PLAYER.combatLock;
}

export function spendRage(player: Player, amount: number): boolean {
  if (player.rage < amount) {
    return false;
  }
  player.rage -= amount;
  player.combatT = PLAYER.combatLock;
  return true;
}

export function stepRage(player: Player, dt: number): void {
  player.combatT = Math.max(0, player.combatT - dt);
  if (player.combatT > 0 || player.rage <= 0) {
    return;
  }
  player.rage = Math.max(0, player.rage - PLAYER.rageDecay * dt);
}

export function applyPlayerHit(world: World, dummy: Dummy, kind: AttackKind = 'basic'): void {
  const player = world.player;
  const crit = Math.random() < player.critChance;
  const skillMult =
    (kind === 'slam' ? PLAYER.slamDamageMult : kind === 'bash' ? PLAYER.bashDamageMult : 1) *
    skillMultForAttack(world, kind) *
    outgoingDamageMult(world, kind, dummy) *
    legendaryDamageMult(world, kind, dummy);
  const critMult = critMultOf(player, world) * (1 + legendaryCritMultBonus(world));
  const value = physicalDamage(player.atk, dummy.def, skillMult, crit, critMult);
  const wasAlive = dummy.hp > 0;
  dummy.hp = Math.max(0, dummy.hp - value);
  dummy.flash = kind === 'slam' ? 0.24 : kind === 'bash' ? 0.22 : 0.18;
  const push = player.facing * (kind === 'slam' ? 0.62 : kind === 'bash' ? 0.95 : 0.18);
  dummy.x += push;
  if (kind === 'bash') {
    dummy.stunT = legendaryBashStun(world);
    dummy.attackT = 0;
    dummy.state = 'idle';
  } else if (kind === 'slam') {
    dummy.stunT = Math.max(dummy.stunT, legendarySlamStun(world));
    dummy.attackT = 0;
    dummy.state = 'idle';
  }
  const shake = kind === 'slam' ? 1.25 : kind === 'bash' ? 1.05 : 0.45;
  world.shake = Math.max(world.shake, crit ? Math.max(shake, 1.1) : shake);
  spawnPopup(world, dummy.x, dummy.y + dummy.h + 0.2, value, dummy.hp <= 0, crit);
  const rageBase = kind === 'slam' ? PLAYER.rageOnSlam : PLAYER.rageOnHit;
  const rageSrc = kind === 'slam' ? 'slam' : 'hit';
  addRage(player, rageBase * rageGainMult(world, rageSrc));
  spawnDust(world, dummy.x - player.facing * 0.2, dummy.y + 0.12);
  if (kind !== 'basic') {
    spawnDust(world, dummy.x, dummy.y + 0.05);
  }
  if (kind === 'slam' || kind === 'bash') {
    sfx.play(kind);
  }
  sfx.play(crit ? 'crit' : 'hit');
  if (wasAlive && dummy.hp <= 0) {
    onEliteDeath(world, dummy);
    spawnKillLoot(world, dummy);
    grantKillXp(world, dummy);
    noteBossKill(world, dummy);
  }
}

export function spawnSkillDust(world: World, player: Player, kind: AttackKind): void {
  const ahead = player.facing * (kind === 'bash' ? 0.55 : 0.35);
  spawnDust(world, player.x + ahead, player.y + 0.08);
  spawnDust(world, player.x - player.facing * 0.2, player.y + 0.06);
}

export function applyEnemyHit(world: World, dummy: Dummy): boolean {
  const player = world.player;
  const before = player.hp;
  const ok = hurtPlayer(world, dummy.atk, {
    knockbackFromX: dummy.x,
    shake: 0.9,
  });
  if (ok) {
    dummy.struck = true;
    const dealt = Math.max(0, before - player.hp);
    onEliteHitPlayer(dummy, dealt);
  }
  return ok;
}

export function hurtPlayer(
  world: World,
  rawAtk: number,
  opts?: {
    knockbackFromX?: number;
    shake?: number;
    skillMult?: number;
    /** 已算好的直接伤害（跳过 ATK 公式） */
    flatDamage?: number;
  },
): boolean {
  const player = world.player;
  if (player.hp <= 0 || player.iFrame > 0 || player.state === 'roll' || player.state === 'dead') {
    return false;
  }
  const value =
    opts?.flatDamage ??
    Math.round(
      physicalDamage(rawAtk, player.def, opts?.skillMult ?? 1, false, 1.5) *
        incomingDamageMult(world),
    );
  player.hp = Math.max(0, player.hp - value);
  player.hurtT = PLAYER.hurtDuration;
  player.iFrame = PLAYER.hurtIFrame;
  player.attackT = 0;
  player.rollT = 0;
  addRage(player, PLAYER.rageOnHurt * rageGainMult(world, 'hurt'));
  if (opts?.knockbackFromX !== undefined) {
    player.facing = opts.knockbackFromX >= player.x ? 1 : -1;
    player.vx = -player.facing * PLAYER.knockback;
    player.vy = 3.4;
  }
  player.hitStop = 0.06;
  player.state = player.hp <= 0 ? 'dead' : 'hurt';
  if (player.hp <= 0) {
    player.awaitRespawn = true;
    player.deadT = 0;
  }
  world.shake = Math.max(world.shake, opts?.shake ?? 0.7);
  spawnPopup(world, player.x, player.y + player.h + 0.15, value, player.hp <= 0, false);
  spawnHurtDust(world, player);
  sfx.play(player.hp <= 0 ? 'die' : 'hurt');
  return true;
}

export function spawnDust(world: World, x: number, y: number): void {
  world.dustId += 1;
  world.dusts.push({
    id: world.dustId,
    x,
    y,
    age: 0,
  });
}

export function spawnLandDust(world: World, player: Player): void {
  spawnDust(world, player.x, player.y + 0.08);
}

export function playLevelUpFx(world: World): void {
  const player = world.player;
  player.levelFxT = 1.4;
  world.shake = Math.max(world.shake, 1.15);
  world.levelToastT = 2.4;
  world.levelToastText = `升级！Lv.${player.level}`;
  world.popupId += 1;
  world.popups.push({
    id: world.popupId,
    x: player.x,
    y: player.y + player.h + 0.35,
    value: player.level,
    age: 0,
    lethal: false,
    crit: true,
    kind: 'level',
  });
  for (let i = 0; i < 6; i += 1) {
    const ang = (i / 6) * Math.PI * 2;
    spawnDust(world, player.x + Math.cos(ang) * 0.55, player.y + 0.1 + Math.sin(ang) * 0.15);
  }
  sfx.play('levelup');
}

function spawnHurtDust(world: World, player: Player): void {
  spawnDust(world, player.x, player.y + 0.1);
  spawnDust(world, player.x - player.facing * 0.38, player.y + 0.06);
}

export function stepPopups(world: World, dt: number): void {
  const keep = [];
  for (const popup of world.popups) {
    popup.age += dt;
    const life = popup.kind === 'level' ? LEVEL_POPUP_LIFE : POPUP_LIFE;
    if (popup.age < life) {
      keep.push(popup);
    }
  }
  world.popups = keep;
  const dustKeep = [];
  for (const dust of world.dusts) {
    dust.age += dt;
    if (dust.age < DUST_LIFE) {
      dustKeep.push(dust);
    }
  }
  world.dusts = dustKeep;
  world.shake = Math.max(0, world.shake - dt * 4.2);
  world.player.levelFxT = Math.max(0, world.player.levelFxT - dt);
  world.levelToastT = Math.max(0, world.levelToastT - dt);
}
