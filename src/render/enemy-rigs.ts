/**
 * 敌人外形族：按 DummyKind 搭可辨识侧视轮廓。
 * 色盘由 EnemyDef 注入；姿态由 poseEnemy 按族播放。
 */
import * as THREE from 'three';
import type { Dummy, DummyKind } from '../game/types';
import { dummyAttackProgress } from '../game/systems/dummy-ai';
import type { BeastRig } from './actor-rig';

export type EnemyPalette = {
  body: number;
  accent: number;
  glow: number;
};

type Limb = { pivot: THREE.Group };

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

function sphere(r: number, material: THREE.MeshStandardMaterial, y = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), material);
  mesh.position.y = y;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function cone(r: number, h: number, material: THREE.MeshStandardMaterial, y = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.ConeGeometry(r, h, 6), material);
  mesh.position.y = y;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function cyl(
  rt: number,
  rb: number,
  h: number,
  material: THREE.MeshStandardMaterial,
  y = 0,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 6), material);
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

function rigOf(
  root: THREE.Group,
  body: THREE.Group,
  head: THREE.Group,
  legs: THREE.Group[],
  mats: THREE.MeshStandardMaterial[],
  extra?: { armL?: THREE.Group; armR?: THREE.Group; extras?: THREE.Object3D[] },
): BeastRig {
  root.add(body);
  return {
    root,
    body,
    head,
    legs,
    armL: extra?.armL,
    armR: extra?.armR,
    extras: extra?.extras,
    mats,
  };
}

function palMats(pal: EnemyPalette, metal = 0.08, rough = 0.72) {
  const body = mat(pal.body, { metal, rough });
  const accent = mat(pal.accent, { metal: metal * 0.4, rough: Math.min(0.92, rough + 0.08) });
  const glow = mat(pal.glow, { emit: 0.42, emitColor: pal.glow, rough: 0.35 });
  const dark = mat(0x1a1814, { metal: 0.2, rough: 0.55 });
  return { body, accent, glow, dark, mats: [body, accent, glow, dark] };
}

function makeWolf(pal: EnemyPalette): BeastRig {
  const { body: fur, accent: belly, glow: eye, dark: claw, mats } = palMats(pal, 0, 0.84);
  const root = new THREE.Group();
  const torso = new THREE.Group();
  torso.add(box(1.12, 0.4, 0.44, fur, 0.1));
  torso.add(box(0.72, 0.28, 0.36, belly, 0));
  const head = new THREE.Group();
  head.position.set(0.62, 0.18, 0);
  head.add(box(0.4, 0.32, 0.32, fur, 0));
  head.add(box(0.28, 0.12, 0.16, claw, -0.06));
  const earL = cone(0.07, 0.16, fur, 0.22);
  earL.position.set(0.02, 0.22, 0.1);
  head.add(earL);
  const earR = cone(0.07, 0.16, fur, 0);
  earR.position.set(0.02, 0.22, -0.1);
  head.add(earR);
  const eyeL = box(0.06, 0.06, 0.06, eye, 0.08);
  eyeL.position.set(0.14, 0.08, 0.14);
  const eyeR = box(0.06, 0.06, 0.06, eye, 0.08);
  eyeR.position.set(0.14, 0.08, -0.14);
  head.add(eyeL, eyeR);
  torso.add(head);
  const legs: THREE.Group[] = [];
  for (const [lx, lz] of [
    [0.34, 0.13],
    [0.34, -0.13],
    [-0.34, 0.13],
    [-0.34, -0.13],
  ] as Array<[number, number]>) {
    const leg = limb(0.44, 0.12, 0.12, claw);
    leg.pivot.position.set(lx, -0.08, lz);
    torso.add(leg.pivot);
    legs.push(leg.pivot);
  }
  const tail = new THREE.Group();
  tail.position.set(-0.58, 0.12, 0);
  tail.add(box(0.42, 0.1, 0.1, fur, 0.04));
  torso.add(tail);
  return rigOf(root, torso, head, legs, mats, { extras: [tail] });
}

function makeTreant(pal: EnemyPalette): BeastRig {
  const { body: bark, accent: moss, glow, mats } = palMats(pal, 0, 0.88);
  const root = new THREE.Group();
  const torso = new THREE.Group();
  torso.add(cyl(0.22, 0.28, 1.05, bark, 0.28));
  torso.add(box(0.78, 0.26, 0.5, moss, 0.78));
  const crown = cone(0.42, 0.38, moss, 1.12);
  torso.add(crown);
  const head = new THREE.Group();
  head.position.y = 0.82;
  head.add(box(0.4, 0.3, 0.34, bark, 0));
  head.add(box(0.08, 0.08, 0.08, glow, 0.02));
  torso.add(head);
  const armL = limb(0.58, 0.16, 0.16, moss);
  armL.pivot.position.set(0.04, 0.58, -0.32);
  const armR = limb(0.58, 0.16, 0.16, moss);
  armR.pivot.position.set(0.04, 0.58, 0.32);
  torso.add(armL.pivot, armR.pivot);
  const thighL = limb(0.42, 0.2, 0.2, bark);
  thighL.pivot.position.set(0, -0.22, -0.16);
  const thighR = limb(0.42, 0.2, 0.2, bark);
  thighR.pivot.position.set(0, -0.22, 0.16);
  torso.add(thighL.pivot, thighR.pivot);
  return rigOf(root, torso, head, [thighL.pivot, thighR.pivot], mats, {
    armL: armL.pivot,
    armR: armR.pivot,
  });
}

