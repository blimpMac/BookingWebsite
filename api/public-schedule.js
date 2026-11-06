import { AppError } from '../server/errors.js';
import { context, respond, fail } from '../server/http.js';
import { validDate } from '../server/validation.js';
import { listPublicSchedule } from '../server/repository.js';
import { manilaCalendarDate } from '../server/publicSchedule.js';

/**
 * Public daily schedule for the reservation form.
 * No names, departments, notes, contact details or IDs are returned.
 * The date defaults to today in the Philippines.
 */
export default async function handler(req, res) {
  const ctx = context(req, res);
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return respond(ctx, 405, { error: 'Method not allowed.' });
    }
    const queryDate = req.query?.date;
    if (Array.isArray(queryDate)) {
      throw new AppError('BAD_QUERY', 'Choose one valid schedule date.');
    }
    const date = queryDate === undefined ? manilaCalendarDate() : String(queryDate);
    if (!validDate(date)) {
      throw new AppError('BAD_QUERY', 'Choose a valid schedule date.');
    }
    const schedule = await listPublicSchedule(date);
    return respond(ctx, 200, { date, ...schedule });
  } catch (error) {
    return fail(ctx, error, 'public-schedule.GET');
  }
}
