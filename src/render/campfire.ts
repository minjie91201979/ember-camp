import * as THREE from 'three';
import { PALETTE } from './palette';
import { cloneRepeat, type P0Textures } from './textures';

export type CampfireView = {
  group: THREE.Group;
  tick: (time: number) => void;
};

function lin(hex: number): THREE.Color {
  return new THREE.Color(hex).convertSRGBToLinear();
}

export function createFlameMat(opacity: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    fog: false,
    blending: THREE.CustomBlending,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: opacity },
      uHot: { value: lin(PALETTE.sun) },
      uMid: { value: lin(PALETTE.ember) },
      uCool: { value: lin(PALETTE.gold) },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uOpacity;
      uniform vec3 uHot;
      uniform vec3 uMid;
      uniform vec3 uCool;
      varying vec2 vUv;
      void main() {
        float x = (vUv.x - 0.5) * 2.0;
        float y = vUv.y;
        float wobble = sin(uTime * 12.0 + y * 9.0) * 0.07 + sin(uTime * 7.3 + y * 4.0) * 0.05;
        float width = (1.0 - y) * 0.62 + 0.06;
        float body = smoothstep(width + wobble, width * 0.25, abs(x - wobble * 0.4));
        body *= smoothstep(0.0, 0.1, y) * smoothstep(1.0, 0.42, y);
        if (body < 0.02) discard;
        vec3 col = mix(uMid, uHot, smoothstep(0.15, 0.55, y));
        col = mix(col, uCool, smoothstep(0.62, 1.0, y));
        float alpha = body * uOpacity;
        gl_FragColor = vec4(col * alpha, alpha);
      }
    `,
  });
}

export function createCampfire(tex: P0Textures): CampfireView {
  const group = new THREE.Group();
  const rock = new THREE.MeshStandardMaterial({
    map: cloneRepeat(tex.rock, 1, 1),
    color: PALETTE.dummy,
    roughness: 0.92,
  });
  const wood = new THREE.MeshStandardMaterial({
    map: cloneRepeat(tex.wood, 1, 1),
    color: PALETTE.hunter,
    roughness: 0.78,
  });
  const coal = new THREE.MeshStandardMaterial({
    color: PALETTE.void,
    emissive: new THREE.Color(PALETTE.ember),
    emissiveIntensity: 0.9,
    roughness: 0.7,
  });

  const pit = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.12, 8), rock);
  pit.position.y = 0.06;
  pit.receiveShadow = true;
  group.add(pit);

  for (let i = 0; i < 7; i += 1) {
    const a = (i / 7) * Math.PI * 2;
    const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.11, 0), rock);
    stone.position.set(Math.cos(a) * 0.46, 0.1, Math.sin(a) * 0.32);
    stone.rotation.set(a, i * 0.7, a * 0.4);
    stone.scale.set(1.15, 0.7, 0.9);
    stone.castShadow = true;
    group.add(stone);
  }

  const logA = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 0.72, 6), wood);
  logA.rotation.z = Math.PI / 2;
  logA.rotation.y = 0.35;
  logA.position.set(0.02, 0.16, 0.04);
  logA.castShadow = true;
  const logB = logA.clone();
  logB.rotation.y = -0.9;
  logB.position.set(-0.04, 0.18, -0.02);
  const logC = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.5, 6), wood);
  logC.rotation.set(0.55, 0.2, 0.4);
  logC.position.set(0.08, 0.22, 0.02);
  logC.castShadow = true;
  group.add(logA, logB, logC);

  for (let i = 0; i < 5; i += 1) {
    const ember = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 5), coal);
    const a = (i / 5) * Math.PI * 2;
    ember.position.set(Math.cos(a) * 0.12, 0.14, Math.sin(a) * 0.08);
    group.add(ember);
  }

  const flameSpecs = [
    { w: 0.58, h: 0.92, x: 0, y: 0.62, z: 0.14, rot: 0, op: 0.95, speed: 1 },
    { w: 0.4, h: 0.78, x: 0.1, y: 0.54, z: 0.06, rot: 0.45, op: 0.7, speed: 1.2 },
    { w: 0.36, h: 0.7, x: -0.1, y: 0.5, z: 0.04, rot: -0.4, op: 0.65, speed: 0.85 },
    { w: 0.28, h: 0.58, x: 0.05, y: 0.46, z: -0.04, rot: 0.9, op: 0.55, speed: 1.35 },
    { w: 0.26, h: 0.52, x: -0.06, y: 0.44, z: 0.1, rot: -0.75, op: 0.5, speed: 1.5 },
    { w: 0.22, h: 0.64, x: 0.02, y: 0.68, z: 0.08, rot: 0.15, op: 0.6, speed: 1.7 },
  ];
  const flames = flameSpecs.map((spec, i) => {
    const mat = createFlameMat(spec.op);
    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(spec.w, spec.h), mat);
    sheet.position.set(spec.x, spec.y, spec.z);
    sheet.rotation.y = spec.rot;
    group.add(sheet);
    return { mat, speed: spec.speed, phase: i * 0.55 };
  });

  const poolMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    fog: false,
    blending: THREE.CustomBlending,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    uniforms: {
      uColor: { value: lin(PALETTE.ember) },
      uPulse: { value: 1 },
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
      uniform float uPulse;
      varying vec2 vUv;
      void main() {
        float d = length(vUv - 0.5) * 2.0;
        if (d > 0.98) discard;
        float a = exp(-d * d * 2.4) * 0.42 * uPulse;
        gl_FragColor = vec4(uColor * a, a);
      }
    `,
  });
  const pool = new THREE.Mesh(new THREE.CircleGeometry(2.4, 24), poolMat);
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = 0.08;
  group.add(pool);

  const glow = new THREE.PointLight(PALETTE.ember, 6.2, 18, 0.85);
  glow.position.set(0, 0.9, 0.85);
  group.add(glow);
  const fill = new THREE.PointLight(PALETTE.gold, 2.4, 10, 1.05);
  fill.position.set(0.1, 0.45, 1.4);
  group.add(fill);

  const sparks: THREE.Mesh[] = [];
  const sparkMat = new THREE.MeshBasicMaterial({
    color: PALETTE.gold,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  });
  for (let i = 0; i < 10; i += 1) {
    const spark = new THREE.Mesh(new THREE.SphereGeometry(0.018, 5, 4), sparkMat);
    spark.userData.phase = i * 0.62;
    group.add(spark);
    sparks.push(spark);
  }

  group.position.set(0.45, 1, 0.15);

  return {
    group,
    tick: (time: number) => {
      for (const flame of flames) {
        flame.mat.uniforms.uTime!.value = time * flame.speed + flame.phase;
      }
      const flicker = 0.82 + Math.sin(time * 17) * 0.1 + Math.sin(time * 29) * 0.06;
      glow.intensity = 5.8 * flicker;
      fill.intensity = 2.1 * flicker;
      poolMat.uniforms.uPulse!.value = flicker;
      coal.emissiveIntensity = 0.7 + flicker * 0.45;
      for (const spark of sparks) {
        const p = Number(spark.userData.phase);
        const t = (time * 0.55 + p) % 1.4;
        const spin = time * 1.8 + p;
        spark.position.set(Math.cos(spin) * 0.12, 0.28 + t * 0.85, Math.sin(spin) * 0.08);
        spark.scale.setScalar(Math.max(0.15, 1.1 - t * 0.7));
      }
    },
  };
}
