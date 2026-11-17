// Små lydeffekter laget med Web Audio (ingen lydfiler)
let ctx = null;
let enabled = true;
let master = null;

export function setSound(on) { enabled = on; }
export function unlockAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume().catch(() => {}); return; }
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.32;
    master.connect(ctx.destination);
  } catch { ctx = null; }
}

function tone(freq, dur, { type = 'square', vol = 0.3, slide = 0, delay = 0, attack = 0.005 } = {}) {
  if (!ctx || !enabled) return;
  const t0 = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(master);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}
let noiseBuf = null;
function noise(dur, { vol = 0.4, freq = 900, delay = 0 } = {}) {
  if (!ctx || !enabled) return;
  if (!noiseBuf) {
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t0 = ctx.currentTime + delay;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.setValueAtTime(freq, t0);
  f.frequency.exponentialRampToValueAtTime(80, t0 + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f).connect(g).connect(master);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
}

export const sfx = {
  tap() { tone(620 + Math.random() * 120, 0.07, { type: 'triangle', vol: 0.22, slide: 260 }); },
  buy() { tone(660, 0.08, { type: 'square', vol: 0.14 }); tone(990, 0.12, { type: 'square', vol: 0.14, delay: 0.07 }); },
  recruit() { tone(330, 0.07, { type: 'square', vol: 0.16 }); tone(495, 0.1, { type: 'square', vol: 0.16, delay: 0.06 }); },
  nope() { tone(180, 0.16, { type: 'sawtooth', vol: 0.12, slide: -60 }); },
  coin() { tone(988, 0.06, { type: 'square', vol: 0.12 }); tone(1319, 0.18, { type: 'square', vol: 0.12, delay: 0.06 }); },
  click() { tone(880, 0.04, { type: 'triangle', vol: 0.15 }); },
  boom() { noise(0.45, { vol: 0.5, freq: 1400 }); tone(90, 0.3, { type: 'sine', vol: 0.4, slide: -50 }); },
  pew() { tone(1400, 0.12, { type: 'square', vol: 0.08, slide: -1100 }); },
  march() { noise(0.06, { vol: 0.25, freq: 500 }); },
  victory() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i === 3 ? 0.5 : 0.14, { type: 'square', vol: 0.16, delay: i * 0.12 })); },
  defeat() { [392, 370, 349, 262].forEach((f, i) => tone(f, i === 3 ? 0.6 : 0.22, { type: 'triangle', vol: 0.22, delay: i * 0.22 })); },
  fanfare() {
    const n = [523, 523, 523, 659, 784, 659, 784, 1047];
    const d = [0, 0.12, 0.24, 0.36, 0.6, 0.84, 0.96, 1.2];
    n.forEach((f, i) => tone(f, i === 7 ? 0.8 : 0.16, { type: 'square', vol: 0.15, delay: d[i] }));
    n.forEach((f, i) => tone(f / 2, i === 7 ? 0.8 : 0.16, { type: 'triangle', vol: 0.18, delay: d[i] }));
  },
  crate() { [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.1, { type: 'triangle', vol: 0.16, delay: i * 0.06 })); },
  milestone() { [660, 880, 1100].forEach((f, i) => tone(f, 0.12, { type: 'square', vol: 0.12, delay: i * 0.08 })); },
};

export function buzz(ms = 10) {
  try { if (navigator.vibrate) navigator.vibrate(ms); } catch { /* ikke støttet */ }
}
