import { AppError } from '../server/errors.js';
import { context, respond, fail, requireJsonSameOrigin } from '../server/http.js';
import { bookingInput } from '../server/validation.js';
import { createBooking } from '../server/repository.js';

/**
 * Public intake endpoint. Only pending requests may be created.
 * Never reveal other visitors' bookings or Supabase credentials.
 */
export default async function handler(req, res) {
  const ctx = context(req, res);
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return respond(ctx, 405, { error: 'Method not allowed.' });
    }
    if (!requireJsonSameOrigin(req))
      throw new AppError('INVALID_ORIGIN', 'Invalid request origin.', 403);
    if (req.body?.website) return respond(ctx, 202, { accepted: true }); // Honeypot for automated submissions
    const booking = bookingInput(req.body, { publicSubmission: true });
    await createBooking(booking);
    return respond(ctx, 201, { accepted: true, message: 'Booking request received. Await administrator confirmation.' });
  } catch (error) {
    return fail(ctx, error, 'public-bookings.POST');
  }
}
