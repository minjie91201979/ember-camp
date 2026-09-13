import * as THREE from 'three';
import { PLAYER, attackDurationOf } from '../game/config';
import type { PlayerClassId } from '../game/data/classes';
import type { Dummy, Player } from '../game/types';
import { dummyAttackProgress } from '../game/systems/dummy-ai';
import { PALETTE } from './palette';

type Limb = {
  pivot: THREE.Group;
};

export type WarriorFlash = 'none' | 'hurt' | 'iframe' | 'level';

export type WarriorRig = {
  root: THREE.Group;
  hip: THREE.Group;
  torso: THREE.Group;
  cloak: THREE.Group;
  cloakMat: THREE.ShaderMaterial;
  armL: THREE.Group;
  armR: THREE.Group;
  forearmR: THREE.Group;
  thighL: THREE.Group;
  thighR: THREE.Group;
  shinL: THREE.Group;
  shinR: THREE.Group;
  footL: THREE.Group;
  footR: THREE.Group;
  mats: THREE.MeshStandardMaterial[];
};

export type BeastRig = {
  root: THREE.Group;
  body: THREE.Group;
  head: THREE.Group;
  legs: THREE.Group[];
  armL?: THREE.Group;
  armR?: THREE.Group;
  /** 翼、尾、螯、刺等可摆动部件 */
  extras?: THREE.Object3D[];
  mats: THREE.MeshStandardMaterial[];
};

function mat(
  color: number,
  opts?: { metal?: number; rough?: number; emit?: number; emitColor?: number },
): THREE.MeshStandardMaterial {
  const emitColor = opts?.emitColor ?? color;
  const emit = opts?.emit ?? 0;
  const material = new THREE.MeshStandardMaterial({
    color,
    metalness: opts?.metal ?? 0.12,
    roughness: opts?.rough ?? 0.55,
    emissive: new THREE.Color(emitColor),
    emissiveIntensity: emit,
    fog: false,
  });
  material.userData.baseEmit = emit;
  material.userData.baseEmitColor = emitColor;
  return material;
}

