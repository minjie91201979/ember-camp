/** NG+ 数值倍率（纯函数，避免与 inventory 循环依赖）。 */

export function ngPlusEnemyHpMult(level: number): number {
  return 1 + 0.35 * Math.max(0, level);
}

export function ngPlusEnemyAtkMult(level: number): number {
  return 1 + 0.25 * Math.max(0, level);
}

export function ngPlusEnemyDefMult(level: number): number {
  return 1 + 0.12 * Math.max(0, level);
}

export function ngPlusEnemyXpMult(level: number): number {
  return 1 + 0.2 * Math.max(0, level);
}

export function ngPlusLootGoldMult(level: number): number {
  return 1 + 0.2 * Math.max(0, level);
}

export function ngPlusWeaponAtkMult(level: number): number {
  return 1 + 0.05 * Math.max(0, level);
}
