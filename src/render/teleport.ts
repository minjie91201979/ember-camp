import * as THREE from 'three';
import { PALETTE } from './palette';
import { cloneRepeat, type P0Textures } from './textures';

export type TeleportView = {
  group: THREE.Group;
  tick: (time: number) => void;
};

function cssHex(hex: number): string {
  return `#${hex.toString(16).padStart(6, '0')}`;
}

function lin(hex: number): THREE.Color {
  return new THREE.Color(hex).convertSRGBToLinear();
}

function makeRuneMap(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('无法创建符文贴图');
  }
  ctx.clearRect(0, 0, 256, 256);
  ctx.strokeStyle = cssHex(PALETTE.gold);
  ctx.fillStyle = cssHex(PALETTE.gold);
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(128, 128, 108, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(128, 128, 72, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2;
    const x = 128 + Math.cos(a) * 90;
    const y = 128 + Math.sin(a) * 90;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a + Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(0, 10);
    ctx.moveTo(-7, -3);
    ctx.lineTo(0, 4);
    ctx.lineTo(7, -3);
    ctx.stroke();
    ctx.restore();
  }
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  return map;
}

function glowMat(color: number, opacity: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    fog: false,
    blending: THREE.CustomBlending,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    uniforms: {
      uColor: { value: lin(color) },
      uOpacity: { value: opacity },
      uTime: { value: 0 },
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
      varying vec2 vUv;
      void main() {
        vec2 p = vUv - 0.5;
        float d = length(p) * 2.0;
        if (d > 0.98) discard;
        float a = atan(p.y, p.x);
        float swirl = sin(a * 7.0 + d * 10.0 - uTime * 3.4);
        float ring = smoothstep(0.22, 0.0, abs(d - 0.62 - swirl * 0.06));
        float core = exp(-d * d * 4.2);
        float fall = 1.0 - smoothstep(0.7, 0.96, d);
        float alpha = (core * 0.55 + ring * 0.85 + (swirl * 0.5 + 0.5) * 0.12) * uOpacity * fall;
        if (alpha < 0.01) discard;
        gl_FragColor = vec4(uColor * alpha, alpha);
      }
    `,
  });
}

export function createTeleport(tex: P0Textures, x = -4.4): TeleportView {
  const group = new THREE.Group();
  const runes = makeRuneMap();
  const stone = new THREE.MeshStandardMaterial({
    map: cloneRepeat(tex.rock, 2, 2),
    color: PALETTE.mossDark,
    roughness: 0.9,
    metalness: 0.08,
  });
  const gold = new THREE.MeshStandardMaterial({
    color: PALETTE.gold,
    emissive: new THREE.Color(PALETTE.gold),
    emissiveIntensity: 0.7,
    roughness: 0.35,
    metalness: 0.45,
  });
  const mage = new THREE.MeshStandardMaterial({
    color: PALETTE.mage,
    emissive: new THREE.Color(PALETTE.mage),
    emissiveIntensity: 0.85,
    roughness: 0.3,
    metalness: 0.2,
  });

  const dais = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.18, 0.2, 10), stone);
  dais.position.y = 0.1;
  dais.receiveShadow = true;
  group.add(dais);

  const well = new THREE.Mesh(
    new THREE.CylinderGeometry(0.62, 0.7, 0.08, 10),
    new THREE.MeshStandardMaterial({
      color: PALETTE.void,
      emissive: new THREE.Color(PALETTE.mage),
      emissiveIntensity: 0.35,
      roughness: 0.8,
    }),
  );
  well.position.y = 0.2;
  group.add(well);

  const floorRunes = new THREE.Mesh(
    new THREE.CircleGeometry(0.92, 24),
    new THREE.MeshBasicMaterial({
      map: runes,
      transparent: true,
      depthWrite: false,
      color: PALETTE.gold,
    }),
  );
  floorRunes.rotation.x = -Math.PI / 2;
  floorRunes.position.y = 0.22;
  group.add(floorRunes);

  for (let i = 0; i < 4; i += 1) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.42, 0.14), stone);
    post.position.set(Math.cos(a) * 0.92, 0.32, Math.sin(a) * 0.55);
    post.castShadow = true;
    group.add(post);
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.07, 0), mage);
    gem.position.set(post.position.x, 0.58, post.position.z);
    group.add(gem);
  }

  const ringA = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.035, 8, 28), gold);
  ringA.rotation.x = Math.PI / 2;
  ringA.position.y = 0.28;
  group.add(ringA);

  const ringB = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.028, 8, 24), mage);
  ringB.rotation.x = Math.PI / 2;
  ringB.position.y = 0.34;
  group.add(ringB);

  const gate = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.045, 10, 32), gold);
  gate.position.set(0, 1.05, 0);
  group.add(gate);

  const gateInner = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.022, 8, 28), mage);
  gateInner.position.set(0, 1.05, 0);
  group.add(gateInner);

  const vortex = glowMat(PALETTE.mage, 0.95);
  const portal = new THREE.Mesh(new THREE.CircleGeometry(0.68, 28), vortex);
  portal.position.set(0, 1.05, 0.02);
  group.add(portal);

  const veil = glowMat(PALETTE.gold, 0.35);
  const veilMesh = new THREE.Mesh(new THREE.CircleGeometry(0.68, 28), veil);
  veilMesh.position.set(0, 1.05, -0.02);
  group.add(veilMesh);

  const beam = glowMat(PALETTE.moonlight, 0.22);
  const column = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 1.7), beam);
  column.position.set(0, 1.15, 0.08);
  group.add(column);

  const motes: THREE.Mesh[] = [];
  const moteMat = new THREE.MeshBasicMaterial({
    color: PALETTE.gold,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });
  for (let i = 0; i < 14; i += 1) {
    const mote = new THREE.Mesh(new THREE.SphereGeometry(0.025 + (i % 3) * 0.01, 6, 5), moteMat);
    mote.userData.phase = i * 0.46;
    mote.userData.radius = 0.28 + (i % 5) * 0.08;
    group.add(mote);
    motes.push(mote);
  }

  const light = new THREE.PointLight(PALETTE.mage, 2.4, 7, 1.2);
  light.position.set(0, 1.1, 0.6);
  group.add(light);

  group.position.set(x, 1, 0.05);

  return {
    group,
    tick: (time: number) => {
      ringA.rotation.z = time * 0.7;
      ringB.rotation.z = -time * 1.1;
      gate.rotation.z = time * 0.35;
      gateInner.rotation.z = -time * 0.85;
      floorRunes.rotation.z = time * 0.25;
      vortex.uniforms.uTime!.value = time;
      veil.uniforms.uTime!.value = time * 0.7;
      beam.uniforms.uTime!.value = time * 1.3;
      const pulse = 0.75 + Math.sin(time * 2.4) * 0.2;
      gold.emissiveIntensity = 0.55 + pulse * 0.35;
      mage.emissiveIntensity = 0.7 + pulse * 0.4;
      light.intensity = 1.8 + pulse * 1.1;
      for (const mote of motes) {
        const p = Number(mote.userData.phase);
        const r = Number(mote.userData.radius);
        const t = time * 1.15 + p;
        mote.position.set(Math.cos(t) * r, 0.45 + ((t * 0.22) % 1.35), Math.sin(t) * r * 0.45);
        mote.scale.setScalar(0.7 + Math.sin(t * 2) * 0.3);
      }
    },
  };
}
