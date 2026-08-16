import * as THREE from 'three';
import { PALETTE } from './palette';
import { cloneRepeat, type P0Textures } from './textures';

export type BannerView = {
  group: THREE.Group;
  tick: (time: number) => void;
};

export function createBanner(tex: P0Textures, x = 2.35): BannerView {
  const group = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({
    map: cloneRepeat(tex.wood, 1, 3),
    color: PALETTE.hunter,
    roughness: 0.84,
  });
  const metal = new THREE.MeshStandardMaterial({
    color: PALETTE.gold,
    emissive: new THREE.Color(PALETTE.gold),
    emissiveIntensity: 0.18,
    roughness: 0.4,
    metalness: 0.55,
  });

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 2.35, 6), wood);
  pole.position.y = 1.18;
  pole.castShadow = true;
  group.add(pole);

  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), metal);
  cap.position.y = 2.4;
  group.add(cap);
  const spike = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.16, 6), metal);
  spike.position.y = 2.52;
  group.add(spike);

  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1.15, 5), wood);
  arm.rotation.z = Math.PI / 2;
  arm.position.set(0.52, 2.28, 0);
  group.add(arm);

  const clothMat = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uMap: { value: tex.banner },
    },
    vertexShader: `
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 pos = position;
        float along = uv.x;
        float wave = sin(along * 5.6 - uTime * 3.8) * along * 0.16;
        float flutter = sin(uv.y * 7.2 + uTime * 5.1) * along * 0.07;
        float ripple = sin(along * 11.0 - uTime * 6.4 + uv.y * 3.0) * along * 0.04;
        pos.z += wave + ripple;
        pos.y += flutter;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uMap;
      varying vec2 vUv;
      void main() {
        vec4 c = texture2D(uMap, vUv);
        if (c.a < 0.12) discard;
        gl_FragColor = c;
      }
    `,
  });
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 1.35, 16, 12), clothMat);
  cloth.position.set(0.68, 1.58, 0.02);
  group.add(cloth);

  const tie = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.008, 6, 10), metal);
  tie.position.set(0.08, 2.2, 0);
  group.add(tie);

  group.position.set(x, 1, 0.22);

  return {
    group,
    tick: (time: number) => {
      clothMat.uniforms.uTime!.value = time;
    },
  };
}