function box(
  w: number,
  h: number,
  d: number,
  material: THREE.MeshStandardMaterial,
  y = 0,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.y = y;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function limb(length: number, w: number, d: number, material: THREE.MeshStandardMaterial): Limb {
  const pivot = new THREE.Group();
  pivot.add(box(w, length, d, material, -length / 2));
  return { pivot };
}

export function createWarriorRig(): WarriorRig {
  const armor = mat(PALETTE.ember, { metal: 0.28, rough: 0.42, emit: 0.06 });
  const dark = mat(PALETTE.hunter, { metal: 0.2, rough: 0.5 });
  const iron = mat(PALETTE.mossDark, { metal: 0.52, rough: 0.36 });
  const gold = mat(PALETTE.gold, { metal: 0.55, rough: 0.28, emit: 0.08 });
  const cloth = mat(PALETTE.rogue, { metal: 0, rough: 0.82 });
  const blade = mat(PALETTE.moonlight, { metal: 0.62, rough: 0.28, emit: 0.04 });
  const mats = [armor, dark, iron, gold, cloth, blade];

  const root = new THREE.Group();
  const hip = new THREE.Group();
  const torso = new THREE.Group();
  torso.position.y = 0.18;
  // 侧视：X 为胸厚（朝向），Z 为肩宽，避免正对镜头横着走
  torso.add(box(0.3, 0.62, 0.5, armor, 0.22));
  torso.add(box(0.34, 0.16, 0.54, dark, 0.5));
  torso.add(box(0.18, 0.08, 0.2, gold, 0.48));
  torso.add(box(0.32, 0.28, 0.3, dark, 0.76));
  torso.add(box(0.22, 0.22, 0.36, cloth, -0.16));

  const helm = box(0.28, 0.22, 0.34, iron, 0.98);
  const brow = box(0.3, 0.05, 0.36, gold, 1.08);
  const visor = box(0.26, 0.045, 0.28, dark, 0.93);
  const crest = box(0.045, 0.24, 0.16, gold, 1.18);
  torso.add(helm, brow, visor, crest);

  const padL = box(0.2, 0.14, 0.22, iron, 0.52);
  padL.position.set(0.04, 0, -0.3);
  const padR = box(0.2, 0.14, 0.22, iron, 0.52);
  padR.position.set(0.04, 0, 0.3);
  torso.add(padL, padR);

  const cloakMat = createCloakMat();
  const cloak = addWornCloak(torso, cloth, dark, cloakMat);

  const armL = new THREE.Group();
  armL.position.set(0.02, 0.48, -0.28);
  const upperL = limb(0.32, 0.15, 0.15, armor);
  const shield = box(0.42, 0.7, 0.1, iron, -0.22);
  shield.position.set(-0.02, 0, -0.12);
  const rim = box(0.46, 0.08, 0.12, gold, 0.08);
  rim.position.set(-0.02, 0, -0.12);
  upperL.pivot.add(shield, rim);
  armL.add(upperL.pivot);

  const armR = new THREE.Group();
  armR.position.set(0.04, 0.48, 0.28);
  const upperR = limb(0.3, 0.14, 0.14, armor);
  const forearmR = limb(0.28, 0.12, 0.12, dark);
  forearmR.pivot.position.y = -0.3;
  forearmR.pivot.add(makeSword(gold, dark, blade));
  upperR.pivot.add(forearmR.pivot);
  armR.add(upperR.pivot);

  const thighL = limb(0.34, 0.2, 0.2, dark);
  const shinL = limb(0.3, 0.17, 0.17, iron);
  shinL.pivot.position.y = -0.34;
  const footL = makeFoot(iron);
  footL.position.y = -0.3;
  shinL.pivot.add(footL);
  thighL.pivot.add(shinL.pivot);
  thighL.pivot.position.set(0.02, 0.02, -0.11);

  const thighR = limb(0.34, 0.2, 0.2, dark);
  const shinR = limb(0.3, 0.17, 0.17, iron);
  shinR.pivot.position.y = -0.34;
  const footR = makeFoot(iron);
  footR.position.y = -0.3;
  shinR.pivot.add(footR);
  thighR.pivot.add(shinR.pivot);
  thighR.pivot.position.set(0.02, 0.02, 0.11);

  torso.add(armL, armR);
  hip.add(torso, thighL.pivot, thighR.pivot);
  root.add(hip);

  return {
    root,
    hip,
    torso,
    cloak,
    cloakMat,
    armL,
    armR,
    forearmR: forearmR.pivot,
    thighL: thighL.pivot,
    thighR: thighR.pivot,
    shinL: shinL.pivot,
    shinR: shinR.pivot,
    footL,
    footR,
    mats,
  };
}

/** 法师：瘦体布甲剪影 + 法杖。 */
export function createMageRig(): WarriorRig {
  const robe = mat(PALETTE.mage, { metal: 0.08, rough: 0.72, emit: 0.05, emitColor: PALETTE.mage });
  const dark = mat(0x3a4a52, { metal: 0.12, rough: 0.65 });
  const trim = mat(PALETTE.moonlight, { metal: 0.35, rough: 0.4, emit: 0.06 });
  const gold = mat(PALETTE.gold, { metal: 0.5, rough: 0.3, emit: 0.1 });
  const cloth = mat(0x4a5e66, { metal: 0, rough: 0.85 });
  const wood = mat(PALETTE.hunter, { metal: 0.05, rough: 0.7 });
  const mats = [robe, dark, trim, gold, cloth, wood];

  const root = new THREE.Group();
  root.scale.set(0.92, 1.02, 0.88);
  const hip = new THREE.Group();
  const torso = new THREE.Group();
  torso.position.y = 0.18;
  torso.add(box(0.24, 0.68, 0.4, robe, 0.2));
  torso.add(box(0.28, 0.14, 0.44, dark, 0.48));
  torso.add(box(0.14, 0.06, 0.16, gold, 0.46));
  torso.add(box(0.26, 0.26, 0.26, dark, 0.74));
  torso.add(box(0.3, 0.36, 0.34, cloth, -0.2));

  const hood = box(0.26, 0.2, 0.3, robe, 0.96);
  const face = box(0.2, 0.12, 0.22, dark, 0.9);
  torso.add(hood, face);

  const cloakMat = createCloakMat();
  const cloak = addWornCloak(torso, cloth, dark, cloakMat);

  const armL = new THREE.Group();
  armL.position.set(0.02, 0.5, -0.24);
  const upperL = limb(0.3, 0.12, 0.12, robe);
  armL.add(upperL.pivot);

  const armR = new THREE.Group();
  armR.position.set(0.04, 0.5, 0.24);
  const upperR = limb(0.28, 0.11, 0.11, robe);
  const forearmR = limb(0.26, 0.1, 0.1, dark);
  forearmR.pivot.position.y = -0.28;
  forearmR.pivot.add(makeStaff(wood, gold, trim));
  upperR.pivot.add(forearmR.pivot);
  armR.add(upperR.pivot);

  const thighL = limb(0.32, 0.16, 0.16, cloth);
  const shinL = limb(0.28, 0.14, 0.14, dark);
  shinL.pivot.position.y = -0.32;
  const footL = makeFoot(dark);
  footL.position.y = -0.28;
  shinL.pivot.add(footL);
  thighL.pivot.add(shinL.pivot);
  thighL.pivot.position.set(0.02, 0.02, -0.1);

  const thighR = limb(0.32, 0.16, 0.16, cloth);
  const shinR = limb(0.28, 0.14, 0.14, dark);
  shinR.pivot.position.y = -0.32;
  const footR = makeFoot(dark);
  footR.position.y = -0.28;
  shinR.pivot.add(footR);
  thighR.pivot.add(shinR.pivot);
  thighR.pivot.position.set(0.02, 0.02, 0.1);

  torso.add(armL, armR);
  hip.add(torso, thighL.pivot, thighR.pivot);
  root.add(hip);

  return {
    root,
    hip,
    torso,
    cloak,
    cloakMat,
    armL,
    armR,
    forearmR: forearmR.pivot,
    thighL: thighL.pivot,
    thighR: thighR.pivot,
    shinL: shinL.pivot,
    shinR: shinR.pivot,
    footL,
    footR,
    mats,
  };
}

/** 猎人：锁甲剪影 + 短弓。 */
export function createHunterRig(): WarriorRig {
  const leather = mat(PALETTE.hunter, { metal: 0.12, rough: 0.62, emit: 0.03 });
  const dark = mat(0x3a3228, { metal: 0.15, rough: 0.55 });
  const trim = mat(PALETTE.gold, { metal: 0.4, rough: 0.35, emit: 0.06 });
  const cloth = mat(0x5a4a3a, { metal: 0, rough: 0.8 });
  const iron = mat(PALETTE.mossDark, { metal: 0.45, rough: 0.4 });
  const wood = mat(0x6b5340, { metal: 0.05, rough: 0.72 });
  const mats = [leather, dark, trim, cloth, iron, wood];

  const root = new THREE.Group();
  root.scale.set(0.96, 1, 0.94);
  const hip = new THREE.Group();
  const torso = new THREE.Group();
  torso.position.y = 0.18;
  torso.add(box(0.28, 0.6, 0.46, leather, 0.2));
  torso.add(box(0.32, 0.14, 0.5, dark, 0.48));
  torso.add(box(0.16, 0.07, 0.18, trim, 0.46));
  torso.add(box(0.3, 0.24, 0.28, dark, 0.74));
  torso.add(box(0.26, 0.28, 0.32, cloth, -0.16));

  const hood = box(0.26, 0.18, 0.32, leather, 0.96);
  const face = box(0.2, 0.1, 0.24, dark, 0.9);
  torso.add(hood, face);

  const cloakMat = createCloakMat();
  const cloak = addWornCloak(torso, cloth, dark, cloakMat);

  const armL = new THREE.Group();
  armL.position.set(0.02, 0.48, -0.26);
  const upperL = limb(0.3, 0.13, 0.13, leather);
  armL.add(upperL.pivot);

  const armR = new THREE.Group();
  armR.position.set(0.04, 0.48, 0.26);
  const upperR = limb(0.28, 0.12, 0.12, leather);
  const forearmR = limb(0.26, 0.11, 0.11, dark);
  forearmR.pivot.position.y = -0.28;
  forearmR.pivot.add(makeBow(wood, trim, iron));
  upperR.pivot.add(forearmR.pivot);
  armR.add(upperR.pivot);

  const thighL = limb(0.33, 0.17, 0.17, dark);
  const shinL = limb(0.28, 0.15, 0.15, iron);
  shinL.pivot.position.y = -0.33;
  const footL = makeFoot(iron);
  footL.position.y = -0.28;
  shinL.pivot.add(footL);
  thighL.pivot.add(shinL.pivot);
  thighL.pivot.position.set(0.02, 0.02, -0.1);

  const thighR = limb(0.33, 0.17, 0.17, dark);
  const shinR = limb(0.28, 0.15, 0.15, iron);
  shinR.pivot.position.y = -0.33;
  const footR = makeFoot(iron);
  footR.position.y = -0.28;
  shinR.pivot.add(footR);
  thighR.pivot.add(shinR.pivot);
  thighR.pivot.position.set(0.02, 0.02, 0.1);

  torso.add(armL, armR);
  hip.add(torso, thighL.pivot, thighR.pivot);
  root.add(hip);

  return {
    root,
    hip,
    torso,
    cloak,
    cloakMat,
    armL,
    armR,
    forearmR: forearmR.pivot,
    thighL: thighL.pivot,
    thighR: thighR.pivot,
    shinL: shinL.pivot,
    shinR: shinR.pivot,
    footL,
    footR,
    mats,
  };
}

export function createPlayerRig(classId: PlayerClassId): WarriorRig {
  if (classId === 'mage') {
    return createMageRig();
  }
  if (classId === 'hunter') {
    return createHunterRig();
  }
  if (classId === 'rogue') {
    return createRogueRig();
  }
  if (classId === 'paladin') {
    return createPaladinRig();
  }
  return createWarriorRig();
}

/** 圣骑士：在战士骨架上做金蓝配色重映射（复用同一套战斗姿态）。 */
export function createPaladinRig(): WarriorRig {
  const rig = createWarriorRig();
  const recolor = (m: THREE.MeshStandardMaterial, color: number, emit = 0): void => {
    m.color.setHex(color);
    m.emissive.setHex(color);
    m.emissiveIntensity = emit;
    m.userData.baseEmit = emit;
    m.userData.baseEmitColor = color;
  };
  // rig.mats = [armor, dark, iron, gold, cloth, blade]
  recolor(rig.mats[0], 0x3a6ea5, 0.08); // 钢蓝护甲
  recolor(rig.mats[1], 0x274472, 0); // 深蓝底甲
  recolor(rig.mats[2], 0xb9c7d6, 0.12); // 亮钢护腿
  recolor(rig.mats[3], PALETTE.gold, 0.16); // 金饰更亮
  recolor(rig.mats[4], 0x8fb8e0, 0.05); // 浅蓝布甲
  recolor(rig.mats[5], PALETTE.moonlight, 0.08); // 淡蓝刃
  const cloak = rig.cloakMat;
  if (cloak.uniforms.uColor?.value instanceof THREE.Color) {
    cloak.uniforms.uColor.value.setHex(0x8fb8e0);
  }
  if (cloak.uniforms.uTrim?.value instanceof THREE.Color) {
    cloak.uniforms.uTrim.value.setHex(PALETTE.gold);
  }
  if (cloak.uniforms.uDark?.value instanceof THREE.Color) {
    cloak.uniforms.uDark.value.setHex(0x274472);
  }
  return rig;
}

/** 盗贼：皮甲剪影 + 匕首。 */
export function createRogueRig(): WarriorRig {
  const leather = mat(PALETTE.rogue, { metal: 0.1, rough: 0.68, emit: 0.02 });
  const dark = mat(0x2a2630, { metal: 0.18, rough: 0.55 });
  const trim = mat(PALETTE.moonlight, { metal: 0.4, rough: 0.32, emit: 0.05 });
  const cloth = mat(0x3d3844, { metal: 0, rough: 0.82 });
  const iron = mat(PALETTE.mossDark, { metal: 0.5, rough: 0.38 });
  const blade = mat(PALETTE.moonlight, { metal: 0.7, rough: 0.22, emit: 0.06 });
  const mats = [leather, dark, trim, cloth, iron, blade];

  const root = new THREE.Group();
  root.scale.set(0.94, 0.98, 0.9);
  const hip = new THREE.Group();
  const torso = new THREE.Group();
  torso.position.y = 0.18;
  torso.add(box(0.26, 0.58, 0.42, leather, 0.2));
  torso.add(box(0.3, 0.12, 0.46, dark, 0.48));
  torso.add(box(0.14, 0.06, 0.16, trim, 0.46));
  torso.add(box(0.28, 0.22, 0.26, dark, 0.72));
  torso.add(box(0.24, 0.3, 0.3, cloth, -0.16));

  const hood = box(0.24, 0.18, 0.3, leather, 0.95);
  const face = box(0.18, 0.1, 0.22, dark, 0.89);
  torso.add(hood, face);

  const cloakMat = createCloakMat();
  const cloak = addWornCloak(torso, cloth, dark, cloakMat);

  const armL = new THREE.Group();
  armL.position.set(0.02, 0.48, -0.24);
  const upperL = limb(0.28, 0.12, 0.12, leather);
  const forearmL = limb(0.24, 0.1, 0.1, dark);
  forearmL.pivot.position.y = -0.28;
  forearmL.pivot.add(makeDagger(iron, blade, -1));
  upperL.pivot.add(forearmL.pivot);
  armL.add(upperL.pivot);

  const armR = new THREE.Group();
  armR.position.set(0.04, 0.48, 0.24);
  const upperR = limb(0.28, 0.12, 0.12, leather);
  const forearmR = limb(0.24, 0.1, 0.1, dark);
  forearmR.pivot.position.y = -0.28;
  forearmR.pivot.add(makeDagger(iron, blade, 1));
  upperR.pivot.add(forearmR.pivot);
  armR.add(upperR.pivot);

  const thighL = limb(0.32, 0.15, 0.15, dark);
  const shinL = limb(0.27, 0.13, 0.13, iron);
  shinL.pivot.position.y = -0.32;
  const footL = makeFoot(iron);
  footL.position.y = -0.27;
  shinL.pivot.add(footL);
  thighL.pivot.add(shinL.pivot);
  thighL.pivot.position.set(0.02, 0.02, -0.09);

  const thighR = limb(0.32, 0.15, 0.15, dark);
  const shinR = limb(0.27, 0.13, 0.13, iron);
  shinR.pivot.position.y = -0.32;
  const footR = makeFoot(iron);
  footR.position.y = -0.27;
  shinR.pivot.add(footR);
  thighR.pivot.add(shinR.pivot);
  thighR.pivot.position.set(0.02, 0.02, 0.09);

  torso.add(armL, armR);
  hip.add(torso, thighL.pivot, thighR.pivot);
  root.add(hip);

  return {
    root,
    hip,
    torso,
    cloak,
    cloakMat,
    armL,
    armR,
    forearmR: forearmR.pivot,
    thighL: thighL.pivot,
    thighR: thighR.pivot,
    shinL: shinL.pivot,
    shinR: shinR.pivot,
    footL,
    footR,
    mats,
  };
}

function makeDagger(
  hilt: THREE.MeshStandardMaterial,
  blade: THREE.MeshStandardMaterial,
  side: 1 | -1,
): THREE.Group {
  const g = new THREE.Group();
  g.position.set(0.05 * side, -0.12, 0.02 * side);
  const grip = box(0.08, 0.16, 0.06, hilt);
  const steel = box(0.06, 0.42, 0.04, blade);
  steel.position.y = -0.28;
  g.add(grip, steel);
  return g;
}

function makeBow(
  wood: THREE.MeshStandardMaterial,
  trim: THREE.MeshStandardMaterial,
  stringMat: THREE.MeshStandardMaterial,
): THREE.Group {
  const bow = new THREE.Group();
  bow.position.set(0.06, -0.15, 0.02);
  const limbU = box(0.08, 0.55, 0.06, wood);
  limbU.position.set(0.12, 0.2, 0);
  limbU.rotation.z = 0.35;
  const limbD = box(0.08, 0.55, 0.06, wood);
  limbD.position.set(0.12, -0.2, 0);
  limbD.rotation.z = -0.35;
  const grip = box(0.1, 0.16, 0.08, trim);
  grip.position.set(0.08, 0, 0);
  const string = box(0.02, 0.72, 0.02, stringMat);
  string.position.set(0.22, 0, 0);
  bow.add(limbU, limbD, grip, string);
  return bow;
}

function makeStaff(
  wood: THREE.MeshStandardMaterial,
  gold: THREE.MeshStandardMaterial,
  crystal: THREE.MeshStandardMaterial,
): THREE.Group {
  const staff = new THREE.Group();
  staff.position.set(0.08, -0.2, 0.02);
  const shaft = box(1.15, 0.06, 0.06, wood);
  shaft.position.x = 0.45;
  const tip = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), crystal);
  tip.position.x = 1.08;
  tip.castShadow = true;
  const band = box(0.08, 0.1, 0.1, gold);
  band.position.x = 0.95;
  staff.add(shaft, tip, band);
  return staff;
}

