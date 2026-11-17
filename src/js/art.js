// Tegneseriegrafikk for hele spillet – alt er håndtegnet som SVG (ingen bildefiler).
// Stil: flate, sterke farger med tykk blålilla kontur (INK).
import { MAPS } from './mapdata.js';

export const INK = '#2b2350';
const st = (w = 3) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const shadow = (cx = 50, cy = 93, rx = 26, ry = 4.5) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#1b1340" opacity=".16"/>`;
const eye = (x, y, r = 3.4, lx = 0.9, ly = 0.2) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" ${st(1.6)}/><circle cx="${x + lx}" cy="${y + ly}" r="${r * 0.52}" fill="${INK}"/>`;
const line = (d, w, c) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w + 3.4}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const star = (cx, cy, r, fill, sw = 2) => {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    d += (i ? 'L' : 'M') + (cx + Math.cos(a) * rr).toFixed(1) + ' ' + (cy + Math.sin(a) * rr).toFixed(1);
  }
  return `<path d="${d}Z" fill="${fill}" ${st(sw)}/>`;
};
let uid = 0;
const nid = (p) => `${p}${++uid}`;

export const wrap = (inner, vb = '0 0 100 100', cls = '') =>
  `<svg viewBox="${vb}" class="${cls}" aria-hidden="true" focusable="false">${inner}</svg>`;

export const TEAMS = {
  me: { main: '#4fb843', dark: '#33862b', light: '#a3e394', acc: '#ffd23f', skin: '#ffd2a8', metal: '#a9b4c6' },
  foe: { main: '#ef5b5b', dark: '#b33b3b', light: '#ffa3a3', acc: '#3d3366', skin: '#f2c19b', metal: '#b1a6bf' },
};

// Spillerens flagg (svalehale-form som Ohio-flagget). Utseendet følger valgt flagg-skin.
let flagDesign = 'ohio';
export const setFlagDesign = (d) => { flagDesign = d || 'ohio'; };
const SWALLOW = 'M0 0h30l-8 9 8 9H0z';
function flagInner(design, red) {
  switch (design) {
    case 'star': return `<rect width="30" height="18" fill="#3a6fe0"/>${star(10, 9, 6.4, '#fff', 1.2)}`;
    case 'forest': return `<rect width="30" height="18" fill="#4fae3c"/><path d="M0 13.5h30" stroke="#2f7d24" stroke-width="5"/><circle cx="9" cy="7" r="3.8" fill="#ffd23f" stroke="${INK}" stroke-width="1.2"/>`;
    case 'pirate': return `<rect width="30" height="18" fill="#2b2d42"/><path d="M5 13l10 3.2M15 13L5 16.2" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/><circle cx="10" cy="7.6" r="3.8" fill="#fff"/><rect x="8.1" y="9.6" width="3.8" height="2.6" rx=".7" fill="#fff"/><circle cx="8.7" cy="7.4" r="1" fill="#2b2d42"/><circle cx="11.3" cy="7.4" r="1" fill="#2b2d42"/>`;
    case 'checker': {
      let r = '<rect width="30" height="18" fill="#fff"/>';
      for (let y = 0; y < 3; y++) for (let x = 0; x < 5; x++) if ((x + y) % 2 === 0) r += `<rect x="${x * 6}" y="${y * 6}" width="6" height="6" fill="#2b2d42"/>`;
      return r;
    }
    case 'norway': return `<rect width="30" height="18" fill="#e5484d"/><path d="M0 9h30M10 0v18" stroke="#fff" stroke-width="5.2"/><path d="M0 9h30M10 0v18" stroke="#2f4fb3" stroke-width="2.6"/>`;
    case 'fire': return `<rect width="30" height="18" fill="#ff5a1f"/><path d="M0 18V10q4-6 6-1 2-7 6-1 3-7 6 0 3-4 6 2l6 8z" fill="#ffd23f"/><path d="M0 18v-4q5-5 8-1 3-5 6 0 4-4 8 1l8 4z" fill="#fff59a"/>`;
    case 'gold': return `<rect width="30" height="18" fill="#ffc62e"/><path d="M0 3.5h30" stroke="#fff3b0" stroke-width="2"/>${star(10, 9.5, 5.4, '#fff', 1.2)}`;
    case 'rainbow': return ['#ff4d6d', '#ff9f1c', '#ffe14d', '#4dd06a', '#4d9fff', '#9a5cff'].map((c, i) => `<rect y="${i * 3}" width="30" height="3.2" fill="${c}"/>`).join('');
    default: return `<rect width="30" height="18" fill="${red}"/><path d="M1 6h22M1 12h22" stroke="#fff" stroke-width="2.2"/><path d="M0 0l15 9L0 18z" fill="#3559d6" ${st(2)}/><circle cx="5.5" cy="9" r="2.6" fill="#fff"/><circle cx="5.5" cy="9" r="1.2" fill="${red}"/>`;
  }
}
export function burgee(x, y, s = 1, red = '#e5484d', design = flagDesign) {
  const id = nid('fl');
  return `<g transform="translate(${x} ${y}) scale(${s})"><defs><clipPath id="${id}"><path d="${SWALLOW}"/></clipPath></defs><g clip-path="url(#${id})">${flagInner(design, red)}</g><path d="${SWALLOW}" fill="none" ${st(2)}/></g>`;
}

export const flagSvg = (cls = 'flag-svg', design) => wrap(burgee(1, 1, 1, '#e5484d', design), '0 0 32 20', cls);

