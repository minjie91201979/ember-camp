/** 音频总线偏好（localStorage）。 */
export type AudioPrefs = {
  bgm: number;
  sfx: number;
  muted: boolean;
};

const KEY = 'ember-camp-audio-v1';
const DEFAULTS: AudioPrefs = { bgm: 0.85, sfx: 0.9, muted: false };

let prefs: AudioPrefs = { ...DEFAULTS };
const listeners = new Set<() => void>();

export function loadAudioPrefs(): AudioPrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      prefs = { ...DEFAULTS };
      return prefs;
    }
    const parsed = JSON.parse(raw) as Partial<AudioPrefs>;
    prefs = {
      bgm: clamp01(parsed.bgm ?? DEFAULTS.bgm),
      sfx: clamp01(parsed.sfx ?? DEFAULTS.sfx),
      muted: Boolean(parsed.muted),
    };
  } catch {
    prefs = { ...DEFAULTS };
  }
  return prefs;
}

export function getAudioPrefs(): AudioPrefs {
  return prefs;
}

export function setAudioPrefs(patch: Partial<AudioPrefs>): AudioPrefs {
  prefs = {
    bgm: clamp01(patch.bgm ?? prefs.bgm),
    sfx: clamp01(patch.sfx ?? prefs.sfx),
    muted: patch.muted ?? prefs.muted,
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

export function onAudioPrefsChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) {
    return 0;
  }
  return Math.max(0, Math.min(1, n));
}
