import * as THREE from 'three';
import { WORLD } from '../game/config';
import type { LandmarkProp } from '../game/data/level-kit';
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

export function createEndGate(tex: P0Textures, x = 47.45): LandmarkView {
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

  group.position.set(x, WORLD.groundTop, 0);

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
  const mat = createFlameMat(0.9 * scale, x * 12.9898 + z * 78.233);
  const flame = new THREE.Mesh(new THREE.PlaneGeometry(0.32 * scale, 0.48 * scale), mat);
  flame.position.set(x, y, z);
  group.add(flame);
  return mat;
}

function addBox(
  group: THREE.Group,
  w: number,
  h: number,
  d: number,
  mat: THREE.Material,
  x: number,
  y: number,
  z: number,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

/** 关卡中段地标：无碰撞，只负责侧视轮廓。 */
export function createZoneLandmark(
  prop: LandmarkProp,
  x: number,
  standY: number,
  tex: P0Textures,
): THREE.Group {
  const group = new THREE.Group();
  const wood = woodMat(tex);
  const stone = stoneMat(tex);
  const bark = new THREE.MeshStandardMaterial({
    map: cloneRepeat(tex.wood, 1, 2),
    color: 0x4a4034,
    roughness: 0.92,
  });
  const moss = new THREE.MeshStandardMaterial({
    map: cloneRepeat(tex.moss, 1, 1),
    color: 0x6a7a58,
    roughness: 0.88,
  });
  const ember = new THREE.MeshStandardMaterial({
    color: PALETTE.ember,
    roughness: 0.4,
    emissive: new THREE.Color(PALETTE.ember),
    emissiveIntensity: 0.35,
  });
  const ice = new THREE.MeshStandardMaterial({
    color: 0xb8e4f8,
    roughness: 0.22,
    metalness: 0.15,
    transparent: true,
    opacity: 0.78,
  });
  const sand = new THREE.MeshStandardMaterial({
    map: cloneRepeat(tex.rock, 1, 1),
    color: 0xc4a060,
    roughness: 0.86,
  });
  const voidMat = new THREE.MeshStandardMaterial({
    color: 0x6a48c0,
    roughness: 0.28,
    emissive: new THREE.Color(0x8866ff),
    emissiveIntensity: 0.4,
  });

  switch (prop) {
    case 'deadwood': {
      addBox(group, 0.7, 3.6, 0.7, bark, 0, 1.8, -0.4);
      addBox(group, 3.4, 0.38, 0.38, bark, 0.2, 2.6, -0.35).rotation.z = 0.35;
      addBox(group, 2.2, 0.28, 0.28, moss, -0.6, 1.7, -0.25).rotation.z = -0.55;
      addBox(group, 0.9, 0.7, 0.9, moss, 0, 0.28, -0.2);
      break;
    }
    case 'minecart': {
      addBox(group, 1.4, 0.55, 0.7, stone, 0, 0.55, -0.2);
      addBox(group, 1.55, 0.12, 0.78, wood, 0, 0.86, -0.2);
      const wheelL = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.12, 8), stone);
      wheelL.rotation.z = Math.PI / 2;
      wheelL.position.set(-0.45, 0.18, 0.18);
      const wheelR = wheelL.clone();
      wheelR.position.set(0.45, 0.18, 0.18);
      group.add(wheelL, wheelR);
      addBox(group, 0.18, 2.4, 0.18, wood, -1.1, 1.2, -0.45);
      addBox(group, 0.18, 2.4, 0.18, wood, 1.1, 1.2, -0.45);
      addBox(group, 2.4, 0.14, 0.14, wood, 0, 2.35, -0.45);
      break;
    }
    case 'wreck': {
      addBox(group, 3.6, 0.7, 1.1, wood, 0, 0.55, -0.35).rotation.z = -0.18;
      addBox(group, 0.22, 1.6, 0.9, wood, -1.2, 1.15, -0.3).rotation.z = 0.2;
      addBox(group, 0.22, 1.4, 0.7, wood, 0.9, 1.0, -0.25).rotation.z = -0.35;
      addBox(group, 1.1, 0.2, 0.2, wood, 0.2, 1.55, -0.2);
      break;
    }
    case 'cinder-arch': {
      addBox(group, 0.55, 2.6, 0.55, stone, -1.15, 1.3, -0.3);
      addBox(group, 0.55, 2.6, 0.55, stone, 1.15, 1.3, -0.3);
      addBox(group, 2.9, 0.4, 0.6, stone, 0, 2.7, -0.28);
      addBox(group, 0.28, 0.28, 0.28, ember, 0, 2.7, 0.12);
      break;
    }
    case 'boardwalk': {
      addBox(group, 3.2, 0.14, 0.9, wood, 0, 0.55, -0.15);
      addBox(group, 0.16, 0.7, 0.16, wood, -1.3, 0.28, 0.25);
      addBox(group, 0.16, 0.7, 0.16, wood, 1.3, 0.28, 0.25);
      addBox(group, 0.16, 1.4, 0.16, wood, -0.4, 1.0, -0.35);
      break;
    }
    case 'ice-span': {
      addBox(group, 3.4, 0.22, 0.7, ice, 0, 0.85, -0.2);
      addBox(group, 0.35, 1.1, 0.35, ice, -1.4, 0.45, -0.15);
      addBox(group, 0.35, 0.9, 0.35, ice, 1.35, 0.4, -0.15);
      break;
    }
    case 'dune-arch': {
      addBox(group, 0.7, 2.2, 0.7, sand, -1.2, 1.1, -0.3);
      addBox(group, 0.7, 2.2, 0.7, sand, 1.2, 1.1, -0.3);
      addBox(group, 2.6, 0.55, 0.7, sand, 0, 2.35, -0.28);
      break;
    }
    case 'idol-column': {
      addBox(group, 0.7, 2.8, 0.7, stone, 0, 1.4, -0.35);
      addBox(group, 0.9, 0.35, 0.9, stone, 0, 2.9, -0.35);
      addBox(group, 0.55, 0.45, 0.55, stone, 0, 3.25, -0.35);
      addBox(group, 0.22, 0.12, 0.4, ember, 0, 3.2, -0.02);
      break;
    }
    case 'hanging-tendril': {
      const ink = new THREE.MeshStandardMaterial({
        color: 0x4a3068,
        roughness: 0.55,
        emissive: new THREE.Color(0x8030c0),
        emissiveIntensity: 0.22,
      });
      for (const ox of [-0.7, 0, 0.75]) {
        const t = new THREE.Mesh(new THREE.ConeGeometry(0.12, 2.4, 5), ink);
        t.position.set(ox, 2.4, -0.25);
        t.rotation.z = ox * 0.12;
        t.castShadow = true;
        group.add(t);
      }
      break;
    }
    case 'dragon-rib': {
      addBox(group, 4.2, 0.28, 0.28, stone, 0, 2.4, -0.4).rotation.z = 0.12;
      addBox(group, 0.22, 2.0, 0.22, stone, -1.4, 1.3, -0.35).rotation.z = 0.25;
      addBox(group, 0.22, 2.2, 0.22, stone, -0.2, 1.35, -0.35).rotation.z = 0.05;
      addBox(group, 0.22, 1.8, 0.22, stone, 1.3, 1.2, -0.35).rotation.z = -0.2;
      break;
    }
    case 'rift-crystal': {
      const up = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.6, 5), voidMat);
      up.position.set(0, 1.4, -0.3);
      const dn = new THREE.Mesh(new THREE.ConeGeometry(0.28, 1.1, 5), voidMat);
      dn.position.set(0.45, 0.9, -0.15);
      dn.rotation.z = 0.4;
      group.add(up, dn);
      break;
    }
    case 'throne-stair': {
      addBox(group, 2.6, 0.28, 1.0, stone, 0, 0.28, -0.25);
      addBox(group, 2.1, 0.28, 1.0, stone, 0.15, 0.56, -0.25);
      addBox(group, 1.6, 0.28, 1.0, stone, 0.3, 0.84, -0.25);
      addBox(group, 0.9, 1.4, 0.7, stone, 0.45, 1.7, -0.3);
      break;
    }
    case 'ember-pyre': {
      addBox(group, 1.3, 0.35, 1.3, stone, 0, 0.22, -0.2);
      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 0.5, 8), stone);
      bowl.position.set(0, 0.62, -0.15);
      group.add(bowl);
      addBox(group, 0.35, 0.9, 0.35, ember, 0, 1.25, -0.1);
      break;
    }
    default:
      addBox(group, 0.8, 1.6, 0.8, stone, 0, 0.8, -0.3);
  }

  group.position.set(x, standY, 0);
  return group;
}