function makeSpitter(pal: EnemyPalette): BeastRig {
  const { body, accent, glow, dark, mats } = palMats(pal, 0.04, 0.7);
  const root = new THREE.Group();
  const torso = new THREE.Group();
  torso.add(sphere(0.38, body, 0.22));
  const gut = sphere(0.22, accent, 0.08);
  gut.position.set(-0.12, 0.08, 0);
  torso.add(gut);
  const sac = sphere(0.16, glow, 0.18);
  sac.position.set(-0.28, 0.22, 0);
  torso.add(sac);
  const head = new THREE.Group();
  head.position.set(0.32, 0.32, 0);
  head.add(sphere(0.22, body, 0));
  const maw = box(0.28, 0.08, 0.2, dark, -0.04);
  maw.position.set(0.16, -0.04, 0);
  const spitEye = box(0.06, 0.06, 0.06, glow, 0.08);
  spitEye.position.set(0.1, 0.08, 0.1);
  head.add(maw, spitEye);
  torso.add(head);
  const legs: THREE.Group[] = [];
  for (const z of [-0.14, 0.14]) {
    const leg = limb(0.32, 0.1, 0.1, dark);
    leg.pivot.position.set(0.08, 0.02, z);
    torso.add(leg.pivot);
    legs.push(leg.pivot);
  }
  return rigOf(root, torso, head, legs, mats, { extras: [sac] });
}

function makePod(pal: EnemyPalette): BeastRig {
  const { body, accent, glow, mats } = palMats(pal, 0.05, 0.55);
  const root = new THREE.Group();
  const torso = new THREE.Group();
  torso.add(sphere(0.42, body, 0.38));
  torso.add(sphere(0.14, glow, 0.5));
  const spotA = sphere(0.08, accent, 0.42);
  spotA.position.set(0.22, 0.42, 0.18);
  const spotB = sphere(0.07, accent, 0.28);
  spotB.position.set(-0.18, 0.28, -0.16);
  torso.add(spotA, spotB);
  const fuse = cyl(0.04, 0.04, 0.22, accent, 0.72);
  torso.add(fuse);
  const head = new THREE.Group();
  head.position.y = 0.55;
  torso.add(head);
  return rigOf(root, torso, head, [], mats, { extras: [fuse] });
}

function makeGolem(pal: EnemyPalette): BeastRig {
  const { body, accent, glow, mats } = palMats(pal, 0.28, 0.48);
  const root = new THREE.Group();
  const torso = new THREE.Group();
  torso.add(box(0.62, 0.72, 0.52, body, 0.42));
  torso.add(box(0.7, 0.16, 0.56, accent, 0.72));
  const head = new THREE.Group();
  head.position.y = 0.92;
  head.add(box(0.4, 0.32, 0.36, body, 0));
  head.add(box(0.22, 0.06, 0.28, glow, 0.02));
  torso.add(head);
  const armL = limb(0.52, 0.2, 0.2, body);
  armL.pivot.position.set(0.04, 0.62, -0.38);
  const armR = limb(0.52, 0.2, 0.2, body);
  armR.pivot.position.set(0.04, 0.62, 0.38);
  torso.add(armL.pivot, armR.pivot);
  const thighL = limb(0.38, 0.22, 0.22, accent);
  thighL.pivot.position.set(0, -0.08, -0.16);
  const thighR = limb(0.38, 0.22, 0.22, accent);
  thighR.pivot.position.set(0, -0.08, 0.16);
  torso.add(thighL.pivot, thighR.pivot);
  return rigOf(root, torso, head, [thighL.pivot, thighR.pivot], mats, {
    armL: armL.pivot,
    armR: armR.pivot,
  });
}

function makeBat(pal: EnemyPalette): BeastRig {
  const { body, accent, glow, dark, mats } = palMats(pal, 0, 0.8);
  const root = new THREE.Group();
  const torso = new THREE.Group();
  torso.add(sphere(0.18, body, 0.28));
  const head = new THREE.Group();
  head.position.set(0.16, 0.34, 0);
  head.add(sphere(0.12, body, 0));
  const batEar = cone(0.05, 0.12, dark, 0.1);
  batEar.position.set(-0.02, 0.1, 0.06);
  const batEye = box(0.04, 0.04, 0.04, glow, 0.04);
  batEye.position.set(0.06, 0.02, 0.05);
  head.add(batEar, batEye);
  torso.add(head);
  const wingL = new THREE.Group();
  wingL.position.set(0, 0.3, -0.08);
  const wingLM = box(0.08, 0.04, 0.7, accent, 0);
  wingLM.position.z = -0.32;
  wingL.add(wingLM);
  const wingR = new THREE.Group();
  wingR.position.set(0, 0.3, 0.08);
  const wingRM = box(0.08, 0.04, 0.7, accent, 0);
  wingRM.position.z = 0.32;
  wingR.add(wingRM);
  torso.add(wingL, wingR);
  const claw = limb(0.16, 0.06, 0.06, dark);
  claw.pivot.position.set(0, 0.12, 0);
  torso.add(claw.pivot);
  return rigOf(root, torso, head, [claw.pivot], mats, { extras: [wingL, wingR] });
}

function makeCrab(pal: EnemyPalette): BeastRig {
  const { body, accent, glow, dark, mats } = palMats(pal, 0.15, 0.55);
  const root = new THREE.Group();
  const torso = new THREE.Group();
  torso.add(box(0.7, 0.28, 0.85, body, 0.22));
  torso.add(box(0.5, 0.1, 0.7, accent, 0.34));
  const head = new THREE.Group();
  head.position.set(0.28, 0.34, 0);
  const stalkL = cyl(0.03, 0.03, 0.22, dark, 0.12);
  stalkL.position.set(0.04, 0.12, 0.12);
  const stalkR = cyl(0.03, 0.03, 0.22, dark, 0.12);
  stalkR.position.set(0.04, 0.12, -0.12);
  const crabEyeL = sphere(0.05, glow, 0.24);
  crabEyeL.position.set(0.04, 0.24, 0.12);
  const crabEyeR = sphere(0.05, glow, 0.24);
  crabEyeR.position.set(0.04, 0.24, -0.12);
  head.add(stalkL, stalkR, crabEyeL, crabEyeR);
  torso.add(head);
  const clawL = new THREE.Group();
  clawL.position.set(0.28, 0.22, -0.48);
  clawL.add(box(0.34, 0.16, 0.22, accent, 0));
  const clawR = new THREE.Group();
  clawR.position.set(0.28, 0.22, 0.48);
  clawR.add(box(0.34, 0.16, 0.22, accent, 0));
  torso.add(clawL, clawR);
  const legs: THREE.Group[] = [];
  for (const [lx, lz] of [
    [0.18, -0.38],
    [-0.1, -0.4],
    [0.18, 0.38],
    [-0.1, 0.4],
  ] as Array<[number, number]>) {
    const leg = limb(0.28, 0.08, 0.08, dark);
    leg.pivot.position.set(lx, 0.08, lz);
    torso.add(leg.pivot);
    legs.push(leg.pivot);
  }
  return rigOf(root, torso, head, legs, mats, { armL: clawL, armR: clawR });
}