function makeSword(
  gold: THREE.MeshStandardMaterial,
  dark: THREE.MeshStandardMaterial,
  steel: THREE.MeshStandardMaterial,
): THREE.Group {
  const sword = new THREE.Group();
  sword.position.set(0.1, -0.28, 0.04);
  const grip = box(0.18, 0.07, 0.07, dark);
  grip.position.x = -0.02;
  const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), gold);
  pommel.position.x = -0.16;
  pommel.castShadow = true;
  const guard = box(0.08, 0.24, 0.1, gold);
  guard.position.x = 0.1;
  const edge = box(0.98, 0.055, 0.032, steel);
  edge.position.x = 0.62;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.12, 6), steel);
  tip.rotation.z = -Math.PI / 2;
  tip.position.x = 1.16;
  tip.castShadow = true;
  sword.add(grip, pommel, guard, edge, tip);
  return sword;
}

export function flashWarrior(rig: WarriorRig, mode: WarriorFlash): void {
  for (const material of rig.mats) {
    if (mode === 'hurt') {
      material.emissive.setHex(PALETTE.moonlight);
      material.emissiveIntensity = 1.05;
    } else if (mode === 'iframe') {
      material.emissive.setHex(PALETTE.ember);
      material.emissiveIntensity = 0.34;
    } else if (mode === 'level') {
      material.emissive.setHex(PALETTE.gold);
      material.emissiveIntensity = 1.25;
    } else {
      material.emissive.setHex(material.userData.baseEmitColor as number);
      material.emissiveIntensity = material.userData.baseEmit as number;
    }
  }
}

