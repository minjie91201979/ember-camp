import { sfx } from './sfx';
import { getAudioPrefs, loadAudioPrefs, onAudioPrefsChange } from './prefs';
import { sceneThemeOf, type SceneTheme } from '../game/data/scene-themes';

/** explore 探索 · camp 营地更静 · combat 交战 · boss 高潮 */
export type BgmMood = 'explore' | 'camp' | 'combat' | 'boss';

const MOOD_VOL: Record<BgmMood, number> = {
  explore: 1,
  camp: 0.52,
  combat: 1.32,
  boss: 1.72,
};

const MOOD_PHRASE: Record<BgmMood, number> = {
  explore: 1,
  camp: 1.45,
  combat: 0.72,
  boss: 0.48,
};

const MOOD_TONE_GAIN: Record<BgmMood, number> = {
  explore: 0.032,
  camp: 0.018,
  combat: 0.048,
  boss: 0.078,
};

const MOOD_BEATS: Record<BgmMood, number[]> = {
  explore: [0, 2.8, 5.2, 7.6, 10.4],
  camp: [0, 4.2, 8.6],
  combat: [0, 1.6, 3.2, 4.8, 6.4, 8.0],
  boss: [0, 0.7, 1.4, 2.1, 2.8, 3.6, 4.4, 5.2, 6.0, 6.8],
};

/**
 * BOSS 独立曲目床层（程序合成，对齐 ASSET_LIST `audio/bgm/boss`）。
 * 与区域主题探索/交战床层分离，进 BOSS 时整床重建。
 */
const BOSS_TRACK = {
  droneA: 46.25,
  droneB: 69.3,
  droneGainA: 0.34,
  droneGainB: 0.2,
  wind: 0.055,
  pulseHz: 1.9,
  pulseDepth: 0.28,
  toneType: 'sawtooth' as OscillatorType,
  /** 相对主题音列的半音下移，制造压迫感 */
  toneSemitoneShift: -5,
} as const;

export class Bgm {
  private started = false;
  private master: GainNode | null = null;
  private windAmp: GainNode | null = null;
  private pulseLfo: OscillatorNode | null = null;
  private timer = 0;
  private readonly sources: AudioScheduledSourceNode[] = [];
  private theme: SceneTheme = sceneThemeOf('woodland');
  private mood: BgmMood = 'explore';
  private userVol = 0.85;
  /** 当前床层是否为 BOSS 独立曲目 */
  private bossBed = false;

  constructor() {
    loadAudioPrefs();
    this.userVol = getAudioPrefs().muted ? 0 : getAudioPrefs().bgm;
    onAudioPrefsChange(() => {
      const p = getAudioPrefs();
      this.userVol = p.muted ? 0 : p.bgm;
      this.refreshGain();
    });
  }

  setTheme(themeId: string): void {
    this.theme = sceneThemeOf(themeId);
    if (this.started) {
      this.rebuildBed();
    }
  }

  /** @deprecated 用 setMood；保留给旧调用兼容。 */
  setCombat(active: boolean): void {
    this.setMood(active ? 'combat' : 'explore');
  }

  setMood(mood: BgmMood): void {
    if (this.mood === mood) {
      return;
    }
    const wasBoss = this.mood === 'boss';
    const nowBoss = mood === 'boss';
    this.mood = mood;
    if (this.started && wasBoss !== nowBoss) {
      this.rebuildBed();
      return;
    }
    this.refreshGain();
    this.refreshWind();
  }

  start(): void {
    if (this.started) {
      return;
    }
    this.rebuildBed();
  }

  stop(): void {
    this.teardownBed();
    this.started = false;
    this.bossBed = false;
  }

  /** 进/出 BOSS 或换主题时整床重建，保证曲目可感切换。 */
  private rebuildBed(): void {
    const ctx = sfx.ensure();
    const dest = sfx.destination();
    if (!ctx || !dest) {
      return;
    }
    this.teardownBed();
    this.started = true;
    this.bossBed = this.mood === 'boss';

    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(dest);
    this.master = master;
    this.refreshGain(true);

    if (this.bossBed) {
      this.startBossBed(ctx, master);
    } else {
      this.startThemeBed(ctx, master);
    }
    this.armPhrase(ctx, master, ctx.currentTime + 0.35);
  }

  private teardownBed(): void {
    window.clearTimeout(this.timer);
    if (this.pulseLfo) {
      try {
        this.pulseLfo.stop();
      } catch {
        // already stopped
      }
      this.pulseLfo.disconnect();
      this.pulseLfo = null;
    }
    for (const src of this.sources) {
      try {
        src.stop();
      } catch {
        // already stopped
      }
      src.disconnect();
    }
    this.sources.length = 0;
    this.windAmp = null;
    if (this.master) {
      this.master.disconnect();
      this.master = null;
    }
  }

  private startThemeBed(ctx: AudioContext, master: GainNode): void {
    const vol = this.targetVol();
    this.holdDrone(ctx, master, this.theme.bgmDroneA, vol);
    this.holdDrone(ctx, master, this.theme.bgmDroneB, vol * 0.45);
    this.holdWind(ctx, master, this.theme.bgmWind);
  }