function makeRaider(pal: EnemyPalette): BeastRig {
  const { body, accent, glow, dark, mats } = palMats(pal, 0.18, 0.6);
  const root = new THREE.Group();
  const torso = new THREE.Group();
  torso.add(box(0.32, 0.52, 0.42, body, 0.42));
  torso.add(box(0.36, 0.14, 0.46, accent, 0.62));
  const head = new THREE.Group();
  head.position.y = 0.82;
  head.add(sphere(0.16, body, 0));
  head.add(box(0.2, 0.08, 0.22, dark, 0.1));
  head.add(box(0.05, 0.05, 0.16, glow, 0.02));
  torso.add(head);
  const armL = limb(0.4, 0.12, 0.12, body);
  armL.pivot.position.set(0.02, 0.58, -0.26);
  const armR = limb(0.4, 0.12, 0.12, body);
  armR.pivot.position.set(0.02, 0.58, 0.26);
  const blade = box(0.08, 0.42, 0.04, glow, -0.42);
  armR.pivot.add(blade);
  torso.add(armL.pivot, armR.pivot);
  const thighL = limb(0.36, 0.14, 0.14, dark);
  thighL.pivot.position.set(0, 0.02, -0.12);
  const thighR = limb(0.36, 0.14, 0.14, dark);
  thighR.pivot.position.set(0, 0.02, 0.12);
  torso.add(thighL.pivot, thighR.pivot);
  return rigOf(root, torso, head, [thighL.pivot, thighR.pivot], mats, {
    armL: armL.pivot,
    armR: armR.pivot,
  });
}

function makeLizard(pal: EnemyPalette): BeastRig {
  const { body, accent, glow, dark, mats } = palMats(pal, 0.06, 0.5);
  const root = new THREE.Group();
  const torso = new THREE.Group();
  torso.add(box(1.28, 0.32, 0.36, body, 0.16));
  const frill = box(0.08, 0.28, 0.5, accent, 0.34);
  frill.position.x = 0.2;
  torso.add(frill);
  const head = new THREE.Group();
  head.position.set(0.72, 0.22, 0);
  head.add(box(0.42, 0.22, 0.26, body, 0));
  head.add(box(0.12, 0.06, 0.18, glow, 0.06));
  torso.add(head);
  const legs: THREE.Group[] = [];
  for (const [lx, lz] of [
    [0.4, 0.14],
    [0.4, -0.14],
    [-0.28, 0.14],
    [-0.28, -0.14],
  ] as Array<[number, number]>) {
    const leg = limb(0.3, 0.1, 0.1, dark);
    leg.pivot.position.set(lx, 0.02, lz);
    torso.add(leg.pivot);
    legs.push(leg.pivot);
  }
  const tail = new THREE.Group();
  tail.position.set(-0.7, 0.14, 0);
  tail.add(box(0.7, 0.1, 0.12, body, 0));
  torso.add(tail);
  return rigOf(root, torso, head, legs, mats, { extras: [tail, frill] });
}

function makeFrog(pal: EnemyPalette, giant = false): BeastRig {
  const { body, accent, glow, dark, mats } = palMats(pal, 0, 0.62);
  const s = giant ? 1.45 : 1;
  const root = new THREE.Group();
  const torso = new THREE.Group();
  torso.add(sphere(0.34 * s, body, 0.28 * s));
  const belly = sphere(0.22 * s, accent, 0.18 * s);
  belly.position.set(0.06 * s, 0.18 * s, 0);
  torso.add(belly);
  const head = new THREE.Group();
  head.position.set(0.22 * s, 0.42 * s, 0);
  head.add(sphere(0.2 * s, body, 0));
  const eyeL = sphere(0.08 * s, glow, 0.12 * s);
  eyeL.position.set(0.04 * s, 0.12 * s, 0.12 * s);
  const eyeR = sphere(0.08 * s, glow, 0.12 * s);
  eyeR.position.set(0.04 * s, 0.12 * s, -0.12 * s);
  head.add(eyeL, eyeR);
  torso.add(head);
  const legL = limb(0.28 * s, 0.16 * s, 0.16 * s, dark);
  legL.pivot.position.set(-0.06 * s, 0.08 * s, -0.2 * s);
  const legR = limb(0.28 * s, 0.16 * s, 0.16 * s, dark);
  legR.pivot.position.set(-0.06 * s, 0.08 * s, 0.2 * s);
  torso.add(legL.pivot, legR.pivot);
  return rigOf(root, torso, head, [legL.pivot, legR.pivot], mats);
}

function makeWraith(pal: EnemyPalette): BeastRig {
  const { body, accent, glow, mats } = palMats(pal, 0, 0.9);
  const root = new THREE.Group();
  const torso = new THREE.Group();
  torso.add(cone(0.32, 0.95, body, 0.2));
  torso.add(box(0.28, 0.4, 0.28, accent, 0.45));
  const head = new THREE.Group();
  head.position.y = 0.78;
  head.add(sphere(0.16, body, 0));
  head.add(box(0.2, 0.06, 0.22, glow, 0.02));
  torso.add(head);
  const armL = limb(0.48, 0.1, 0.18, body);
  armL.pivot.position.set(0.02, 0.5, -0.22);
  const armR = limb(0.48, 0.1, 0.18, body);
  armR.pivot.position.set(0.02, 0.5, 0.22);
  torso.add(armL.pivot, armR.pivot);
  return rigOf(root, torso, head, [], mats, { armL: armL.pivot, armR: armR.pivot });
}

