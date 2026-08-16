import { sfx } from './sfx';
import { getAudioPrefs, loadAudioPrefs, onAudioPrefsChange } from './prefs';
import { sceneThemeOf, type SceneTheme } from '../game/data/scene-themes';

export class Bgm {
  private started = false;
  private master: GainNode | null = null;
  private timer = 0;
  private readonly sources: AudioScheduledSourceNode[] = [];
  private theme: SceneTheme = sceneThemeOf('woodland');
  private combat = false;
  private userVol = 0.85;

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
      this.stop();
      this.start();
    }
  }

  /** BOSS / 交战紧张度：略抬音量与短语密度。 */
  setCombat(active: boolean): void {
    if (this.combat === active) {
      return;
    }
    this.combat = active;
    this.refreshGain();
  }

  start(): void {
    const ctx = sfx.ensure();
    const dest = sfx.destination();
    if (!ctx || !dest || this.started) {
      return;
    }
    this.started = true;
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(dest);
    this.master = master;
    this.refreshGain(true);
    const vol = this.targetVol();
    this.holdDrone(ctx, master, this.theme.bgmDroneA, vol);
    this.holdDrone(ctx, master, this.theme.bgmDroneB, vol * 0.45);
    this.holdWind(ctx, master, this.theme.bgmWind * (this.combat ? 1.25 : 1));
    this.armPhrase(ctx, master, ctx.currentTime + 0.4);
  }

  stop(): void {
    window.clearTimeout(this.timer);
    for (const src of this.sources) {
      try {
        src.stop();
      } catch {
        // already stopped
      }
      src.disconnect();
    }
    this.sources.length = 0;
    if (this.master) {
      this.master.disconnect();
      this.master = null;
    }
    this.started = false;
  }

  private targetVol(): number {
    return this.theme.bgmVolume * this.userVol * (this.combat ? 1.35 : 1);
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
      this.master.gain.linearRampToValueAtTime(vol, ctx.currentTime + 1.2);
    } else {
      this.master.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.35);
    }
  }

  private armPhrase(ctx: AudioContext, master: GainNode, at: number): void {
    const tones = this.theme.bgmTones;
    const phrase = this.theme.bgmPhrase * (this.combat ? 0.72 : 1);
    const beats = this.combat ? [0, 1.6, 3.2, 4.8, 6.4, 8.0] : [0, 2.8, 5.2, 7.6, 10.4];
    const gain = this.combat ? 0.048 : 0.035;
    for (let i = 0; i < beats.length; i += 1) {
      const freq = tones[(i * 2 + Math.floor(at)) % tones.length]!;
      this.tone(ctx, master, at + beats[i]!, freq, this.combat ? 1.2 : 1.8, gain);
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
    filter.frequency.value = 420;
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
    filter.frequency.value = 720;
    filter.Q.value = 0.7;
    const amp = ctx.createGain();
    amp.gain.value = gain;
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
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, at);
    amp.gain.setValueAtTime(0.001, at);
    amp.gain.exponentialRampToValueAtTime(gain, at + 0.18);
    amp.gain.exponentialRampToValueAtTime(0.001, at + dur);
    osc.connect(amp);
    amp.connect(master);
    osc.start(at);
    osc.stop(at + dur + 0.05);
  }
}

export const bgm = new Bgm();