  private startBossBed(ctx: AudioContext, master: GainNode): void {
    const vol = this.targetVol();
    this.holdDrone(ctx, master, BOSS_TRACK.droneA, vol * BOSS_TRACK.droneGainA);
    this.holdDrone(ctx, master, BOSS_TRACK.droneB, vol * BOSS_TRACK.droneGainB);
    this.holdWind(ctx, master, BOSS_TRACK.wind);
    this.holdBossPulse(ctx, master, vol);
  }

  /** 心跳式低频脉冲，仅 BOSS 曲目。 */
  private holdBossPulse(ctx: AudioContext, master: GainNode, baseVol: number): void {
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    const lfo = ctx.createOscillator();
    const lfoAmp = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = BOSS_TRACK.droneA * 0.5;
    amp.gain.value = baseVol * 0.22;
    lfo.type = 'sine';
    lfo.frequency.value = BOSS_TRACK.pulseHz;
    lfoAmp.gain.value = baseVol * BOSS_TRACK.pulseDepth;
    lfo.connect(lfoAmp);
    lfoAmp.connect(amp.gain);
    osc.connect(amp);
    amp.connect(master);
    osc.start();
    lfo.start();
    this.sources.push(osc);
    this.pulseLfo = lfo;
  }

  private targetVol(): number {
    return this.theme.bgmVolume * this.userVol * MOOD_VOL[this.mood];
  }

  private windMult(): number {
    if (this.mood === 'camp') {
      return 0.55;
    }
    if (this.mood === 'combat') {
      return 1.25;
    }
    if (this.mood === 'boss') {
      return 1.65;
    }
    return 1;
  }

  private refreshGain(rampIn = false): void {
    const ctx = sfx.ensure();
    if (!ctx || !this.master) {
      return;
    }
    const vol = this.targetVol();
    this.master.gain.cancelScheduledValues(ctx.currentTime);
    if (rampIn) {
      this.master.gain.setValueAtTime(0, ctx.currentTime);
      this.master.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.9);
    } else {
      this.master.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.45);
    }
  }

  private refreshWind(): void {
    const ctx = sfx.ensure();
    if (!ctx || !this.windAmp) {
      return;
    }
    const base = this.bossBed ? BOSS_TRACK.wind : this.theme.bgmWind;
    const gain = base * this.windMult();
    this.windAmp.gain.cancelScheduledValues(ctx.currentTime);
    this.windAmp.gain.linearRampToValueAtTime(gain, ctx.currentTime + 0.4);
  }

  private armPhrase(ctx: AudioContext, master: GainNode, at: number): void {
    const tones = this.theme.bgmTones;
    const phrase = this.theme.bgmPhrase * MOOD_PHRASE[this.mood];
    const beats = MOOD_BEATS[this.mood];
    const gain = MOOD_TONE_GAIN[this.mood];
    const dur =
      this.mood === 'boss' ? 0.72 : this.mood === 'camp' ? 2.4 : this.mood === 'combat' ? 1.2 : 1.8;
    const shift =
      this.mood === 'boss' ? Math.pow(2, BOSS_TRACK.toneSemitoneShift / 12) : 1;
    for (let i = 0; i < beats.length; i += 1) {
      const toneIdx =
        this.mood === 'boss'
          ? (i * 3 + Math.floor(at * 2)) % tones.length
          : (i * 2 + Math.floor(at)) % tones.length;
      const freq = tones[toneIdx]! * shift;
      this.tone(ctx, master, at + beats[i]!, freq, dur, gain);
    }
    const wait = Math.max(80, (at + phrase - ctx.currentTime) * 1000);
    this.timer = window.setTimeout(() => {
      if (!this.master) {
        return;
      }
      this.armPhrase(ctx, this.master, ctx.currentTime + 0.05);
    }, wait);
  }

  private holdDrone(ctx: AudioContext, master: GainNode, freq: number, gain: number): void {
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.type = 'sine';
    osc.frequency.value = freq;
    filter.type = 'lowpass';
    filter.frequency.value = this.bossBed ? 280 : 420;
    amp.gain.value = gain;
    osc.connect(filter);
    filter.connect(amp);
    amp.connect(master);
    osc.start();
    this.sources.push(osc);
  }

  private holdWind(ctx: AudioContext, master: GainNode, gain: number): void {
    const n = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = n.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
    const src = ctx.createBufferSource();
    src.buffer = n;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = this.bossBed ? 480 : 720;
    filter.Q.value = this.bossBed ? 1.1 : 0.7;
    const amp = ctx.createGain();
    amp.gain.value = gain * this.windMult();
    this.windAmp = amp;
    src.connect(filter);
    filter.connect(amp);
    amp.connect(master);
    src.start();
    this.sources.push(src);
  }

  private tone(
    ctx: AudioContext,
    master: GainNode,
    at: number,
    freq: number,
    dur: number,
    gain: number,
  ): void {
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type =
      this.mood === 'camp'
        ? 'sine'
        : this.mood === 'boss'
          ? BOSS_TRACK.toneType
          : 'triangle';
    osc.frequency.setValueAtTime(freq, at);
    amp.gain.setValueAtTime(0.001, at);
    amp.gain.exponentialRampToValueAtTime(gain, at + (this.mood === 'boss' ? 0.06 : 0.18));
    amp.gain.exponentialRampToValueAtTime(0.001, at + dur);
    osc.connect(amp);
    amp.connect(master);
    osc.start(at);
    osc.stop(at + dur + 0.05);
  }
}

export const bgm = new Bgm();
