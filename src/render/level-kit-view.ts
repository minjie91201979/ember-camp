import * as THREE from 'three';
import { KIT_THEMES, type KitPiece, type KitThemeId } from '../game/data/level-kit';
import { sceneThemeOf } from '../game/data/scene-themes';
import { PALETTE } from './palette';
import { cloneRepeat, type P0Textures } from './textures';

export function placeKitDecor(
  pieces: KitPiece[],
  themeId: KitThemeId,
  tex: P0Textures,
): THREE.Group {
  const root = new THREE.Group();
  const theme = KIT_THEMES[themeId] ?? KIT_THEMES.woodland;
  const scene = sceneThemeOf(themeId);
  for (const piece of pieces) {
    if (piece.kind === 'slope') {
      root.add(makeSlope(piece, theme.slopeTint, tex));
    } else if (piece.kind === 'secret-wall') {
      root.add(makeSecretWall(piece, scene.leafTint, tex));
    } else if (piece.kind === 'backdrop') {
      root.add(makeBackdrop(piece, scene.breakableTint, tex));
    }
  }
  return root;
}

function makeSlope(
  piece: KitPiece,
  tint: number,
  tex: P0Textures,
): THREE.Mesh {
  const rise = piece.rise ?? piece.h;
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(piece.w, piece.h, 1.35),
    new THREE.MeshStandardMaterial({
      map: cloneRepeat(tex.platform, Math.max(1, piece.w), 1),
      color: tint,
      roughness: 0.8,
      emissive: new THREE.Color(PALETTE.moss),
      emissiveIntensity: 0.04,
    }),
  );
  const angle = Math.atan2(rise, piece.w);
  mesh.rotation.z = angle;
  mesh.position.set(
    piece.x + piece.w / 2,
    piece.y + rise / 2 + piece.h * 0.35,
    -0.05,
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function makeSecretWall(piece: KitPiece, tint: number, tex: P0Textures): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(piece.w, piece.h, 0.28),
    new THREE.MeshStandardMaterial({
      map: cloneRepeat(tex.moss, 1, 2),
      color: tint,
      roughness: 0.9,
      transparent: true,
      opacity: 0.78,
      depthWrite: false,
    }),
  );
  // 略靠镜头前方，避免与平台侧面穿插；仍无碰撞
  mesh.position.set(piece.x + piece.w / 2, piece.y + piece.h / 2, 0.35);
  return mesh;
}

function makeBackdrop(piece: KitPiece, tint: number, tex: P0Textures): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(piece.w * 0.45, piece.w * 0.55, piece.h, 6),
    new THREE.MeshStandardMaterial({
      map: cloneRepeat(tex.wood, 1, 1),
      color: tint,
      roughness: 0.92,
    }),
  );
  mesh.position.set(piece.x + piece.w / 2, piece.y + piece.h / 2, -0.35);
  mesh.castShadow = true;
  return mesh;
}

export function createBreakableMesh(
  tex: P0Textures,
  tint: number,
): THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial> {
  return new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({
      map: cloneRepeat(tex.wood, 1, 1),
      color: tint,
      roughness: 0.86,
    }),
  );
}
