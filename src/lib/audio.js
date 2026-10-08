// Web Audio API Sound Synthesizer for Pulse KPRIET
// Generates emergency sirens, dispatch tones, and alerts without external audio files.

let audioCtx = null;
let currentAlarmInterval = null;
let currentOscillators = [];

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Plays high-urgency alternating two-tone emergency alarm
 */
export function playEmergencyAlarm() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    stopEmergencyAlarm();

    let toggle = false;
    const playTone = () => {
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        const freq = toggle ? 880 : 587.33; // A5 / D5 high-urgency cadence
        toggle = !toggle;

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } catch (e) {
        console.warn('Audio tone error:', e);
      }
    };

    playTone();
    currentAlarmInterval = setInterval(playTone, 400);
  } catch (err) {
    console.warn('Could not start emergency alarm:', err);
  }
}

/**
 * Stops ongoing emergency alarm
 */
export function stopEmergencyAlarm() {
  if (currentAlarmInterval) {
    clearInterval(currentAlarmInterval);
    currentAlarmInterval = null;
  }
  currentOscillators.forEach((osc) => {
    try {
      osc.stop();
    } catch (_) {}
  });
  currentOscillators = [];
}

/**
 * Plays affirmative dispatch tone when SOS is activated
 */
export function playDispatchSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (err) {
    console.warn('Dispatch sound failed:', err);
  }
}

/**
 * Plays resolution success chime
 */
export function playSuccessChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const freqs = [523.25, 659.25, 783.99, 1046.50]; // C Major chord arpeggio
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

      gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.08);
      osc.stop(ctx.currentTime + idx * 0.08 + 0.45);
    });
  } catch (err) {
    console.warn('Success chime failed:', err);
  }
}
