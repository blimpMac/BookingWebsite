import { AppError } from '../server/errors.js';
import { context, respond, fail } from '../server/http.js';
import { validDate } from '../server/validation.js';
import { occupiedTimes } from '../server/repository.js';

/** Public schedule only; never return guest names, departments or notes. */
export default async function handler(req, res) {
  const ctx = context(req, res);
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return respond(ctx, 405, { error: 'Method not allowed.' });
    }
    const date = String(req.query?.date || '');
    const resource = String(req.query?.resource || '').trim();
    if (!validDate(date) || !resource || resource.length > 120)
      throw new AppError('BAD_QUERY', 'Valid date and resource are required.');
    const occupied = await occupiedTimes(date, resource);
    return respond(ctx, 200, { occupied });
  } catch (error) {
    return fail(ctx, error, 'availability.GET');
  }
}