// ================= ENHETER =================
const UNITS = {
  militia: (t) => `${shadow()}
  ${line('M77 32V92', 3.4, '#b07a45')}
  ${line('M67 20v10q0 7 10 7t10-7V20M77 18v19', 2.4, '#d6dde8')}
  <rect x="38" y="72" width="10" height="16" rx="3" fill="${t.dark}" ${st()}/>
  <rect x="52" y="72" width="10" height="16" rx="3" fill="${t.dark}" ${st()}/>
  <path d="M35 92q0-6 4-6h10v6zM51 86h10q4 0 4 6H51z" fill="#6b4a2b" ${st(2.6)}/>
  <rect x="33" y="50" width="34" height="27" rx="10" fill="#e8615d" ${st()}/>
  <path d="M40 52v24M50 52v24M60 52v24M34 63h32" stroke="#c94a47" stroke-width="2"/>
  <path d="M37 59h26v12q0 6-6 6H43q-6 0-6-6z" fill="${t.main}" ${st()}/>
  <path d="M41 59l-2-8M59 59l2-8" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
  <circle cx="44" cy="65" r="1.6" fill="${t.acc}"/><circle cx="56" cy="65" r="1.6" fill="${t.acc}"/>
  ${line('M64 56q9 1 11 8', 4.4, '#e8615d')}
  <circle cx="76" cy="64" r="4.6" fill="${t.skin}" ${st(2.5)}/>
  <circle cx="50" cy="38" r="13" fill="${t.skin}" ${st()}/>
  ${eye(45.5, 37.5)}${eye(55, 37.5)}
  <path d="M46 44q4 3 8 0" fill="none" ${st(2)}/>
  <path d="M55 44.5l9 2.5" stroke="#e7b443" stroke-width="2" stroke-linecap="round"/>
  <ellipse cx="50" cy="28" rx="21" ry="5" fill="#f2c94c" ${st()}/>
  <path d="M39 28q1-12 11-12t11 12z" fill="#f2c94c" ${st()}/>
  <path d="M40.5 24.5h19" stroke="#e5484d" stroke-width="3"/>`,

  hunter: (t) => `${shadow()}
  <rect x="38" y="72" width="10" height="16" rx="3" fill="#4a6fa5" ${st()}/>
  <rect x="52" y="72" width="10" height="16" rx="3" fill="#4a6fa5" ${st()}/>
  <path d="M35 92q0-6 4-6h10v6zM51 86h10q4 0 4 6H51z" fill="#5b3d22" ${st(2.6)}/>
  <rect x="33" y="50" width="34" height="27" rx="10" fill="#6a5440" ${st()}/>
  <path d="M36 54q14-6 28 0v18q0 5-5 5H41q-5 0-5-5z" fill="${t.main}" ${st()}/>
  <path d="M41 62h7v6h-7zM53 62h7v6h-7z" fill="${t.dark}" ${st(2)}/>
  ${line('M28 66l22-4', 4.4, '#8a5a2b')}
  ${line('M50 62l44-8', 3, '#56607a')}
  <circle cx="47" cy="63" r="4.4" fill="${t.skin}" ${st(2.5)}/>
  <circle cx="70" cy="59" r="4.4" fill="${t.skin}" ${st(2.5)}/>
  <circle cx="50" cy="38" r="13" fill="${t.skin}" ${st()}/>
  <path d="M38 41q2 11 12 11t12-11q-6 4-12 3-6 1-12-3z" fill="#8a5a3a" ${st(2.2)}/>
  ${eye(45.5, 37)}${eye(55, 37)}
  <path d="M37 33q0-15 13-15 12 0 13 13z" fill="#ff8a1f" ${st()}/>
  <path d="M60 31h13q2 0 1 3H60z" fill="#ff8a1f" ${st(2.4)}/>
  <circle cx="50" cy="19" r="2.2" fill="#ff8a1f" ${st(1.6)}/>`,

  truck: (t) => `${shadow(50, 93, 42, 4.5)}
  <path d="M30 44l26-14" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>
  <path d="M30 44l26-14" stroke="#56607a" stroke-width="4.4" stroke-linecap="round"/>
  <rect x="18" y="40" width="18" height="10" rx="3" fill="${t.metal}" ${st()}/>
  <path d="M8 64V52q0-3 3-3h38v-9q0-4 4-4h17q4 0 7 4l7 9h6q4 0 4 4v11q0 3-3 3H11q-3 0-3-3z" fill="${t.main}" ${st()}/>
  <path d="M55 41h13q2 0 3 2l5 6H55z" fill="#bfe8ff" ${st(2.4)}/>
  <path d="M10 57h80" stroke="${t.acc}" stroke-width="4"/>
  <path d="M10 57h80" stroke="${INK}" stroke-width="1" opacity=".3"/>
  <circle cx="90" cy="53" r="2.6" fill="#fff6a8" ${st(1.6)}/>
  <path d="M26 66v6M76 66v6" stroke="${INK}" stroke-width="4"/>
  <circle cx="26" cy="76" r="14" fill="#3b3b4f" ${st()}/><circle cx="26" cy="76" r="6" fill="#d6dde8" ${st(2)}/>
  <circle cx="76" cy="76" r="14" fill="#3b3b4f" ${st()}/><circle cx="76" cy="76" r="6" fill="#d6dde8" ${st(2)}/>
  <path d="M16 70l4 2M66 70l4 2M14 82l4-1M64 82l4-1" stroke="#6d6d86" stroke-width="2.4" stroke-linecap="round"/>`,

  soldier: (t) => `${shadow()}
  <rect x="25" y="50" width="12" height="22" rx="4" fill="${t.dark}" ${st()}/>
  <rect x="38" y="72" width="10" height="16" rx="3" fill="${t.dark}" ${st()}/>
  <rect x="52" y="72" width="10" height="16" rx="3" fill="${t.dark}" ${st()}/>
  <path d="M35 92q0-6 4-6h10v6zM51 86h10q4 0 4 6H51z" fill="#2f2b3a" ${st(2.6)}/>
  <rect x="33" y="50" width="34" height="27" rx="10" fill="${t.main}" ${st()}/>
  <path d="M34 68h32" stroke="${t.dark}" stroke-width="4"/>
  <rect x="47" y="65.5" width="6" height="5" rx="1" fill="${t.acc}" ${st(1.4)}/>
  ${line('M34 64l18-2', 4, '#3e3a4f')}
  ${line('M52 62l42-6', 3, '#3e3a4f')}
  <circle cx="48" cy="62.5" r="4.4" fill="${t.skin}" ${st(2.5)}/>
  <circle cx="70" cy="59" r="4.4" fill="${t.skin}" ${st(2.5)}/>
  <circle cx="50" cy="39" r="12.5" fill="${t.skin}" ${st()}/>
  ${eye(45.5, 39)}${eye(55, 39)}
  <path d="M46 45.5h8" ${st(2)}/>
  <path d="M35 37q0-18 15-18t15 18z" fill="${t.main}" ${st()}/>
  <path d="M33 37h34" ${st(3.4)}/>
  <path d="M41 26q4-3 8-2" fill="none" stroke="${t.light}" stroke-width="2.4" stroke-linecap="round"/>`,

  tank: (t) => `${shadow(50, 90, 44, 5)}
  <rect x="62" y="40" width="32" height="7" rx="3" fill="${t.dark}" ${st()}/>
  <rect x="90" y="38" width="7" height="11" rx="2" fill="${t.dark}" ${st(2.5)}/>
  <rect x="8" y="64" width="80" height="20" rx="10" fill="#4b4b60" ${st()}/>
  ${[18, 32, 46, 60, 74].map((x) => `<circle cx="${x}" cy="74" r="5.6" fill="#9aa3b5" ${st(2)}/>`).join('')}
  <path d="M10 64l7-13h64l8 13z" fill="${t.main}" ${st()}/>
  <path d="M30 51q0-17 20-17t20 17z" fill="${t.main}" ${st()}/>
  <ellipse cx="46" cy="35" rx="7" ry="2.8" fill="${t.dark}" ${st(2)}/>
  ${star(48, 45, 5, t.acc, 1.6)}
  <path d="M20 57h56" stroke="${t.light}" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>`,

  heli: (t) => `${shadow(52, 93, 26, 4)}
  <path d="M8 44l34 3v9L10 51z" fill="${t.main}" ${st()}/>
  <path d="M5 33h7l4 17H8z" fill="${t.dark}" ${st()}/>
  <g class="spin-sm" style="transform-origin:10px 41px"><path d="M10 33v16M2 41h16" stroke="#4b4b60" stroke-width="3" stroke-linecap="round"/></g>
  <path d="M34 47q4-16 26-16t26 18q2 10-8 12H44q-10 0-10-14z" fill="${t.main}" ${st()}/>
  <path d="M62 34q16 0 20 14H62z" fill="#bfe8ff" ${st(2.4)}/>
  <path d="M40 53h34" stroke="${t.light}" stroke-width="2.4" stroke-linecap="round"/>
  ${star(50, 46, 4.6, t.acc, 1.4)}
  <path d="M44 62v8M74 62v8M34 72h50q4 0 6-4" fill="none" ${st(3)}/>
  <rect x="56" y="22" width="6" height="10" rx="2" fill="#4b4b60" ${st(2)}/>
  <g class="rotor" style="transform-origin:59px 21px"><rect x="18" y="18.5" width="82" height="5" rx="2.5" fill="#4b4b60" ${st(2)}/></g>`,

  jet: (t) => `<path class="flame" d="M2 52q9-7 15 0-6 7-15 0z" fill="#ff9f1c" ${st(2)}/>
  <path d="M15 46h50q22 0 31 6-9 6-31 6H15q-4-6 0-12z" fill="#c4cddb" ${st()}/>
  <path d="M17 46l-7-18h10l15 18z" fill="${t.main}" ${st()}/>
  <path d="M40 54l-15 19h12l27-19z" fill="${t.dark}" ${st()}/>
  <path d="M60 46q9-9 19 0z" fill="#bfe8ff" ${st(2.4)}/>
  <path d="M22 52h44" stroke="${t.main}" stroke-width="3" stroke-linecap="round"/>
  ${star(41, 63, 4, t.acc, 1.3)}`,

  ship: (t) => `<path d="M0 82q8-5 17 0t17 0 17 0 17 0 17 0 17 0v18H0z" fill="#58b4ef"/>
  <path d="M50 24v14" ${st(2.6)}/><path d="M50 24h12l-3 4 3 4H50z" fill="${t.main}" ${st(1.8)}/>
  <path d="M38 62V48h22V38h9v24z" fill="#cdd4df" ${st()}/>
  <path d="M42 53h3M48 53h3M54 53h3" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M84 52h14M84 56h14" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
  <path d="M84 52h14M84 56h14" stroke="#6f7a8e" stroke-width="2" stroke-linecap="round"/>
  <path d="M30 52h14M30 56h14" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
  <path d="M30 52h14M30 56h14" stroke="#6f7a8e" stroke-width="2" stroke-linecap="round"/>
  <path d="M70 62v-6q0-5 5-5h7q5 0 5 5v6zM14 62v-6q0-5 5-5h7q5 0 5 5v6z" fill="#6f7a8e" ${st()}/>
  <path d="M3 62h94l-11 19H14z" fill="#8c97ab" ${st()}/>
  <path d="M6 66h88" stroke="${t.main}" stroke-width="4"/>
  ${[24, 36, 48, 60, 72].map((x) => `<circle cx="${x}" cy="73" r="2" fill="#e9f4ff" ${st(1.4)}/>`).join('')}`,

  drone: (t) => `${shadow(50, 92, 22, 3.5)}
  ${line('M20 34L80 62M20 62L80 34', 3, '#7a8499')}
  ${[[20, 30], [80, 30], [20, 58], [80, 58]].map(([x, y]) => `<rect x="${x - 4}" y="${y}" width="8" height="8" rx="2" fill="#4b4b60" ${st(2)}/><ellipse class="blur" cx="${x}" cy="${y - 1}" rx="15" ry="3.4" fill="#c4cddb" opacity=".85" ${st(1.8)}/>`).join('')}
  <rect x="33" y="38" width="34" height="22" rx="10" fill="${t.main}" ${st()}/>
  <path d="M38 43q5-3 10-2" fill="none" stroke="${t.light}" stroke-width="2.4" stroke-linecap="round"/>
  <circle cx="50" cy="62" r="7.5" fill="${INK}" ${st(2)}/><circle cx="50" cy="62" r="3.6" fill="#56e0ff"/><circle cx="48.4" cy="60.4" r="1.3" fill="#fff"/>
  <circle cx="60" cy="44" r="2.2" fill="${t.acc}" class="blink"/>`,

  carrier: (t) => `<path d="M0 82q8-5 17 0t17 0 17 0 17 0 17 0 17 0v18H0z" fill="#58b4ef"/>
  <path d="M2 61h96l-9 19H11z" fill="#7d889c" ${st()}/>
  <rect x="2" y="54" width="96" height="8" rx="2" fill="#5b6475" ${st()}/>
  <path d="M8 58h80" stroke="#fff" stroke-width="1.6" stroke-dasharray="5 4"/>
  <path d="M64 54V38h12v-8h4v24z" fill="#aeb7c6" ${st()}/>
  <path d="M66 43h8" stroke="#bfe8ff" stroke-width="3" stroke-linecap="round"/>
  <path d="M78 30q6-6 10 0" fill="none" ${st(2.4)}/>
  <path d="M14 53l4-8h3l1 4h10l3 4z" fill="${t.main}" ${st(2)}/>
  <path d="M38 53l4-8h3l1 4h10l3 4z" fill="${t.main}" ${st(2)}/>
  <path d="M6 66h86" stroke="${t.main}" stroke-width="3.4"/>`,

  mech: (t) => `${shadow(50, 93, 28, 4.5)}
  <path d="M38 64l-4 14 2 10M62 64l4 14-2 10" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M38 64l-4 14 2 10M62 64l4 14-2 10" fill="none" stroke="${t.dark}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M26 92q0-6 6-6h10v6zM58 86h10q6 0 6 6H58z" fill="#4b4b60" ${st(2.6)}/>
  <rect x="64" y="42" width="32" height="11" rx="4" fill="#6f7a8e" ${st()}/>
  <rect x="92" y="40" width="6" height="15" rx="2" fill="#4b4b60" ${st(2.4)}/>
  <rect x="29" y="34" width="42" height="32" rx="9" fill="${t.main}" ${st()}/>
  <circle cx="50" cy="50" r="5.4" fill="${t.acc}" ${st(2)}/>
  <circle cx="27" cy="42" r="8" fill="${t.dark}" ${st()}/>
  <rect x="40" y="17" width="22" height="17" rx="6" fill="${t.light}" ${st()}/>
  <rect x="44" y="22" width="16" height="6" rx="3" fill="#56e0ff" ${st(2)}/>
  <path d="M51 17V9" ${st(2.4)}/><circle cx="51" cy="8" r="2.6" fill="#ff5d5d" ${st(1.6)} class="blink"/>`,

  rocket: (t) => `<g transform="rotate(-28 50 52)">
  <path class="flame" d="M19 52q-16-10-18 0 2 10 18 0z" fill="#ff9f1c" ${st(2)}/>
  <path d="M19 52q-9-5-11 0 2 5 11 0z" fill="#ffe066"/>
  <path d="M24 43l-9-13h11l10 13zM24 61l-9 13h11l10-13z" fill="${t.main}" ${st()}/>
  <path d="M20 43h48q18 0 27 9-9 9-27 9H20z" fill="#eef2f7" ${st()}/>
  <path d="M70 43q17 0 25 9-8 9-25 9z" fill="${t.main}" ${st()}/>
  <circle cx="54" cy="52" r="5.4" fill="#bfe8ff" ${st(2)}/>
  <path d="M30 43v18" stroke="${t.acc}" stroke-width="4"/><path d="M30 43v18" ${st(1.2)}/>
  </g>`,

  spacemarine: (t) => `${shadow()}
  <rect x="22" y="44" width="13" height="26" rx="5" fill="#8a95a8" ${st()}/>
  <path class="flame" d="M24 72q4 12 9 0z" fill="#7ffcff" ${st(1.8)}/>
  <rect x="38" y="72" width="10" height="15" rx="4" fill="${t.dark}" ${st()}/>
  <rect x="52" y="72" width="10" height="15" rx="4" fill="${t.dark}" ${st()}/>
  <path d="M35 92q0-6 4-6h10v6zM51 86h10q4 0 4 6H51z" fill="#e3e9f2" ${st(2.6)}/>
  <rect x="32" y="46" width="36" height="30" rx="11" fill="${t.main}" ${st()}/>
  <path d="M38 56h24" stroke="${t.acc}" stroke-width="4" stroke-linecap="round"/>
  <rect x="56" y="54" width="32" height="9" rx="3" fill="#4b4b60" ${st()}/>
  <circle cx="90" cy="58.5" r="3.8" fill="#7ffcff" ${st(1.6)} class="blink"/>
  <circle cx="58" cy="59" r="4.6" fill="${t.light}" ${st(2.5)}/>
  <circle cx="50" cy="33" r="16" fill="${t.light}" ${st()}/>
  <path d="M40 29h21q5 0 5 5 0 8-9 8H44q-7 0-7-7 0-6 3-6z" fill="#7fe3ff" ${st(2.5)}/>
  <path d="M45 32q4-2 8-1" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>
  <path d="M38 22l-5-7" ${st(2.2)}/><circle cx="32.5" cy="14" r="2.4" fill="${t.acc}" ${st(1.4)}/>`,

  spacefighter: (t) => `<ellipse class="flame" cx="11" cy="50" rx="10" ry="5" fill="#7ffcff" ${st(2)}/>
  <path d="M30 44l14-23h10l-4 23zM30 56l14 23h10l-4-23z" fill="${t.main}" ${st()}/>
  <path d="M44 25h12M44 75h12" stroke="#ff5d5d" stroke-width="3" stroke-linecap="round"/>
  <path d="M14 44h40l40 6-40 6H14z" fill="#e1e8f2" ${st()}/>
  <path d="M52 46q13 0 19 4-6 4-19 4z" fill="#56e0ff" ${st(2)}/>
  <path d="M20 50h22" stroke="${t.main}" stroke-width="3" stroke-linecap="round"/>`,

  laser: (t) => `<ellipse cx="50" cy="86" rx="34" ry="5" fill="#7ffcff" opacity=".55" class="blink"/>
  <rect x="60" y="44" width="31" height="10" rx="4" fill="#4b4b60" ${st()}/>
  <path d="M68 44v10M76 44v10" stroke="#7ffcff" stroke-width="3"/>
  <circle cx="93" cy="49" r="5.4" fill="#b5fffd" ${st(2)} class="blink"/>
  <path d="M30 62q0-18 20-18t20 18z" fill="${t.light}" ${st()}/>
  <path d="M12 75q0-13 13-13h50q13 0 13 13 0 6-6 6H18q-6 0-6-6z" fill="${t.main}" ${st()}/>
  <path d="M20 70h60" stroke="${t.acc}" stroke-width="3.4" stroke-linecap="round"/>
  <circle cx="40" cy="54" r="3" fill="#56e0ff" ${st(1.4)}/>`,

  megamech: (t) => `${shadow(50, 94, 34, 5)}
  <path d="M36 66l-6 14 2 9M64 66l6 14-2 9" fill="none" stroke="${INK}" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M36 66l-6 14 2 9M64 66l6 14-2 9" fill="none" stroke="${t.dark}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M20 93q0-7 7-7h12v7zM61 86h12q7 0 7 7H61z" fill="#ffd23f" ${st(2.6)}/>
  <rect x="66" y="44" width="30" height="13" rx="5" fill="#6f7a8e" ${st()}/>
  <path d="M96 46v9" stroke="#7ffcff" stroke-width="4" stroke-linecap="round"/>
  <rect x="24" y="32" width="52" height="36" rx="10" fill="${t.main}" ${st()}/>
  <path d="M30 40h40" stroke="#ffd23f" stroke-width="4" stroke-linecap="round"/>
  <circle cx="50" cy="54" r="7" fill="#7ffcff" ${st(2.2)} class="blink"/>
  <rect x="14" y="26" width="16" height="14" rx="3" fill="#ffd23f" ${st()}/>
  <circle cx="19" cy="31" r="2" fill="${INK}"/><circle cx="25" cy="31" r="2" fill="${INK}"/><circle cx="19" cy="36" r="2" fill="${INK}"/><circle cx="25" cy="36" r="2" fill="${INK}"/>
  <rect x="38" y="12" width="26" height="20" rx="7" fill="${t.light}" ${st()}/>
  <path d="M43 19h6M54 19h6" stroke="#ff4d4d" stroke-width="4" stroke-linecap="round"/>
  <path d="M42 12l-3-7 6 4 6-6 6 6 6-4-3 7" fill="#ffd23f" ${st(2)}/>`,

  ohiostar: (t) => `<ellipse class="flame" cx="12" cy="52" rx="10" ry="8" fill="#7ffcff" ${st(2)}/>
  <g transform="translate(9 7) scale(.43)">
    <path d="${MAPS.ohioOutline}" fill="#cfd7e3" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
    <path d="${MAPS.ohioOutline}" fill="none" stroke="${t.main}" stroke-width="9" transform="translate(100 100) scale(.8) translate(-100 -100)" opacity=".85"/>
  </g>
  ${[[34, 30], [44, 30], [54, 30], [64, 30], [74, 34], [30, 62], [40, 66], [60, 66], [70, 58]].map(([x, y]) => `<rect x="${x}" y="${y}" width="5" height="3.4" rx="1" fill="#ffe680" ${st(1.2)}/>`).join('')}
  <circle cx="52" cy="48" r="10" fill="#7ffcff" ${st(2.6)} class="blink"/>
  <circle cx="52" cy="48" r="4.4" fill="#fff"/>
  <path d="M84 30h12" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M84 30h12" stroke="#ff4d4d" stroke-width="2.4" stroke-linecap="round"/>
  ${burgee(64, 6, 0.5)}`,
};

