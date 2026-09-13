import * as THREE from 'three';
import { WORLD } from '../game/config';
import { PALETTE } from './palette';
import { cloneRepeat, type P0Textures } from './textures';

function hash(seed: number): number {
  const n = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function addStake(
  group: THREE.Group,
  wood: THREE.MeshStandardMaterial,
  x: number,
  z: number,
  seed: number,
): void {
  const h = 1.25 + hash(seed) * 0.95;
  const r = 0.055 + hash(seed + 1) * 0.03;
  const leanX = (hash(seed + 2) - 0.5) * 0.14;
  const leanZ = (hash(seed + 3) - 0.5) * 0.1;
  const post = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.88, r, h, 6), wood);
  post.position.set(x, h / 2, z);
  post.rotation.set(leanZ, hash(seed + 4) * Math.PI, leanX);
  post.castShadow = true;
  post.receiveShadow = true;
  group.add(post);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(r * 0.95, 0.22 + hash(seed + 5) * 0.12, 5), wood);
  tip.position.set(x + leanX * h * 0.35, h + 0.08, z + leanZ * h * 0.35);
  tip.rotation.z = leanX;
  tip.rotation.x = -leanZ;
  tip.castShadow = true;
  group.add(tip);
}

function addRail(
  group: THREE.Group,
  wood: THREE.MeshStandardMaterial,
  from: THREE.Vector3,
  to: THREE.Vector3,
  y: number,
): void {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const len = Math.hypot(dx, dz);
  const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.034, len, 5), wood);
  rail.position.set((from.x + to.x) / 2, y, (from.z + to.z) / 2);
  rail.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx, 0, dz).normalize());
  rail.castShadow = true;
  group.add(rail);
}

export function createPalisade(tex: P0Textures): THREE.Group {
  const group = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({
    map: cloneRepeat(tex.wood, 1, 2),
    color: PALETTE.hunter,
    roughness: 0.86,
  });

  const back: Array<[number, number]> = [];
  let x = -7.2;
  let i = 0;
  while (x < 8.8) {
    const z = -1.55 + (hash(i + 10) - 0.5) * 0.42 + (i % 2) * 0.16;
    back.push([x, z]);
    addStake(group, wood, x, z, i + 1);
    x += 0.2 + hash(i + 20) * 0.14;
    i += 1;
  }

  const wing: Array<[number, number]> = [];
  let z = -1.35;
  let j = 40;
  while (z < 0.55) {
    const wx = -7.25 + (hash(j) - 0.5) * 0.28 + (j % 2) * 0.1;
    wing.push([wx, z]);
    addStake(group, wood, wx, z, j);
    z += 0.22 + hash(j + 3) * 0.12;
    j += 1;
  }

  if (back.length > 1) {
    const a = back[1]!;
    const b = back[back.length - 2]!;
    addRail(group, wood, new THREE.Vector3(a[0], 0, a[1]), new THREE.Vector3(b[0], 0, b[1]), 0.72);
    addRail(group, wood, new THREE.Vector3(a[0], 0, a[1]), new THREE.Vector3(b[0], 0, b[1]), 1.18);
  }
  if (wing.length > 1) {
    const a = wing[1]!;
    const b = wing[wing.length - 2]!;
    addRail(group, wood, new THREE.Vector3(a[0], 0, a[1]), new THREE.Vector3(b[0], 0, b[1]), 0.68);
    addRail(group, wood, new THREE.Vector3(a[0], 0, a[1]), new THREE.Vector3(b[0], 0, b[1]), 1.12);
  }

  group.position.y = WORLD.groundTop;
  return group;
}