function makeLurker(pal: EnemyPalette): BeastRig {
  const { body, accent, glow, dark, mats } = palMats(pal, 0.05, 0.75);
  const root = new THREE.Group();
  const torso = new THREE.Group();
  torso.add(box(0.7, 0.22, 0.5, body, 0.18));
  const head = new THREE.Group();
  head.position.set(0.38, 0.2, 0);
  head.add(sphere(0.14, body, 0));
  head.add(box(0.2, 0.05, 0.16, glow, -0.02));
  torso.add(head);
  const legs: THREE.Group[] = [];
  for (const [lx, lz] of [
    [0.22, -0.28],
    [0.0, -0.32],
    [-0.22, -0.28],
    [0.22, 0.28],
    [0.0, 0.32],
    [-0.22, 0.28],
  ] as Array<[number, number]>) {
    const leg = limb(0.34, 0.07, 0.07, dark);
    leg.pivot.position.set(lx, 0.1, lz);
    torso.add(leg.pivot);
    legs.push(leg.pivot);
  }
  const abdomen = sphere(0.16, accent, 0.16);
  abdomen.position.set(-0.38, 0.16, 0);
  torso.add(abdomen);
  return rigOf(root, torso, head, legs, mats);
}

function makeTadpole(pal: EnemyPalette): BeastRig {
  const { body, accent, glow, mats } = palMats(pal, 0, 0.55);
  const root = new THREE.Group();
  const torso = new THREE.Group();
  torso.add(sphere(0.2, body, 0.22));
  const head = new THREE.Group();
  head.position.set(0.16, 0.24, 0);
  head.add(sphere(0.12, body, 0));
  head.add(box(0.04, 0.04, 0.04, glow, 0.04));
  torso.add(head);
  const tail = new THREE.Group();
  tail.position.set(-0.18, 0.2, 0);
  tail.add(box(0.32, 0.06, 0.16, accent, 0));
  torso.add(tail);
  return rigOf(root, torso, head, [], mats, { extras: [tail] });
}

function makeBrute(pal: EnemyPalette): BeastRig {
  const { body, accent, glow, dark, mats } = palMats(pal, 0.08, 0.7);
  const root = new THREE.Group();
  const torso = new THREE.Group();
  torso.add(box(0.7, 0.85, 0.62, body, 0.5));
  torso.add(box(0.78, 0.22, 0.68, accent, 0.22));
  const head = new THREE.Group();
  head.position.set(0.12, 1.02, 0);
  head.add(box(0.38, 0.32, 0.38, body, 0));
  head.add(box(0.12, 0.06, 0.28, glow, 0.04));
  torso.add(head);
  const armL = limb(0.62, 0.22, 0.22, body);
  armL.pivot.position.set(0.06, 0.7, -0.42);
  const armR = limb(0.62, 0.22, 0.22, body);
  armR.pivot.position.set(0.06, 0.7, 0.42);
  torso.add(armL.pivot, armR.pivot);
  const thighL = limb(0.4, 0.24, 0.24, dark);
  thighL.pivot.position.set(0, 0.02, -0.18);
  const thighR = limb(0.4, 0.24, 0.24, dark);
  thighR.pivot.position.set(0, 0.02, 0.18);
  torso.add(thighL.pivot, thighR.pivot);
  return rigOf(root, torso, head, [thighL.pivot, thighR.pivot], mats, {
    armL: armL.pivot,
    armR: armR.pivot,
  });
}

function makeScorpion(pal: EnemyPalette): BeastRig {
  const { body, accent, glow, dark, mats } = palMats(pal, 0.2, 0.5);
  const root = new THREE.Group();
  const torso = new THREE.Group();
  torso.add(box(0.85, 0.24, 0.42, body, 0.18));
  const head = new THREE.Group();
  head.position.set(0.48, 0.22, 0);
  head.add(box(0.28, 0.18, 0.28, body, 0));
  head.add(box(0.06, 0.06, 0.18, glow, 0.04));
  torso.add(head);
  const clawL = new THREE.Group();
  clawL.position.set(0.4, 0.2, -0.32);
  clawL.add(box(0.36, 0.14, 0.18, accent, 0));
  const clawR = new THREE.Group();
  clawR.position.set(0.4, 0.2, 0.32);
  clawR.add(box(0.36, 0.14, 0.18, accent, 0));
  torso.add(clawL, clawR);
  const legs: THREE.Group[] = [];
  for (const [lx, lz] of [
    [0.2, -0.22],
    [-0.05, -0.24],
    [-0.28, -0.2],
    [0.2, 0.22],
    [-0.05, 0.24],
    [-0.28, 0.2],
  ] as Array<[number, number]>) {
    const leg = limb(0.26, 0.07, 0.07, dark);
    leg.pivot.position.set(lx, 0.08, lz);
    torso.add(leg.pivot);
    legs.push(leg.pivot);
  }
  const sting = new THREE.Group();
  sting.position.set(-0.42, 0.22, 0);
  sting.add(box(0.16, 0.55, 0.12, body, 0.28));
  sting.add(cone(0.07, 0.22, glow, 0.62));
  torso.add(sting);
  return rigOf(root, torso, head, legs, mats, { armL: clawL, armR: clawR, extras: [sting] });
}

