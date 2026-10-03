/**
 * The SyncOut confirmation chime — a rising two-note "ssssync-outttt" with a
 * sparkle tail. Pure Web Audio, no files. Respects a muted preference and the
 * browser's autoplay rules (only plays after the user has interacted, which a
 * booking always is).
 */
let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

export function soundEnabled(): boolean {
  try {
    return localStorage.getItem("so_sound") !== "off";
  } catch {
    return true;
  }
}

export function setSoundEnabled(on: boolean) {
  try {
    localStorage.setItem("so_sound", on ? "on" : "off");
  } catch {}
}

/** A confident rising chime for a successful booking / confirmation. */
export function playConfirm() {
  if (!soundEnabled()) return;
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime;
  const master = ac.createGain();
  master.gain.value = 0.0001;
  master.connect(ac.destination);
  master.gain.setValueAtTime(0.0001, t0);
  master.gain.exponentialRampToValueAtTime(0.5, t0 + 0.02);
  master.gain.exponentialRampToValueAtTime(0.28, t0 + 0.9);
  master.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.7);

  // "sssync" — a soft airy swell rising into the first note
  const noise = ac.createBufferSource();
  const buf = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  noise.buffer = buf;
  const nf = ac.createBiquadFilter();
  nf.type = "bandpass";
  nf.frequency.setValueAtTime(1200, t0);
  nf.frequency.exponentialRampToValueAtTime(3200, t0 + 0.35);
  nf.Q.value = 6;
  const ng = ac.createGain();
  ng.gain.setValueAtTime(0.0001, t0);
  ng.gain.exponentialRampToValueAtTime(0.1, t0 + 0.14);
  ng.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.42);
  noise.connect(nf).connect(ng).connect(master);
  noise.start(t0);
  noise.stop(t0 + 0.5);

  // two warm notes rising: "sync" → "out"
  const note = (freq: number, start: number, dur: number, gain = 0.5) => {
    const o = ac.createOscillator();
    const o2 = ac.createOscillator();
    const g = ac.createGain();
    o.type = "triangle";
    o2.type = "sine";
    o.frequency.setValueAtTime(freq, start);
    o2.frequency.setValueAtTime(freq * 2, start);
    o.frequency.exponentialRampToValueAtTime(freq * 1.01, start + dur);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(gain, start + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g);
    o2.connect(g);
    g.connect(master);
    o.start(start);
    o2.start(start);
    o.stop(start + dur);
    o2.stop(start + dur);
  };
  note(523.25, t0 + 0.12, 0.42, 0.45); // C5 — "sync"
  note(783.99, t0 + 0.42, 0.95, 0.5); // G5 — "outttt" (held, with the tail)

  // a little sparkle on the tail
  [1046.5, 1318.5, 1568].forEach((f, i) => note(f, t0 + 0.7 + i * 0.07, 0.5, 0.12));
}
