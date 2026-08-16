/** 世界地图大陆坐标（百分比，原点左上）。对齐 `public/maps/ember-continent.png`。 */
export type ZoneMapPos = { x: number; y: number };

export const ZONE_MAP_POS: Record<string, ZoneMapPos> = {
  a01: { x: 12, y: 56 },
  a02: { x: 24, y: 50 },
  a03: { x: 33, y: 30 },
  a04: { x: 38, y: 68 },
  a05: { x: 50, y: 78 },
  a06: { x: 50, y: 18 },
  a07: { x: 58, y: 46 },
  a08: { x: 66, y: 28 },
  a09: { x: 70, y: 68 },
  a10: { x: 80, y: 22 },
  a11: { x: 88, y: 50 },
  a12: { x: 94, y: 40 },
};

/** 航线：线性解锁链（魔兽飞行点式虚线）。 */
export const ZONE_FLIGHT_EDGES: ReadonlyArray<readonly [string, string]> = [
  ['a01', 'a02'],
  ['a02', 'a03'],
  ['a03', 'a04'],
  ['a04', 'a05'],
  ['a05', 'a06'],
  ['a06', 'a07'],
  ['a07', 'a08'],
  ['a08', 'a09'],
  ['a09', 'a10'],
  ['a10', 'a11'],
  ['a11', 'a12'],
];
