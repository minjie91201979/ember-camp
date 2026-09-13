import * as THREE from 'three';
import { WORLD } from '../game/config';
import type { PropView } from './camp-props';
import { PALETTE } from './palette';
import { cloneRepeat, type P0Textures } from './textures';

/** 试炼入口：红色椭圆魔法漩涡（与传送阵金色地台区分）。 */

function lin(hex: number): THREE.Color {
  return new THREE.Color(hex).convertSRGBToLinear();
}

function vortexMat(color: number, opacity: number, spin: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    fog: false,
    side: THREE.DoubleSide,
    blending: THREE.CustomBlending,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    uniforms: {
      uColor: { value: lin(color) },
      uOpacity: { value: opacity },
      uTime: { value: 0 },
      uSpin: { value: spin },
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
      uniform float uTime;
      uniform float uSpin;
      varying vec2 vUv;
      void main() {
        // 椭圆空间：压扁 y，做出竖椭圆门
        vec2 p = (vUv - 0.5) * vec2(1.15, 0.82);
        float d = length(p) * 2.0;
        if (d > 1.02) discard;
        float a = atan(p.y, p.x);
        float spiral = sin(a * 5.0 - d * 14.0 + uTime * uSpin);
        float arms = sin(a * 3.0 + uTime * uSpin * 0.55 - d * 6.0) * 0.5 + 0.5;
        float ring = smoothstep(0.16, 0.0, abs(d - 0.72 - spiral * 0.08));
        float core = exp(-d * d * 5.5);
        float rim = smoothstep(0.55, 1.0, d) * (1.0 - smoothstep(0.92, 1.02, d));
        float fall = 1.0 - smoothstep(0.78, 1.0, d);
        float alpha =
          (core * 0.7 + ring * 0.95 + arms * 0.28 + rim * 0.45) * uOpacity * fall;
        if (alpha < 0.012) discard;
        vec3 tint = uColor * (0.75 + arms * 0.45 + core * 0.35);
        gl_FragColor = vec4(tint * alpha, alpha);
      }
    `,
  });
}

export function createChallengePortal(tex: P0Textures, x = -2.6): PropView {
  const group = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({
    map: cloneRepeat(tex.rock, 1.4, 1.4),
    color: 0x3a4650,
    roughness: 0.88,
    metalness: 0.12,
  });
  const trim = new THREE.MeshStandardMaterial({
    color: PALETTE.ember,
    emissive: new THREE.Color(PALETTE.ember),
    emissiveIntensity: 0.95,
    roughness: 0.32,
    metalness: 0.35,
  });
  const frost = new THREE.MeshStandardMaterial({
    color: 0xe08a6a,
    emissive: new THREE.Color(PALETTE.ember),
    emissiveIntensity: 0.55,
    roughness: 0.4,
    metalness: 0.25,
  });

  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.86, 0.16, 12), stone);
  plinth.position.y = 0.08;
  plinth.receiveShadow = true;
  group.add(plinth);

  const ringFloor = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.03, 8, 28), trim);
  ringFloor.rotation.x = Math.PI / 2;
  ringFloor.position.y = 0.18;
  group.add(ringFloor);

  // 竖椭圆石框（压扁的环）
  const frame = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.055, 10, 36), stone);
  frame.scale.set(0.78, 1.12, 1);
  frame.position.set(0, 1.15, 0);
  frame.castShadow = true;
  group.add(frame);

  const frameInner = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.028, 8, 32), trim);
  frameInner.scale.set(0.78, 1.12, 1);
  frameInner.position.set(0, 1.15, 0.02);
  group.add(frameInner);

  const frameGlow = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.018, 8, 32), frost);
  frameGlow.scale.set(0.78, 1.12, 1);
  frameGlow.position.set(0, 1.15, -0.02);
  group.add(frameGlow);

  for (const side of [-1, 1] as const) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.05, 0.18), stone);
    pillar.position.set(side * 0.62, 0.62, -0.06);
    pillar.castShadow = true;
    group.add(pillar);
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.07, 0), trim);
    gem.position.set(side * 0.62, 1.2, -0.02);
    group.add(gem);
  }

  const swirl = vortexMat(PALETTE.ember, 1.05, 3.6);
  const portal = new THREE.Mesh(new THREE.CircleGeometry(0.72, 36), swirl);
  portal.scale.set(0.78, 1.12, 1);
  portal.position.set(0, 1.15, 0.04);
  group.add(portal);

  const back = vortexMat(0x8a3028, 0.55, -2.4);
  const veil = new THREE.Mesh(new THREE.CircleGeometry(0.72, 36), back);
  veil.scale.set(0.78, 1.12, 1);
  veil.position.set(0, 1.15, -0.04);
  group.add(veil);

  const mist = vortexMat(0xe29a46, 0.28, 1.8);
  const haze = new THREE.Mesh(new THREE.CircleGeometry(0.88, 28), mist);
  haze.scale.set(0.85, 1.2, 1);
  haze.position.set(0, 1.15, 0.01);
  group.add(haze);

  const motes: THREE.Mesh[] = [];
  const moteMat = new THREE.MeshBasicMaterial({
    color: PALETTE.ember,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  });
  for (let i = 0; i < 16; i += 1) {
    const mote = new THREE.Mesh(
      new THREE.SphereGeometry(0.02 + (i % 4) * 0.008, 6, 5),
      moteMat,
    );
    mote.userData.phase = i * 0.41;
    mote.userData.rx = 0.22 + (i % 5) * 0.07;
    mote.userData.ry = 0.32 + (i % 4) * 0.09;
    group.add(mote);
    motes.push(mote);
  }

  const light = new THREE.PointLight(PALETTE.ember, 2.8, 8, 1.15);
  light.position.set(0, 1.2, 0.55);
  group.add(light);

  group.position.set(x, WORLD.groundTop, 0.08);

  return {
    group,
    tick: (time: number) => {
      ringFloor.rotation.z = time * 0.55;
      frameInner.rotation.z = time * 0.4;
      frameGlow.rotation.z = -time * 0.65;
      swirl.uniforms.uTime!.value = time;
      back.uniforms.uTime!.value = time * 0.85;
      mist.uniforms.uTime!.value = time * 1.1;
      light.intensity = 2.35 + Math.sin(time * 2.4) * 0.45;
      for (const mote of motes) {
        const ph = mote.userData.phase as number;
        const rx = mote.userData.rx as number;
        const ry = mote.userData.ry as number;
        const ang = time * 1.35 + ph;
        mote.position.set(
          Math.cos(ang) * rx * 0.78,
          1.15 + Math.sin(ang * 1.15) * ry,
          Math.sin(ang * 0.7) * 0.12,
        );
        mote.scale.setScalar(0.75 + (Math.sin(time * 3 + ph) * 0.5 + 0.5) * 0.55);
      }
    },
  };
}
