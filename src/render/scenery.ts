import * as THREE from 'three';
import type { Rect } from '../game/types';
import { PALETTE } from './palette';
import type { P0Textures } from './textures';

function hash(seed: number): number {
  const n = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function tint(map: THREE.Texture, color: number, opts?: { fog?: boolean; rough?: number }): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    map,
    color,
    roughness: opts?.rough ?? 0.88,
    metalness: 0.02,
    fog: opts?.fog ?? true,
  });
}

function mesh(
  geo: THREE.BufferGeometry,
  material: THREE.Material,
  x: number,
  y: number,
  z: number,
): THREE.Mesh {
  const item = new THREE.Mesh(geo, material);
  item.position.set(x, y, z);
  item.castShadow = true;
  item.receiveShadow = true;
  return item;
}

function skyLin(hex: number): THREE.Color {
  return new THREE.Color(hex).convertSRGBToLinear();
}

export function createCelestialGlow(
  color: number,
  size: number,
  core: number,
): THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial> {
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    fog: false,
    blending: THREE.CustomBlending,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    uniforms: {
      uColor: { value: new THREE.Color(color).convertSRGBToLinear() },
      uIntensity: { value: 1 },
      uCore: { value: core },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uIntensity;
      uniform float uCore;
      varying vec2 vUv;
      void main() {
        float d = length(vUv - 0.5) * 2.0;
        if (d > 0.96) discard;
        float fall = 1.0 - smoothstep(0.62, 0.94, d);
        float hot = exp(-d * d * uCore);
        float halo = exp(-d * d * 5.2);
        float alpha = (hot * 1.15 + halo * 0.18) * uIntensity * fall;
        if (alpha < 0.01) discard;
        vec3 col = mix(uColor, vec3(1.0), hot * 0.55);
        gl_FragColor = vec4(col * alpha, alpha);
      }
    `,
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(size, size), material);
}

export function createSkyGroup(): {
  group: THREE.Group;
  material: THREE.ShaderMaterial;
} {
  const group = new THREE.Group();
  const material = new THREE.ShaderMaterial({
    fog: false,
    depthWrite: false,
    uniforms: {
      uDay: { value: 1 },
      uDayTop: { value: skyLin(PALETTE.skyDayTop) },
      uDayBottom: { value: skyLin(PALETTE.skyDayBottom) },
      uNightTop: { value: skyLin(PALETTE.skyNightTop) },
      uNightBottom: { value: skyLin(PALETTE.skyNightBottom) },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uDay;
      uniform vec3 uDayTop;
      uniform vec3 uDayBottom;
      uniform vec3 uNightTop;
      uniform vec3 uNightBottom;
      varying vec2 vUv;
      void main() {
        float t = smoothstep(1.0, 0.0, vUv.y);
        vec3 dayCol = mix(uDayTop, uDayBottom, t);
        vec3 nightCol = mix(uNightTop, uNightBottom, t);
        gl_FragColor = vec4(mix(nightCol, dayCol, uDay), 1.0);
      }
    `,
  });
  const dome = new THREE.Mesh(new THREE.PlaneGeometry(160, 90), material);
  dome.position.z = -62;
  group.add(dome);
  return { group, material };
}

export function createMountain(seed: number, rock: THREE.Texture): THREE.Group {
  const group = new THREE.Group();
  const h = 2.5 + hash(seed) * 1.35;
  const r = 1.55 + hash(seed + 1) * 1.15;
  const mat = tint(rock, 0xc8cfc6, { fog: true, rough: 0.94 });
  const peak = mesh(new THREE.ConeGeometry(r, h, 5), mat, 0, h / 2, 0);
  peak.rotation.y = hash(seed + 2) * Math.PI;
  group.add(peak);
  const footing = mesh(
    new THREE.CylinderGeometry(r * 1.25, r * 2.55, 3.2, 6),
    mat,
    0,
    -1.55,
    0,
  );
  group.add(footing);
  const skirt = mesh(
    new THREE.CylinderGeometry(r * 2.2, r * 3.2, 1.4, 6),
    mat,
    0,
    -2.85,
    0,
  );
  group.add(skirt);
  if (hash(seed + 3) > 0.35) {
    const side = mesh(
      new THREE.ConeGeometry(r * 0.55, h * 0.62, 5),
      mat,
      r * 0.45,
      h * 0.31,
      -0.4,
    );
    side.rotation.y = 0.8;
    group.add(side);
  }
  return group;
}

