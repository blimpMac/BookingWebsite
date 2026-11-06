import { randomUUID } from 'node:crypto';
import { toPublicError } from './errors.js';

export function context(req, res) {
  const requestId = randomUUID();
  res.setHeader('X-Request-ID', requestId);
  res.setHeader('Cache-Control', 'private, no-store');
  return { req, res, requestId };
}
export function respond(ctx, status, body) {
  return ctx.res.status(status).json({ ...body, requestId: ctx.requestId });
}
export function fail(ctx, error, operation) {
  const safe = toPublicError(error);
  // Never log names, passwords, notes, cookies, or request bodies.
  console.error(JSON.stringify({
    level: 'error', at: new Date().toISOString(), operation,
    requestId: ctx.requestId, code: error?.code || safe.code,
    detail: error?.message || 'Unknown error'
  }));
  return respond(ctx, safe.status, { code: safe.code, error: safe.message });
}
export function requireJsonSameOrigin(req) {
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toLowerCase();
  const origin = req.headers.origin;
  const mime = (req.headers['content-type'] || '').toLowerCase();
  if (!origin || !host || !mime.startsWith('application/json')) return false;
  try {
    const url = new URL(origin);
    return url.host.toLowerCase() === host && (url.protocol === 'https:' || process.env.NODE_ENV !== 'production');
  } catch { return false; }
}
