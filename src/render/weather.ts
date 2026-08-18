import * as THREE from 'three';
import type { SceneThemeId } from '../game/data/scene-themes';

/** 天气类型：决定粒子形状/行为。'none' = 该区无天气。 */
type WeatherKind = 'none' | 'snow' | 'rain' | 'sand' | 'leaf' | 'ash' | 'mist';

type TexShape = 'dot' | 'streak' | 'leaf' | 'mist';

interface KindCfg {
  texture: TexShape;
  baseColor: number;
  count: number;
  size: number;
  /** 下落速度（世界单位/秒，正=向下；负值如飘烬则上浮）。 */
  fall: number;
  /** 水平风（世界单位/秒）。 */
  drift: number;
  /** 左右摆动幅度（世界单位）。 */
  sway: number;
  swaySpeed: number;
  opacity: number;
  additive?: boolean;
  /** 是否为暴风雨：加浓雾 + 压低曝光。 */
  storm?: boolean;
}

/** 各天气类型的基础参数；主题可覆盖颜色与强度。 */
const KIND: Record<Exclude<WeatherKind, 'none'>, KindCfg> = {
  snow: { texture: 'dot', baseColor: 0xeaf2f8, count: 340, size: 5, fall: 2.4, drift: 0.7, sway: 0.5, swaySpeed: 1.1, opacity: 0.9 },
  rain: { texture: 'streak', baseColor: 0x9fc0d8, count: 300, size: 11, fall: 16, drift: 1.3, sway: 0.05, swaySpeed: 2, opacity: 0.55, storm: true },
  sand: { texture: 'dot', baseColor: 0xd8b078, count: 240, size: 5.5, fall: 3.6, drift: 3.2, sway: 0.3, swaySpeed: 1.6, opacity: 0.8 },
  leaf: { texture: 'leaf', baseColor: 0x9ab07a, count: 150, size: 7, fall: 1.7, drift: 1.1, sway: 1.3, swaySpeed: 0.8, opacity: 0.95 },
  ash: { texture: 'dot', baseColor: 0xe08850, count: 170, size: 4, fall: -0.5, drift: 0.9, sway: 0.9, swaySpeed: 1.3, opacity: 0.85, additive: true },
  mist: { texture: 'mist', baseColor: 0xcfe0e0, count: 70, size: 72, fall: 0.25, drift: 0.6, sway: 0.4, swaySpeed: 0.4, opacity: 0.16 },
};

/** 区域主题 → 天气。只新增一条映射，不碰其它系统。 */
const WEATHER_BY_THEME: Partial<Record<SceneThemeId, { kind: WeatherKind; color?: number; intensity?: number }>> = {
  woodland: { kind: 'leaf' },
  mistnight: { kind: 'mist' },
  quarry: { kind: 'none' },
  coast: { kind: 'mist', color: 0xbfe0e8, intensity: 0.6 },
  ashland: { kind: 'ash' },
  mire: { kind: 'mist', intensity: 1.1 },
  frost: { kind: 'snow' },
  dunes: { kind: 'sand' },
  ruins: { kind: 'ash', color: 0x9a8cd0 },
  abyss: { kind: 'mist', color: 0x6a8a98, intensity: 0.6 },
  ridge: { kind: 'snow', intensity: 0.6 },
  void: { kind: 'mist', color: 0x6a5a8a, intensity: 0.6 },
  throne: { kind: 'ash' },
};