export function createFarPeak(seed: number, rock: THREE.Texture): THREE.Group {
  const group = new THREE.Group();
  const slope = Math.tan((30 * Math.PI) / 180);
  const h = 7.2 + hash(seed) * 2.6;
  const r = h / slope;
  const footH = 2.4;
  const mat = tint(rock, 0xb4bec0, { fog: true, rough: 0.96 });
  const peak = mesh(new THREE.ConeGeometry(r, h, 5), mat, 0, h / 2, 0);
  peak.rotation.y = hash(seed + 2) * Math.PI;
  group.add(peak);
  const footing = mesh(
    new THREE.CylinderGeometry(r, (h + footH) / slope, footH, 6),
    mat,
    0,
    -footH / 2,
    0,
  );
  group.add(footing);
  if (hash(seed + 3) > 0.28) {
    const sideH = h * (0.55 + hash(seed + 4) * 0.2);
    const sideR = sideH / slope;
    const side = mesh(
      new THREE.ConeGeometry(sideR, sideH, 5),
      mat,
      r * 0.42,
      sideH / 2,
      -0.35,
    );
    group.add(side);
  }
  return group;
}

export function buildFarPeakRange(rock: THREE.Texture): THREE.Group {
  const group = new THREE.Group();
  const spots = [-20, -4, 14, 32];
  for (const [i, x] of spots.entries()) {
    const peak = createFarPeak(i + 70, rock);
    peak.position.set(x + hash(i + 8) * 1.8, 0.4, (i % 2) * 1.4 - 0.7);
    group.add(peak);
  }
  return group;
}

export function createPine(scale: number, bark: THREE.Texture, leaf: THREE.Texture): THREE.Group {
  const group = new THREE.Group();
  const trunk = mesh(
    new THREE.CylinderGeometry(0.08 * scale, 0.12 * scale, 0.9 * scale, 5),
    tint(bark, 0xb08a68, { rough: 0.9 }),
    0,
    0.45 * scale,
    0,
  );
  group.add(trunk);
  const leafMat = tint(leaf, 0x8fa888, { rough: 0.82 });
  for (let i = 0; i < 3; i += 1) {
    const coneH = (1.1 - i * 0.18) * scale;
    const cone = mesh(
      new THREE.ConeGeometry((0.55 - i * 0.08) * scale, coneH, 6),
      leafMat,
      0,
      (0.85 + i * 0.42) * scale,
      0,
    );
    group.add(cone);
  }
  return group;
}

export function createBigTree(scale: number, bark: THREE.Texture, leaf: THREE.Texture): THREE.Group {
  const group = new THREE.Group();
  const trunk = mesh(
    new THREE.CylinderGeometry(0.16 * scale, 0.24 * scale, 2.1 * scale, 6),
    tint(bark, 0xc4a07a, { rough: 0.88 }),
    0,
    1.05 * scale,
    0,
  );
  group.add(trunk);
  const leafMat = tint(leaf, 0x9aaa90, { rough: 0.8 });
  const crowns: Array<[number, number, number, number]> = [
    [0, 2.35, 0, 0.95],
    [-0.45, 2.1, 0.2, 0.62],
    [0.5, 2.15, -0.15, 0.58],
    [0.1, 2.85, 0.1, 0.5],
  ];
  for (const [x, y, z, r] of crowns) {
    group.add(mesh(new THREE.SphereGeometry(r * scale, 8, 6), leafMat, x * scale, y * scale, z * scale));
  }
  return group;
}

