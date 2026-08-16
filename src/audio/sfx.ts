export type SfxKind =
  | 'hit'
  | 'crit'
  | 'hurt'
  | 'die'
  | 'land'
  | 'loot'
  | 'drink'
  | 'slam'
  | 'bash'
  | 'deny'
  | 'jump'
  | 'roll'
  | 'step'
  | 'levelup'
  | 'ui';

import { getAudioPrefs, loadAudioPrefs, onAudioPrefsChange } from './prefs';

export class Sfx {
  private ctx: AudioContext | null = null;
  private noise: AudioBuffer | null = null;
  private bus: GainNode | null = null;
  private masterGain = 0.9;

  constructor() {
    loadAudioPrefs();
    this.applyPrefs();
    onAudioPrefsChange(() => this.applyPrefs());
  }

  play(kind: SfxKind): void {
    const ctx = this.ensure();
    if (!ctx || !this.bus || this.masterGain <= 0.001) {
      return;
    }
    const now = ctx.currentTime;
    if (kind === 'hit') {
      this.blip(ctx, now, 980, 0.04, 0.05, 'sawtooth');
      this.blip(ctx, now, 240, 0.08, 0.045, 'triangle');
    } else if (kind === 'crit') {
      this.blip(ctx, now, 1320, 0.05, 0.06, 'sawtooth');
      this.blip(ctx, now + 0.02, 880, 0.07, 0.05, 'triangle');
      this.blip(ctx, now + 0.05, 1760, 0.08, 0.04, 'sine');
      this.whoosh(ctx, now, 0.1, 0.04, 2200);
    } else if (kind === 'slam') {
      this.whoosh(ctx, now, 0.14, 0.07, 1400);
      this.blip(ctx, now, 520, 0.09, 0.08, 'sawtooth');
      this.thud(ctx, now + 0.02, 0.14, 0.09, 220);
      this.blip(ctx, now + 0.03, 160, 0.1, 0.05, 'triangle');
    } else if (kind === 'bash') {
      this.thud(ctx, now, 0.12, 0.08, 480);
      this.blip(ctx, now, 420, 0.05, 0.07, 'square');
      this.blip(ctx, now + 0.02, 210, 0.1, 0.06, 'triangle');
      this.blip(ctx, now + 0.04, 140, 0.08, 0.04, 'square');
    } else if (kind === 'deny') {
      this.blip(ctx, now, 160, 0.08, 0.06, 'square');
    } else if (kind === 'hurt') {
      this.blip(ctx, now, 180, 0.1, 0.1, 'square');
    } else if (kind === 'die') {
      this.blip(ctx, now, 110, 0.22, 0.12, 'square');
    } else if (kind === 'jump') {
      this.blip(ctx, now, 280, 0.07, 0.045, 'triangle');
      this.thud(ctx, now, 0.08, 0.05, 420);
    } else if (kind === 'roll') {
      this.thud(ctx, now, 0.16, 0.055, 380);
      this.blip(ctx, now, 140, 0.12, 0.035, 'triangle');
    } else if (kind === 'step') {
      this.thud(ctx, now, 0.07, 0.042, 240 + Math.random() * 50);
    } else if (kind === 'loot') {
      this.blip(ctx, now, 660, 0.05, 0.045, 'triangle');
      this.blip(ctx, now + 0.04, 990, 0.07, 0.05, 'sine');
    } else if (kind === 'drink') {
      this.blip(ctx, now, 420, 0.06, 0.04, 'sine');
      this.blip(ctx, now + 0.05, 560, 0.08, 0.045, 'triangle');
      this.whoosh(ctx, now + 0.02, 0.12, 0.03, 900);
    } else if (kind === 'ui') {
      this.blip(ctx, now, 520, 0.04, 0.03, 'triangle');
    } else if (kind === 'levelup') {
      this.blip(ctx, now, 392, 0.08, 0.055, 'triangle');
      this.blip(ctx, now + 0.06, 523, 0.09, 0.06, 'triangle');
      this.blip(ctx, now + 0.13, 659, 0.12, 0.07, 'sine');
      this.blip(ctx, now + 0.2, 784, 0.16, 0.055, 'sine');
      this.whoosh(ctx, now + 0.04, 0.22, 0.045, 1800);
    } else {
      this.thud(ctx, now, 0.1, 0.07, 180);
    }
  }

  applyPrefs(): void {
    const p = getAudioPrefs();
    this.masterGain = p.muted ? 0 : p.sfx;
    if (this.bus) {
      this.bus.gain.value = this.masterGain;
    }
  }

  ensure(): AudioContext | null {
    const Ctor = window.AudioContext;
    if (!Ctor) {
      return null;
    }
    if (!this.ctx) {
      this.ctx = new Ctor();
      this.bus = this.ctx.createGain();
      this.bus.gain.value = this.masterGain;
      this.bus.connect(this.ctx.destination);
      this.noise = makeNoise(this.ctx, 1);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  out(): GainNode | null {
    return this.ensure() ? this.bus : null;
  }

  /** BGM 直连 destination，避免被 SFX 总线增益牵连。 */
  destination(): AudioNode | null {
    return this.ensure() ? this.ctx!.destination : null;
  }

  private blip(
    ctx: AudioContext,
    at: number,
    freq: number,
    dur: number,
    gain: number,
    type: OscillatorType = 'square',
  ): void {
    if (!this.bus) {
      return;
    }
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, at);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.42), at + dur);
    amp.gain.setValueAtTime(gain, at);
    amp.gain.exponentialRampToValueAtTime(0.001, at + dur);
    osc.connect(amp);
    amp.connect(this.bus);
    osc.start(at);
    osc.stop(at + dur + 0.02);
  }

  private thud(ctx: AudioContext, at: number, dur: number, gain: number, cutoff: number): void {
    if (!this.bus || !this.noise) {
      return;
    }
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, at);
    filter.frequency.exponentialRampToValueAtTime(Math.max(60, cutoff * 0.35), at + dur);
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(gain, at);
    amp.gain.exponentialRampToValueAtTime(0.001, at + dur);
    src.connect(filter);
    filter.connect(amp);
    amp.connect(this.bus);
    src.start(at);
    src.stop(at + dur + 0.02);
  }

  private whoosh(
    ctx: AudioContext,
    at: number,
    dur: number,
    gain: number,
    cutoff: number,
  ): void {
    if (!this.bus || !this.noise) {
      return;
    }
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 1.4;
    filter.frequency.setValueAtTime(cutoff * 0.45, at);
    filter.frequency.exponentialRampToValueAtTime(cutoff, at + dur * 0.45);
    filter.frequency.exponentialRampToValueAtTime(cutoff * 0.3, at + dur);
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0.001, at);
    amp.gain.exponentialRampToValueAtTime(gain, at + dur * 0.2);
    amp.gain.exponentialRampToValueAtTime(0.001, at + dur);
    src.connect(filter);
    filter.connect(amp);
    amp.connect(this.bus);
    src.start(at);
    src.stop(at + dur + 0.02);
  }
}

function makeNoise(ctx: AudioContext, seconds: number): AudioBuffer {
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

export const sfx = new Sfx();