/** 消失：半透明 + 略偏夜影色；结束恢复。 */
export function applyVanishStealth(rig: WarriorRig, stealth: boolean): void {
  for (const material of rig.mats) {
    if (material.userData.baseOpacity === undefined) {
      material.userData.baseOpacity = material.opacity;
      material.userData.baseTransparent = material.transparent;
      material.userData.baseColorHex = material.color.getHex();
      material.userData.baseDepthWrite = material.depthWrite;
    }
    if (stealth) {
      material.transparent = true;
      material.opacity = 0.35;
      material.depthWrite = false;
      material.color.setHex(PALETTE.rogue);
      material.emissive.setHex(PALETTE.moonlight);
      material.emissiveIntensity = 0.22;
    } else {
      material.transparent = Boolean(material.userData.baseTransparent);
      material.opacity = Number(material.userData.baseOpacity);
      material.depthWrite = Boolean(material.userData.baseDepthWrite ?? true);
      material.color.setHex(Number(material.userData.baseColorHex));
    }
  }
  const cloak = rig.cloakMat;
  if (cloak.userData.baseOpacity === undefined) {
    cloak.userData.baseOpacity = cloak.opacity;
    cloak.userData.baseTransparent = cloak.transparent;
  }
  if (stealth) {
    cloak.transparent = true;
    cloak.opacity = 0.28;
  } else {
    cloak.transparent = Boolean(cloak.userData.baseTransparent);
    cloak.opacity = Number(cloak.userData.baseOpacity ?? 1);
  }
}