function makeTexture(kind: TexShape): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d')!;
  if (kind === 'streak') {
    const g = ctx.createLinearGradient(0, 0, 0, 64);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, 'rgba(255,255,255,1)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = g;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(32, 4);
    ctx.lineTo(32, 60);
    ctx.stroke();
  } else if (kind === 'leaf') {
    ctx.fillStyle = 'rgba(255,255,255,1)';
    ctx.beginPath();
    ctx.ellipse(32, 32, 10, 22, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'mist') {
    const g = ctx.createRadialGradient(32, 32, 4, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,0.9)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
  } else {
    const g = ctx.createRadialGradient(32, 32, 1, 32, 32, 30);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.6, 'rgba(255,255,255,0.85)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

/** 屏幕前天气粒子层：相机锚定，按区域主题自动选型。 */
export class WeatherView {
  readonly group = new THREE.Group();
  /** 暴风雨强度 0~1，供 GameRenderer 加雾压光。 */
  stormFactor = 0;

  private points: THREE.Points | null = null;
  private geom: THREE.BufferGeometry | null = null;
  private mat: THREE.PointsMaterial | null = null;
  private positions = new Float32Array(0);
  private vx = new Float32Array(0);
  private vy = new Float32Array(0);
  private phase = new Float32Array(0);
  private cfg: KindCfg | null = null;
  private readonly texCache: Partial<Record<TexShape, THREE.Texture>> = {};
  private clock = 0;
  private readonly margin = 2.5;

  constructor() {
    this.group.renderOrder = 12;
    this.group.visible = false;
  }

  private textureOf(kind: TexShape): THREE.Texture {
    const cached = this.texCache[kind];
    if (cached) return cached;
    const t = makeTexture(kind);
    this.texCache[kind] = t;
    return t;
  }

  /** 切换区域主题时调用，重建粒子层。 */
  setTheme(themeId: SceneThemeId): void {
    const entry = WEATHER_BY_THEME[themeId] ?? { kind: 'none' as WeatherKind };
    this.disposePoints();
    this.cfg = null;
    this.stormFactor = 0;
    if (entry.kind === 'none') {
      this.group.visible = false;
      return;
    }
    const base = KIND[entry.kind];
    const intensity = entry.intensity ?? 1;
    const count = Math.max(20, Math.round(base.count * Math.min(1.4, intensity)));
    const color = entry.color ?? base.baseColor;

    const pos = new Float32Array(count * 3);
    this.vx = new Float32Array(count);
    this.vy = new Float32Array(count);
    this.phase = new Float32Array(count);
    const spanX = (this.group.userData.spanX as number) ?? 14;
    const spanY = (this.group.userData.spanY as number) ?? 7;
    for (let i = 0; i < count; i += 1) {
      pos[i * 3] = (Math.random() * 2 - 1) * spanX;
      pos[i * 3 + 1] = (Math.random() * 2 - 1) * spanY;
      pos[i * 3 + 2] = 0;
      this.vx[i] = base.drift * (0.6 + Math.random() * 0.8) * (Math.random() < 0.5 ? -1 : 1);
      this.vy[i] = base.fall * (0.7 + Math.random() * 0.6);
      this.phase[i] = Math.random() * Math.PI * 2;
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.positions = pos;
    const mat = new THREE.PointsMaterial({
      map: this.textureOf(base.texture),
      color,
      size: base.size,
      sizeAttenuation: false,
      transparent: true,
      opacity: base.opacity,
      depthTest: false,
      depthWrite: false,
      fog: false,
      toneMapped: false,
      blending: base.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    const points = new THREE.Points(geom, mat);
    points.frustumCulled = false;
    this.geom = geom;
    this.mat = mat;
    this.points = points;
    this.cfg = base;
    this.group.add(points);
    this.group.visible = true;
    this.stormFactor = base.storm ? 1 : 0;
  }

  /** 每帧：锚定相机、推进粒子、屏幕边界回绕。 */
  update(dt: number, camX: number, camY: number, cam: THREE.OrthographicCamera): void {
    this.clock += dt;
    this.group.position.set(camX, camY, 6);
    if (!this.cfg || !this.points || !this.geom) {
      return;
    }
    const hw = (cam.right - cam.left) / 2;
    const hh = (cam.top - cam.bottom) / 2;
    // 缓存给下次 setTheme 用，避免初始尺寸为 0
    this.group.userData.spanX = hw + this.margin;
    this.group.userData.spanY = hh + this.margin;
    const spanX = hw + this.margin;
    const spanY = hh + this.margin;
    const pos = this.positions;
    const cfg = this.cfg;
    const rise = cfg.fall < 0;
    for (let i = 0; i < this.vx.length; i += 1) {
      const ix = i * 3;
      let x = pos[ix] + this.vx[i] * dt;
      x += Math.sin(this.clock * cfg.swaySpeed + this.phase[i]) * cfg.sway * dt;
      if (x > spanX) x = -spanX;
      else if (x < -spanX) x = spanX;
      pos[ix] = x;

      let y = pos[ix + 1] + this.vy[i] * dt;
      if (rise) {
        y += Math.sin(this.clock * 2 + this.phase[i]) * 0.4 * dt;
      }
      if (y < -spanY) y = spanY;
      else if (y > spanY) y = -spanY;
      pos[ix + 1] = y;
    }
    (this.geom.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }

  private disposePoints(): void {
    if (!this.points) {
      return;
    }
    this.group.remove(this.points);
    this.geom?.dispose();
    this.mat?.dispose();
    this.points = null;
    this.geom = null;
    this.mat = null;
  }

  dispose(): void {
    this.disposePoints();
    for (const key of Object.keys(this.texCache) as TexShape[]) {
      this.texCache[key]?.dispose();
    }
  }
}
