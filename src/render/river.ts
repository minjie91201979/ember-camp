import * as THREE from 'three';
import { PALETTE } from './palette';
import { cloneRepeat, type P0Textures } from './textures';

function lin(hex: number): THREE.Color {
  return new THREE.Color(hex).convertSRGBToLinear();
}

function createWaterMaterial(alpha: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    fog: false,
    uniforms: {
      uTime: { value: 0 },
      uDeep: { value: lin(PALETTE.fog) },
      uShallow: { value: lin(PALETTE.mage) },
      uFoam: { value: lin(PALETTE.moonlight) },
      uAlpha: { value: alpha },
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
      uniform vec3 uDeep;
      uniform vec3 uShallow;
      uniform vec3 uFoam;
      uniform float uAlpha;
      varying vec2 vUv;
      void main() {
        float flow = vUv.x - uTime * 0.28;
        float band = sin(flow * 16.0 + vUv.y * 3.0) * 0.5 + 0.5;
        float ripple = sin(vUv.y * 20.0 + uTime * 3.4 + flow * 7.0) * 0.5 + 0.5;
        float spark = sin((vUv.x * 9.0 - uTime * 1.6) + ripple * 4.0) * 0.5 + 0.5;
        vec3 col = mix(uDeep, uShallow, band * 0.55 + ripple * 0.35);
        col = mix(col, uFoam, spark * 0.18);
        float edge = 1.0 - smoothstep(0.0, 0.1, vUv.y) * smoothstep(1.0, 0.9, vUv.y);
        col = mix(col, uFoam, edge * 0.35);
        gl_FragColor = vec4(col, uAlpha);
      }
    `,
  });
}

export function createRiver(
  x: number,
  w: number,
  tex: P0Textures,
): { group: THREE.Group; mats: THREE.ShaderMaterial[] } {
  const group = new THREE.Group();
  const cx = x + w / 2;
  const frontMat = createWaterMaterial(0.92);
  const topMat = createWaterMaterial(0.78);
  const streakMat = createWaterMaterial(0.35);

  const front = new THREE.Mesh(new THREE.PlaneGeometry(w, 9.2), frontMat);
  front.position.set(cx, -3.85, 3.46);
  group.add(front);

  const top = new THREE.Mesh(new THREE.PlaneGeometry(w, 2.6), topMat);
  top.rotation.x = -Math.PI / 2;
  top.position.set(cx, 0.52, 0.15);
  group.add(top);

  const streak = new THREE.Mesh(new THREE.PlaneGeometry(w, 8.6), streakMat);
  streak.position.set(cx, -3.7, 3.5);
  group.add(streak);

  const bed = new THREE.Mesh(
    new THREE.BoxGeometry(w, 0.35, 2.8),
    new THREE.MeshStandardMaterial({
      color: PALETTE.mossDark,
      roughness: 1,
    }),
  );
  bed.position.set(cx, -4.4, 0.2);
  group.add(bed);

  const bank = new THREE.MeshStandardMaterial({
    map: cloneRepeat(tex.moss, 1, 2),
    color: PALETTE.moss,
    roughness: 0.9,
  });
  const left = new THREE.Mesh(new THREE.BoxGeometry(0.32, 5.4, 2.6), bank);
  left.position.set(x + 0.14, -1.6, 0.2);
  const right = new THREE.Mesh(new THREE.BoxGeometry(0.32, 5.4, 2.6), bank);
  right.position.set(x + w - 0.14, -1.6, 0.2);
  group.add(left, right);

  const glow = new THREE.PointLight(PALETTE.mage, 1.6, 8, 1.3);
  glow.position.set(cx, 0.8, 1.4);
  group.add(glow);

  return { group, mats: [frontMat, topMat, streakMat] };
}

export function tickRiver(mats: THREE.ShaderMaterial[], time: number): void {
  for (const mat of mats) {
    mat.uniforms.uTime!.value = time;
  }
}
