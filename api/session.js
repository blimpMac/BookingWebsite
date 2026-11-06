import { authorized, configured, verifyAdmin, makeCookie, clearCookie } from '../server/adminAuth.js';
import { AppError } from '../server/errors.js';
import { context, respond, fail, requireJsonSameOrigin } from '../server/http.js';

export default async function handler(req, res) {
  const ctx = context(req, res);
  try {
    if (req.method === 'GET') {
      return respond(ctx, 200, { authenticated: authorized(req), configured: configured() });
    }
    if (!['POST', 'DELETE'].includes(req.method)) {
      res.setHeader('Allow', 'GET, POST, DELETE');
      return respond(ctx, 405, { error: 'Method not allowed.' });
    }
    if (!requireJsonSameOrigin(req)) throw new AppError('INVALID_ORIGIN', 'Request must come from this website.', 403);
    if (req.method === 'DELETE') {
      res.setHeader('Set-Cookie', clearCookie());
      return respond(ctx, 200, { authenticated: false });
    }
    if (!verifyAdmin(req.body?.username, req.body?.password))
      throw new AppError('INVALID_CREDENTIALS', 'Invalid username or password.', 401);
    res.setHeader('Set-Cookie', makeCookie());
    return respond(ctx, 200, { authenticated: true });
  } catch (error) {
    return fail(ctx, error, 'session.' + req.method);
  }
}