// ================= FIENDER (spesielle) =================
const ENEMIES = {
  penguin: (crown) => `${shadow(50, 93, 22, 4)}
  <path d="M30 56q-10 10-4 22 6-6 8-14zM70 56q10 10 4 22-6-6-8-14z" fill="#2b2d42" ${st()}/>
  <ellipse cx="50" cy="60" rx="22" ry="30" fill="#2b2d42" ${st()}/>
  <ellipse cx="52" cy="65" rx="14" ry="21" fill="#fff"/>
  <path d="M38 91q0-6 6-6t6 6zM52 91q0-6 6-6t6 6z" fill="#ffa21f" ${st(2.4)}/>
  ${eye(44, 46, 4)}${eye(57, 46, 4)}
  <path d="M38 38l10 5M63 38l-10 5" ${st(3)}/>
  <path d="M48 52l14 4-14 4z" fill="#ffa21f" ${st(2.2)}/>
  ${crown ? `<path d="M36 33l4-13 7 7 3-11 4 11 7-7 4 13z" fill="#ffd23f" ${st(2.4)}/><circle cx="50" cy="27" r="2" fill="#ef5b5b"/>` : `<path d="M32 36q0-14 18-14t18 14z" fill="#ef5b5b" ${st(2.6)}/><path d="M30 36h40" ${st(3)}/>`}`,

  alien: (skin = '#7be07b', crown = false) => `${shadow(50, 93, 20, 4)}
  <path d="M43 80v8M57 80v8" ${st(5)}/>
  <path d="M38 66q0-11 12-11t12 11v12q0 6-6 6H44q-6 0-6-6z" fill="${skin}" ${st()}/>
  ${line('M60 66l14-4', 3, skin)}
  <rect x="70" y="56" width="18" height="8" rx="3" fill="#ff5dd6" ${st(2.4)}/>
  <circle cx="90" cy="60" r="3" fill="#fff59a" ${st(1.6)} class="blink"/>
  <path d="M41 24q-4-9-10-11M59 24q4-9 10-11" fill="none" ${st(2.6)}/>
  <circle cx="30" cy="12" r="3.6" fill="${skin}" ${st(2)}/><circle cx="70" cy="12" r="3.6" fill="${skin}" ${st(2)}/>
  <ellipse cx="50" cy="38" rx="23" ry="18" fill="${skin}" ${st()}/>
  <ellipse cx="41" cy="38" rx="6.5" ry="8.5" fill="${INK}" transform="rotate(-22 41 38)"/>
  <ellipse cx="59" cy="38" rx="6.5" ry="8.5" fill="${INK}" transform="rotate(22 59 38)"/>
  <circle cx="39" cy="35" r="2" fill="#fff"/><circle cx="57" cy="35" r="2" fill="#fff"/>
  <ellipse cx="50" cy="49" rx="3" ry="2" fill="${INK}"/>
  ${crown ? `<path d="M36 24l3-12 7 6 4-10 4 10 7-6 3 12z" fill="#ffd23f" ${st(2.4)}/>` : ''}`,

  ufo: (color = '#ff5dd6') => `<path d="M36 62L22 96h56L64 62z" fill="#b5fffd" opacity=".35"/>
  <path d="M34 46q0-19 16-19t16 19z" fill="#c9f1ff" ${st()}/>
  <ellipse cx="50" cy="40" rx="7" ry="6" fill="#7be07b" ${st(1.8)}/>
  <circle cx="47.5" cy="39" r="1.6" fill="${INK}"/><circle cx="52.5" cy="39" r="1.6" fill="${INK}"/>
  <path d="M38 34q3-4 7-5" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>
  <ellipse cx="50" cy="52" rx="39" ry="11" fill="#b8c2d3" ${st()}/>
  <path d="M12 54q38 10 76 0" fill="none" stroke="${color}" stroke-width="5"/>
  ${[20, 35, 50, 65, 80].map((x, i) => `<circle cx="${x}" cy="${i % 2 ? 57 : 56}" r="2.6" fill="#fff59a" ${st(1.4)} class="blink" style="animation-delay:${i * 0.15}s"/>`).join('')}`,

  bear: () => `${shadow(50, 93, 30, 4.5)}
  <path d="M24 70q-4 18 6 20h8l2-14M60 76l2 14h8q10-2 6-20" fill="#f4f7fb" ${st()}/>
  <ellipse cx="48" cy="62" rx="30" ry="22" fill="#f4f7fb" ${st()}/>
  <circle cx="72" cy="40" r="15" fill="#f4f7fb" ${st()}/>
  <circle cx="64" cy="27" r="5" fill="#f4f7fb" ${st(2.4)}/><circle cx="80" cy="28" r="5" fill="#f4f7fb" ${st(2.4)}/>
  <ellipse cx="80" cy="46" rx="8" ry="6" fill="#e3e9f2" ${st(2)}/><ellipse cx="84" cy="44" rx="3" ry="2.2" fill="${INK}"/>
  ${eye(68, 38, 3)}${eye(77, 37, 3)}
  <path d="M64 33l6 2M81 32l-5 3" ${st(2.4)}/>`,

  kangaroo: () => `${shadow(50, 93, 26, 4)}
  <path d="M30 80q-22 4-26-6 12 2 26-6z" fill="#d98b4a" ${st()}/>
  <path d="M36 86q-6-2-2-10l10-6 14 4-4 12z" fill="#c97a3a" ${st()}/>
  <path d="M30 92h20q2-4-4-6H34z" fill="#c97a3a" ${st(2.4)}/>
  <ellipse cx="46" cy="60" rx="17" ry="22" fill="#d98b4a" ${st()}/>
  <ellipse cx="50" cy="66" rx="9" ry="13" fill="#f2c08f"/>
  <path d="M54 34q-4-14 2-20 4 8 2 18M62 34q2-14 10-18 0 10-4 18" fill="#d98b4a" ${st(2.4)}/>
  <ellipse cx="62" cy="40" rx="13" ry="11" fill="#d98b4a" ${st()}/>
  <ellipse cx="73" cy="44" rx="6" ry="5" fill="#f2c08f" ${st(2)}/><circle cx="76" cy="42" r="1.8" fill="${INK}"/>
  ${eye(60, 37, 2.8)}${eye(67, 36, 2.8)}
  <circle cx="64" cy="58" r="7" fill="#ef3b3b" ${st(2.4)}/><circle cx="74" cy="54" r="7" fill="#ef3b3b" ${st(2.4)}/>`,

  gator: () => `${shadow(50, 90, 42, 4.5)}
  <path d="M4 70q20-14 40-10l50 2q4 6-2 10l-40 2q-24 6-48-4z" fill="#5fae3c" ${st()}/>
  <path d="M48 62l46 1M52 70l40-1" stroke="${INK}" stroke-width="2"/>
  <path d="M56 62l3 4 3-4 3 4 3-4 3 4 3-4 3 4 3-4" fill="#fff" ${st(1.4)}/>
  <ellipse cx="50" cy="56" rx="7" ry="6" fill="#5fae3c" ${st(2.4)}/>${eye(51, 55, 3)}
  <path d="M16 62l3-5 3 5 3-5 3 5 3-5 3 5" fill="#3e8a28" ${st(1.6)}/>
  <path d="M22 76v8h6M40 76v8h6" fill="none" ${st(4)}/>`,
};

