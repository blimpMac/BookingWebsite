import { authorized } from '../server/adminAuth.js';
import { AppError } from '../server/errors.js';
import { context, respond, fail, requireJsonSameOrigin } from '../server/http.js';
import { bookingInput, bookingId, bookingStatus, isStatusOnlyPatch } from '../server/validation.js';
import { listBookings, createBooking, editBooking, updateBookingStatus } from '../server/repository.js';

/** Private administration: list, create, edit, and change booking status. */
export default async function handler(req, res) {
  const ctx = context(req, res);
  try {
    if (!authorized(req)) throw new AppError('UNAUTHORIZED', 'Administrator sign-in is required.', 401);
    if (!['GET', 'POST', 'PATCH'].includes(req.method)) {
      res.setHeader('Allow', 'GET, POST, PATCH');
      return respond(ctx, 405, { error: 'Method not allowed.' });
    }
    if (req.method !== 'GET' && !requireJsonSameOrigin(req))
      throw new AppError('INVALID_ORIGIN', 'Invalid request origin.', 403);
    if (req.method === 'GET') return respond(ctx, 200, await listBookings());
    if (req.method === 'POST') return respond(ctx, 201, { booking: await createBooking(bookingInput(req.body)) });
    if (req.method === 'PATCH') {
      const id = bookingId(req.body?.id);
      // A status-only change updates exactly one database column.
      if (isStatusOnlyPatch(req.body))
        return respond(ctx, 200, {
          booking: await updateBookingStatus(id, bookingStatus(req.body.status))
        });
      return respond(ctx, 200, { booking: await editBooking(id, bookingInput(req.body)) });
    }
  } catch (error) {
    return fail(ctx, error, 'bookings.' + req.method);
  }
}
