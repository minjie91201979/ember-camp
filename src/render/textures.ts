import * as THREE from 'three';
import { ASSET } from './asset-paths';

export type P0Textures = {
  skyDay: THREE.Texture;
  moon: THREE.Texture;
  rock: THREE.Texture;
  leaf: THREE.Texture;
  grass: THREE.Texture;
  farRidge: THREE.Texture;
  midTrees: THREE.Texture;
  fgTrunk: THREE.Texture;
  ground: THREE.Texture;
  platform: THREE.Texture;
  bark: THREE.Texture;
  moss: THREE.Texture;
  warrior: THREE.Texture;
  rotwolf: THREE.Texture;
  treant: THREE.Texture;
  wood: THREE.Texture;
  firepit: THREE.Texture;
  forge: THREE.Texture;
  stall: THREE.Texture;
  teleport: THREE.Texture;
  palisade: THREE.Texture;
  torch: THREE.Texture;
  banner: THREE.Texture;
  slash: THREE.Texture;
  ember: THREE.Texture;
  hitSpark: THREE.Texture;
};

const CHROMA_KEYS: ReadonlySet<string> = new Set([
  ASSET.warrior,
  ASSET.rotwolf,
  ASSET.treant,
  ASSET.fgTrunk,
  ASSET.firepit,
  ASSET.forge,
  ASSET.stall,
  ASSET.teleport,
  ASSET.palisade,
  ASSET.torch,
  ASSET.banner,
]);

const REPEAT_KEYS: ReadonlySet<string> = new Set([
  ASSET.ground,
  ASSET.platform,
  ASSET.bark,
  ASSET.moss,
  ASSET.wood,
  ASSET.moon,
  ASSET.rock,
  ASSET.leaf,
  ASSET.grass,
]);

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`贴图加载失败: ${url}`));
    image.src = url;
  });
}

function isChromaGreen(r: number, g: number, b: number): boolean {
  return g > 90 && g > r + 28 && g > b + 28 && r < 190 && b < 190;
}

function chromaCanvas(image: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('无法创建 2D 上下文');
  }
  ctx.drawImage(image, 0, 0);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = pixels.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] ?? 0;
    const g = data[i + 1] ?? 0;
    const b = data[i + 2] ?? 0;
    if (isChromaGreen(r, g, b)) {
      data[i + 3] = 0;
      continue;
    }
    if (g > r && g > b) {
      data[i + 1] = Math.max(r, b);
    }
  }
  ctx.putImageData(pixels, 0, 0);
  return canvas;
}

function toTexture(image: HTMLImageElement, url: string): THREE.Texture {
  const source = CHROMA_KEYS.has(url) ? chromaCanvas(image) : image;
  const texture = new THREE.Texture(source);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  texture.anisotropy = 4;
  if (REPEAT_KEYS.has(url)) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
  }
  return texture;
}

async function loadOne(url: string): Promise<THREE.Texture> {
  const image = await loadImage(url);
  return toTexture(image, url);
}

export async function loadP0Textures(): Promise<P0Textures> {
  const entries = Object.entries(ASSET) as [keyof typeof ASSET, string][];
  const loaded = await Promise.all(entries.map(async ([key, url]) => {
    const texture = await loadOne(url);
    return [key, texture] as const;
  }));
  return Object.fromEntries(loaded) as P0Textures;
}

export function cloneRepeat(
  source: THREE.Texture,
  repeatX: number,
  repeatY: number,
): THREE.Texture {
  const texture = source.clone();
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.needsUpdate = true;
  return texture;
}
