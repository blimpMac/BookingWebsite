import { authorized } from '../server/adminAuth.js';
import { AppError } from '../server/errors.js';
import { context, respond, fail, requireJsonSameOrigin } from '../server/http.js';
import { bookingInput, bookingId } from '../server/validation.js';
import { listBookings, createBooking, editBooking, cancelBooking } from '../server/repository.js';

/** Private administration: list, create, edit, approve and cancel bookings. */
export default async function handler(req, res) {
  const ctx = context(req, res);
  try {
    if (!authorized(req)) throw new AppError('UNAUTHORIZED', 'Administrator sign-in is required.', 401);
    if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(req.method)) {
      res.setHeader('Allow', 'GET, POST, PATCH, DELETE');
      return respond(ctx, 405, { error: 'Method not allowed.' });
    }
    if (req.method !== 'GET' && !requireJsonSameOrigin(req))
      throw new AppError('INVALID_ORIGIN', 'Invalid request origin.', 403);
    if (req.method === 'GET') return respond(ctx, 200, await listBookings());
    if (req.method === 'POST') return respond(ctx, 201, { booking: await createBooking(bookingInput(req.body)) });
    if (req.method === 'PATCH')
      return respond(ctx, 200, { booking: await editBooking(bookingId(req.body?.id), bookingInput(req.body)) });
    return respond(ctx, 200, { booking: await cancelBooking(bookingId(req.body?.id)) });
  } catch (error) {
    return fail(ctx, error, 'bookings.' + req.method);
  }
}