function makeIdol(pal: EnemyPalette): BeastRig {
  const { body, accent, glow, mats } = palMats(pal, 0.45, 0.38);
  const root = new THREE.Group();
  const torso = new THREE.Group();
  torso.add(box(0.5, 0.9, 0.4, body, 0.4));
  torso.add(box(0.58, 0.12, 0.46, glow, 0.55));
  const head = new THREE.Group();
  head.position.y = 0.98;
  head.add(box(0.36, 0.32, 0.32, body, 0));
  head.add(box(0.16, 0.08, 0.24, glow, 0));
  const hornL = cone(0.05, 0.18, accent, 0.22);
  hornL.position.set(0, 0.22, -0.1);
  const hornR = cone(0.05, 0.18, accent, 0.22);
  hornR.position.set(0, 0.22, 0.1);
  head.add(hornL, hornR);
  torso.add(head);
  const armL = limb(0.5, 0.14, 0.14, body);
  armL.pivot.position.set(0.02, 0.62, -0.28);
  const armR = limb(0.5, 0.14, 0.14, body);
  armR.pivot.position.set(0.02, 0.62, 0.28);
  torso.add(armL.pivot, armR.pivot);
  const thighL = limb(0.32, 0.16, 0.16, accent);
  thighL.pivot.position.set(0, -0.02, -0.12);
  const thighR = limb(0.32, 0.16, 0.16, accent);
  thighR.pivot.position.set(0, -0.02, 0.12);
  torso.add(thighL.pivot, thighR.pivot);
  return rigOf(root, torso, head, [thighL.pivot, thighR.pivot], mats, {
    armL: armL.pivot,
    armR: armR.pivot,
  });
}

function makeWisp(pal: EnemyPalette): BeastRig {
  const { body, accent, glow, mats } = palMats(pal, 0, 0.4);
  const root = new THREE.Group();
  const torso = new THREE.Group();
  torso.add(sphere(0.22, glow, 0.55));
  torso.add(sphere(0.14, accent, 0.55));
  const head = new THREE.Group();
  head.position.y = 0.55;
  torso.add(head);
  const orbL = sphere(0.07, body, 0.55);
  orbL.position.set(0, 0.55, -0.28);
  const orbR = sphere(0.07, body, 0.55);
  orbR.position.set(0, 0.55, 0.28);
  torso.add(orbL, orbR);
  return rigOf(root, torso, head, [], mats, { extras: [orbL, orbR] });
}

function makeWatcher(pal: EnemyPalette): BeastRig {
  const { body, accent, glow, mats } = palMats(pal, 0.35, 0.4);
  const root = new THREE.Group();
  const torso = new THREE.Group();
  torso.add(cyl(0.28, 0.28, 0.1, body, 0.55));
  torso.add(cyl(0.22, 0.22, 0.08, accent, 0.62));
  const head = new THREE.Group();
  head.position.y = 0.58;
  head.add(sphere(0.16, glow, 0));
  head.add(sphere(0.07, body, 0.02));
  torso.add(head);
  return rigOf(root, torso, head, [], mats);
}

function makeCultist(pal: EnemyPalette): BeastRig {
  const { body, accent, glow, dark, mats } = palMats(pal, 0.05, 0.85);
  const root = new THREE.Group();
  const torso = new THREE.Group();
  torso.add(cone(0.28, 0.95, body, 0.18));
  torso.add(box(0.3, 0.4, 0.3, accent, 0.42));
  const head = new THREE.Group();
  head.position.y = 0.82;
  head.add(cone(0.18, 0.32, body, 0.08));
  head.add(box(0.14, 0.06, 0.16, glow, -0.02));
  torso.add(head);
  const armL = limb(0.42, 0.1, 0.1, dark);
  armL.pivot.position.set(0.02, 0.52, -0.2);
  const armR = limb(0.42, 0.1, 0.1, dark);
  armR.pivot.position.set(0.02, 0.52, 0.2);
  const staff = cyl(0.03, 0.03, 0.7, glow, -0.2);
  armR.pivot.add(staff);
  torso.add(armL.pivot, armR.pivot);
  const thighL = limb(0.3, 0.12, 0.12, dark);
  thighL.pivot.position.set(0, 0.02, -0.1);
  const thighR = limb(0.3, 0.12, 0.12, dark);
  thighR.pivot.position.set(0, 0.02, 0.1);
  torso.add(thighL.pivot, thighR.pivot);
  return rigOf(root, torso, head, [thighL.pivot, thighR.pivot], mats, {
    armL: armL.pivot,
    armR: armR.pivot,
  });
}

function makeTentacle(pal: EnemyPalette): BeastRig {
  const { body, accent, glow, mats } = palMats(pal, 0.04, 0.55);
  const root = new THREE.Group();
  const torso = new THREE.Group();
  torso.add(sphere(0.22, body, 0.18));
  const head = new THREE.Group();
  head.position.y = 0.32;
  head.add(sphere(0.12, glow, 0));
  torso.add(head);
  const extras: THREE.Group[] = [];
  for (let i = 0; i < 4; i += 1) {
    const t = new THREE.Group();
    t.position.set((i % 2 === 0 ? 0.1 : -0.1) * (i < 2 ? 1 : -1), 0.12, i < 2 ? -0.12 : 0.12);
    t.add(cyl(0.05, 0.03, 0.7, i % 2 ? accent : body, 0.28));
    torso.add(t);
    extras.push(t);
  }
  return rigOf(root, torso, head, [], mats, { extras });
}

function makeLord(pal: EnemyPalette): BeastRig {
  const { body, accent, glow, dark, mats } = palMats(pal, 0.1, 0.7);
  const root = new THREE.Group();
  const torso = new THREE.Group();
  torso.add(box(0.7, 0.9, 0.55, body, 0.5));
  torso.add(cone(0.5, 0.4, accent, 0.08));
  const head = new THREE.Group();
  head.position.y = 1.08;
  head.add(cone(0.22, 0.4, body, 0.05));
  head.add(box(0.18, 0.08, 0.22, glow, 0));
  torso.add(head);
  const armL = limb(0.7, 0.16, 0.22, accent);
  armL.pivot.position.set(0.04, 0.72, -0.38);
  const armR = limb(0.7, 0.16, 0.22, accent);
  armR.pivot.position.set(0.04, 0.72, 0.38);
  torso.add(armL.pivot, armR.pivot);
  const skirt = new THREE.Group();
  skirt.position.y = 0.1;
  const skirtArm = cyl(0.08, 0.04, 0.55, dark, 0.1);
  skirtArm.position.set(0.2, 0.1, -0.22);
  skirt.add(skirtArm);
  torso.add(skirt);
  return rigOf(root, torso, head, [], mats, { armL: armL.pivot, armR: armR.pivot, extras: [skirt] });
}