export function createGrassClump(seed: number, grass: THREE.Texture): THREE.Group {
  const group = new THREE.Group();
  const mat = tint(grass, 0x8a9a7c, { rough: 0.85, fog: false });
  const count = 5 + Math.floor(hash(seed) * 4);
  for (let i = 0; i < count; i += 1) {
    const h = 0.22 + hash(seed + i) * 0.28;
    const blade = mesh(
      new THREE.ConeGeometry(0.05, h, 4),
      mat,
      (hash(seed + i + 9) - 0.5) * 0.35,
      h / 2,
      (hash(seed + i + 17) - 0.5) * 0.28,
    );
    blade.rotation.z = (hash(seed + i + 3) - 0.5) * 0.4;
    group.add(blade);
  }
  return group;
}

export function createStone(seed: number, rock: THREE.Texture): THREE.Group {
  const group = new THREE.Group();
  const mat = tint(rock, 0xb8b8b0, { rough: 0.92, fog: false });
  const s = 0.18 + hash(seed) * 0.28;
  const stone = mesh(new THREE.DodecahedronGeometry(s, 0), mat, 0, s * 0.55, 0);
  stone.rotation.set(hash(seed + 1), hash(seed + 2) * 6, hash(seed + 3));
  stone.scale.set(1.2, 0.7 + hash(seed + 4) * 0.4, 1);
  group.add(stone);
  if (hash(seed + 5) > 0.55) {
    const pebble = mesh(
      new THREE.DodecahedronGeometry(s * 0.45, 0),
      mat,
      s * 0.7,
      s * 0.25,
      0.05,
    );
    group.add(pebble);
  }
  return group;
}

export function buildHorizonRidge(ground: THREE.Texture, rock: THREE.Texture): THREE.Group {
  const group = new THREE.Group();
  const soil = tint(ground, 0x9aa090, { rough: 0.94 });
  const stone = tint(rock, 0x8a9088, { rough: 0.93 });
  const band = mesh(new THREE.BoxGeometry(110, 8, 7), soil, 8, -3, 0);
  group.add(band);
  const cap = mesh(new THREE.BoxGeometry(110, 0.35, 7.1), stone, 8, 1.08, 0);
  group.add(cap);
  for (let i = 0; i < 14; i += 1) {
    const mound = mesh(
      new THREE.SphereGeometry(1.1 + hash(i + 70) * 1.3, 6, 4, 0, Math.PI * 2, 0, Math.PI * 0.5),
      soil,
      -20 + i * 7.2 + hash(i) * 1.2,
      0.95,
      (i % 3) * 0.8 - 0.8,
    );
    mound.scale.set(1.6, 0.45 + hash(i + 2) * 0.25, 1.1);
    group.add(mound);
  }
  return group;
}

export function createHill(seed: number, rock: THREE.Texture): THREE.Group {
  const group = new THREE.Group();
  const h = 0.55 + hash(seed) * 0.5;
  const r = 2.4 + hash(seed + 1) * 1.5;
  const mat = tint(rock, 0xa8b09c, { fog: true, rough: 0.95 });
  const dome = mesh(
    new THREE.SphereGeometry(r, 7, 5, 0, Math.PI * 2, 0, Math.PI * 0.52),
    mat,
    0,
    h * 0.2,
    0,
  );
  dome.scale.set(1.25, 0.32 + hash(seed + 2) * 0.12, 1);
  group.add(dome);
  return group;
}

