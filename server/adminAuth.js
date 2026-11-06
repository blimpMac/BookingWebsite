import { createHmac, scryptSync, timingSafeEqual } from 'node:crypto';

const COOKIE = 'greenlight_admin_session';
const SESSION_MS = 7 * 24 * 60 * 60 * 1000;

function sign(value) {
  return createHmac('sha256', process.env.SESSION_SECRET || '').update(value).digest('hex');
}
function equal(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
export function configured() {
  const [salt, hash] = (process.env.ADMIN_PASSWORD_SCRYPT || '').split(':');
  return /^[0-9a-f]{32}$/i.test(salt || '') &&
    /^[0-9a-f]{128}$/i.test(hash || '') && (process.env.SESSION_SECRET || '').length >= 32;
}
export function verifyAdmin(username, password) {
  if (!configured() || typeof username !== 'string' || typeof password !== 'string') return false;
  const [salt, expected] = process.env.ADMIN_PASSWORD_SCRYPT.split(':');
  const actual = scryptSync(password, Buffer.from(salt, 'hex'), 64, { N: 16384, r: 8, p: 1 }).toString('hex');
  return username === (process.env.ADMIN_USERNAME || 'Greenlight') && equal(actual, expected);
}
export function makeCookie() {
  const payload = Buffer.from(JSON.stringify({
    role: 'admin', exp: Date.now() + SESSION_MS
  })).toString('base64url');
  const flags = ['Path=/', 'HttpOnly', 'SameSite=Strict', 'Max-Age=604800'];
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') flags.push('Secure');
  return `${COOKIE}=${payload}.${sign(payload)}; ${flags.join('; ')}`;
}
export function clearCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;
}
export function authorized(req) {
  if (!configured()) return false;
  const cookie = (req.headers.cookie || '').split(';').map(s => s.trim()).find(x => x.startsWith(COOKIE + '='));
  if (!cookie) return false;
  const [payload, signature] = cookie.slice(COOKIE.length + 1).split('.');
  if (!payload || !signature || !equal(sign(payload), signature)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return data.role === 'admin' && Number.isFinite(data.exp) && data.exp > Date.now();
  } catch { return false; }
}
