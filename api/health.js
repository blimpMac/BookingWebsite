import { authorized, configured } from '../server/adminAuth.js';
import { AppError } from '../server/errors.js';
import { context, respond, fail } from '../server/http.js';
import { healthCheck } from '../server/repository.js';

/** Administrator-only readiness probe, safe to include in end-user support instructions. */
export default async function handler(req, res) {
  const ctx = context(req, res);
  try {
    if (req.method !== 'GET') return respond(ctx, 405, { error: 'Method not allowed.' });
    if (!authorized(req)) throw new AppError('UNAUTHORIZED', 'Sign in first.', 401);
    await healthCheck();
    return respond(ctx, 200, { status: 'ok', authentication: configured(), database: 'connected' });
  } catch (error) {
    return fail(ctx, error, 'health.GET');
  }
}
