// Zero-dependency Procedural Web Audio Sound Engine for 2D Game UI
let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
};

// Mute state
let muted = false;
if (typeof window !== "undefined") {
  muted = localStorage.getItem("matik_sound_muted") === "true";
}

const listeners = new Set<(muted: boolean) => void>();

export const isSoundMuted = (): boolean => muted;

export const toggleSoundMute = (): boolean => {
  muted = !muted;
  if (typeof window !== "undefined") {
    localStorage.setItem("matik_sound_muted", String(muted));
  }
  listeners.forEach((fn) => fn(muted));
  return muted;
};

export const subscribeSoundMute = (fn: (muted: boolean) => void): (() => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

// Play a single tone with envelope
const playTone = (
  freq: number,
  type: OscillatorType,
  duration: number,
  gainLevel = 0.15,
  freqEnd?: number
) => {
  if (muted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (freqEnd !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), ctx.currentTime + duration);
    }

    gain.gain.setValueAtTime(gainLevel, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (err) {
    console.debug("Audio playTone error:", err);
  }
};

/**
 * 2D Game UI Sound Effects
 */
export const SoundFX = {
  // Mechanical tactile button click
  click: () => {
    playTone(550, "triangle", 0.05, 0.18, 180);
  },

  // Subtle button hover
  hover: () => {
    playTone(880, "sine", 0.02, 0.04);
  },

  // Correct answer chime (rising arpeggio)
  correct: () => {
    if (muted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, index) => {
      setTimeout(() => {
        playTone(freq, "sine", 0.12, 0.15);
      }, index * 40);
    });
  },

  // Incorrect answer thud
  wrong: () => {
    playTone(160, "sawtooth", 0.2, 0.2, 70);
  },

  // Match start / found gong
  matchStart: () => {
    if (muted) return;
    playTone(440, "triangle", 0.15, 0.2);
    setTimeout(() => {
      playTone(880, "triangle", 0.35, 0.25);
    }, 120);
  },

  // Victory fanfare
  victory: () => {
    if (muted) return;
    const fanfare = [
      { f: 523.25, d: 0.1, t: 0 },
      { f: 659.25, d: 0.1, t: 100 },
      { f: 783.99, d: 0.12, t: 200 },
      { f: 1046.5, d: 0.45, t: 320 },
    ];
    fanfare.forEach((n) => {
      setTimeout(() => {
        playTone(n.f, "triangle", n.d, 0.22);
      }, n.t);
    });
  },

  // Defeat descending sequence
  defeat: () => {
    if (muted) return;
    const sequence = [
      { f: 400, d: 0.15, t: 0 },
      { f: 340, d: 0.18, t: 140 },
      { f: 280, d: 0.35, t: 300 },
    ];
    sequence.forEach((n) => {
      setTimeout(() => {
        playTone(n.f, "sawtooth", n.d, 0.18);
      }, n.t);
    });
  },
};
