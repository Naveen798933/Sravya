// Web Audio API Sound Synthesizer & Manager
// Zero external file dependencies - 100% reliable synthesized audio

class SoundManager {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private isMusicPlaying = false;
  private musicTimer: number | null = null;
  private musicEnabled = true;
  private soundEnabled = true;

  constructor() {
    // Load persisted settings
    const savedMusic = localStorage.getItem('sravya_bday_music');
    const savedSound = localStorage.getItem('sravya_bday_sound');
    if (savedMusic !== null) this.musicEnabled = savedMusic === 'true';
    if (savedSound !== null) this.soundEnabled = savedSound === 'true';
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();

      this.musicGain.gain.value = this.musicEnabled ? 0.15 : 0;
      this.sfxGain.gain.value = this.soundEnabled ? 0.3 : 0;

      this.musicGain.connect(this.ctx.destination);
      this.sfxGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMusic(): boolean {
    this.musicEnabled = !this.musicEnabled;
    localStorage.setItem('sravya_bday_music', String(this.musicEnabled));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(this.musicEnabled ? 0.15 : 0, this.ctx.currentTime);
    }
    if (this.musicEnabled && !this.isMusicPlaying) {
      this.startMusic();
    }
    return this.musicEnabled;
  }

  public toggleSound(): boolean {
    this.soundEnabled = !this.soundEnabled;
    localStorage.setItem('sravya_bday_sound', String(this.soundEnabled));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.soundEnabled ? 0.3 : 0, this.ctx.currentTime);
    }
    return this.soundEnabled;
  }

  public getMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  public getSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  // Play synthesized magical chime for item pickup
  public playPickup() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Arpeggio up
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.08); // E5
    osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.15); // G5
    osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.22); // C6

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  // Play button click sound
  public playClick() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.05);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  // Play level clear fanfare
  public playLevelClear() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const now = this.ctx.currentTime + idx * 0.09;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.25);
    });
  }

  // Play candle blow / extinction sound
  public playCandleBlow() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    // White noise for wind/smoke blow sound
    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.Q.setValueAtTime(3, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.4);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
  }

  // Play Firework explosion boom & whistle
  public playFirework() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;

    // 1. Whistle rise
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);

    oscGain.gain.setValueAtTime(0.1, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.16);

    // 2. Explosion noise boom
    const burstTime = now + 0.15;
    const bufferSize = this.ctx.sampleRate * 0.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, burstTime);
    filter.frequency.exponentialRampToValueAtTime(60, burstTime + 0.5);

    const burstGain = this.ctx.createGain();
    burstGain.gain.setValueAtTime(0.35, burstTime);
    burstGain.gain.exponentialRampToValueAtTime(0.001, burstTime + 0.5);

    noise.connect(filter);
    filter.connect(burstGain);
    burstGain.connect(this.sfxGain);

    noise.start(burstTime);
  }

  // Start continuous ambient background music (gentle pentatonic synth sequence)
  public startMusic() {
    this.initCtx();
    if (this.isMusicPlaying) return;
    this.isMusicPlaying = true;

    // Pentatonic scale (C4, D4, E4, G4, A4, C5)
    const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 659.25];
    let noteIdx = 0;

    const playNote = () => {
      if (!this.isMusicPlaying || !this.ctx || !this.musicGain || !this.musicEnabled) return;
      const now = this.ctx.currentTime;

      // Select harmony notes
      const baseFreq = scale[noteIdx % scale.length];
      const harmonyFreq = scale[(noteIdx + 2) % scale.length];

      [baseFreq, harmonyFreq].forEach((freq) => {
        if (!this.ctx || !this.musicGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        osc.connect(gain);
        gain.connect(this.musicGain);

        osc.start(now);
        osc.stop(now + 1.2);
      });

      noteIdx = (noteIdx + 1) % scale.length;
    };

    playNote();
    this.musicTimer = window.setInterval(playNote, 600);
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

export const soundManager = new SoundManager();
