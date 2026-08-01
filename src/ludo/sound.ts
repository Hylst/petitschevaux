// Premium Procedural Audio Engine using Web Audio API

class SoundSystem {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicPlaying: boolean = false;
  private isMusicMuted: boolean = false;
  private isSfxMuted: boolean = false;
  private musicLoopId: number | null = null;

  constructor() {
    // Lazy initialization on first user interaction
  }

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.isMusicMuted ? 0 : 0.2;
      this.musicGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.isSfxMuted ? 0 : 0.6;
      this.sfxGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public toggleMusic(): boolean {
    this.init();
    this.isMusicMuted = !this.isMusicMuted;
    if (this.musicGain) {
      this.musicGain.gain.setValueAtTime(this.isMusicMuted ? 0 : 0.2, this.ctx!.currentTime);
    }
    if (!this.musicPlaying && !this.isMusicMuted) {
      this.startMusic();
    }
    return !this.isMusicMuted;
  }

  public toggleSfx(): boolean {
    this.init();
    this.isSfxMuted = !this.isSfxMuted;
    if (this.sfxGain) {
      this.sfxGain.gain.setValueAtTime(this.isSfxMuted ? 0 : 0.6, this.ctx!.currentTime);
    }
    return !this.isSfxMuted;
  }

  public setVolumes(musicVol: number, sfxVol: number) {
    this.init();
    if (this.musicGain) {
      this.musicGain.gain.setValueAtTime(this.isMusicMuted ? 0 : musicVol, this.ctx!.currentTime);
    }
    if (this.sfxGain) {
      this.sfxGain.gain.setValueAtTime(this.isSfxMuted ? 0 : sfxVol, this.ctx!.currentTime);
    }
  }

  public getStatus() {
    return {
      music: !this.isMusicMuted,
      sfx: !this.isSfxMuted,
    };
  }

  // Beautiful Generative Relaxing Ambient Lounge Music
  public startMusic() {
    this.init();
    if (this.musicPlaying) return;
    this.musicPlaying = true;

    const chords = [
      [261.63, 329.63, 392.00, 493.88], // C maj7
      [220.00, 261.63, 329.63, 392.00], // A min7
      [174.61, 220.00, 261.63, 329.63], // F maj7
      [196.00, 246.94, 293.66, 349.23], // G 7
    ];

    let step = 0;
    let arpeggioIdx = 0;

    const playChord = () => {
      if (!this.musicPlaying || !this.ctx || !this.musicGain) return;

      const now = this.ctx.currentTime;
      const currentChord = chords[step % chords.length];

      // Play soft ambient pad
      currentChord.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const filter = this.ctx!.createBiquadFilter();

        osc.type = idx % 2 === 0 ? "sine" : "triangle";
        osc.frequency.setValueAtTime(freq * 0.5, now); // lower octave for warmth

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(400 + Math.sin(now * 0.5) * 150, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.04 / currentChord.length, now + 1.5);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 3.8);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain!);

        osc.start(now);
        osc.stop(now + 4);
      });

      // Play delicate marimba/harp arpeggio note
      const arpFreq = currentChord[arpeggioIdx % currentChord.length];
      const arpOsc = this.ctx.createOscillator();
      const arpGain = this.ctx.createGain();

      arpOsc.type = "sine";
      arpOsc.frequency.setValueAtTime(arpFreq * 2, now); // two octaves up

      arpGain.gain.setValueAtTime(0, now);
      arpGain.gain.linearRampToValueAtTime(0.02, now + 0.05);
      arpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

      arpOsc.connect(arpGain);
      arpGain.connect(this.musicGain);

      arpOsc.start(now);
      arpOsc.stop(now + 1);

      arpeggioIdx++;
      if (arpeggioIdx % 4 === 0) {
        step++;
      }

      this.musicLoopId = window.setTimeout(playChord, 1000);
    };

    playChord();
  }

  public stopMusic() {
    this.musicPlaying = false;
    if (this.musicLoopId !== null) {
      clearTimeout(this.musicLoopId);
      this.musicLoopId = null;
    }
  }

  // SFX: Crisp UI Button Click
  public playClick() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isSfxMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  // SFX: Realistic Dice Rolling sound (bouncing clatter)
  public playDiceRoll() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isSfxMuted) return;

    const now = this.ctx.currentTime;
    const bounces = [0, 0.12, 0.22, 0.3, 0.36, 0.4];

    bounces.forEach((delay, idx) => {
      const time = now + delay;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      // Pitch slightly changes on each bounce
      const pitch = 300 + Math.random() * 150 + idx * 50;
      osc.type = "triangle";
      osc.frequency.setValueAtTime(pitch, time);
      osc.frequency.exponentialRampToValueAtTime(pitch * 0.5, time + 0.04);

      gain.gain.setValueAtTime(0.3 * (1 - idx / bounces.length), time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(time);
      osc.stop(time + 0.05);
    });
  }

  // SFX: Satisfying step token movement tap
  public playMoveStep(pitchOffset: number = 0) {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isSfxMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(450 + pitchOffset * 25, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.08);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  // SFX: Triumphant Opponent Capture
  public playCapture() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isSfxMuted) return;

    const now = this.ctx.currentTime;

    // Dramatic pitch sweep down + explosion
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.35);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    // Noise component for smash impact
    const bufferSize = this.ctx.sampleRate * 0.2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(800, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    whiteNoise.start(now);
    osc.stop(now + 0.36);
  }

  // SFX: Token get out of Yard / Sparkle
  public playSpawn() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isSfxMuted) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

    notes.forEach((freq, idx) => {
      const time = now + idx * 0.08;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.25, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(time);
      osc.stop(time + 0.31);
    });
  }

  // SFX: Token enters Home safely
  public playHomeEnter() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isSfxMuted) return;

    const now = this.ctx.currentTime;
    const notes = [587.33, 739.99, 880.00, 1174.66]; // D5, F#5, A5, D6

    notes.forEach((freq, idx) => {
      const time = now + idx * 0.1;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(time);
      osc.stop(time + 0.45);
    });
  }

  // SFX: Victory Fanfare
  public playVictory() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isSfxMuted) return;

    const now = this.ctx.currentTime;
    // Triumphant Fanfare: C5, G5, C6, E6, G6, C7
    const notes = [
      { f: 523.25, t: 0, d: 0.2 },
      { f: 783.99, t: 0.2, d: 0.2 },
      { f: 1046.50, t: 0.4, d: 0.2 },
      { f: 1318.51, t: 0.6, d: 0.2 },
      { f: 1046.50, t: 0.8, d: 0.15 },
      { f: 1567.98, t: 1.0, d: 0.8 },
    ];

    notes.forEach(({ f, t, d }) => {
      const time = now + t;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(f, time);

      // Add a slight filter for premium brassy sound
      const filter = this.ctx!.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(f * 2.5, time);

      gain.gain.setValueAtTime(0.25, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + d);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(time);
      osc.stop(time + d + 0.05);
    });
  }
}

export const sound = new SoundSystem();
