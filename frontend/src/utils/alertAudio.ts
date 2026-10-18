let audioCtx: AudioContext | null = null;
let isPlaying = false;
let timeoutId: number | null = null;

export function playSecurityAlarm(cycles = 5, onComplete?: () => void) {
  if (isPlaying) return;
  isPlaying = true;

  try {
    const AudioCtxClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioCtxClass();
    const startTime = audioCtx.currentTime;

    for (let i = 0; i < cycles; i++) {
      const cycleStart = startTime + i * 0.9;

      // High Tone (880Hz)
      createTone(880, cycleStart, 0.4);
      // Low Tone (660Hz)
      createTone(660, cycleStart + 0.45, 0.4);
    }

    timeoutId = window.setTimeout(() => {
      stopSecurityAlarm();
      onComplete?.();
    }, cycles * 900);
  } catch (err) {
    console.warn("AudioContext playback not allowed or supported:", err);
    timeoutId = window.setTimeout(() => {
      stopSecurityAlarm();
      onComplete?.();
    }, cycles * 900);
  }
}

function createTone(freq: number, start: number, duration: number) {
  if (!audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, start);

    // Smooth attack/decay to prevent audio pop
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.exponentialRampToValueAtTime(0.2, start + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(start);
    osc.stop(start + duration);
  } catch {
    // Ignore oscillator errors if context state changed
  }
}

export function stopSecurityAlarm() {
  isPlaying = false;
  if (timeoutId !== null) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
  if (audioCtx && audioCtx.state !== "closed") {
    try {
      audioCtx.close();
    } catch {
      // Ignore closing errors
    }
    audioCtx = null;
  }
}
