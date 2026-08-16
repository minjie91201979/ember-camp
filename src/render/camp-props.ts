import * as THREE from 'three';
import { createFlameMat } from './campfire';
import { PALETTE } from './palette';
import { cloneRepeat, type P0Textures } from './textures';

export type PropView = {
  group: THREE.Group;
  tick: (time: number) => void;
};

function woodMat(tex: P0Textures): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    map: cloneRepeat(tex.wood, 1, 1),
    color: PALETTE.hunter,
    roughness: 0.84,
  });
}

function stoneMat(tex: P0Textures): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    map: cloneRepeat(tex.rock, 1, 1),
    color: PALETTE.dummy,
    roughness: 0.9,
  });
}

function addFlame(
  group: THREE.Group,
  x: number,
  y: number,
  z: number,
  scale: number,
): THREE.ShaderMaterial[] {
  const mats = [createFlameMat(0.95), createFlameMat(0.55)];
  const a = new THREE.Mesh(new THREE.PlaneGeometry(0.28 * scale, 0.42 * scale), mats[0]);
  a.position.set(x, y, z);
  const b = new THREE.Mesh(new THREE.PlaneGeometry(0.2 * scale, 0.34 * scale), mats[1]);
  b.position.set(x + 0.03, y - 0.02, z - 0.04);
  b.rotation.y = 0.5;
  group.add(a, b);
  return mats;
}

export function createForge(tex: P0Textures): PropView {
  const group = new THREE.Group();
  const wood = woodMat(tex);
  const stone = stoneMat(tex);
  const iron = new THREE.MeshStandardMaterial({
    color: PALETTE.mossDark,
    metalness: 0.55,
    roughness: 0.4,
  });
  const coal = new THREE.MeshStandardMaterial({
    color: PALETTE.void,
    emissive: new THREE.Color(PALETTE.ember),
    emissiveIntensity: 1.1,
    roughness: 0.7,
  });

  const hearth = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.7, 0.85), stone);
  hearth.position.set(0.15, 0.35, -0.1);
  hearth.castShadow = true;
  group.add(hearth);

  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.32, 0.2), coal);
  mouth.position.set(0.15, 0.38, 0.34);
  group.add(mouth);

  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.85, 0.32), stone);
  chimney.position.set(0.15, 0.95, -0.18);
  chimney.castShadow = true;
  group.add(chimney);

  const anvilBase = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.28, 0.22), wood);
  anvilBase.position.set(-0.62, 0.14, 0.12);
  const anvil = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.2), iron);
  anvil.position.set(-0.62, 0.36, 0.12);
  const horn = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.1), iron);
  horn.position.set(-0.88, 0.36, 0.12);
  group.add(anvilBase, anvil, horn);

  const bench = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.36), wood);
  bench.position.set(0.85, 0.42, 0.1);
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.38, 0.08), wood);
  legL.position.set(0.58, 0.19, 0.18);
  const legR = legL.clone();
  legR.position.set(1.08, 0.19, 0.02);
  group.add(bench, legL, legR);

  const flames = addFlame(group, 0.15, 0.62, 0.42, 0.85);
  const glow = new THREE.PointLight(PALETTE.ember, 3.4, 11, 1);
  glow.position.set(0.2, 0.7, 0.7);
  group.add(glow);

  group.position.set(4.15, 1, -0.15);

  return {
    group,
    tick: (time: number) => {
      flames[0]!.uniforms.uTime!.value = time;
      flames[1]!.uniforms.uTime!.value = time * 1.2 + 0.4;
      const flicker = 0.85 + Math.sin(time * 14) * 0.08 + Math.sin(time * 23) * 0.05;
      glow.intensity = 3.2 * flicker;
      coal.emissiveIntensity = 0.85 + flicker * 0.4;
    },
  };
}

export function createStall(tex: P0Textures): PropView {
  const group = new THREE.Group();
  const wood = woodMat(tex);
  const clothMat = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(PALETTE.gold) },
      uTrim: { value: new THREE.Color(PALETTE.ember) },
    },
    vertexShader: `
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 pos = position;
        float w = sin(uv.x * 4.5 + uTime * 1.6) * uv.y * 0.05;
        pos.z += w;
        pos.y += sin(uv.x * 3.0 + uTime * 1.2) * 0.02;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform vec3 uTrim;
      varying vec2 vUv;
      void main() {
        float stripe = step(0.5, fract(vUv.x * 5.0));
        gl_FragColor = vec4(mix(uColor, uTrim, stripe * 0.55), 1.0);
      }
    `,
  });

  const posts = [
    [-0.7, 0.55],
    [0.7, 0.55],
    [-0.7, -0.25],
    [0.7, -0.25],
  ] as const;
  for (const [x, z] of posts) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 1.15, 6), wood);
    post.position.set(x, 0.58, z);
    post.castShadow = true;
    group.add(post);
  }

  const counter = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.1, 0.55), wood);
  counter.position.set(0, 0.62, 0.22);
  counter.castShadow = true;
  group.add(counter);

  const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 0.28), wood);
  shelf.position.set(0, 0.95, -0.12);
  group.add(shelf);

  const canopy = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.05, 8, 4), clothMat);
  canopy.rotation.x = -0.55;
  canopy.position.set(0, 1.28, 0.05);
  group.add(canopy);

  const crate = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.22, 0.22), wood);
  crate.position.set(-0.42, 0.78, 0.22);
  const jug = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.08, 0.18, 6),
    new THREE.MeshStandardMaterial({ color: PALETTE.ember, roughness: 0.6 }),
  );
  jug.position.set(0.35, 0.78, 0.2);
  const sack = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 6, 5),
    new THREE.MeshStandardMaterial({ color: PALETTE.gold, roughness: 0.85 }),
  );
  sack.scale.set(1.1, 0.7, 0.9);
  sack.position.set(0.08, 0.74, 0.18);
  group.add(crate, jug, sack);

  group.position.set(6.6, 1, -0.2);

  return {
    group,
    tick: (time: number) => {
      clothMat.uniforms.uTime!.value = time;
    },
  };
}

export function createTorch(tex: P0Textures, x: number): PropView {
  const group = new THREE.Group();
  const wood = woodMat(tex);
  const iron = new THREE.MeshStandardMaterial({
    color: PALETTE.mossDark,
    metalness: 0.4,
    roughness: 0.5,
  });
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.15, 6), wood);
  post.position.y = 0.58;
  post.castShadow = true;
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.06, 0.1, 6), iron);
  bowl.position.y = 1.18;
  group.add(post, bowl);
  const flames = addFlame(group, 0, 1.38, 0.06, 0.7);
  const glow = new THREE.PointLight(PALETTE.ember, 2.2, 8, 1.1);
  glow.position.set(0, 1.35, 0.35);
  group.add(glow);
  group.position.set(x, 1, 0.12);

  return {
    group,
    tick: (time: number) => {
      flames[0]!.uniforms.uTime!.value = time * 1.1 + x;
      flames[1]!.uniforms.uTime!.value = time * 1.4 + x * 0.3;
      glow.intensity = 1.8 + Math.sin(time * 16 + x) * 0.25;
    },
  };
}
