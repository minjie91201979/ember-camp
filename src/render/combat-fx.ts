import * as THREE from 'three';
import { PALETTE } from './palette';

function cssHex(hex: number): string {
  return `#${hex.toString(16).padStart(6, '0')}`;
}

const BAR_W = 1.15;
const BAR_H = 0.1;

export function createHpBar(): {
  root: THREE.Group;
  fill: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
} {
  const root = new THREE.Group();
  const bg = new THREE.Mesh(
    new THREE.PlaneGeometry(BAR_W + 0.06, BAR_H + 0.05),
    new THREE.MeshBasicMaterial({
      color: PALETTE.void,
      depthTest: false,
      fog: false,
    }),
  );
  const fill = new THREE.Mesh(
    new THREE.PlaneGeometry(BAR_W, BAR_H),
    new THREE.MeshBasicMaterial({
      color: PALETTE.ember,
      depthTest: false,
      fog: false,
    }),
  );
  bg.position.z = 0.4;
  fill.position.z = 0.41;
  root.add(bg, fill);
  return { root, fill };
}

export function updateHpBar(
  fill: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>,
  ratio: number,
): void {
  const t = Math.max(0, Math.min(1, ratio));
  fill.scale.x = Math.max(0.001, t);
  fill.position.x = (t - 1) * (BAR_W / 2);
  fill.material.color.setHex(PALETTE.ember);
}

export function createDustMesh(): THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> {
  return new THREE.Mesh(
    new THREE.PlaneGeometry(0.55, 0.22),
    new THREE.MeshBasicMaterial({
      color: PALETTE.gold,
      transparent: true,
      depthTest: false,
      fog: false,
      opacity: 0.55,
    }),
  );
}

export function createDamagePopupMesh(
  value: number,
  lethal: boolean,
  crit = false,
): THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> {
  return createPopupMesh(`-${value}`, lethal || crit ? PALETTE.gold : PALETTE.ember, crit ? 56 : 48);
}

export function refreshDamagePopupMesh(
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>,
  value: number,
  lethal: boolean,
  crit = false,
): void {
  paintPopupTexture(
    mesh,
    `-${value}`,
    lethal || crit ? PALETTE.gold : PALETTE.ember,
    crit ? 56 : 48,
  );
}

export function createLevelUpPopupMesh(
  level: number,
): THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> {
  return createPopupMesh(`升级 Lv.${level}`, PALETTE.gold, 42, 220, 90, 2.2, 0.9);
}

export function createGoldPopupMesh(
  amount: number,
): THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> {
  return createPopupMesh(`+${amount}金`, PALETTE.gold, 44, 180, 80, 1.5, 0.7);
}

export function refreshGoldPopupMesh(
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>,
  amount: number,
): void {
  paintPopupTexture(mesh, `+${amount}金`, PALETTE.gold, 44);
}

export function createXpPopupMesh(
  amount: number,
): THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> {
  return createPopupMesh(`+${amount}经验`, PALETTE.mage, 40, 200, 80, 1.65, 0.7);
}

export function refreshXpPopupMesh(
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>,
  amount: number,
): void {
  paintPopupTexture(mesh, `+${amount}经验`, PALETTE.mage, 40);
}

export function createMissPopupMesh(): THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> {
  return createPopupMesh('未命中', PALETTE.moonlight, 40, 160, 72, 1.35, 0.62);
}

export function createInteractPromptMesh(
  text: string,
): THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> {
  return createPopupMesh(`[F] ${text}`, PALETTE.gold, 36, 280, 72, 2.4, 0.62);
}

function createPopupMesh(
  text: string,
  fill: number,
  fontSize: number,
  width = 160,
  height = 80,
  planeW = 1.35,
  planeH = 0.68,
): THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(planeW, planeH),
    new THREE.MeshBasicMaterial({
      map,
      transparent: true,
      depthTest: false,
      fog: false,
    }),
  );
  mesh.userData.popupCanvas = canvas;
  mesh.userData.popupWidth = width;
  mesh.userData.popupHeight = height;
  paintPopupTexture(mesh, text, fill, fontSize);
  return mesh;
}

function paintPopupTexture(
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>,
  text: string,
  fill: number,
  fontSize: number,
): void {
  const canvas = mesh.userData.popupCanvas as HTMLCanvasElement | undefined;
  const width = (mesh.userData.popupWidth as number | undefined) ?? 160;
  const height = (mesh.userData.popupHeight as number | undefined) ?? 80;
  if (!canvas) {
    return;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return;
  }
  ctx.clearRect(0, 0, width, height);
  ctx.font = `800 ${fontSize}px "Segoe UI", "PingFang SC", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 8;
  ctx.strokeStyle = cssHex(PALETTE.void);
  ctx.fillStyle = cssHex(fill);
  ctx.strokeText(text, width / 2, height / 2 + 2);
  ctx.fillText(text, width / 2, height / 2 + 2);
  const map = mesh.material.map;
  if (map) {
    map.needsUpdate = true;
  }
}