function makeWyvern(pal: EnemyPalette): BeastRig {
  const { body, accent, glow, dark, mats } = palMats(pal, 0.12, 0.48);
  const root = new THREE.Group();
  const torso = new THREE.Group();
  torso.add(box(0.85, 0.42, 0.4, body, 0.42));
  const head = new THREE.Group();
  head.position.set(0.55, 0.58, 0);
  head.add(box(0.46, 0.24, 0.24, body, 0));
  head.add(box(0.1, 0.06, 0.16, glow, 0.04));
  const horn = cone(0.06, 0.16, dark, 0.16);
  horn.position.set(-0.08, 0.16, 0.08);
  head.add(horn);
  torso.add(head);
  const wingL = new THREE.Group();
  wingL.position.set(-0.05, 0.52, -0.12);
  const wyvernWingL = box(0.16, 0.06, 0.95, accent, 0);
  wyvernWingL.position.set(0, 0, -0.42);
  wingL.add(wyvernWingL);
  const wingR = new THREE.Group();
  wingR.position.set(-0.05, 0.52, 0.12);
  const wyvernWingR = box(0.16, 0.06, 0.95, accent, 0);
  wyvernWingR.position.set(0, 0, 0.42);
  wingR.add(wyvernWingR);
  torso.add(wingL, wingR);
  const thighL = limb(0.36, 0.14, 0.14, dark);
  thighL.pivot.position.set(0.1, 0.18, -0.12);
  const thighR = limb(0.36, 0.14, 0.14, dark);
  thighR.pivot.position.set(0.1, 0.18, 0.12);
  torso.add(thighL.pivot, thighR.pivot);
  const tail = new THREE.Group();
  tail.position.set(-0.5, 0.36, 0);
  tail.add(box(0.55, 0.1, 0.1, body, 0));
  torso.add(tail);
  return rigOf(root, torso, head, [thighL.pivot, thighR.pivot], mats, { extras: [wingL, wingR, tail] });
}

function makeShard(pal: EnemyPalette): BeastRig {
  const { body, accent, glow, mats } = palMats(pal, 0.55, 0.22);
  const root = new THREE.Group();
  const torso = new THREE.Group();
  torso.add(cone(0.18, 0.5, glow, 0.55));
  const down = cone(0.16, 0.4, body, 0.18);
  down.rotation.z = Math.PI;
  torso.add(down);
  torso.add(box(0.08, 0.08, 0.08, accent, 0.42));
  const head = new THREE.Group();
  head.position.y = 0.7;
  torso.add(head);
  return rigOf(root, torso, head, [], mats);
}

function makeWalker(pal: EnemyPalette): BeastRig {
  const { body, accent, glow, dark, mats } = palMats(pal, 0.08, 0.45);
  const root = new THREE.Group();
  const torso = new THREE.Group();
  torso.add(box(0.28, 0.95, 0.28, body, 0.5));
  torso.add(box(0.22, 0.5, 0.22, glow, 0.52));
  const head = new THREE.Group();
  head.position.y = 1.12;
  head.add(box(0.22, 0.28, 0.22, accent, 0));
  head.add(box(0.16, 0.06, 0.18, glow, 0.04));
  torso.add(head);
  const armL = limb(0.7, 0.08, 0.08, dark);
  armL.pivot.position.set(0.02, 0.72, -0.2);
  const armR = limb(0.7, 0.08, 0.08, dark);
  armR.pivot.position.set(0.02, 0.72, 0.2);
  torso.add(armL.pivot, armR.pivot);
  const thighL = limb(0.5, 0.1, 0.1, dark);
  thighL.pivot.position.set(0, 0.02, -0.1);
  const thighR = limb(0.5, 0.1, 0.1, dark);
  thighR.pivot.position.set(0, 0.02, 0.1);
  torso.add(thighL.pivot, thighR.pivot);
  return rigOf(root, torso, head, [thighL.pivot, thighR.pivot], mats, {
    armL: armL.pivot,
    armR: armR.pivot,
  });
}

function makeGuard(pal: EnemyPalette): BeastRig {
  const { body, accent, glow, dark, mats } = palMats(pal, 0.42, 0.36);
  const root = new THREE.Group();
  const torso = new THREE.Group();
  torso.add(box(0.4, 0.62, 0.48, body, 0.48));
  torso.add(box(0.46, 0.14, 0.52, accent, 0.72));
  const head = new THREE.Group();
  head.position.y = 0.92;
  head.add(box(0.3, 0.26, 0.3, dark, 0));
  head.add(box(0.24, 0.05, 0.26, glow, 0.04));
  torso.add(head);
  const armL = limb(0.42, 0.14, 0.14, body);
  armL.pivot.position.set(0.02, 0.62, -0.3);
  const armR = limb(0.42, 0.14, 0.14, body);
  armR.pivot.position.set(0.02, 0.62, 0.3);
  const spear = cyl(0.03, 0.03, 0.85, glow, -0.28);
  armR.pivot.add(spear);
  torso.add(armL.pivot, armR.pivot);
  const thighL = limb(0.38, 0.16, 0.16, dark);
  thighL.pivot.position.set(0, 0.04, -0.12);
  const thighR = limb(0.38, 0.16, 0.16, dark);
  thighR.pivot.position.set(0, 0.04, 0.12);
  torso.add(thighL.pivot, thighR.pivot);
  return rigOf(root, torso, head, [thighL.pivot, thighR.pivot], mats, {
    armL: armL.pivot,
    armR: armR.pivot,
  });
}