function createMistMaterial(opacity: number, color = PALETTE.moonlight): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    fog: false,
    blending: THREE.CustomBlending,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    uniforms: {
      uColor: { value: new THREE.Color(color).convertSRGBToLinear() },
      uOpacity: { value: opacity },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec2 vUv;
      void main() {
        vec2 p = (vUv - 0.5) * vec2(1.0, 1.15);
        float d = length(p) * 2.0;
        if (d > 0.96) discard;
        float fall = 1.0 - smoothstep(0.7, 0.95, d);
        float alpha = exp(-d * d * 4.2) * uOpacity * fall;
        if (alpha < 0.008) discard;
        gl_FragColor = vec4(uColor * alpha, alpha);
      }
    `,
  });
}

export function createSkyCloud(seed: number): THREE.Group {
  const group = new THREE.Group();
  const kind = hash(seed);
  const mat = createMistMaterial(0.18 + hash(seed + 2) * 0.14, PALETTE.moonlight);
  if (kind < 0.3) {
    const n = 2 + Math.floor(hash(seed + 3) * 3);
    for (let i = 0; i < n; i += 1) {
      const w = 3.4 + hash(seed + i + 4) * 4.2;
      const puff = new THREE.Mesh(new THREE.PlaneGeometry(w, w * (0.22 + hash(seed + i + 6) * 0.12)), mat);
      puff.position.set((i - (n - 1) * 0.5) * w * 0.42, hash(seed + i + 8) * 0.25, (hash(seed + i) - 0.5) * 0.4);
      puff.rotation.z = (hash(seed + i + 9) - 0.5) * 0.12;
      group.add(puff);
    }
  } else if (kind < 0.62) {
    const n = 4 + Math.floor(hash(seed + 3) * 4);
    for (let i = 0; i < n; i += 1) {
      const s = 1.6 + hash(seed + i + 4) * 2.2;
      const puff = new THREE.Mesh(new THREE.PlaneGeometry(s, s * (0.45 + hash(seed + i + 5) * 0.25)), mat);
      puff.position.set(
        (hash(seed + i + 11) - 0.5) * 3.8,
        (hash(seed + i + 13) - 0.15) * 1.3,
        (hash(seed + i + 17) - 0.5) * 0.6,
      );
      puff.rotation.z = (hash(seed + i + 21) - 0.5) * 0.28;
      group.add(puff);
    }
  } else if (kind < 0.84) {
    const n = 3 + Math.floor(hash(seed + 3) * 3);
    for (let i = 0; i < n; i += 1) {
      const w = 2.4 + hash(seed + i + 4) * 2.8;
      const puff = new THREE.Mesh(new THREE.PlaneGeometry(w, w * (0.18 + hash(seed + i + 6) * 0.2)), mat);
      puff.position.set(
        (hash(seed + i + 11) - 0.5) * 4.4,
        (hash(seed + i + 13) - 0.5) * 0.7,
        (hash(seed + i + 17) - 0.5) * 0.5,
      );
      puff.rotation.z = (hash(seed + i + 21) - 0.5) * 0.55;
      group.add(puff);
    }
  } else {
    const s = 1.1 + hash(seed + 4) * 1.4;
    const puff = new THREE.Mesh(new THREE.PlaneGeometry(s, s * 0.4), mat);
    puff.rotation.z = (hash(seed + 7) - 0.5) * 0.4;
    group.add(puff);
  }
  return group;
}

export function buildSkyClouds(): THREE.Group {
  const group = new THREE.Group();
  const spots = [-38, -32, -25, -20, -14, -8, -2, 3, 9, 15, 21, 27, 34, 40, 47];
  for (const [i, x] of spots.entries()) {
    const cloud = createSkyCloud(i + 210);
    const y = hash(i + 4) * 2.8;
    cloud.position.set(x + (hash(i + 8) - 0.5) * 2.4, y, (hash(i + 12) - 0.5) * 2.2);
    cloud.scale.setScalar(0.55 + hash(i + 16) * 1.65);
    cloud.userData.baseY = cloud.position.y;
    group.add(cloud);
  }
  return group;
}

export function createCloud(seed: number): THREE.Group {
  const group = new THREE.Group();
  const mat = createMistMaterial(0.09 + hash(seed) * 0.07);
  const puffs = 4 + Math.floor(hash(seed + 1) * 3);
  for (let i = 0; i < puffs; i += 1) {
    const s = 2.2 + hash(seed + i + 4) * 2.4;
    const puff = new THREE.Mesh(new THREE.PlaneGeometry(s, s * 0.55), mat);
    puff.position.set(
      (hash(seed + i + 11) - 0.5) * 3.6,
      (hash(seed + i + 13) - 0.5) * 0.4,
      (hash(seed + i + 17) - 0.5) * 1.4,
    );
    puff.rotation.z = (hash(seed + i + 21) - 0.5) * 0.35;
    group.add(puff);
  }
  return group;
}

export function buildMountainRange(rock: THREE.Texture): THREE.Group {
  const group = new THREE.Group();
  const spots = [-24, -12, 0, 12, 24, 36];
  for (const [i, x] of spots.entries()) {
    const mountain = createMountain(i + 1, rock);
    mountain.position.set(x + hash(i + 20) * 1.1, 0, (i % 2) * 0.8 - 0.4);
    group.add(mountain);
  }
  return group;
}

export function buildHillRange(rock: THREE.Texture): THREE.Group {
  const group = new THREE.Group();
  const spots = [-18, -6, 6, 18, 30];
  for (const [i, x] of spots.entries()) {
    const hill = createHill(i + 40, rock);
    hill.position.set(x + (hash(i + 55) - 0.5) * 1.2, 0.2, (i % 2) * 0.9 - 0.3);
    group.add(hill);
  }
  return group;
}

export function buildMountainMist(): THREE.Group {
  const group = new THREE.Group();
  const spots = [
    [-18, 1.15, -0.4],
    [-12, 1.7, 0.3],
    [-6, 1.05, 0.5],
    [0, 1.85, -0.3],
    [6, 1.1, 0.4],
    [12, 1.75, -0.2],
    [18, 1.05, 0.5],
    [24, 1.8, -0.4],
    [30, 1.1, 0.3],
    [36, 1.7, -0.2],
  ] as const;
  for (const [i, [x, y, z]] of spots.entries()) {
    const cloud = createCloud(i + 90);
    cloud.position.set(x + hash(i + 3) * 0.8, y, z);
    cloud.userData.baseY = y;
    group.add(cloud);
  }
  return group;
}

export function buildForestBelt(bark: THREE.Texture, leaf: THREE.Texture): THREE.Group {
  const group = new THREE.Group();
  for (let i = 0; i < 36; i += 1) {
    const pine = createPine(0.55 + hash(i + 40) * 0.55, bark, leaf);
    pine.position.set(-18 + i * 1.7 + hash(i) * 0.6, 0, (i % 4) * 0.7 - 1);
    group.add(pine);
  }
  return group;
}

export function scatterGroundDressing(
  platforms: Rect[],
  tex: P0Textures,
): THREE.Group {
  const group = new THREE.Group();
  let seed = 80;
  for (const plat of platforms) {
    if (plat.y > 0 || plat.h < 0.8) {
      continue;
    }
    const treeCount = Math.max(1, Math.floor(plat.w / 5.5));
    for (let i = 0; i < treeCount; i += 1) {
      seed += 1;
      const tree = createBigTree(0.85 + hash(seed) * 0.45, tex.bark, tex.leaf);
      const x = plat.x + 1.2 + (i + 0.3) * (plat.w / (treeCount + 0.4));
      tree.position.set(x, 1, -0.85 - hash(seed + 1) * 0.15);
      group.add(tree);
    }
    const grassCount = Math.max(3, Math.floor(plat.w / 1.6));
    for (let i = 0; i < grassCount; i += 1) {
      seed += 1;
      const clump = createGrassClump(seed, tex.grass);
      clump.position.set(plat.x + 0.6 + i * (plat.w / grassCount), 1, (hash(seed) - 0.5) * 1.1);
      group.add(clump);
    }
    const rockCount = Math.max(1, Math.floor(plat.w / 3.2));
    for (let i = 0; i < rockCount; i += 1) {
      seed += 1;
      const stone = createStone(seed, tex.rock);
      stone.position.set(
        plat.x + 0.8 + hash(seed + 8) * (plat.w - 1.6),
        1,
        (hash(seed + 9) - 0.5) * 0.9,
      );
      group.add(stone);
    }
  }
  const fgTrees = [-1.4, 15.2, 24.6, 37.5];
  for (const [i, x] of fgTrees.entries()) {
    const tree = createBigTree(1.15 + hash(i + 200) * 0.25, tex.bark, tex.leaf);
    tree.position.set(x, 1, 1.15);
    group.add(tree);
  }
  return group;
}
