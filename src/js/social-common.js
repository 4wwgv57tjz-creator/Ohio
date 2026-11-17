// Felles hjelpere for leaderboard og venner (brukes av både demo og Firebase).
export const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const randomCode = () => Array.from({ length: 6 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join('');
// Godtar «ohio-ab12cd», «AB12CD» osv.
export function normalizeCode(input) {
  let c = String(input || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (c.startsWith('OHIO') && c.length > 6) c = c.slice(4);
  return /^[A-Z0-9]{6}$/.test(c) ? c : '';
}
export const formatCode = (c) => (c ? 'OHIO-' + c : '');
