import * as THREE from 'three';
import { WORLD } from '../game/config';
import { PALETTE } from './palette';
import { cloneRepeat, type P0Textures } from './textures';

export type CampfireView = {
  group: THREE.Group;
  tick: (time: number) => void;
};

function lin(hex: number): THREE.Color {
  return new THREE.Color(hex).convertSRGBToLinear();
}

/**
 * 生成一张带透明渐变的火焰贴图：底部宽、顶端尖，内部有暖色渐变。
 * 用 Sprite 始终朝向相机，比自定义 ShaderMaterial 更可靠。
 */
function makeFlameTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('无法创建 2D 上下文');
  }

  const gradient = ctx.createLinearGradient(size / 2, size, size / 2, 0);
  gradient.addColorStop(0.0, 'rgba(255, 80, 20, 0.95)');
  gradient.addColorStop(0.25, 'rgba(255, 160, 40, 0.85)');
  gradient.addColorStop(0.52, 'rgba(255, 220, 120, 0.78)');
  gradient.addColorStop(0.78, 'rgba(255, 160, 60, 0.45)');
  gradient.addColorStop(1.0, 'rgba(200, 60, 30, 0.0)');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(size * 0.5, size * 0.06);
  ctx.quadraticCurveTo(size * 0.82, size * 0.42, size * 0.72, size * 0.78);
  ctx.quadraticCurveTo(size * 0.62, size * 0.96, size * 0.5, size * 1.0);
  ctx.quadraticCurveTo(size * 0.38, size * 0.96, size * 0.28, size * 0.78);
  ctx.quadraticCurveTo(size * 0.18, size * 0.42, size * 0.5, size * 0.06);
  ctx.fill();

  // 内部亮芯
  const core = ctx.createRadialGradient(
    size * 0.5, size * 0.62, 0,
    size * 0.5, size * 0.62, size * 0.34,
  );
  core.addColorStop(0.0, 'rgba(255, 245, 200, 0.55)');
  core.addColorStop(0.5, 'rgba(255, 180, 60, 0.28)');
  core.addColorStop(1.0, 'rgba(255, 120, 40, 0.0)');
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.ellipse(size * 0.5, size * 0.62, size * 0.24, size * 0.38, 0, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

/**
 * 为铁匠铺火炉、地标火盆等提供的通用火焰材质。
 */
export function createFlameMat(opacity: number, seed = 0): THREE.ShaderMaterial {
  // 保留原 shader 接口，避免 landmarks/camp-props 调用处签名变化。
  // 实际上这些调用点传入的 seed 已不再影响（使用统一贴图动画由上层控制）。
  void seed;
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    fog: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: opacity },
      uSeed: { value: seed },
      uHot: { value: lin(PALETTE.sun) },
      uMid: { value: lin(PALETTE.ember) },
      uCool: { value: lin(PALETTE.gold) },
    },
    vertexShader: `
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 p = position;
        float b = sin(uTime * 2.2 + uv.y * 3.1) * 0.1
                + sin(uTime * 3.9 + uv.y * 5.3 + 1.3) * 0.05;
        p.x += b * uv.y;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uOpacity;
      uniform float uSeed;
      uniform vec3 uHot;
      uniform vec3 uMid;
      uniform vec3 uCool;
      varying vec2 vUv;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
          f.y
        );
      }
      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.55;
        for (int i = 0; i < 3; i++) {
          v += a * noise(p);
          p = p * 2.3 + 7.7;
          a *= 0.5;
        }
        return v;
      }

      void main() {
        float x = (vUv.x - 0.5) * 2.0;
        float y = vUv.y;
        float flow = uTime * 1.9;
        float n1 = fbm(vec2(x * 1.4 + uSeed, y * 2.1 - flow));
        float n2 = fbm(vec2(x * 3.2 - uSeed * 1.7 + 4.2, y * 3.6 - flow * 1.45));
        float sway = (n1 - 0.5) * (0.65 * y + 0.05);
        float xc = x - sway;
        float width = (1.0 - y) * (0.5 + n2 * 0.22) + 0.05;
        float body = smoothstep(width, width * 0.15, abs(xc));
        float top = 0.5 + n2 * 0.52;
        body *= smoothstep(0.0, 0.12, y) * smoothstep(1.0, top, y);
        body *= 0.72 + n1 * 0.56;
        if (body < 0.02) discard;
        vec3 col = mix(uMid, uHot, smoothstep(0.02, 0.5, y) * (0.65 + n1 * 0.7));
        col = mix(col, uCool, smoothstep(0.5, 1.0, y) * (0.45 + n2 * 0.55));
        float alpha = clamp(body, 0.0, 1.0) * uOpacity;
        gl_FragColor = vec4(col, alpha);
      }
    `,
  });
}

