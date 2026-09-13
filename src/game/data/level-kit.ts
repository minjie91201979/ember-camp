import { WORLD, alignLegacyY, LEGACY_GROUND_TOP } from '../config';
import type { Rect } from '../types';
import { KIT_THEMES, type KitTheme, type KitThemeId } from './scene-themes';

export type { KitTheme, KitThemeId };
export { KIT_THEMES };

export type KitPieceKind =
  | 'ground'
  | 'ledge'
  | 'slope'
  | 'breakable'
  | 'secret-wall'
  | 'backdrop'
  | 'landmark';

/** 侧视可认的关卡地标；无碰撞。 */
export type LandmarkProp =
  | 'deadwood'
  | 'minecart'
  | 'wreck'
  | 'cinder-arch'
  | 'boardwalk'
  | 'ice-span'
  | 'dune-arch'
  | 'idol-column'
  | 'hanging-tendril'
  | 'dragon-rib'
  | 'rift-crystal'
  | 'throne-stair'
  | 'ember-pyre';

export type KitPiece = {
  id: string;
  kind: KitPieceKind;
  x: number;
  y: number;
  w: number;
  h: number;
  /** 斜坡：从左到右抬升高度 */
  rise?: number;
  rewardDefId?: string;
  rewardQty?: number;
  /** landmark 外形 */
  prop?: LandmarkProp;
};

/** 将套件展开为物理碰撞矩形（已破坏的可破坏物跳过）。 */
export function expandKitCollision(
  pieces: KitPiece[],
  brokenIds: ReadonlySet<string> | Record<string, boolean>,
): Rect[] {
  const broken =
    brokenIds instanceof Set
      ? brokenIds
      : new Set(
          Object.entries(brokenIds as Record<string, boolean>)
            .filter(([, v]) => v)
            .map(([id]) => id),
        );
  const rects: Rect[] = [];
  for (const piece of pieces) {
    if (piece.kind === 'backdrop' || piece.kind === 'secret-wall' || piece.kind === 'landmark') {
      continue;
    }
    if (piece.kind === 'breakable' && broken.has(piece.id)) {
      continue;
    }
    if (piece.kind === 'ground') {
      rects.push({
        x: piece.x,
        y: piece.y,
        w: piece.w,
        h: piece.h * (WORLD.groundTop / LEGACY_GROUND_TOP),
      });
      continue;
    }
    if (piece.kind === 'slope') {
      rects.push(...expandSlope({ ...piece, y: alignLegacyY(piece.y) }));
      continue;
    }
    rects.push({ x: piece.x, y: alignLegacyY(piece.y), w: piece.w, h: piece.h });
  }
  return rects;
}

function expandSlope(piece: KitPiece): Rect[] {
  const rise = piece.rise ?? piece.h;
  const steps = Math.max(4, Math.round(piece.w / 0.35));
  const stepW = piece.w / steps;
  const stepRise = rise / steps;
  const rects: Rect[] = [];
  for (let i = 0; i < steps; i += 1) {
    rects.push({
      x: piece.x + i * stepW,
      y: piece.y + i * stepRise,
      w: stepW + 0.04,
      h: Math.max(0.28, piece.h),
    });
  }
  return rects;
}

export function listBreakablePieces(pieces: KitPiece[]): KitPiece[] {
  return pieces.filter((p) => p.kind === 'breakable');
}