// ================= ØKONOMI-BYGNINGER =================
const BUILDINGS = {
  corn: () => `<path d="M5 80q45-13 90 0v13H5z" fill="#a0703f" ${st()}/>
  <path d="M14 86q36-8 72 0" fill="none" stroke="#7d5330" stroke-width="2.4" stroke-linecap="round"/>
  ${[26, 50, 74].map((x, i) => `
    ${line(`M${x} 84V${30 + i * 2}`, 3, '#5aa83c')}
    <path d="M${x} 66q-14-4-16-14 10 0 16 8zM${x} 56q13-6 15-16-10 2-15 10z" fill="#7fcc52" ${st(2.2)}/>
    <ellipse cx="${x + 6}" cy="${47 + i}" rx="5" ry="10" fill="#ffd23f" ${st(2.2)} transform="rotate(14 ${x + 6} ${47 + i})"/>
    <path d="M${x + 1} 58q4-14 12-16-2 10-8 18z" fill="#7fcc52" ${st(1.8)}/>
    <path d="M${x} ${30 + i * 2}l-4-8M${x} ${30 + i * 2}l4-8M${x} ${30 + i * 2}v-9" stroke="#e0b13c" stroke-width="2.4" stroke-linecap="round"/>`).join('')}`,

  cow: () => `${shadow(48, 92, 34, 4.5)}
  <path d="M24 70v18M34 70v18M58 70v18M68 70v18" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>
  <path d="M24 70v18M34 70v18M58 70v18M68 70v18" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
  <path d="M20 88h8M30 88h8M54 88h8M64 88h8" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
  <path d="M18 52q-10 4-8 18" fill="none" ${st(2.6)}/><path d="M6 70q4-4 6 0-2 6-6 0z" fill="${INK}"/>
  <rect x="16" y="40" width="60" height="34" rx="15" fill="#fff" ${st()}/>
  <path d="M28 42q10 4 6 14-8 2-12-6zM52 56q8-4 12 4-2 10-12 8-4-6 0-12zM40 70q4-6 10-2l-2 5h-8z" fill="${INK}"/>
  <ellipse cx="46" cy="74" rx="7" ry="4" fill="#ffb3c1" ${st(2)}/>
  <path d="M68 30q-6-8-2-12M88 30q6-8 2-12" fill="none" stroke="#f6e7c1" stroke-width="5" stroke-linecap="round"/>
  <path d="M68 30q-6-8-2-12M88 30q6-8 2-12" fill="none" ${st(1.4)}/>
  <ellipse cx="64" cy="36" rx="6" ry="3.6" fill="#ffb3c1" ${st(2)} transform="rotate(-20 64 36)"/>
  <ellipse cx="92" cy="36" rx="6" ry="3.6" fill="#ffb3c1" ${st(2)} transform="rotate(20 92 36)"/>
  <rect x="66" y="26" width="24" height="30" rx="11" fill="#fff" ${st()}/>
  <rect x="64" y="44" width="28" height="16" rx="8" fill="#ffb3c1" ${st()}/>
  <circle cx="72" cy="52" r="2" fill="${INK}"/><circle cx="84" cy="52" r="2" fill="${INK}"/>
  ${eye(72, 37, 3)}${eye(84, 37, 3)}
  <circle cx="70" cy="64" r="4" fill="#ffd23f" ${st(2)}/>`,

  gas: () => `<path d="M4 88h92" ${st(3)}/>
  <rect x="14" y="34" width="8" height="54" fill="#e8edf3" ${st()}/><rect x="78" y="34" width="8" height="54" fill="#e8edf3" ${st()}/>
  <rect x="6" y="20" width="88" height="15" rx="4" fill="#ef5b5b" ${st()}/>
  <path d="M10 28h80" stroke="#fff" stroke-width="3"/>
  <rect x="36" y="50" width="24" height="38" rx="4" fill="#ffd23f" ${st()}/>
  <rect x="40" y="55" width="16" height="10" rx="2" fill="#bfe8ff" ${st(2)}/>
  <path d="M43 75h10" ${st(2.4)}/>
  <path d="M60 60q10 2 10 12v8" fill="none" ${st(3)}/>
  <rect x="66" y="78" width="8" height="8" rx="2" fill="#4b4b60" ${st(2)}/>
  <circle cx="50" cy="13" r="8" fill="#4fb843" ${st(2.4)}/><path d="M47 13h6M50 10v6" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>`,

  factory: () => `<circle class="smoke" cx="68" cy="12" r="6" fill="#d9dee8" ${st(2)}/>
  <circle class="smoke" style="animation-delay:.8s" cx="84" cy="16" r="5" fill="#d9dee8" ${st(2)}/>
  <rect x="62" y="18" width="11" height="36" fill="#d9534f" ${st()}/><rect x="78" y="24" width="11" height="30" fill="#d9534f" ${st()}/>
  <path d="M62 26h11M62 34h11M78 32h11" stroke="#fff" stroke-width="2.4"/>
  <path d="M6 88V50l16-11v11l16-11v11l16-11v11h40v38z" fill="#b8c2d3" ${st()}/>
  ${[14, 30, 46, 62, 78].map((x) => `<rect x="${x}" y="58" width="9" height="10" rx="1.6" fill="#ffe680" ${st(2)}/>`).join('')}
  <rect x="40" y="72" width="16" height="16" fill="#6f7a8e" ${st()}/>
  <path d="M8 88h84" ${st(3)}/>`,

  oil: () => `<path d="M4 88h92" ${st(3)}/><rect x="10" y="80" width="16" height="8" fill="#6f7a8e" ${st(2.4)}/>
  ${line('M40 86L54 40l14 46', 3, '#ffd23f')}
  <path d="M18 38v42" stroke="${INK}" stroke-width="2.6"/>
  <circle cx="78" cy="70" r="10" fill="#ef5b5b" ${st()}/><circle cx="78" cy="70" r="3" fill="${INK}"/>
  <g class="rock" style="transform-origin:54px 40px">
    <path d="M78 70L82 42" stroke="${INK}" stroke-width="3.4"/>
    <rect x="20" y="35" width="66" height="9" rx="4" fill="#2b2d42" ${st()}/>
    <path d="M14 28q-6 11 0 24l9-2V30z" fill="#ffd23f" ${st()}/>
  </g>
  <circle cx="54" cy="40" r="4" fill="#ef5b5b" ${st(2)}/>
  <path d="M86 84q4-8 6 0-1 4-3 4t-3-4z" fill="${INK}"/>`,

  burger: () => `<rect x="14" y="54" width="72" height="34" rx="4" fill="#fff4d6" ${st()}/>
  <path d="M10 56h80l-4 8q-4 4-8 0-4 4-8 0-4 4-8 0-4 4-8 0-4 4-8 0-4 4-8 0-4 4-8 0-4 4-8 0-4 4-8 0z" fill="#ef5b5b" ${st(2.4)}/>
  <rect x="24" y="70" width="18" height="12" rx="2" fill="#bfe8ff" ${st(2.2)}/><rect x="56" y="68" width="16" height="20" rx="2" fill="#ef5b5b" ${st(2.2)}/>
  <path d="M28 42q0-24 22-24t22 24z" fill="#f6a945" ${st()}/>
  <path d="M38 28l2 2M48 24l2 1M58 28l2 2M44 34l2 1M54 33l2 1" stroke="#fff6dd" stroke-width="2.4" stroke-linecap="round"/>
  <path d="M26 44q6-4 12 0t12 0 12 0 12 0" fill="none" stroke="#5fbf3c" stroke-width="5" stroke-linecap="round"/>
  <path d="M28 46h44l-6 6-4-4-6 6-4-5-6 5-4-4-6 5z" fill="#ffd23f" ${st(1.8)}/>
  <rect x="27" y="47" width="46" height="8" rx="4" fill="#8a4b2a" ${st(2.4)}/>`,

  bank: () => `<path d="M8 36L50 12l42 24z" fill="#eef2f7" ${st()}/>
  <circle cx="50" cy="27" r="6.5" fill="#ffd23f" ${st(2.2)}/><path d="M50 22.5v9M52.5 24.5q-2.5-2-5 0t0 3 5 1q0 3-5 1" fill="none" ${st(1.4)}/>
  <rect x="12" y="36" width="76" height="8" fill="#dfe5ee" ${st()}/>
  ${[18, 34, 56, 72].map((x) => `<rect x="${x}" y="44" width="10" height="34" fill="#fff" ${st(2.6)}/><path d="M${x + 3.5} 48v26M${x + 6.5} 48v26" stroke="#c9d1dd" stroke-width="1.6"/>`).join('')}
  <rect x="8" y="78" width="84" height="6" fill="#dfe5ee" ${st()}/><rect x="4" y="84" width="92" height="6" fill="#c9d1dd" ${st()}/>
  <circle cx="86" cy="72" r="5" fill="#ffd23f" ${st(2)}/><circle cx="91" cy="78" r="5" fill="#ffd23f" ${st(2)}/>`,

  coffee: () => `<path d="M14 40q-6-16 6-26 6 14-6 26zM86 40q6-16-6-26-6 14 6 26z" fill="#4fae3c" ${st(2.2)}/>
  <circle cx="20" cy="44" r="4" fill="#e5484d" ${st(1.8)}/><circle cx="80" cy="44" r="4" fill="#e5484d" ${st(1.8)}/>
  <path class="smoke" d="M40 30q-4-6 0-12t0-12" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/>
  <path class="smoke" style="animation-delay:.6s" d="M54 30q-4-6 0-12t0-12" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/>
  <ellipse cx="48" cy="88" rx="34" ry="5" fill="#e3e9f2" ${st()}/>
  ${line('M70 52q14 0 14 10t-14 10', 3, '#fff')}
  <path d="M24 44h48v20q0 20-24 20T24 64z" fill="#fff" ${st()}/>
  <path d="M26 62h44" stroke="#ef5b5b" stroke-width="4"/>
  <ellipse cx="48" cy="44" rx="24" ry="6" fill="#7a4a2a" ${st()}/>`,

  goldmine: () => `<path d="M4 88q10-52 46-58 36 6 46 58z" fill="#a78a6d" ${st()}/>
  <path d="M18 60l6-2M70 48l7 3M80 70l6-1" stroke="#7f6550" stroke-width="2.4" stroke-linecap="round"/>
  <path d="M30 88V68q0-16 18-16t18 16v20z" fill="#2b2350"/>
  <path d="M28 88V66M68 88V66M26 64h44" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>
  <path d="M28 88V66M68 88V66M26 64h44" stroke="#b07a45" stroke-width="4" stroke-linecap="round"/>
  <path d="M60 64l5-8 6 4 4-7 6 6 4-4 3 9z" fill="#ffd23f" ${st(2)}/>
  <path d="M56 66h34l-4 16H60z" fill="#6f7a8e" ${st()}/>
  <circle cx="64" cy="84" r="3.4" fill="#4b4b60" ${st(1.6)}/><circle cx="82" cy="84" r="3.4" fill="#4b4b60" ${st(1.6)}/>
  ${star(88, 52, 4, '#fff8c4', 1.2)}${star(60, 50, 3, '#fff8c4', 1.2)}`,

  tech: () => `<path d="M30 90V26l18-12 18 12v64z" fill="#8fd3ff" ${st()}/>
  <path d="M38 32v52M48 24v60M58 32v52M30 44h36M30 58h36M30 72h36" stroke="#d6f1ff" stroke-width="2"/>
  <path d="M48 14V4" ${st(2.4)}/><circle cx="48" cy="4" r="2.6" fill="#ff5d5d" class="blink"/>
  <rect x="66" y="50" width="26" height="40" rx="5" fill="#4b4b60" ${st()}/>
  <rect x="70" y="55" width="18" height="27" rx="2" fill="#56e0ff"/>
  <path d="M74 62h10M74 67h7M74 72h9" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
  <rect x="6" y="62" width="22" height="28" rx="2" fill="#c3cad6" ${st()}/>
  <path d="M11 68h4M19 68h4M11 76h4M19 76h4" stroke="${INK}" stroke-width="2.6"/>`,

  rocketbase: () => `<path class="smoke" d="M54 84q-10 2-12-4 4-6 12-2z" fill="#e3e9f2" ${st(2)}/>
  <rect x="16" y="22" width="13" height="66" fill="none" ${st(3)}/>
  <path d="M16 22l13 12M29 34l-13 12M16 46l13 12M29 58l-13 12M16 70l13 12M29 40h10M29 64h10" ${st(2.2)}/>
  <path d="M52 76l-8 10h12zM80 76l8 10H76z" fill="#ef5b5b" ${st(2.4)}/>
  <path d="M54 84V40q0-22 12-30 12 8 12 30v44z" fill="#eef2f7" ${st()}/>
  <path d="M57 26q9-14 18 0z" fill="#ef5b5b" ${st(2.2)}/>
  <circle cx="66" cy="44" r="5.4" fill="#bfe8ff" ${st(2)}/>
  <path d="M54 62h24" stroke="#3559d6" stroke-width="4"/>
  <path d="M6 88h88" ${st(3)}/>`,

  mooncheese: () => `<circle cx="84" cy="16" r="9" fill="#4fa3ff" ${st(2)}/><path d="M80 12q4 0 5 4-3 3-6 0zM86 18q3 1 3 4" fill="none" stroke="#4fb843" stroke-width="3"/>
  <circle cx="20" cy="18" r="1.4" fill="#fff"/><circle cx="54" cy="10" r="1.2" fill="#fff"/><circle cx="36" cy="30" r="1" fill="#fff"/>
  <path d="M2 74q48-14 96 0v20H2z" fill="#c9ccd6" ${st()}/>
  <ellipse cx="22" cy="82" rx="8" ry="3" fill="#a9acb8" ${st(1.8)}/><ellipse cx="78" cy="86" rx="6" ry="2.4" fill="#a9acb8" ${st(1.8)}/>
  <path d="M22 72l46-26 14 26z" fill="#ffd23f" ${st()}/>
  <path d="M22 72l46-26v8L30 74z" fill="#f0b429"/>
  <circle cx="50" cy="64" r="4" fill="#f0b429" ${st(1.6)}/><circle cx="66" cy="58" r="3" fill="#f0b429" ${st(1.6)}/><circle cx="64" cy="68" r="2.4" fill="#f0b429" ${st(1.6)}/>
  ${burgee(76, 26, 0.55)}<path d="M76 26v24" ${st(2.2)}/>`,

  asteroid: () => `<circle cx="12" cy="14" r="1.4" fill="#fff"/><circle cx="88" cy="24" r="1.2" fill="#fff"/><circle cx="80" cy="86" r="1.4" fill="#fff"/>
  <path d="M16 54q2-26 30-30 30 2 36 28 2 28-30 32-34 0-36-30z" fill="#9b8f80" ${st()}/>
  <ellipse cx="36" cy="44" rx="6" ry="4" fill="#857a6d" ${st(1.8)}/><ellipse cx="62" cy="70" rx="7" ry="4.6" fill="#857a6d" ${st(1.8)}/>
  <path d="M54 46l6-10 6 10-6 8z" fill="#56e0ff" ${st(2)}/><path d="M28 66l5-7 5 7-5 6z" fill="#ff7ad9" ${st(2)}/>
  <path d="M70 52l4-6 4 6-4 5z" fill="#b5ff6a" ${st(1.8)}/>
  <rect x="42" y="16" width="14" height="12" rx="2" fill="#ffd23f" ${st(2.4)}/><path d="M49 28v8" ${st(3)}/>
  <circle cx="49" cy="14" r="2.4" fill="#ff5d5d" class="blink"/>`,

  antimatter: () => `<rect x="20" y="78" width="60" height="12" rx="4" fill="#6f7a8e" ${st()}/>
  <circle cx="50" cy="46" r="26" fill="#c77dff" opacity=".35" class="pulse"/>
  <ellipse cx="50" cy="46" rx="36" ry="11" fill="none" stroke="#7f5cff" stroke-width="3" transform="rotate(-18 50 46)"/>
  <ellipse cx="50" cy="46" rx="36" ry="11" fill="none" stroke="#56e0ff" stroke-width="3" transform="rotate(18 50 46)"/>
  <circle cx="50" cy="46" r="15" fill="#d9a3ff" ${st()}/><circle cx="45" cy="41" r="5" fill="#fff" opacity=".8"/>
  <path d="M40 78l6-17M60 78l-6-17" ${st(3)}/>`,

  dyson: () => `<circle cx="50" cy="50" r="30" fill="#ffe680" opacity=".45" class="pulse"/>
  <circle cx="50" cy="50" r="19" fill="#ffcf33" ${st()}/><circle cx="44" cy="44" r="5" fill="#fff6c4"/>
  ${Array.from({ length: 10 }, (_, i) => {
    if (i === 3 || i === 7) return '';
    const a = (i / 10) * Math.PI * 2;
    const x = 50 + Math.cos(a) * 34, y = 50 + Math.sin(a) * 34;
    return `<rect x="${(x - 6).toFixed(1)}" y="${(y - 4).toFixed(1)}" width="12" height="8" rx="1.6" fill="#4b5bd6" ${st(2)} transform="rotate(${((a * 180) / Math.PI + 90).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
  }).join('')}`,
};

// ================= HOVEDKVARTER (trykk for penger) =================
function hqBarn() {
  return `<ellipse cx="100" cy="158" rx="94" ry="12" fill="#57b947" ${st()}/>
  <rect x="16" y="58" width="34" height="96" rx="4" fill="#d6dde8" ${st()}/>
  <path d="M16 80h34M16 104h34M16 128h34" stroke="#a9b4c6" stroke-width="3"/>
  <path d="M16 60q0-24 17-24t17 24z" fill="#a9b4c6" ${st()}/>
  <path d="M58 154V88l42-34 42 34v66z" fill="#e5484d" ${st()}/>
  <path d="M64 96v58M136 96v58" stroke="#c43c41" stroke-width="2.4"/>
  <path d="M50 94l50-47 50 47-8 5-42-39-42 39z" fill="#7a2e3a" ${st()}/>
  <rect x="88" y="74" width="24" height="18" rx="2" fill="#fff" ${st()}/><path d="M88 74l24 18M112 74L88 92" stroke="${INK}" stroke-width="2.4"/>
  <rect x="74" y="108" width="52" height="46" fill="#fff" ${st()}/>
  <rect x="79" y="113" width="20" height="41" fill="#e5484d"/><rect x="101" y="113" width="20" height="41" fill="#e5484d"/>
  <path d="M79 113l20 41M99 113l-20 41M101 113l20 41M121 113l-20 41" stroke="#fff" stroke-width="3"/>
  <path d="M100 113v41" ${st(3)}/>
  <path d="M100 48V16" ${st(3)}/>${burgee(100, 14, 0.9)}
  <rect x="146" y="128" width="34" height="24" rx="5" fill="#f2c94c" ${st()}/><path d="M152 136h22M152 144h22" stroke="#d9a62e" stroke-width="2.4"/>
  <path d="M30 156l3-8 3 8M176 156l3-8 3 8" fill="#3e9a32" ${st(2)}/>`;
}
function hqFort(era) {
  const cren = (x0, x1, y) => { let d = ''; for (let x = x0; x < x1 - 4; x += 12) d += `<rect x="${x}" y="${y - 8}" width="8" height="10" fill="#c9a26b" ${st(2.4)}/>`; return d; };
  return `<ellipse cx="100" cy="158" rx="94" ry="12" fill="#57b947" ${st()}/>
  ${cren(70, 132, 60)}
  <rect x="70" y="58" width="60" height="50" fill="#b78f5a" ${st()}/>
  <path d="M100 58V20" ${st(3)}/>${burgee(100, 18, 0.9)}
  ${cren(22, 182, 100)}
  <rect x="22" y="98" width="156" height="56" fill="#c9a26b" ${st()}/>
  <path d="M22 116h156M22 134h156M50 98v18M90 98v18M130 98v18M70 116v18M110 116v18M150 116v18M50 134v20M150 134v20" stroke="#a7834f" stroke-width="2.2"/>
  ${cren(12, 50, 84)}${cren(150, 188, 84)}
  <rect x="12" y="82" width="36" height="72" fill="#b78f5a" ${st()}/><rect x="152" y="82" width="36" height="72" fill="#b78f5a" ${st()}/>
  <rect x="24" y="98" width="12" height="16" rx="6" fill="${INK}"/><rect x="164" y="98" width="12" height="16" rx="6" fill="${INK}"/>
  <path d="M80 154v-24q0-20 20-20t20 20v24z" fill="#6b4a2b" ${st()}/><path d="M100 112v42M82 132h36" stroke="#4e3420" stroke-width="2.4"/>
  ${era >= 2 ? `<path d="M170 82v-12" ${st(3)}/><path d="M156 60q14 16 28 0z" fill="#d6dde8" ${st(2.6)} transform="rotate(-20 170 64)"/>` : ''}
  ${era >= 3 ? `<path d="M30 82V64" ${st(3)}/><circle cx="30" cy="60" r="5" fill="#ff5d5d" ${st(2)} class="blink"/>` : ''}
  <path d="M40 156q8-8 16 0M144 156q8-8 16 0" fill="#c2b07a" ${st(2.4)}/>`;
}
function hqTower() {
  return `<ellipse cx="100" cy="158" rx="94" ry="12" fill="#9aa7b8" ${st()}/>
  <rect x="24" y="96" width="40" height="58" fill="#b9e4ff" ${st()}/><rect x="136" y="96" width="40" height="58" fill="#b9e4ff" ${st()}/>
  <path d="M34 104v44M44 104v44M54 104v44M146 104v44M156 104v44M166 104v44" stroke="#e2f5ff" stroke-width="2"/>
  <path d="M70 154V40l30-18 30 18v114z" fill="#7cc8ff" ${st()}/>
  <path d="M82 46v100M100 34v112M118 46v100M70 64h60M70 88h60M70 112h60M70 136h60" stroke="#c9ecff" stroke-width="2"/>
  <g transform="translate(84 66) scale(.16)"><path d="${MAPS.ohioOutline}" fill="#e5484d" stroke="${INK}" stroke-width="14"/></g>
  <ellipse cx="100" cy="20" rx="24" ry="5" fill="#4b4b60" ${st(2.6)}/><path d="M92 20h16M100 16v8" stroke="#ffd23f" stroke-width="2.4"/>
  <path d="M100 15V2" ${st(2.4)}/><circle cx="100" cy="2" r="3" fill="#ff5d5d" class="blink"/>
  ${burgee(132, 30, 0.7)}<path d="M132 30v12" ${st(2)}/>`;
}
function hqStation() {
  return `<ellipse cx="100" cy="84" rx="92" ry="26" fill="none" stroke="${INK}" stroke-width="10"/>
  <ellipse cx="100" cy="84" rx="92" ry="26" fill="none" stroke="#c4cddb" stroke-width="5"/>
  <rect x="4" y="64" width="36" height="22" rx="2" fill="#3559d6" ${st()}/><path d="M16 64v22M28 64v22M4 75h36" stroke="#8fb0ff" stroke-width="2"/>
  <rect x="160" y="64" width="36" height="22" rx="2" fill="#3559d6" ${st()}/><path d="M172 64v22M184 64v22M160 75h36" stroke="#8fb0ff" stroke-width="2"/>
  <path d="M40 75h24M136 75h24" ${st(5)}/>
  <circle cx="100" cy="76" r="38" fill="#e3e9f2" ${st()}/>
  <path d="M66 62q34-14 68 0M64 90q36 14 72 0" fill="none" stroke="#a9b4c6" stroke-width="3"/>
  <circle cx="100" cy="76" r="14" fill="#7ffcff" ${st(2.6)} class="blink"/><circle cx="96" cy="72" r="4" fill="#fff"/>
  ${[[76, 60], [124, 60], [72, 92], [128, 92]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.4" fill="#ffe680" ${st(1.6)}/>`).join('')}
  <path d="M100 38V18" ${st(3)}/>${burgee(100, 14, 0.8)}
  <rect x="92" y="114" width="16" height="22" rx="3" fill="#a9b4c6" ${st()}/><path class="flame" d="M94 138q6 14 12 0z" fill="#7ffcff" ${st(2)}/>`;
}
function hqMothership() {
  return `<ellipse class="flame" cx="20" cy="88" rx="16" ry="12" fill="#7ffcff" ${st(2.4)}/>
  <g transform="translate(18 4) scale(.82)">
    <path d="${MAPS.ohioOutline}" fill="#cfd7e3" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
    <path d="${MAPS.ohioOutline}" fill="none" stroke="#4fb843" stroke-width="6" transform="translate(100 100) scale(.84) translate(-100 -100)"/>
  </g>
  ${Array.from({ length: 16 }, (_, i) => `<rect x="${52 + (i % 6) * 18}" y="${44 + Math.floor(i / 6) * 34}" width="8" height="5" rx="1.4" fill="#ffe680" ${st(1.4)}/>`).join('')}
  <circle cx="104" cy="96" r="22" fill="#7ffcff" ${st(3)} class="blink"/><circle cx="104" cy="96" r="9" fill="#fff"/>
  ${burgee(150, 10, 0.9)}<path d="M150 10v26" ${st(2.6)}/>`;
}
export function hq(era) {
  const inner = era <= 0 ? hqBarn() : era <= 3 ? hqFort(era) : era === 4 ? hqTower() : era === 5 ? hqStation() : hqMothership();
  return wrap(inner, '0 0 200 172', 'hq-art');
}

// ================= MASKOT: General Buckeye =================
let mascotHat = 'general';
export const setHat = (h) => { mascotHat = h || 'general'; };
const HATS = {
  general: `<path d="M22 36q28-24 56 0v6H22z" fill="#3f6a3a" ${st()}/><path d="M22 40h56" stroke="#ffd23f" stroke-width="4"/><path d="M18 42h64q-4 9-32 9T18 42z" fill="${INK}"/>${star(50, 30, 6, '#ffd23f', 1.8)}`,
  cap: `<path d="M26 41q1-23 24-23t24 23z" fill="#e5484d" ${st()}/><path d="M50 41h34q3 1 0 5H50z" fill="#c43c41" ${st(2.4)}/><circle cx="50" cy="18" r="2.6" fill="#c43c41" ${st(1.4)}/><circle cx="48" cy="31" r="5.4" fill="#fff" ${st(1.6)}/><circle cx="48" cy="31" r="2.4" fill="#e5484d"/>`,
  cowboy: `<ellipse cx="50" cy="40" rx="41" ry="7" fill="#a8692f" ${st()}/><path d="M30 39q-1-24 20-24t20 24z" fill="#b47538" ${st()}/><path d="M43 17q7 7 14 0" fill="none" stroke="#7a4b22" stroke-width="2.6" stroke-linecap="round"/><path d="M31 34h38" stroke="#3d2414" stroke-width="4.4"/>${star(50, 34, 3.6, '#ffd23f', 1.2)}`,
  party: `<g transform="rotate(10 50 40)"><path d="M35 41L51 5l15 36z" fill="#ff5d8f" ${st()}/><path d="M40 30l18-6M44 20l11-4" stroke="#ffd23f" stroke-width="3" stroke-linecap="round"/><circle cx="46" cy="36" r="2" fill="#56e0ff"/><circle cx="58" cy="34" r="2" fill="#56e0ff"/><circle cx="51" cy="5" r="5.4" fill="#ffd23f" ${st(2)}/></g>`,
  viking: `<path d="M28 30q-15-4-17-21q11 6 21 12z" fill="#f6e7c1" ${st(2.6)}/><path d="M72 30q15-4 17-21q-11 6-21 12z" fill="#f6e7c1" ${st(2.6)}/><path d="M24 43q0-27 26-27t26 27z" fill="#a9b4c6" ${st()}/><path d="M24 38h52" stroke="#7d889c" stroke-width="5"/><path d="M50 17v21" stroke="#7d889c" stroke-width="4"/>${[30, 40, 60, 70].map((x) => `<circle cx="${x}" cy="38" r="1.6" fill="#e3e9f2"/>`).join('')}`,
  pirate: `<path d="M15 41q9-27 35-25q26-2 35 25q-17-8-35-8t-35 8z" fill="#2b2d42" ${st()}/><path d="M19 38q31-11 62 0" fill="none" stroke="#ffd23f" stroke-width="2.4"/><circle cx="50" cy="25" r="4.6" fill="#fff"/><path d="M44 31l12 4M56 31l-12 4" stroke="#fff" stroke-width="2" stroke-linecap="round"/><circle cx="48.4" cy="24.6" r="1.2" fill="#2b2d42"/><circle cx="51.6" cy="24.6" r="1.2" fill="#2b2d42"/>`,
  crown: `<path d="M27 42l4-24 10 10 9-17 9 17 10-10 4 24z" fill="#ffd23f" ${st()}/><path d="M28 38h44" stroke="#e8a91c" stroke-width="3.4"/><circle cx="50" cy="30" r="3.4" fill="#ef4f5a" ${st(1.4)}/><circle cx="37" cy="32" r="2.6" fill="#56e0ff" ${st(1.2)}/><circle cx="63" cy="32" r="2.6" fill="#56e0ff" ${st(1.2)}/><circle cx="50" cy="11" r="2.2" fill="#fff"/>`,
  astro: '',
};
export function mascot(mood = 'happy', hat = mascotHat) {
  const mouth = mood === 'sad' ? `<path d="M44 74q6-5 12 0" fill="none" ${st(2.4)}/>` : `<path d="M42 71q8 8 16 0" fill="#ff8f8f" ${st(2.4)}/>`;
  const bubble = hat === 'astro'
    ? `<path d="M50 15V4" ${st(2.6)}/><circle cx="50" cy="4" r="3.4" fill="#ff5d5d" ${st(1.6)} class="blink"/>
       <circle cx="50" cy="57" r="42" fill="#bfe8ff" fill-opacity=".26" ${st(3)}/>
       <path d="M22 44q7-19 27-24" fill="none" stroke="#fff" stroke-width="4.4" stroke-linecap="round" opacity=".85"/>
       <path d="M17 82q33 17 66 0" fill="none" stroke="${INK}" stroke-width="10" stroke-linecap="round"/><path d="M17 82q33 17 66 0" fill="none" stroke="#c4cddb" stroke-width="6" stroke-linecap="round"/>`
    : '';
  return wrap(`<ellipse cx="50" cy="96" rx="26" ry="3.6" fill="#1b1340" opacity=".16"/>
  <circle cx="18" cy="70" r="7" fill="#fff" ${st(2.4)}/>
  <ellipse cx="50" cy="60" rx="33" ry="31" fill="#7b4a2a" ${st()}/>
  <ellipse cx="34" cy="46" rx="8" ry="5" fill="#fff" opacity=".22" transform="rotate(-30 34 46)"/>
  <ellipse cx="51" cy="63" rx="22" ry="20" fill="#e2bd8f" ${st(2.4)}/>
  ${eye(43, 57, 4.4, 0.6, 0.4)}${eye(59, 57, 4.4, 0.6, 0.4)}
  <path d="M36 49q6-4 12-1M54 48q6-3 12 1" fill="none" stroke="#3d2414" stroke-width="3.4" stroke-linecap="round"/>
  ${mouth}
  <path d="M32 67q9-9 18-2 9-7 18 2-7 4-18 0-11 4-18 0z" fill="#3d2414" ${st(1.6)}/>
  ${HATS[hat] ?? HATS.general}
  <circle cx="82" cy="40" r="7" fill="#fff" ${st(2.4)}/>
  <path d="M40 92l4-6 6 4 6-4 4 6" fill="#ffd23f" ${st(1.8)}/>
  ${bubble}`, '0 0 100 100', 'mascot');
}

// ================= LOOTKASSER =================
export function crateArt(kind = 'wood') {
  const [main, dark, trim, glow] = {
    wood: ['#c98b4f', '#8f5a2c', '#d9dee8', ''],
    gold: ['#ffcf3d', '#c99411', '#fff4c2', '#ffe680'],
    cosmic: ['#7a5cff', '#3f24a8', '#7ffcff', '#c77dff'],
  }[kind] || ['#c98b4f', '#8f5a2c', '#d9dee8', ''];
  return wrap(`${glow ? `<circle cx="50" cy="56" r="44" fill="${glow}" opacity=".35" class="pulse"/>` : ''}
  <ellipse cx="50" cy="92" rx="38" ry="5" fill="#1b1340" opacity=".18"/>
  <rect x="14" y="44" width="72" height="44" rx="6" fill="${main}" ${st()}/>
  <path d="M16 59h68M16 74h68" stroke="${dark}" stroke-width="2.4"/>
  <path d="M14 50h10v38H20q-6 0-6-6zM86 50H76v38h4q6 0 6-6z" fill="${trim}" ${st(2.4)}/>
  <g class="lid"><rect x="10" y="30" width="80" height="18" rx="6" fill="${main}" ${st()}/>
  <path d="M12 39h76" stroke="${dark}" stroke-width="2.4"/>
  <path d="M10 36q0-6 6-6h6v18h-6q-6 0-6-6zM90 36q0-6-6-6h-6v18h6q6 0 6-6z" fill="${trim}" ${st(2.4)}/></g>
  <rect x="43" y="42" width="14" height="16" rx="3.4" fill="${trim}" ${st(2.4)}/>
  ${kind === 'gold' ? `<path d="M50 46l3 4-3 4-3-4z" fill="#ef4f5a" ${st(1.4)}/>` : `<circle cx="50" cy="50" r="2.4" fill="${INK}"/>`}
  ${kind === 'cosmic' ? `${star(28, 70, 4.6, '#fff', 1.2)}${star(70, 68, 3.6, '#7ffcff', 1.2)}${star(56, 80, 2.8, '#ffe680', 1)}` : ''}
  ${kind === 'gold' ? `${star(26, 22, 4, '#fff8c4', 1.2)}${star(78, 18, 3, '#fff8c4', 1.2)}` : ''}`, '0 0 100 100', 'crate-art crate-' + kind);
}
// Fiktiv brus for demo-reklamer
export const colaArt = () => wrap(`<ellipse cx="50" cy="91" rx="22" ry="4" fill="#1b1340" opacity=".16"/>
  <rect x="30" y="16" width="40" height="72" rx="9" fill="#e5484d" ${st()}/>
  <rect x="30" y="16" width="40" height="9" rx="4.5" fill="#d6dde8" ${st(2.4)}/>
  <rect x="30" y="79" width="40" height="9" rx="4.5" fill="#d6dde8" ${st(2.4)}/>
  <path d="M31 44q19-9 38 0v18q-19 9-38 0z" fill="#fff"/>
  <ellipse cx="50" cy="53" rx="8" ry="7" fill="#7b4a2a" ${st(1.6)}/><ellipse cx="50" cy="50" rx="4.4" ry="2.4" fill="#e2bd8f"/>
  <path d="M37 28v44" stroke="#fff" stroke-width="3.4" opacity=".45" stroke-linecap="round"/>`, '0 0 100 100', 'bld-art');

// ================= PLANETER =================
const PLANETS = {
  earth: { base: '#4fa3ff', spots: [['#5fc94a', 'M-12 -14q10-6 16 2t-4 14q-10 2-12-16zM6 6q10 0 12 8-6 8-14 2z']] },
  moon: { base: '#c9ccd6', craters: '#a9acb8' },
  mars: { base: '#e8714a', craters: '#c75536', cap: '#fff' },
  venus: { base: '#f5c26b', bands: ['#e8a94e', '#ffe2a1'] },
  mercury: { base: '#b19a86', craters: '#917b68' },
  jupiter: { base: '#e8b98a', bands: ['#c98b5a', '#f6dcc0', '#b9764a'], spot: '#d9534f' },
  saturn: { base: '#f0d58c', bands: ['#d9b866', '#fbe9b8'], ring: '#d9c08a' },
  ice: { base: '#7fd8f0', bands: ['#5fc0e0', '#b5ecfa'] },
  neptune: { base: '#4f7cff', bands: ['#3d63d6', '#7fa0ff'] },
  pluto: { base: '#d9b9a0', heart: '#fff2e6', craters: '#b8957c' },
  slime: { base: '#7be07b', spots: [['#4fb843', 'M-10 -8a5 5 0 1 0 1 0zM8 6a6 6 0 1 0 1 0zM6 -14a3 3 0 1 0 1 0z']] },
  crystal: { base: '#b38cff', shards: '#e7d9ff' },
  lava: { base: '#ff7a3d', cracks: '#ffe066', dark: '#7a2e1a' },
  toxic: { base: '#d4f55a', bands: ['#9fd13c', '#f2ff9e'] },
  ocean: { base: '#2f7fe0', swirls: '#9fd8ff' },
  robot: { base: '#a9b4c6', plates: '#6f7a8e' },
  candy: { base: '#ff9ed2', bands: ['#ffd1ea', '#ff6fb8'], ring: '#9de7ff' },
};
function specialBody(kind) {
  if (kind === 'sun') {
    return `<circle r="40" fill="#ffe680" opacity=".45" class="pulse"/>
    ${Array.from({ length: 12 }, (_, i) => `<path d="M0 -36L5 -46L-5 -46Z" fill="#ffb000" ${st(2)} transform="rotate(${i * 30})"/>`).join('')}
    <circle r="31" fill="#ffcf33" ${st(3)}/><circle cx="-10" cy="-10" r="8" fill="#fff6c4"/>
    <circle cx="-9" cy="2" r="3" fill="${INK}"/><circle cx="9" cy="2" r="3" fill="${INK}"/><path d="M-9 12q9 8 18 0" fill="none" ${st(2.6)}/>`;
  }
  if (kind === 'mothership') {
    return `<path d="M-18 14L-34 46H34L18 14z" fill="#ff5dd6" opacity=".25" class="pulse"/>
    <path d="M-20 -6q0-26 20-26t20 26z" fill="#c9f1ff" ${st(3)}/>
    <ellipse cx="0" cy="-12" rx="9" ry="8" fill="#b38cff" ${st(2)}/><path d="M-8 -18l3-7 5 4 3-6 3 6 5-4 2 7z" fill="#ffd23f" ${st(1.6)}/>
    <circle cx="-3.5" cy="-12" r="2" fill="${INK}"/><circle cx="3.5" cy="-12" r="2" fill="${INK}"/>
    <ellipse cx="0" cy="2" rx="46" ry="15" fill="#8a7bd6" ${st(3)}/>
    <path d="M-44 6q44 14 88 0" fill="none" stroke="#ff5dd6" stroke-width="6"/>
    ${[-32, -16, 0, 16, 32].map((x, i) => `<circle cx="${x}" cy="${i % 2 ? 10 : 9}" r="3.2" fill="#fff59a" ${st(1.4)} class="blink" style="animation-delay:${i * 0.2}s"/>`).join('')}`;
  }
  return null;
}
export function planet(kind, opts = {}) {
  const sp = specialBody(kind);
  if (sp) return opts.raw ? sp : wrap(`<g transform="translate(50 50)">${sp}</g>`, '0 0 100 100', 'planet');
  const p = PLANETS[kind] || PLANETS.moon;
  const id = nid('pc');
  const r = 30;
  let inner = '';
  if (p.bands) {
    p.bands.forEach((c, i) => {
      const y = -r + ((i + 1) * 2 * r) / (p.bands.length + 1);
      inner += `<path d="M-40 ${(y - 4).toFixed(1)}q20 ${i % 2 ? 4 : -4} 40 0t40 0v${8 + (i % 2) * 2}q-20 4-40 0t-40 0z" fill="${c}"/>`;
    });
  }
  if (p.craters) inner += `<circle cx="-10" cy="-8" r="6" fill="${p.craters}" ${st(1.6)}/><circle cx="10" cy="10" r="4" fill="${p.craters}" ${st(1.6)}/><circle cx="12" cy="-14" r="2.6" fill="${p.craters}" ${st(1.2)}/>`;
  if (p.cap) inner += `<ellipse cx="0" cy="-28" rx="14" ry="5" fill="${p.cap}"/>`;
  if (p.spot) inner += `<ellipse cx="10" cy="8" rx="7" ry="4" fill="${p.spot}" ${st(1.6)}/>`;
  if (p.spots) p.spots.forEach(([c, d]) => (inner += `<path d="${d}" fill="${c}" ${st(1.4)}/>`));
  if (p.heart) inner += `<path d="M2 14q-12-6-8-14 4-6 8 0 4-6 8 0 4 8-8 14z" fill="${p.heart}"/>`;
  if (p.shards) inner += `<path d="M-14 -6l6-14 6 14-6 8zM6 4l5-11 5 11-5 7zM-6 12l4-8 4 8-4 5z" fill="${p.shards}" ${st(1.4)}/>`;
  if (p.cracks) inner += `<path d="M-24 -6l12 4 6-10 10 6 14-4M-16 14l10-4 8 8 12-6" fill="none" stroke="${p.cracks}" stroke-width="3" stroke-linecap="round"/>`;
  if (p.swirls) inner += `<path d="M-18 -8q8-8 16 0t16 0M-12 10q8-6 14 0t14 0" fill="none" stroke="${p.swirls}" stroke-width="3" stroke-linecap="round"/>`;
  if (p.plates) inner += `<path d="M-30 -10h60M-30 10h60M-10 -30v20M12 -10v20M-4 10v20" stroke="${p.plates}" stroke-width="2.4"/><circle cx="0" cy="0" r="6" fill="#ff4d4d" ${st(1.6)} class="blink"/>`;
  const ring = p.ring ? (front) => `<path d="${front ? 'M-46 2q46 18 92 0' : 'M-46 2q46 -16 92 0'}" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><path d="${front ? 'M-46 2q46 18 92 0' : 'M-46 2q46 -16 92 0'}" fill="none" stroke="${p.ring}" stroke-width="4" stroke-linecap="round"/>` : () => '';
  const body = `<defs><clipPath id="${id}"><circle r="${r}"/></clipPath></defs>
  ${ring(false)}
  <circle r="${r}" fill="${p.base}"/>
  <g clip-path="url(#${id})">${inner}<path d="M${r * 0.15} ${-r}a${r} ${r} 0 0 1 0 ${2 * r}a${r * 1.25} ${r * 1.25} 0 0 0 0 ${-2 * r}z" fill="#1b1340" opacity=".18" transform="rotate(-20)"/></g>
  <circle r="${r}" fill="none" ${st(3)}/>
  <ellipse cx="-12" cy="-14" rx="7" ry="4" fill="#fff" opacity=".35" transform="rotate(-35 -12 -14)"/>
  ${ring(true)}`;
  if (opts.raw) return body;
  return wrap(`<g transform="translate(50 50)">${body}</g>`, '0 0 100 100', 'planet');
}

// ================= IKONER (UI) =================
const ICONS = {
  coin: `<circle cx="12" cy="12" r="10" fill="#ffd23f" ${st(2)}/><circle cx="12" cy="12" r="6.6" fill="none" stroke="#e8a91c" stroke-width="1.6"/><path d="M12 7.6v8.8M14.4 9.6q-2.4-1.8-4.6-.2t.2 2.6 4.6 1.2q.4 2.6-4.6 1" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`,
  swords: `<path d="M4 4l11 11M20 4L9 15" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M4 4l11 11M20 4L9 15" stroke="#e3e9f2" stroke-width="2.4" stroke-linecap="round"/><path d="M13 17l4-4M11 17l-4-4" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><circle cx="18.5" cy="18.5" r="2.4" fill="#ffd23f" ${st(1.4)}/><circle cx="5.5" cy="18.5" r="2.4" fill="#ffd23f" ${st(1.4)}/>`,
  gear: `<path d="M12 2.5l2 .3.6 2.4 1.7.9 2.2-1.1 1.6 1.4-1 2.3.6 1.8 2.3.8v2.2l-2.3.8-.6 1.8 1 2.3-1.6 1.4-2.2-1.1-1.7.9-.6 2.4-2 .3-2-.3-.6-2.4-1.7-.9-2.2 1.1-1.6-1.4 1-2.3-.6-1.8L2.5 13v-2.2l2.3-.8.6-1.8-1-2.3L6 4.5l2.2 1.1 1.7-.9.6-2.4z" fill="#c4cddb" ${st(1.8)}/><circle cx="12" cy="12" r="3.4" fill="#fff" ${st(1.8)}/>`,
  base: `<path d="M3 11l9-7 9 7v9H3z" fill="#ff8a65" ${st(2)}/><path d="M9 20v-6h6v6" fill="#fff" ${st(2)}/><path d="M12 4V1" ${st(1.6)}/><path d="M12 1h5l-1.4 1.4L17 4h-5z" fill="#3559d6" ${st(1.2)}/>`,
  build: `<path d="M3 21V10l5 3V10l5 3V7h7v14z" fill="#8fd3ff" ${st(2)}/><path d="M15.5 3v4M18.5 4v3" ${st(2)}/><rect x="6" y="15" width="3" height="3" fill="#ffe680" ${st(1.2)}/><rect x="12" y="15" width="3" height="3" fill="#ffe680" ${st(1.2)}/>`,
  army: `<path d="M3.5 15q0-10 8.5-10t8.5 10z" fill="#4fb843" ${st(2)}/><path d="M2 15h20" ${st(2.6)}/><path d="M8 9q2-2 4-2" fill="none" stroke="#a3e394" stroke-width="1.8" stroke-linecap="round"/><path d="M7 15v3q5 4 10 0v-3" fill="none" ${st(1.8)}/>`,
  map: `<path d="M2 6l6-2 8 3 6-2v14l-6 2-8-3-6 2z" fill="#b6e36b" ${st(2)}/><path d="M8 4v14M16 7v14" stroke="${INK}" stroke-width="1.6"/><path d="M12 13.5q-3-3-3-5a3 3 0 0 1 6 0q0 2-3 5z" fill="#ef5b5b" ${st(1.4)}/>`,
  lock: `<rect x="5" y="10" width="14" height="11" rx="2.4" fill="#ffd23f" ${st(2)}/><path d="M8 10V7.5a4 4 0 0 1 8 0V10" fill="none" ${st(2.2)}/><circle cx="12" cy="15.5" r="1.6" fill="${INK}"/>`,
  check: `<circle cx="12" cy="12" r="10" fill="#4fb843" ${st(2)}/><path d="M7 12.5l3.4 3.4L17 9" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>`,
  star: `<path d="M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.5L12 17.2l-5.9 3.2 1.3-6.5L2.5 9.3l6.6-.8z" fill="#ffd23f" ${st(1.8)}/>`,
  sound: `<path d="M4 9h4l5-4v14l-5-4H4z" fill="#8fd3ff" ${st(2)}/><path d="M16 8.5q2 3.5 0 7M18.5 6q4 6 0 12" fill="none" ${st(2)}/>`,
  mute: `<path d="M4 9h4l5-4v14l-5-4H4z" fill="#c4cddb" ${st(2)}/><path d="M16 9l5 6M21 9l-5 6" ${st(2.2)}/>`,
  close: `<path d="M6 6l12 12M18 6L6 18" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/>`,
  crate: `<path d="M5 3q7-4 14 0" fill="#ff8a65" ${st(1.6)}/><path d="M5 3l5 7M19 3l-5 7M12 1v9" stroke="${INK}" stroke-width="1.2"/><rect x="6" y="10" width="12" height="11" rx="1.6" fill="#d39a5b" ${st(2)}/><path d="M6 10l12 11M18 10L6 21" stroke="#9b6a36" stroke-width="1.6"/>`,
  trophy: `<path d="M7 3h10v5a5 5 0 0 1-10 0z" fill="#ffd23f" ${st(2)}/><path d="M7 5H4q0 5 4 5M17 5h3q0 5-4 5" fill="none" ${st(1.8)}/><path d="M12 13v4M8 21h8l-1-4H9z" fill="#ffd23f" ${st(1.8)}/>`,
  tap: `<path d="M9 11V4.5a1.8 1.8 0 0 1 3.6 0V10l4.6.9q2.6.6 2.2 3.3L18.6 19q-.4 2-2.6 2H11q-1.2 0-2-1l-4-5q-.8-1.4.6-2.2 1.2-.6 2.2.4z" fill="#ffd2a8" ${st(1.8)}/><path d="M6 4.5q1-2.5 3-3.2M15.6 4.5q-1-2.5-3-3.2" fill="none" stroke="#ffd23f" stroke-width="1.6" stroke-linecap="round"/>`,
  boost: `<path d="M13 2L5 13h6l-1 9 8-11h-6z" fill="#ffd23f" ${st(1.8)}/>`,
  skull: `<path d="M12 3q8 0 8 7.5 0 3.5-3 5v3h-10v-3q-3-1.5-3-5Q4 3 12 3z" fill="#f4f7fb" ${st(1.8)}/><circle cx="9" cy="11" r="2" fill="${INK}"/><circle cx="15" cy="11" r="2" fill="${INK}"/><path d="M10 18.5v-2M14 18.5v-2" stroke="${INK}" stroke-width="1.4"/>`,
  flag: `<path d="M5 22V3" ${st(2)}/><path d="M5 3h14l-4 4.5 4 4.5H5z" fill="#e5484d" ${st(1.8)}/><path d="M5 3l7 4.5L5 12z" fill="#3559d6" ${st(1.4)}/>`,
  globe: `<circle cx="12" cy="12" r="9.5" fill="#4fa3ff" ${st(2)}/><path d="M6 7q4 0 4 4t-3 5M14 4q-1 4 2 5t4 4M12 21q0-4 3-5" fill="none" stroke="#5fc94a" stroke-width="2.4" stroke-linecap="round"/>`,
  rocket: `<path d="M12 2q5 4 5 11l-2 4H9l-2-4q0-7 5-11z" fill="#eef2f7" ${st(1.8)}/><circle cx="12" cy="9.5" r="2" fill="#8fd3ff" ${st(1.2)}/><path d="M9 17l-3 4 4-1M15 17l3 4-4-1" fill="#ef5b5b" ${st(1.4)}/>`,
  info: `<circle cx="12" cy="12" r="10" fill="#8fd3ff" ${st(2)}/><path d="M12 11v6" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/><circle cx="12" cy="7.4" r="1.6" fill="${INK}"/>`,
  zoomout: `<circle cx="10.5" cy="10.5" r="7" fill="#fff" ${st(2)}/><path d="M15.5 15.5l5 5" ${st(3)}/><path d="M7.5 10.5h6" ${st(2.2)}/>`,
  vibrate: `<rect x="8" y="3" width="8" height="18" rx="2" fill="#c4cddb" ${st(1.8)}/><path d="M4 8v8M20 8v8M2 10v4M22 10v4" ${st(1.6)}/>`,
  download: `<path d="M12 3v11M7.5 10l4.5 4.5 4.5-4.5" fill="none" ${st(2.4)}/><path d="M4 16v4h16v-4" fill="none" ${st(2.2)}/>`,
  gem: `<path d="M7 3.5h10l4.5 5.5L12 21 2.5 9z" fill="#56e0ff" ${st(1.8)}/><path d="M2.5 9h19M9.5 9L12 3.8 14.5 9 12 21 9.5 9" fill="none" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/><path d="M5.4 8l1.8-2.6" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>`,
  shop: `<path d="M3 9l2-5h14l2 5z" fill="#ff5d8f" ${st(1.8)}/><path d="M3 9q1.5 2.6 3 0 1.5 2.6 3 0 1.5 2.6 3 0 1.5 2.6 3 0 1.5 2.6 3 0 1.5 2.6 3 0" fill="#fff" ${st(1.4)}/><rect x="4.5" y="11.4" width="15" height="9.6" rx="1.4" fill="#fff4d6" ${st(1.8)}/><rect x="10" y="14" width="4.6" height="7" fill="#8fd3ff" ${st(1.3)}/>`,
  tree: `<path d="M12 22v-7" stroke="${INK}" stroke-width="5.4" stroke-linecap="round"/><path d="M12 22v-7" stroke="#9b6334" stroke-width="2.6" stroke-linecap="round"/><circle cx="12" cy="9.5" r="7.6" fill="#5fc94a" ${st(1.8)}/><circle cx="9" cy="8" r="1.7" fill="#ffd23f" ${st(1)}/><circle cx="14.6" cy="11.4" r="1.7" fill="#ff5d5d" ${st(1)}/>`,
  ad: `<rect x="2.5" y="4.5" width="19" height="13.5" rx="3" fill="#ffd23f" ${st(1.8)}/><path d="M10 8.2v6l5-3z" fill="${INK}"/><path d="M8 21h8" ${st(1.8)}/>`,
  adfree: `<rect x="2.5" y="4.5" width="19" height="13.5" rx="3" fill="#fff" ${st(1.8)}/><path d="M10 8.2v6l5-3z" fill="#c4cddb"/><path d="M4.5 20L19.5 3" stroke="#ef4f5a" stroke-width="3" stroke-linecap="round"/>`,
  palette: `<path d="M12 3a9 9 0 1 0 0 18c1.6 0 2-1.3 1.2-2.4-.8-1.1-.2-2.6 1.3-2.6H17a4 4 0 0 0 4-4c0-5-4-9-9-9z" fill="#fff4d6" ${st(1.8)}/><circle cx="7.5" cy="11" r="1.7" fill="#ef5b5b"/><circle cx="10" cy="7" r="1.7" fill="#ffd23f"/><circle cx="15" cy="7.5" r="1.7" fill="#4fb843"/><circle cx="17.5" cy="11.5" r="1.5" fill="#3559d6"/>`,
  ffwd: `<path d="M3 6l8 6-8 6zM12 6l8 6-8 6z" fill="#8fd3ff" ${st(1.8)}/>`,
  clock: `<circle cx="12" cy="12" r="9" fill="#fff" ${st(1.8)}/><path d="M12 7v5l3.5 2" fill="none" ${st(2)}/>`,
  gift: `<rect x="3.5" y="10" width="17" height="11" rx="2" fill="#ff5d8f" ${st(1.8)}/><rect x="2.5" y="7" width="19" height="4" rx="1.5" fill="#ff8fb1" ${st(1.6)}/><path d="M12 7v14" stroke="#ffd23f" stroke-width="3"/><path d="M12 7q-6-6-7.5-1.5T12 7q6-6 7.5-1.5T12 7" fill="none" ${st(1.5)}/>`,
};
export const icon = (name, cls = 'ico') => wrap(ICONS[name] || ICONS.star, '0 0 24 24', cls);

const DEFAULT_ME = { ...TEAMS.me };
let armyFx = '';
// Hær-skin: bytter fargene på alle egne enheter (og legger på glød/regnbue for de sjeldneste)
export function setArmySkin(skin) {
  Object.assign(TEAMS.me, DEFAULT_ME, skin && skin.team ? skin.team : {});
  armyFx = skin && skin.fx ? 'fx-' + skin.fx : '';
}
export function unitArt(id, side = 'me', skin = null) {
  const f = UNITS[id];
  const t = side === 'me' && skin ? { ...DEFAULT_ME, ...(skin.team || {}) } : TEAMS[side];
  const fx = side === 'me' ? (skin ? (skin.fx ? 'fx-' + skin.fx : '') : armyFx) : '';
  const inner = f ? f(t) : '';
  return wrap(side === 'foe' ? `<g transform="translate(100 0) scale(-1 1)">${inner}</g>` : inner, '0 0 100 100', 'unit-art ' + fx);
}
export function enemyArt(kind, variant) {
  let inner;
  if (kind === 'penguin') inner = ENEMIES.penguin(variant === 'boss');
  else if (kind === 'alien') inner = ENEMIES.alien(variant || '#7be07b', false);
  else if (kind === 'boss') inner = ENEMIES.alien(variant || '#b38cff', true);
  else if (kind === 'ufo') inner = ENEMIES.ufo(variant);
  else if (ENEMIES[kind]) inner = ENEMIES[kind]();
  else return null;
  return wrap(`<g transform="translate(100 0) scale(-1 1)">${inner}</g>`, '0 0 100 100', 'unit-art');
}
export const buildingArt = (id) => wrap(BUILDINGS[id] ? BUILDINGS[id]() : '', '0 0 100 100', 'bld-art');
export const hasUnitArt = (id) => !!UNITS[id];

// Spillets logo: Ohio med et stort flagg og kloden bak
export function logo() {
  return wrap(`<circle cx="100" cy="100" r="88" fill="#4fa3ff" ${st(5)}/>
  <path d="M30 70q30-10 50 6t40-4 52 10M24 120q40-8 60 6t60-2 34 4" fill="none" stroke="#5fc94a" stroke-width="16" stroke-linecap="round" opacity=".9"/>
  <g transform="translate(36 34) scale(.64)"><path d="${MAPS.ohioOutline}" fill="#ffd23f" stroke="${INK}" stroke-width="9" stroke-linejoin="round"/></g>
  <path d="M100 96V22" ${st(5)}/>${burgee(100, 18, 1.5)}
  ${star(86, 120, 12, '#fff', 3)}`, '0 0 200 200', 'logo-art');
}
