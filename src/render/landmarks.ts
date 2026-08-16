import * as THREE from 'three';
import { createFlameMat } from './campfire';
import { PALETTE } from './palette';
import { cloneRepeat, type P0Textures } from './textures';

export type LandmarkView = {
  group: THREE.Group;
  tick: (time: number) => void;
};

export type SecretChestView = {
  id: string;
  group: THREE.Group;
  lid: THREE.Object3D;
  glow: THREE.PointLight;
  beacon: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  tick: (time: number, claimed: boolean) => void;
};

function woodMat(tex: P0Textures): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    map: cloneRepeat(tex.wood, 1, 1),
    color: 0xc4a574,
    roughness: 0.78,
  });
}

function stoneMat(tex: P0Textures): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    map: cloneRepeat(tex.rock, 1, 1),
    color: PALETTE.dummy,
    roughness: 0.9,
  });
}

/** standY = 平台顶面高度；宝箱脚底贴在该高度。 */
export function createSecretChest(
  tex: P0Textures,
  id: string,
  x: number,
  standY: number,
): SecretChestView {
  const group = new THREE.Group();
  const wood = woodMat(tex);
  const iron = new THREE.MeshStandardMaterial({
    color: PALETTE.mossDark,
    metalness: 0.55,
    roughness: 0.35,
  });
  const gold = new THREE.MeshStandardMaterial({
    color: PALETTE.gold,
    metalness: 0.6,
    roughness: 0.28,
    emissive: new THREE.Color(PALETTE.gold),
    emissiveIntensity: 0.45,
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.42, 0.48), wood);
  body.position.y = 0.21;
  body.castShadow = true;
  const lid = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.14, 0.52), wood);
  lid.position.y = 0.49;
  lid.castShadow = true;
  const band = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.44, 0.5), iron);
  band.position.y = 0.22;
  const lock = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.1), gold);
  lock.position.set(0.34, 0.28, 0.02);
  const trim = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.04, 0.5), gold);
  trim.position.y = 0.42;

  const beacon = new THREE.Mesh(
    new THREE.PlaneGeometry(0.55, 0.55),
    new THREE.MeshBasicMaterial({
      color: PALETTE.gold,
      transparent: true,
      depthTest: false,
      fog: false,
      opacity: 0.75,
    }),
  );
  beacon.position.set(0, 1.15, 0.2);

  const glow = new THREE.PointLight(PALETTE.gold, 1.4, 4.5, 2);
  glow.position.set(0, 0.7, 0.6);

  group.add(body, lid, band, lock, trim, beacon, glow);
  group.position.set(x, standY, 0.12);

  return {
    id,
    group,
    lid,
    glow,
    beacon,
    tick: (time: number, claimed: boolean) => {
      group.visible = true;
      const pulse = 0.55 + Math.sin(time * 3.2) * 0.35;
      if (claimed) {
        lid.rotation.x = -1.05;
        glow.intensity = 0.25;
        beacon.visible = false;
        return;
      }
      lid.rotation.x = 0;
      glow.intensity = 1.1 + pulse * 0.6;
      beacon.visible = true;
      beacon.position.y = 1.05 + Math.sin(time * 2.6) * 0.12;
      beacon.rotation.z = time * 1.4;
      beacon.material.opacity = 0.45 + pulse * 0.4;
    },
  };
}

export function createEndGate(tex: P0Textures): LandmarkView {
  const group = new THREE.Group();
  const stone = stoneMat(tex);
  const wood = woodMat(tex);
  const gold = new THREE.MeshStandardMaterial({
    color: PALETTE.gold,
    metalness: 0.5,
    roughness: 0.36,
    emissive: new THREE.Color(PALETTE.gold),
    emissiveIntensity: 0.14,
  });
  const cloth = new THREE.MeshStandardMaterial({
    color: PALETTE.ember,
    roughness: 0.78,
    metalness: 0,
  });

  const left = new THREE.Mesh(new THREE.BoxGeometry(0.55, 3.2, 0.7), stone);
  left.position.set(-1.15, 1.6, -0.15);
  left.castShadow = true;
  const right = new THREE.Mesh(new THREE.BoxGeometry(0.55, 3.2, 0.7), stone);
  right.position.set(1.15, 1.6, -0.15);
  right.castShadow = true;
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.42, 0.78), stone);
  lintel.position.set(0, 3.28, -0.12);
  lintel.castShadow = true;
  const key = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.2), gold);
  key.position.set(0, 3.28, 0.28);
  group.add(left, right, lintel, key);

  addHangFlag(group, cloth, -0.55, 2.55);
  addHangFlag(group, cloth, 0.55, 2.55);

  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.16, 8), wood);
  bowl.position.set(0, 0.22, 0.35);
  group.add(bowl);
  const flameMats = [
    addGateFlame(group, 0, 0.48, 0.38, 1),
    addGateFlame(group, 0.04, 0.44, 0.32, 0.7),
  ];

  group.position.set(47.45, 1, 0);

  return {
    group,
    tick: (time: number) => {
      for (const mat of flameMats) {
        mat.uniforms.uTime!.value = time;
      }
    },
  };
}

function addHangFlag(group: THREE.Group, cloth: THREE.MeshStandardMaterial, x: number, y: number): void {
  const flag = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.85, 0.42), cloth);
  flag.position.set(x, y, 0.22);
  flag.castShadow = true;
  group.add(flag);
}

function addGateFlame(
  group: THREE.Group,
  x: number,
  y: number,
  z: number,
  scale: number,
): THREE.ShaderMaterial {
  const mat = createFlameMat(0.9 * scale);
  const flame = new THREE.Mesh(new THREE.PlaneGeometry(0.32 * scale, 0.48 * scale), mat);
  flame.position.set(x, y, z);
  group.add(flame);
  return mat;
}