function addWornCloak(
  torso: THREE.Group,
  cloth: THREE.MeshStandardMaterial,
  dark: THREE.MeshStandardMaterial,
  cloakMat: THREE.ShaderMaterial,
): THREE.Group {
  const cloak = new THREE.Group();
  const collar = box(0.3, 0.1, 0.5, cloth, 0.58);
  collar.position.x = 0.02;
  const nape = box(0.16, 0.12, 0.44, dark, 0.56);
  nape.position.x = -0.12;
  const drapeL = box(0.2, 0.1, 0.18, cloth, 0.5);
  drapeL.position.set(-0.04, 0, -0.28);
  const drapeR = box(0.2, 0.1, 0.18, cloth, 0.5);
  drapeR.position.set(-0.04, 0, 0.28);
  const cape = new THREE.Mesh(createCapeGeometry(), cloakMat);
  cape.position.set(0, 0.12, 0);
  cloak.add(collar, nape, drapeL, drapeR, cape);
  torso.add(cloak);
  return cloak;
}

function createCapeGeometry(): THREE.PlaneGeometry {
  const geo = new THREE.PlaneGeometry(0.56, 0.9, 12, 16);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  if (!pos || !uv) {
    return geo;
  }
  for (let i = 0; i < pos.count; i += 1) {
    const along = 1 - uv.getY(i);
    const side = uv.getX(i) - 0.5;
    const x = -0.14 - along * along * 0.3;
    const y = (uv.getY(i) - 0.5) * 0.9;
    const z = side * (0.54 - along * 0.1);
    pos.setXYZ(i, x, y, z);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

function createCloakMat(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    fog: false,
    uniforms: {
      uTime: { value: 0 },
      uGust: { value: 0.5 },
      uColor: { value: new THREE.Color(PALETTE.rogue) },
      uTrim: { value: new THREE.Color(PALETTE.ember) },
      uDark: { value: new THREE.Color(PALETTE.void) },
    },
    vertexShader: `
      uniform float uTime;
      uniform float uGust;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 pos = position;
        float along = 1.0 - uv.y;
        float side = uv.x - 0.5;
        float gust = max(uGust, 0.12);
        float lift = along * along;
        float wave = sin(along * 5.4 - uTime * 4.2 + side * 2.6) * lift * 0.12 * gust;
        float flutter = sin(along * 9.6 + uTime * 6.8 + side * 5.4) * lift * 0.07 * gust;
        float ripple = sin(uv.x * 8.2 - uTime * 5.2) * lift * 0.05 * gust;
        pos.x += wave;
        pos.z += flutter + ripple;
        pos.y += sin(uTime * 3.2 + uv.x * 4.0) * lift * 0.03 * gust;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform vec3 uTrim;
      uniform vec3 uDark;
      varying vec2 vUv;
      void main() {
        float hem = smoothstep(0.0, 0.12, vUv.y);
        vec3 col = mix(uDark, uColor, 0.7 + vUv.y * 0.22);
        col = mix(col, uTrim, (1.0 - hem) * 0.18);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
}

function cloakGust(state: Player['state']): number {
  if (state === 'run') {
    return 1.25;
  }
  if (state === 'jump' || state === 'fall') {
    return 1.5;
  }
  if (state === 'roll') {
    return 1.75;
  }
  if (state === 'hurt') {
    return 1.4;
  }
  if (state === 'attack') {
    return 0.95;
  }
  if (state === 'drink') {
    return 0.4;
  }
  if (state === 'dead') {
    return 0.1;
  }
  return 0.55;
}

function tickCloak(rig: WarriorRig, player: Player, time: number): void {
  rig.cloakMat.uniforms.uTime!.value = time;
  rig.cloakMat.uniforms.uGust!.value = cloakGust(player.state);
}

/** NG+：披风描边偏烬金。 */
export function applyNgPlusCloak(rig: WarriorRig, ngPlusLevel: number): void {
  const trim = rig.cloakMat.uniforms.uTrim?.value as THREE.Color | undefined;
  if (!trim) {
    return;
  }
  if (ngPlusLevel > 0) {
    trim.setHex(PALETTE.gold);
  } else {
    trim.setHex(PALETTE.ember);
  }
}

function makeFoot(material: THREE.MeshStandardMaterial): THREE.Group {
  const pivot = new THREE.Group();
  const sole = box(0.28, 0.08, 0.16, material, -0.03);
  sole.position.x = 0.08;
  pivot.add(sole);
  return pivot;
}

function plantFeet(rig: WarriorRig): void {
  rig.footL.rotation.z = -(rig.thighL.rotation.z + rig.shinL.rotation.z) + 0.05;
  rig.footR.rotation.z = -(rig.thighR.rotation.z + rig.shinR.rotation.z) + 0.05;
}

export function poseWarrior(rig: WarriorRig, player: Player, time: number): void {
  rig.root.rotation.z = 0;
  rig.hip.position.y = 0;
  rig.hip.rotation.z = 0;
  tickCloak(rig, player, time);
  rig.cloak.rotation.z = 0;

  if (player.state === 'dead') {
    rig.root.rotation.z = -1.25;
    rig.hip.position.y = -0.15;
    rig.cloak.rotation.z = 0.08;
    rig.armL.rotation.z = 0.8;
    rig.armR.rotation.z = -0.2;
    rig.thighL.rotation.z = 0.7;
    rig.thighR.rotation.z = 0.15;
    rig.shinL.rotation.z = -0.2;
    rig.shinR.rotation.z = -0.35;
    plantFeet(rig);
    return;
  }

  if (player.state === 'hurt') {
    rig.root.rotation.z = 0.18;
    rig.torso.rotation.z = 0.12;
    rig.cloak.rotation.z = 0.04;
    rig.armL.rotation.z = -0.7;
    rig.armR.rotation.z = -0.55;
    rig.thighL.rotation.z = 0.35;
    rig.thighR.rotation.z = -0.1;
    rig.shinL.rotation.z = -0.55;
    rig.shinR.rotation.z = -0.2;
    plantFeet(rig);
    return;
  }

  if (player.state === 'drink') {
    const u = 1 - Math.min(1, player.drinkT / 0.42);
    rig.root.rotation.z = -0.06;
    rig.torso.rotation.z = 0.08;
    rig.armR.rotation.z = -1.1 - Math.sin(u * Math.PI) * 0.35;
    rig.armL.rotation.z = 0.25;
    rig.thighL.rotation.z = 0.12;
    rig.thighR.rotation.z = -0.08;
    plantFeet(rig);
    return;
  }

  if (player.state === 'roll') {
    const u = 1 - player.rollT / PLAYER.rollDuration;
    rig.cloak.rotation.z = -0.06;
    rig.root.rotation.z = -u * Math.PI * 2;
    rig.thighL.rotation.z = 0.55;
    rig.thighR.rotation.z = 0.7;
    rig.shinL.rotation.z = -1.1;
    rig.shinR.rotation.z = -1.05;
    rig.armL.rotation.z = 0.6;
    rig.armR.rotation.z = -0.4;
    plantFeet(rig);
    return;
  }

  if (player.state === 'attack') {
    const u = 1 - player.attackT / attackDurationOf(player.attackKind);
    if (
      player.attackKind === 'bash' ||
      player.attackKind === 'frost-nova' ||
      player.attackKind === 'trap' ||
      player.attackKind === 'explosive-trap' ||
      player.attackKind === 'ice-lance' ||
      player.attackKind === 'whirlwind' ||
      player.attackKind === 'battle-shout' ||
      player.attackKind === 'kidney-shot' ||
      player.attackKind === 'fan-of-knives' ||
      player.attackKind === 'eviscerate'
    ) {
      const punch = u < 0.38 ? -0.15 - u * 2.6 : -1.05 + (u - 0.38) * 1.35;
      rig.root.rotation.z = u < 0.45 ? -0.12 - u * 0.18 : -0.2 + (u - 0.45) * 0.35;
      rig.hip.position.y = u < 0.4 ? u * 0.04 : 0.016 - (u - 0.4) * 0.03;
      rig.armL.rotation.z = punch;
      rig.armR.rotation.z = 0.35;
      rig.forearmR.rotation.z = 0.18;
      rig.torso.rotation.z = punch * 0.22;
      rig.cloak.rotation.z = -0.04 - Math.min(u, 0.5) * 0.06;
      rig.thighL.rotation.z = 0.28;
      rig.thighR.rotation.z = -0.22;
      rig.shinL.rotation.z = -0.28;
      rig.shinR.rotation.z = -0.18;
      plantFeet(rig);
      return;
    }
    if (player.attackKind === 'blizzard') {
      // 双臂上举引导落冰
      const sway = Math.sin(u * Math.PI * 6) * 0.06;
      rig.root.rotation.z = -0.04 + sway * 0.35;
      rig.hip.position.y = 0.02;
      rig.armL.rotation.z = -2.35 + sway;
      rig.armR.rotation.z = -2.2 - sway;
      rig.forearmR.rotation.z = -0.28;
      rig.torso.rotation.z = -0.08;
      rig.cloak.rotation.z = -0.12;
      plantFeet(rig);
      return;
    }
    const heavy =
      player.attackKind === 'slam' ||
      player.attackKind === 'fireball' ||
      player.attackKind === 'arcane-missiles' ||
      player.attackKind === 'aimed-shot' ||
      player.attackKind === 'multi-shot' ||
      player.attackKind === 'shadow-strike' ||
      player.attackKind === 'poison-blade' ||
      player.attackKind === 'pyroblast'
        ? 1.35
        : 1;
    const slash =
      u < 0.35 ? -0.95 - u * 0.75 : u < 0.7 ? -1.2 + (u - 0.35) * 5.6 : 0.75 - (u - 0.7) * 1.5;
    if (
      player.attackKind === 'slam' ||
      player.attackKind === 'fireball' ||
      player.attackKind === 'arcane-missiles' ||
      player.attackKind === 'blink' ||
      player.attackKind === 'aimed-shot' ||
      player.attackKind === 'disengage' ||
      player.attackKind === 'multi-shot' ||
      player.attackKind === 'shadow-strike' ||
      player.attackKind === 'poison-blade' ||
      player.attackKind === 'sprint' ||
      player.attackKind === 'pyroblast' ||
      player.attackKind === 'rapid-fire'
    ) {
      rig.root.rotation.z = u < 0.4 ? -0.08 - u * 0.2 : -0.16 + (u - 0.4) * 0.28;
      rig.hip.position.y = u < 0.45 ? 0.05 * Math.sin(u * Math.PI) : 0;
      rig.cloak.rotation.z = -0.05 - Math.min(u, 0.55) * 0.08;
    }
    if (
      player.attackKind === 'blink' ||
      player.attackKind === 'disengage' ||
      player.attackKind === 'sprint' ||
      player.attackKind === 'vanish'
    ) {
      rig.armL.rotation.z = -0.8;
      rig.armR.rotation.z = -0.6;
      plantFeet(rig);
      return;
    }
    rig.armR.rotation.z = slash * heavy;
    rig.forearmR.rotation.z = u < 0.4 ? 0.25 : -0.42;
    rig.armL.rotation.z =
      player.attackKind === 'slam' ||
      player.attackKind === 'fireball' ||
      player.attackKind === 'arcane-missiles' ||
      player.attackKind === 'aimed-shot' ||
      player.attackKind === 'multi-shot' ||
      player.attackKind === 'shadow-strike' ||
      player.attackKind === 'poison-blade'
        ? 0.7
        : 0.35;
    rig.torso.rotation.z =
      slash *
      (player.attackKind === 'slam' ||
      player.attackKind === 'fireball' ||
      player.attackKind === 'arcane-missiles' ||
      player.attackKind === 'aimed-shot' ||
      player.attackKind === 'multi-shot' ||
      player.attackKind === 'shadow-strike' ||
      player.attackKind === 'poison-blade'
        ? 0.28
        : 0.12);
    rig.thighL.rotation.z =
      player.attackKind === 'slam' ||
      player.attackKind === 'fireball' ||
      player.attackKind === 'aimed-shot' ||
      player.attackKind === 'shadow-strike'
        ? 0.22
        : 0.12;
    rig.thighR.rotation.z =
      player.attackKind === 'slam' ||
      player.attackKind === 'fireball' ||
      player.attackKind === 'aimed-shot' ||
      player.attackKind === 'shadow-strike'
        ? -0.28
        : -0.18;
    rig.shinL.rotation.z = -0.22;
    rig.shinR.rotation.z = -0.18;
    plantFeet(rig);
    return;
  }

  if (player.state === 'jump' || player.state === 'fall') {
    const up = player.state === 'jump';
    rig.cloak.rotation.z = up ? -0.05 : 0.03;
    rig.armL.rotation.z = up ? -0.45 : 0.35;
    rig.armR.rotation.z = up ? -0.3 : 0.45;
    rig.forearmR.rotation.z = 0.15;
    rig.thighL.rotation.z = up ? -0.2 : 0.35;
    rig.thighR.rotation.z = up ? 0.15 : 0.28;
    rig.shinL.rotation.z = up ? -0.35 : -0.85;
    rig.shinR.rotation.z = up ? -0.28 : -0.75;
    rig.torso.rotation.z = up ? -0.05 : 0.06;
    plantFeet(rig);
    return;
  }

  if (player.state === 'run') {
    const t = time * 6.2;
    const swing = Math.sin(t);
    rig.cloak.rotation.z = -0.03 + swing * 0.02;
    rig.hip.position.y = Math.abs(Math.sin(t * 2)) * 0.03;
    rig.torso.rotation.z = -0.05 + swing * 0.02;
    rig.thighL.rotation.z = swing * 0.4;
    rig.thighR.rotation.z = -swing * 0.4;
    rig.shinL.rotation.z = -0.18 - Math.max(0, swing) * 0.36;
    rig.shinR.rotation.z = -0.18 - Math.max(0, -swing) * 0.36;
    rig.armL.rotation.z = -swing * 0.32;
    rig.armR.rotation.z = swing * 0.38;
    rig.forearmR.rotation.z = 0.18;
    plantFeet(rig);
    return;
  }

  const breath = Math.sin(time * 2.2) * 0.012;
  rig.hip.position.y = breath;
  rig.torso.rotation.z = Math.sin(time * 1.4) * 0.015;
  rig.armL.rotation.z = 0.14 + breath;
  rig.armR.rotation.z = -0.1;
  rig.forearmR.rotation.z = 0.16;
  rig.thighL.rotation.z = 0.03;
  rig.thighR.rotation.z = -0.02;
  rig.shinL.rotation.z = -0.14;
  rig.shinR.rotation.z = -0.12;
  plantFeet(rig);
}

export function createRotwolfRig(): BeastRig {
  const fur = mat(0x4a5a48, { metal: 0, rough: 0.82 });
  const belly = mat(0x6a6a58, { metal: 0, rough: 0.78 });
  const claw = mat(0x2a2a24, { metal: 0.1, rough: 0.5 });
  const eye = mat(0xb8d080, { emit: 0.45, emitColor: 0xb8d080, rough: 0.4 });
  const mats = [fur, belly, claw, eye];

  const root = new THREE.Group();
  const body = new THREE.Group();
  body.add(box(1.05, 0.38, 0.42, fur, 0.08));
  body.add(box(0.7, 0.28, 0.36, belly, -0.02));
  const head = new THREE.Group();
  head.position.set(0.58, 0.16, 0);
  head.add(box(0.38, 0.3, 0.3, fur, 0));
  head.add(box(0.22, 0.12, 0.16, claw, -0.08));
  const eyeL = box(0.06, 0.06, 0.06, eye, 0.08);
  eyeL.position.set(0.12, 0.08, 0.14);
  const eyeR = box(0.06, 0.06, 0.06, eye, 0.08);
  eyeR.position.set(0.12, 0.08, -0.14);
  head.add(eyeL, eyeR);
  body.add(head);

  const legs: THREE.Group[] = [];
  const offsets: Array<[number, number]> = [
    [0.32, 0.12],
    [0.32, -0.12],
    [-0.32, 0.12],
    [-0.32, -0.12],
  ];
  for (const [lx, lz] of offsets) {
    const leg = limb(0.42, 0.12, 0.12, claw);
    leg.pivot.position.set(lx, -0.08, lz);
    body.add(leg.pivot);
    legs.push(leg.pivot);
  }

  const tail = box(0.36, 0.1, 0.1, fur, 0.06);
  tail.position.set(-0.62, 0.1, 0);
  body.add(tail);
  root.add(body);
  return { root, body, head, legs, mats };
}

export function poseRotwolf(rig: BeastRig, dummy: Dummy, time: number): void {
  resetBeast(rig);
  if (dummy.state === 'dead') {
    rig.body.rotation.z = -1.15;
    rig.body.position.y = -0.25;
    return;
  }
  if (dummy.stunT > 0) {
    rig.body.rotation.z = 0.22;
    rig.head.rotation.z = 0.18;
    return;
  }
  if (dummy.state === 'attack' || dummy.state === 'charge' || dummy.castId === 'charge') {
    const u = dummyAttackProgress(dummy);
    const lunge = u < 0.45 ? u * 1.6 : 0.72 - (u - 0.45) * 1.1;
    const dash = dummy.state === 'charge' ? 0.55 : lunge;
    rig.body.position.x = dash * 0.28;
    rig.body.rotation.z = -dash * 0.28;
    rig.head.rotation.z = -0.35;
    return;
  }
  if (dummy.state === 'fuse') {
    rig.body.rotation.z = Math.sin(time * 28) * 0.2;
    rig.body.position.y = 0.06;
    return;
  }
  const t = time * 8;
  const swing = Math.sin(t);
  const chill = (dummy.chillT ?? 0) > 0;
  rig.body.position.y = Math.abs(Math.sin(t * 2)) * 0.04;
  rig.body.rotation.z = chill ? Math.sin(time * 16) * 0.05 : 0;
  rig.legs[0]!.rotation.z = swing * (chill ? 0.45 : 0.7);
  rig.legs[1]!.rotation.z = -swing * (chill ? 0.45 : 0.7);
  rig.legs[2]!.rotation.z = -swing * (chill ? 0.45 : 0.7);
  rig.legs[3]!.rotation.z = swing * (chill ? 0.45 : 0.7);
  rig.head.rotation.z = Math.sin(t * 0.5) * 0.08 + (chill ? 0.05 : 0);
}

export function createTreantRig(): BeastRig {
  const bark = mat(0x3a4a3c, { metal: 0, rough: 0.88 });
  const moss = mat(0x5a6e58, { metal: 0, rough: 0.8, emit: 0.04 });
  const glow = mat(PALETTE.moonlight, { emit: 0.25, emitColor: PALETTE.moonlight });
  const mats = [bark, moss, glow];

  const root = new THREE.Group();
  const body = new THREE.Group();
  body.add(box(0.55, 0.95, 0.4, bark, 0.2));
  body.add(box(0.7, 0.28, 0.46, moss, 0.72));
  const head = new THREE.Group();
  head.position.y = 0.78;
  head.add(box(0.42, 0.32, 0.36, bark, 0));
  head.add(box(0.08, 0.08, 0.08, glow, 0.02));
  body.add(head);

  const armL = limb(0.55, 0.16, 0.16, moss);
  armL.pivot.position.set(-0.38, 0.55, 0);
  const armR = limb(0.55, 0.16, 0.16, moss);
  armR.pivot.position.set(0.38, 0.55, 0);
  body.add(armL.pivot, armR.pivot);

  const legs: THREE.Group[] = [];
  const thighL = limb(0.4, 0.2, 0.2, bark);
  thighL.pivot.position.set(-0.16, -0.28, 0);
  const thighR = limb(0.4, 0.2, 0.2, bark);
  thighR.pivot.position.set(0.16, -0.28, 0);
  body.add(thighL.pivot, thighR.pivot);
  legs.push(thighL.pivot, thighR.pivot);

  root.add(body);
  return { root, body, head, legs, armL: armL.pivot, armR: armR.pivot, mats };
}

export function poseTreant(rig: BeastRig, dummy: Dummy, time: number): void {
  resetBeast(rig);
  if (dummy.state === 'dead') {
    rig.body.rotation.z = 1.05;
    rig.body.position.y = -0.2;
    return;
  }
  if (dummy.stunT > 0) {
    rig.body.rotation.z = -0.18;
    if (rig.armL) {
      rig.armL.rotation.z = 0.45;
    }
    if (rig.armR) {
      rig.armR.rotation.z = 0.35;
    }
    return;
  }
  if (dummy.state === 'attack' || dummy.state === 'fuse') {
    const u = dummyAttackProgress(dummy);
    const smash = dummy.state === 'fuse' ? -0.4 - Math.sin(time * 24) * 0.35 : u < 0.4 ? -0.8 - u * 0.4 : -0.96 + (u - 0.4) * 2.8;
    if (rig.armL) {
      rig.armL.rotation.z = smash;
    }
    if (rig.armR) {
      rig.armR.rotation.z = smash;
    }
    rig.body.rotation.z = smash * 0.08;
    return;
  }
  const t = time * 5;
  const swing = Math.sin(t);
  rig.body.position.y = Math.abs(Math.sin(t * 2)) * 0.03;
  rig.legs[0]!.rotation.z = swing * 0.4;
  rig.legs[1]!.rotation.z = -swing * 0.4;
  if (rig.armL) {
    rig.armL.rotation.z = -swing * 0.25;
  }
  if (rig.armR) {
    rig.armR.rotation.z = swing * 0.25;
  }
}

function resetBeast(rig: BeastRig): void {
  rig.body.position.set(0, 0, 0);
  rig.body.rotation.set(0, 0, 0);
  rig.head.rotation.set(0, 0, 0);
  for (const leg of rig.legs) {
    leg.rotation.set(0, 0, 0);
  }
  if (rig.armL) {
    rig.armL.rotation.set(0, 0, 0);
  }
  if (rig.armR) {
    rig.armR.rotation.set(0, 0, 0);
  }
  for (const extra of rig.extras ?? []) {
    extra.rotation.set(0, 0, 0);
  }
}