export function createCampfire(tex: P0Textures): CampfireView {
  (window as unknown as Record<string, unknown>).__campfireLogs = ((window as unknown as Record<string, unknown>).__campfireLogs || []) as string[];
  ((window as unknown as Record<string, string[]>).__campfireLogs).push('new sprite-based campfire created at ' + performance.now());
  const group = new THREE.Group();
  const rock = new THREE.MeshStandardMaterial({
    map: cloneRepeat(tex.rock, 1, 1),
    color: 0x8a8078,
    roughness: 0.92,
  });
  const wood = new THREE.MeshStandardMaterial({
    map: cloneRepeat(tex.wood, 1, 1),
    color: 0xa07850,
    emissive: new THREE.Color(0x6a3018),
    emissiveIntensity: 0.25,
    roughness: 0.78,
  });
  const coal = new THREE.MeshStandardMaterial({
    color: 0x2a1a14,
    emissive: new THREE.Color(PALETTE.ember),
    emissiveIntensity: 1.1,
    roughness: 0.7,
  });
  // 柴头焦黑烧蚀，内端透红
  const char = new THREE.MeshStandardMaterial({
    color: 0x1e1210,
    emissive: new THREE.Color(0xc44a28),
    emissiveIntensity: 0.8,
    roughness: 0.95,
  });

  // 浅坑
  const pit = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.12, 8), rock);
  pit.position.y = 0.06;
  pit.receiveShadow = true;
  group.add(pit);

  // 石头环
  for (let i = 0; i < 7; i += 1) {
    const a = (i / 7) * Math.PI * 2;
    const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.11, 0), rock);
    stone.position.set(Math.cos(a) * 0.46, 0.1, Math.sin(a) * 0.32);
    stone.rotation.set(a, i * 0.7, a * 0.4);
    stone.scale.set(1.15, 0.7, 0.9);
    stone.castShadow = true;
    group.add(stone);
  }

  // 柴火堆：锥形柴薪架（teepee），柴头在顶端交叉
  const UP = new THREE.Vector3(0, 1, 0);
  const APEX_H = 0.72;
  const apex = new THREE.Vector3(0, APEX_H, 0);
  const LOG_COUNT = 8;
  for (let i = 0; i < LOG_COUNT; i += 1) {
    const a = (i / LOG_COUNT) * Math.PI * 2 + 0.35;
    const baseR = 0.42 - ((i * 5) % 3) * 0.03;
    const base = new THREE.Vector3(Math.cos(a) * baseR, 0.02, Math.sin(a) * baseR * 0.82);
    const dir = apex.clone().sub(base);
    const len = dir.length();
    dir.normalize();

    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.058, len, 6), wood);
    log.quaternion.setFromUnitVectors(UP, dir);
    log.position.copy(base).addScaledVector(dir, len * 0.5);
    log.rotation.y += i * 0.9;
    log.castShadow = true;
    group.add(log);

    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.05, len * 0.38, 6), char);
    tip.quaternion.copy(log.quaternion);
    tip.position.copy(apex).addScaledVector(dir, -len * 0.19);
    group.add(tip);
  }

  // 底部两根横柴，压住柴堆造型
  const logH1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.92, 6), wood);
  logH1.rotation.z = Math.PI / 2;
  logH1.rotation.y = 0.25;
  logH1.position.set(0.0, 0.06, 0.18);
  logH1.castShadow = true;
  const logH2 = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.8, 6), wood);
  logH2.rotation.x = Math.PI / 2;
  logH2.rotation.z = 0.18;
  logH2.position.set(-0.14, 0.06, -0.02);
  logH2.castShadow = true;
  group.add(logH1, logH2);

  // 火心炭堆（压暗一点，不要抢火焰的视觉焦点）
  const mound = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), coal);
  mound.scale.set(1.25, 0.45, 1.0);
  mound.position.set(0, 0.12, 0);
  group.add(mound);
  for (let i = 0; i < 5; i += 1) {
    const ember = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 5), coal);
    const a = (i / 5) * Math.PI * 2;
    ember.position.set(Math.cos(a) * 0.12, 0.14, Math.sin(a) * 0.08);
    group.add(ember);
  }

  // ---- 火苗：用 Sprite 交叉面片，始终朝向相机，缩放模拟窜高 ----
  const flameTex = makeFlameTexture();
  const flameMat = new THREE.SpriteMaterial({
    map: flameTex,
    color: 0xffffff,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity: 0.95,
  });

  type FlameSprite = {
    sprite: THREE.Sprite;
    baseScale: THREE.Vector2;
    phase: number;
    speed: number;
    baseX: number;
    baseZ: number;
    baseY: number;
    rot: number;
  };

  const flames: FlameSprite[] = [
    { baseScale: new THREE.Vector2(0.52, 1.42), phase: 0.0, speed: 1.0, baseX: 0.0, baseZ: 0.0, baseY: 0.26, rot: 0.0 },
    { baseScale: new THREE.Vector2(0.44, 1.28), phase: 1.1, speed: 1.18, baseX: 0.02, baseZ: 0.02, baseY: 0.26, rot: 1.05 },
    { baseScale: new THREE.Vector2(0.4, 1.18), phase: 2.3, speed: 0.9, baseX: -0.02, baseZ: -0.02, baseY: 0.24, rot: -0.65 },
    { baseScale: new THREE.Vector2(0.3, 0.98), phase: 0.7, speed: 1.12, baseX: 0.0, baseZ: 0.03, baseY: 0.24, rot: 0.8 },
    { baseScale: new THREE.Vector2(0.28, 0.92), phase: 3.2, speed: 1.32, baseX: -0.14, baseZ: 0.06, baseY: 0.22, rot: 0.5 },
    { baseScale: new THREE.Vector2(0.26, 0.86), phase: 1.8, speed: 1.26, baseX: 0.15, baseZ: 0.04, baseY: 0.22, rot: -0.85 },
    { baseScale: new THREE.Vector2(0.22, 0.72), phase: 4.1, speed: 1.46, baseX: 0.05, baseZ: 0.17, baseY: 0.2, rot: 0.25 },
    { baseScale: new THREE.Vector2(0.2, 0.76), phase: 2.6, speed: 1.52, baseX: -0.06, baseZ: -0.15, baseY: 0.2, rot: -0.35 },
  ].map((spec) => {
    const sprite = new THREE.Sprite(flameMat.clone());
    sprite.center.set(0.5, 0.08); // 底端锚定
    sprite.scale.set(spec.baseScale.x, spec.baseScale.y, 1);
    const r = spec.rot;
    sprite.position.set(
      spec.baseX * Math.cos(r) - spec.baseZ * Math.sin(r),
      spec.baseY,
      spec.baseX * Math.sin(r) + spec.baseZ * Math.cos(r),
    );
    group.add(sprite);
    return { ...spec, sprite };
  });

  // 地面光池：让火堆底部照亮
  const poolMat = new THREE.MeshBasicMaterial({
    color: PALETTE.ember,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const pool = new THREE.Mesh(new THREE.CircleGeometry(2.2, 24), poolMat);
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = 0.08;
  group.add(pool);

  // 灯光
  const glow = new THREE.PointLight(PALETTE.ember, 7.5, 20, 0.8);
  glow.position.set(0, 0.95, 0.85);
  group.add(glow);
  const fill = new THREE.PointLight(PALETTE.gold, 2.8, 10, 1.0);
  fill.position.set(0.1, 0.45, 1.4);
  group.add(fill);

  // 火星
  type SparkData = { phase: number; rise: number; radius: number; spin: number; life: number };
  const sparks: { mesh: THREE.Mesh; data: SparkData }[] = [];
  const sparkMat = new THREE.MeshBasicMaterial({
    color: PALETTE.gold,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  });
  for (let i = 0; i < 16; i += 1) {
    const spark = new THREE.Mesh(new THREE.SphereGeometry(0.016, 5, 4), sparkMat);
    const data: SparkData = {
      phase: i * 0.71,
      rise: 0.7 + ((i * 37) % 10) / 20,
      radius: 0.05 + ((i * 53) % 10) / 85,
      spin: 1.1 + ((i * 29) % 10) / 8,
      life: 1.05 + ((i * 17) % 10) / 11,
    };
    sparks.push({ mesh: spark, data });
    group.add(spark);
  }

  group.position.set(0.45, WORLD.groundTop, 0.15);

  return {
    group,
    tick: (time: number) => {
      for (const f of flames) {
        const t = time * f.speed + f.phase;
        // 火苗往上窜：多频正弦叠加，高矮不一
        const surge =
          1.0 +
          Math.sin(t * 2.1) * 0.22 +
          Math.sin(t * 3.7 + 1.3) * 0.11 +
          Math.sin(time * 0.85 + f.phase) * 0.08;
        // 飘忽：轻微左右漂移
        const sway = Math.sin(t * 1.6) * 0.035 + Math.sin(t * 4.3 + 0.5) * 0.018;
        // 窜高时收窄
        const scaleX = f.baseScale.x * (1.0 + (1.0 - surge) * 0.28);
        const scaleY = f.baseScale.y * surge;
        f.sprite.scale.set(scaleX, scaleY, 1);
        f.sprite.position.x = f.baseX + sway;
        f.sprite.position.y = f.baseY + (scaleY - f.baseScale.y) * 0.5;
        f.sprite.position.z = f.baseZ + Math.cos(t * 1.4) * 0.02;
        // 贴图颜色轻微呼吸
        const mat = f.sprite.material as THREE.SpriteMaterial;
        mat.opacity = 0.82 + Math.sin(t * 2.4) * 0.13;
      }

      // 阵风：偶尔让火光大盛
      const gust = Math.max(0, Math.sin(time * 0.83) * Math.sin(time * 0.47 + 2.1));
      const flicker =
        0.78 + Math.sin(time * 13.7) * 0.1 + Math.sin(time * 29.3 + 1.7) * 0.06 + Math.sin(time * 5.3) * 0.06;
      glow.intensity = (6.8 + gust * 2.2) * flicker;
      fill.intensity = (2.4 + gust * 0.6) * flicker;
      poolMat.opacity = 0.14 + flicker * 0.06 + gust * 0.05;
      coal.emissiveIntensity = 0.8 + flicker * 0.5 + gust * 0.3;
      char.emissiveIntensity = 0.45 + flicker * 0.4 + gust * 0.25;
      wood.emissiveIntensity = 0.18 + flicker * 0.08;

      for (const { mesh: spark, data: d } of sparks) {
        const t = (time * d.rise + d.phase) % d.life;
        const k = t / d.life;
        const spin = time * d.spin + d.phase;
        const r = d.radius * (1 - k * 0.4);
        spark.position.set(
          Math.cos(spin) * r + Math.sin(time * 3.1 + d.phase * 4.0) * 0.05 * k,
          0.3 + t * 1.15,
          Math.sin(spin) * r * 0.8 + Math.cos(time * 2.7 + d.phase * 3.0) * 0.04 * k,
        );
        spark.scale.setScalar(Math.max(0.1, 1.2 - k * 1.05));
        spark.visible = k < 0.96;
      }
    },
  };
}
