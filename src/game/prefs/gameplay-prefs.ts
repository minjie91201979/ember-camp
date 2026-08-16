/** 玩法偏好（localStorage），与存档无关。 */
export type GameplayPrefs = {
  /** 伤害飘字；升级飘字始终显示 */
  showDamageNumbers: boolean;
  /** 打开背包时自动按品质/种类排序 */
  autoSortBagOnOpen: boolean;
  /** 走近自动拾取材料与药水（装备仍需 F） */
  autoPickupConsumables: boolean;
};

const KEY = 'ember-camp-gameplay-v1';
const DEFAULTS: GameplayPrefs = {
  showDamageNumbers: true,
  autoSortBagOnOpen: true,
  autoPickupConsumables: true,
};

let prefs: GameplayPrefs = { ...DEFAULTS };
const listeners = new Set<() => void>();

export function loadGameplayPrefs(): GameplayPrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      prefs = { ...DEFAULTS };
      return prefs;
    }
    const parsed = JSON.parse(raw) as Partial<GameplayPrefs>;
    prefs = {
      showDamageNumbers:
        parsed.showDamageNumbers === undefined
          ? DEFAULTS.showDamageNumbers
          : Boolean(parsed.showDamageNumbers),
      autoSortBagOnOpen:
        parsed.autoSortBagOnOpen === undefined
          ? DEFAULTS.autoSortBagOnOpen
          : Boolean(parsed.autoSortBagOnOpen),
      autoPickupConsumables:
        parsed.autoPickupConsumables === undefined
          ? DEFAULTS.autoPickupConsumables
          : Boolean(parsed.autoPickupConsumables),
    };
  } catch {
    prefs = { ...DEFAULTS };
  }
  return prefs;
}

export function getGameplayPrefs(): GameplayPrefs {
  return prefs;
}

export function setGameplayPrefs(patch: Partial<GameplayPrefs>): GameplayPrefs {
  prefs = {
    showDamageNumbers: patch.showDamageNumbers ?? prefs.showDamageNumbers,
    autoSortBagOnOpen: patch.autoSortBagOnOpen ?? prefs.autoSortBagOnOpen,
    autoPickupConsumables: patch.autoPickupConsumables ?? prefs.autoPickupConsumables,
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    // ignore quota
  }
  for (const fn of listeners) {
    fn();
  }
  return prefs;
}

export function onGameplayPrefsChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

loadGameplayPrefs();
