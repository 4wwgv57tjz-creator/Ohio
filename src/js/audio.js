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

// Båndpass-filtrert støy som sveiper fra én frekvens til en annen (sus, vind og «whoosh»)
function sweep(dur, { vol = 0.25, from = 400, to = 3000, delay = 0, q = 1.2 } = {}) {
  if (!ctx || !enabled) return;
  noise(0.001, { vol: 0.0001 }); // sørger for at støybufferen finnes
  const t0 = ctx.currentTime + delay;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass';
  f.Q.value = q;
  f.frequency.setValueAtTime(from, t0);
  f.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + dur * 0.4);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f).connect(g).connect(master);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
}
const sparkle = (n = 6, delay = 0) => { for (let i = 0; i < n; i++) tone(1800 + Math.random() * 1600, 0.07, { type: 'triangle', vol: 0.06, delay: delay + i * 0.05 }); };

export const sfx = {
  // ----- grensesnitt -----
  pop() { tone(420, 0.09, { type: 'sine', vol: 0.16, slide: 520 }); },
  swish() { sweep(0.18, { vol: 0.16, from: 900, to: 3800 }); },
  tab() { tone(740, 0.035, { type: 'triangle', vol: 0.12 }); tone(1110, 0.05, { type: 'triangle', vol: 0.1, delay: 0.035 }); },
  whoosh() { sweep(0.45, { vol: 0.18, from: 2500, to: 300 }); },
  equip() {
    noise(0.04, { vol: 0.2, freq: 4000 });
    tone(523, 0.07, { type: 'square', vol: 0.1, delay: 0.02 });
    tone(784, 0.08, { type: 'square', vol: 0.1, delay: 0.08 });
    [1568, 2093, 2637].forEach((f, i) => tone(f, 0.1, { type: 'triangle', vol: 0.07, delay: 0.16 + i * 0.05 }));
  },
  // ----- kasser -----
  crateShake() { [0, 0.12, 0.24].forEach((d) => noise(0.07, { vol: 0.22, freq: 700, delay: d })); tone(110, 0.12, { type: 'sine', vol: 0.25, slide: -30 }); },
  crateOpen() { sweep(0.35, { vol: 0.22, from: 300, to: 3500 }); tone(160, 0.25, { type: 'sine', vol: 0.3, slide: -90, delay: 0.25 }); noise(0.2, { vol: 0.25, freq: 2500, delay: 0.25 }); },
  // avsløring – større lyd jo sjeldnere skinnet er (0 = vanlig … 4 = mytisk)
  reveal(rank = 0) {
    if (rank <= 0) { tone(880, 0.12, { type: 'triangle', vol: 0.16 }); tone(1320, 0.16, { type: 'triangle', vol: 0.12, delay: 0.08 }); return; }
    if (rank === 1) { [988, 1319, 1760].forEach((f, i) => tone(f, 0.12, { type: 'triangle', vol: 0.15, delay: i * 0.07 })); sparkle(4, 0.2); return; }
    if (rank === 2) { [659, 831, 988, 1319].forEach((f, i) => tone(f, 0.14, { type: 'square', vol: 0.11, delay: i * 0.08 })); tone(1319, 0.4, { type: 'triangle', vol: 0.12, delay: 0.32 }); sparkle(6, 0.3); return; }
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i === 3 ? 0.5 : 0.13, { type: 'square', vol: 0.13, delay: i * 0.1 }));
    [262, 330, 392].forEach((f) => tone(f, 0.6, { type: 'triangle', vol: 0.12, delay: 0.3 }));
    sparkle(10, 0.35);
    if (rank >= 4) { [1047, 1319, 1568, 2093].forEach((f) => tone(f, 0.7, { type: 'triangle', vol: 0.08, delay: 0.75 })); sparkle(10, 0.8); }
  },
  // ----- basen -----
  // generalen «prater» når den sier noe (Drip mørkt og kult, Buckeye midt på, Zorgon romvesen-vibrato)
  talk(gen = 'drip') {
    const [lo, hi, type] = gen === 'drip' ? [170, 300, 'square'] : gen === 'zorgon' ? [380, 760, 'sine'] : [300, 520, 'triangle'];
    for (let i = 0; i < 5; i++) tone(lo + Math.random() * (hi - lo), 0.05, { type, vol: 0.06, delay: i * 0.075, slide: gen === 'zorgon' ? 120 : 0 });
  },
  citizen(kind) {
    switch (kind) {
      case 'goose': tone(330, 0.14, { type: 'sawtooth', vol: 0.13, slide: -80 }); tone(310, 0.16, { type: 'sawtooth', vol: 0.13, slide: -90, delay: 0.18 }); break;
      case 'robot': [880, 660, 990, 740].forEach((f, i) => tone(f, 0.06, { type: 'square', vol: 0.09, delay: i * 0.07 })); break;
      case 'alien': tone(500, 0.25, { type: 'sine', vol: 0.14, slide: 400 }); tone(900, 0.25, { type: 'sine', vol: 0.12, slide: -500, delay: 0.22 }); break;
      case 'kid': [1200, 1450, 1300, 1550].forEach((f, i) => tone(f, 0.05, { type: 'triangle', vol: 0.11, delay: i * 0.06 })); break;
      case 'granny': tone(392, 0.2, { type: 'sine', vol: 0.14, slide: 80 }); tone(330, 0.25, { type: 'sine', vol: 0.12, delay: 0.2 }); break;
      case 'farmer': tone(1100, 0.12, { type: 'sine', vol: 0.12, slide: 400 }); tone(1500, 0.18, { type: 'sine', vol: 0.12, slide: -300, delay: 0.14 }); break;
      case 'chef': tone(1480, 0.25, { type: 'square', vol: 0.06 }); tone(2220, 0.25, { type: 'triangle', vol: 0.06 }); noise(0.05, { vol: 0.2, freq: 5000 }); break;
      case 'soldier': [392, 523, 659].forEach((f, i) => tone(f, i === 2 ? 0.22 : 0.09, { type: 'square', vol: 0.11, delay: i * 0.1 })); break;
      case 'mayor': tone(196, 0.12, { type: 'sawtooth', vol: 0.08, slide: 40 }); tone(220, 0.16, { type: 'sawtooth', vol: 0.08, delay: 0.14 }); break;
      case 'scientist': for (let i = 0; i < 6; i++) tone(500 + Math.random() * 500, 0.05, { type: 'sine', vol: 0.09, slide: 300, delay: i * 0.06 }); break;
      default: tone(660, 0.08, { type: 'triangle', vol: 0.12 });
    }
  },
  good() { [523, 659, 784].forEach((f, i) => tone(f, 0.1, { type: 'square', vol: 0.12, delay: i * 0.09 })); tone(1047, 0.45, { type: 'square', vol: 0.12, delay: 0.27 }); tone(523, 0.45, { type: 'triangle', vol: 0.12, delay: 0.27 }); },
  bad() { tone(311, 0.3, { type: 'sawtooth', vol: 0.11, slide: -20 }); tone(294, 0.3, { type: 'sawtooth', vol: 0.11, slide: -20, delay: 0.32 }); tone(277, 0.6, { type: 'sawtooth', vol: 0.11, slide: -60, delay: 0.64 }); },
  daily() { [784, 988, 1175, 1568, 2093].forEach((f, i) => tone(f, 0.12, { type: 'triangle', vol: 0.15, delay: i * 0.07 })); tone(1568, 0.5, { type: 'triangle', vol: 0.1, delay: 0.38 }); sparkle(6, 0.4); },
  drop() { tone(1400, 0.6, { type: 'sine', vol: 0.06, slide: -900 }); },
  powerup() { tone(300, 0.35, { type: 'sine', vol: 0.15, slide: 900 }); tone(1319, 0.2, { type: 'triangle', vol: 0.13, delay: 0.32 }); sparkle(4, 0.4); },
  expire() { [784, 659, 523].forEach((f, i) => tone(f, 0.1, { type: 'triangle', vol: 0.1, delay: i * 0.1 })); },
  // ----- kamp -----
  hit() { noise(0.08, { vol: 0.3, freq: 1800 }); tone(180, 0.1, { type: 'sine', vol: 0.25, slide: -80 }); },
  shield() { tone(523, 0.3, { type: 'triangle', vol: 0.15, slide: 260 }); tone(784, 0.35, { type: 'triangle', vol: 0.12, slide: 390, delay: 0.04 }); sparkle(4, 0.12); },
  shieldUp() { sweep(0.3, { vol: 0.14, from: 500, to: 3000 }); tone(440, 0.3, { type: 'sine', vol: 0.12, slide: 440 }); },
  alarm() { [0, 0.22].forEach((d) => { tone(700, 0.11, { type: 'square', vol: 0.11, slide: 250, delay: d }); tone(950, 0.11, { type: 'square', vol: 0.11, slide: -250, delay: d + 0.11 }); }); },
  laser() { tone(2200, 0.7, { type: 'sawtooth', vol: 0.08, slide: -1900 }); tone(1100, 0.7, { type: 'square', vol: 0.05, slide: -900 }); },
  nuts() { for (let i = 0; i < 8; i++) { tone(300 + Math.random() * 400, 0.04, { type: 'square', vol: 0.09, delay: i * 0.05 }); noise(0.03, { vol: 0.15, freq: 2000, delay: i * 0.05 }); } },
  bribe() { noise(0.05, { vol: 0.2, freq: 3000 }); tone(1568, 0.1, { type: 'square', vol: 0.1, delay: 0.05 }); tone(2093, 0.3, { type: 'triangle', vol: 0.12, delay: 0.12 }); },
  // skytelyd for hver troppetype (og fiendens skudd)
  gun(unit) {
    switch (unit) {
      case 'militia': noise(0.09, { vol: 0.22, freq: 1600 }); tone(240, 0.08, { type: 'square', vol: 0.06, slide: -140 }); break; // gammelt gevær
      case 'hunter': noise(0.2, { vol: 0.3, freq: 2600 }); tone(120, 0.15, { type: 'sine', vol: 0.18, slide: -60 }); break; // hagle
      case 'truck': for (let i = 0; i < 5; i++) noise(0.035, { vol: 0.2, freq: 2200, delay: i * 0.055 }); break; // maskingevær
      case 'soldier': for (let i = 0; i < 3; i++) { noise(0.04, { vol: 0.2, freq: 3500, delay: i * 0.08 }); tone(900, 0.03, { type: 'square', vol: 0.04, slide: -600, delay: i * 0.08 }); } break; // automatgevær
      case 'tank': tone(70, 0.4, { type: 'sine', vol: 0.32, slide: -35 }); noise(0.35, { vol: 0.32, freq: 900 }); break; // kanon
      case 'heli': for (let i = 0; i < 9; i++) noise(0.022, { vol: 0.16, freq: 3000, delay: i * 0.032 }); break; // minigun
      case 'jet': sweep(0.3, { vol: 0.16, from: 600, to: 3200 }); noise(0.18, { vol: 0.24, freq: 1800, delay: 0.26 }); break; // rakett
      case 'ship': tone(55, 0.6, { type: 'sine', vol: 0.32, slide: -20 }); noise(0.5, { vol: 0.3, freq: 700 }); tone(110, 0.3, { type: 'triangle', vol: 0.1, slide: -50 }); break; // skipskanon
      case 'drone': tone(520, 0.14, { type: 'square', vol: 0.07, slide: 700 }); tone(1300, 0.08, { type: 'sawtooth', vol: 0.06, slide: -900, delay: 0.1 }); break; // summende zap
      case 'carrier': sweep(0.5, { vol: 0.18, from: 400, to: 4000 }); tone(180, 0.5, { type: 'sawtooth', vol: 0.04, slide: 300 }); break; // fly letter
      case 'mech': tone(90, 0.12, { type: 'square', vol: 0.12, slide: -40 }); tone(70, 0.35, { type: 'sine', vol: 0.28, slide: -30, delay: 0.12 }); noise(0.3, { vol: 0.28, freq: 1100, delay: 0.12 }); break; // skritt og kanon
      case 'rocket': sweep(0.55, { vol: 0.2, from: 200, to: 2400 }); noise(0.3, { vol: 0.3, freq: 1500, delay: 0.5 }); break; // rakettbatteri
      case 'spacemarine': tone(1800, 0.09, { type: 'square', vol: 0.07, slide: -1200 }); tone(1700, 0.09, { type: 'square', vol: 0.07, slide: -1100, delay: 0.11 }); break; // lasergevær
      case 'spacefighter': for (let i = 0; i < 3; i++) tone(1300, 0.08, { type: 'sawtooth', vol: 0.06, slide: -1000, delay: i * 0.09 }); break; // blaster
      case 'laser': tone(880, 0.4, { type: 'sawtooth', vol: 0.06, slide: 120 }); tone(1760, 0.4, { type: 'sine', vol: 0.06, slide: -200 }); break; // laserkanon
      case 'megamech': tone(45, 0.7, { type: 'sine', vol: 0.34, slide: -15 }); noise(0.55, { vol: 0.34, freq: 1200 }); tone(1500, 0.2, { type: 'square', vol: 0.04, delay: 0.05 }); break; // megakanon
      case 'ohiostar': sweep(0.4, { vol: 0.14, from: 3000, to: 600 }); [784, 988, 1175].forEach((f, i) => tone(f, 0.25, { type: 'triangle', vol: 0.06, delay: 0.05 + i * 0.05 })); break; // kosmisk stråle
      case 'foe': noise(0.08, { vol: 0.14, freq: 700 }); tone(160, 0.08, { type: 'square', vol: 0.04, slide: -60 }); break; // fiendens skudd
      default: noise(0.08, { vol: 0.2, freq: 2000 });
    }
  },
  star(i = 1) { const k = Math.pow(1.26, i - 1); tone(880 * k, 0.18, { type: 'triangle', vol: 0.16 }); tone(1760 * k, 0.12, { type: 'triangle', vol: 0.06, delay: 0.03 }); },
  // ----- fra før -----
  // tonen stiger med kombotrinnet
  tap(tier = 0) { tone(620 + tier * 90 + Math.random() * 120, 0.07, { type: 'triangle', vol: 0.22, slide: 260 }); },
  crit(mega = false) {
    tone(mega ? 1568 : 1319, 0.08, { type: 'square', vol: 0.14 });
    tone(mega ? 2093 : 1760, 0.16, { type: 'square', vol: 0.13, delay: 0.06 });
    noise(mega ? 0.3 : 0.14, { vol: mega ? 0.35 : 0.2, freq: 3000 });
    if (mega) [1047, 1319, 1568, 2093].forEach((f, i) => tone(f, 0.12, { type: 'triangle', vol: 0.12, delay: 0.14 + i * 0.07 }));
  },
  comboUp(tier = 1) { [0, 1, 2].forEach((i) => tone(523 * Math.pow(1.26, tier + i * 0.5), 0.09, { type: 'square', vol: 0.11, delay: i * 0.06 })); },
  event() { tone(880, 0.12, { type: 'triangle', vol: 0.2 }); tone(1175, 0.18, { type: 'triangle', vol: 0.2, delay: 0.14 }); tone(988, 0.24, { type: 'triangle', vol: 0.16, delay: 0.3 }); },
  buy() { tone(660, 0.08, { type: 'square', vol: 0.14 }); tone(990, 0.12, { type: 'square', vol: 0.14, delay: 0.07 }); },
  recruit() { tone(330, 0.07, { type: 'square', vol: 0.16 }); tone(495, 0.1, { type: 'square', vol: 0.16, delay: 0.06 }); },
  nope() { tone(180, 0.16, { type: 'sawtooth', vol: 0.12, slide: -60 }); },
  coin() { tone(988, 0.06, { type: 'square', vol: 0.12 }); tone(1319, 0.18, { type: 'square', vol: 0.12, delay: 0.06 }); },
  click() { tone(880, 0.04, { type: 'triangle', vol: 0.15 }); },
  warn() { tone(740, 0.1, { type: 'square', vol: 0.13 }); tone(554, 0.14, { type: 'square', vol: 0.13, delay: 0.13 }); },
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