function makeKing(pal: EnemyPalette): BeastRig {
  const { body, accent, glow, dark, mats } = palMats(pal, 0.35, 0.4);
  const root = new THREE.Group();
  const torso = new THREE.Group();
  torso.add(box(0.55, 0.85, 0.5, body, 0.5));
  torso.add(box(0.22, 0.7, 0.7, accent, 0.35));
  const head = new THREE.Group();
  head.position.y = 1.08;
  head.add(box(0.34, 0.3, 0.34, dark, 0));
  head.add(box(0.4, 0.1, 0.16, glow, 0.22));
  head.add(cone(0.06, 0.18, glow, 0.28));
  torso.add(head);
  const armL = limb(0.55, 0.16, 0.16, body);
  armL.pivot.position.set(0.04, 0.72, -0.34);
  const armR = limb(0.55, 0.16, 0.16, body);
  armR.pivot.position.set(0.04, 0.72, 0.34);
  torso.add(armL.pivot, armR.pivot);
  const thighL = limb(0.42, 0.18, 0.18, dark);
  thighL.pivot.position.set(0, 0.02, -0.14);
  const thighR = limb(0.42, 0.18, 0.18, dark);
  thighR.pivot.position.set(0, 0.02, 0.14);
  torso.add(thighL.pivot, thighR.pivot);
  return rigOf(root, torso, head, [thighL.pivot, thighR.pivot], mats, {
    armL: armL.pivot,
    armR: armR.pivot,
  });
}

export function createEnemyRig(kind: DummyKind, pal: EnemyPalette): BeastRig {
  switch (kind) {
    case 'treant':
      return makeTreant(pal);
    case 'spitter':
      return makeSpitter(pal);
    case 'pod':
      return makePod(pal);
    case 'golem':
      return makeGolem(pal);
    case 'bat':
      return makeBat(pal);
    case 'crab':
      return makeCrab(pal);
    case 'raider':
      return makeRaider(pal);
    case 'lizard':
      return makeLizard(pal);
    case 'frog':
      return makeFrog(pal, false);
    case 'mother':
      return makeFrog(pal, true);
    case 'wraith':
      return makeWraith(pal);
    case 'lurker':
      return makeLurker(pal);
    case 'tadpole':
      return makeTadpole(pal);
    case 'brute':
      return makeBrute(pal);
    case 'scorpion':
      return makeScorpion(pal);
    case 'idol':
      return makeIdol(pal);
    case 'wisp':
      return makeWisp(pal);
    case 'watcher':
      return makeWatcher(pal);
    case 'cultist':
      return makeCultist(pal);
    case 'tentacle':
      return makeTentacle(pal);
    case 'lord':
      return makeLord(pal);
    case 'wyvern':
      return makeWyvern(pal);
    case 'shard':
      return makeShard(pal);
    case 'walker':
      return makeWalker(pal);
    case 'guard':
      return makeGuard(pal);
    case 'king':
      return makeKing(pal);
    case 'wolf':
    case 'rotwolf':
    default:
      return makeWolf(pal);
  }
}

const TALL: ReadonlySet<DummyKind> = new Set([
  'treant',
  'golem',
  'raider',
  'brute',
  'idol',
  'cultist',
  'lord',
  'wyvern',
  'walker',
  'guard',
  'king',
  'mother',
]);

const FLOATING: ReadonlySet<DummyKind> = new Set(['bat', 'wraith', 'wisp', 'watcher', 'shard']);

export function enemyFootOffset(kind: DummyKind): number {
  if (FLOATING.has(kind)) {
    return 0.55;
  }
  if (TALL.has(kind)) {
    return 0.7;
  }
  if (kind === 'crab' || kind === 'scorpion' || kind === 'lurker' || kind === 'tadpole') {
    return 0.38;
  }
  return 0.48;
}

export function enemyHeadOffset(kind: DummyKind): number {
  if (kind === 'king' || kind === 'lord' || kind === 'mother' || kind === 'brute') {
    return 2.55;
  }
  if (TALL.has(kind)) {
    return 2.35;
  }
  if (FLOATING.has(kind)) {
    return 1.95;
  }
  if (kind === 'pod' || kind === 'tadpole') {
    return 1.45;
  }
  return 1.75;
}

function resetEnemy(rig: BeastRig): void {
  rig.body.position.set(0, 0, 0);
  rig.body.rotation.set(0, 0, 0);
  rig.body.scale.set(1, 1, 1);
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
    extra.scale.set(1, 1, 1);
  }
}

function poseBiped(rig: BeastRig, dummy: Dummy, time: number, smashScale = 1): void {
  if (dummy.state === 'dead') {
    rig.body.rotation.z = 1.05;
    rig.body.position.y = -0.2;
    return;
  }
  if (dummy.stunT > 0) {
    rig.body.rotation.z = -0.18;
    return;
  }
  if (dummy.state === 'attack' || dummy.state === 'fuse' || dummy.castId === 'slam') {
    const u = dummyAttackProgress(dummy);
    const smash =
      dummy.state === 'fuse' ? -0.4 - Math.sin(time * 24) * 0.35 : u < 0.4 ? -0.8 - u * 0.4 : -0.96 + (u - 0.4) * 2.8;
    if (rig.armL) {
      rig.armL.rotation.z = smash * smashScale;
    }
    if (rig.armR) {
      rig.armR.rotation.z = smash * smashScale;
    }
    rig.body.rotation.z = smash * 0.08;
    return;
  }
  const t = time * 5;
  const swing = Math.sin(t);
  rig.body.position.y = Math.abs(Math.sin(t * 2)) * 0.03;
  if (rig.legs[0]) {
    rig.legs[0].rotation.z = swing * 0.4;
  }
  if (rig.legs[1]) {
    rig.legs[1].rotation.z = -swing * 0.4;
  }
  if (rig.armL) {
    rig.armL.rotation.z = -swing * 0.25;
  }
  if (rig.armR) {
    rig.armR.rotation.z = swing * 0.25;
  }
}

function poseQuad(rig: BeastRig, dummy: Dummy, time: number): void {
  if (dummy.state === 'dead') {
    rig.body.rotation.z = -1.15;
    rig.body.position.y = -0.25;
    return;
  }
  if (dummy.stunT > 0) {
    rig.body.rotation.z = 0.22;
    return;
  }
  const leaping = dummy.castId === 'leap' || dummy.state === 'charge';
  if (dummy.state === 'attack' || leaping) {
    const u = dummyAttackProgress(dummy);
    const lunge = u < 0.45 ? u * 1.4 : 0.63 - (u - 0.45) * 0.8;
    rig.body.rotation.z = leaping ? -0.35 : -0.28 - lunge * 0.35;
    rig.body.position.x = lunge * 0.22;
    if (leaping) {
      rig.body.position.y = Math.sin(Math.min(1, u) * Math.PI) * 0.42;
    }
    if (rig.extras?.[0]) {
      rig.extras[0].rotation.z = 0.4;
    }
    return;
  }
  const t = time * 7;
  const swing = Math.sin(t);
  rig.body.position.y = Math.abs(Math.sin(t * 2)) * 0.04;
  for (let i = 0; i < rig.legs.length; i += 1) {
    rig.legs[i]!.rotation.z = swing * (i % 2 === 0 ? 0.55 : -0.55);
  }
  if (rig.extras?.[0]) {
    rig.extras[0].rotation.z = Math.sin(t * 0.7) * 0.25;
  }
}

function poseFlyer(rig: BeastRig, dummy: Dummy, time: number): void {
  if (dummy.state === 'dead') {
    rig.body.rotation.z = 0.9;
    rig.body.position.y = -0.15;
    return;
  }
  const flap = Math.sin(time * 10);
  rig.body.position.y = 0.12 + Math.sin(time * 3.2) * 0.08;
  if (rig.extras?.[0]) {
    rig.extras[0].rotation.x = flap * 0.45;
  }
  if (rig.extras?.[1]) {
    rig.extras[1].rotation.x = -flap * 0.45;
  }
  if (dummy.state === 'attack' || dummy.state === 'charge' || dummy.castId === 'leap') {
    rig.body.rotation.z = -0.4;
    rig.body.position.y += 0.15;
  }
}

export function poseEnemy(rig: BeastRig, dummy: Dummy, time: number): void {
  resetEnemy(rig);
  const kind = dummy.kind;
  if (
    kind === 'wolf' ||
    kind === 'rotwolf' ||
    kind === 'lizard' ||
    kind === 'lurker' ||
    kind === 'scorpion' ||
    kind === 'crab' ||
    kind === 'tadpole'
  ) {
    poseQuad(rig, dummy, time);
    if (kind === 'scorpion' && rig.extras?.[0] && (dummy.state === 'attack' || dummy.behavior === 'sting')) {
      const u = dummyAttackProgress(dummy);
      rig.extras[0].rotation.z = dummy.state === 'attack' ? -0.8 - u * 0.4 : Math.sin(time * 4) * 0.2;
    }
    return;
  }
  if (kind === 'bat' || kind === 'wraith' || kind === 'wisp' || kind === 'watcher' || kind === 'shard' || kind === 'wyvern') {
    poseFlyer(rig, dummy, time);
    if (kind === 'wyvern' && dummy.state === 'walk') {
      const swing = Math.sin(time * 5);
      if (rig.legs[0]) {
        rig.legs[0].rotation.z = swing * 0.35;
      }
      if (rig.legs[1]) {
        rig.legs[1].rotation.z = -swing * 0.35;
      }
    }
    if (kind === 'wisp' && rig.extras) {
      const a = time * 3;
      rig.extras[0]!.position.set(Math.cos(a) * 0.28, 0.55 + Math.sin(a) * 0.08, Math.sin(a) * 0.28);
      rig.extras[1]!.position.set(Math.cos(a + 2.1) * 0.28, 0.55 + Math.sin(a + 1) * 0.08, Math.sin(a + 2.1) * 0.28);
    }
    return;
  }
  if (kind === 'frog' || kind === 'mother' || kind === 'pod') {
    if (dummy.state === 'dead') {
      rig.body.rotation.z = 0.8;
      return;
    }
    if (dummy.state === 'fuse') {
      const pulse = 1 + Math.sin(time * 22) * 0.12;
      rig.body.scale.set(pulse, pulse, pulse);
      return;
    }
    const leaping = dummy.castId === 'leap' || dummy.state === 'charge';
    if (leaping || dummy.state === 'attack') {
      const u = dummyAttackProgress(dummy);
      rig.body.position.y = Math.sin(Math.min(1, Math.max(u, dummy.chargeDashT > 0 ? 0.5 : u)) * Math.PI) * 0.5;
      rig.body.rotation.z = -0.25;
      return;
    }
    rig.body.position.y = Math.abs(Math.sin(time * 4)) * 0.04;
    return;
  }
  if (kind === 'tentacle') {
    if (dummy.state === 'dead') {
      rig.body.rotation.z = 0.7;
      return;
    }
    for (let i = 0; i < (rig.extras?.length ?? 0); i += 1) {
      rig.extras![i]!.rotation.z = Math.sin(time * 4 + i) * 0.45;
    }
    if (dummy.state === 'attack') {
      rig.body.rotation.z = -0.2;
    }
    return;
  }
  if (kind === 'spitter') {
    poseQuad(rig, dummy, time);
    if (dummy.state === 'attack') {
      rig.head.rotation.z = -0.35;
      if (rig.extras?.[0]) {
        const pulse = 1 + Math.sin(time * 16) * 0.15;
        rig.extras[0].scale.setScalar(pulse);
      }
    }
    return;
  }
  poseBiped(rig, dummy, time);
}
