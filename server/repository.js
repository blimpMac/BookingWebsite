import { createClient } from '@supabase/supabase-js';
import { AppError } from './errors.js';

export const TABLE = 'greenlight_booking_reservations';
let db;

/**
 * Prevents the booking service from accidentally connecting to an existing
 * application database. The project reference MUST be from the new, dedicated
 * Greenlight Booking project and is configured only in Vercel.
 */
export function validateDatabaseConfig(config) {
  const {
    SUPABASE_URL: url,
    SUPABASE_SECRET_KEY,
    SUPABASE_SERVICE_ROLE_KEY,
    BOOKING_SUPABASE_PROJECT_REF: projectRef,
  } = config;

  // Prefer modern, independently rotatable Supabase secret keys. Legacy service_role
  // remains supported during migration; neither key is ever sent to the browser.
  const key = SUPABASE_SECRET_KEY || SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key || !projectRef) {
    throw new AppError(
      'DATABASE_NOT_CONFIGURED',
      'Greenlight Booking is not connected to its dedicated database.',
      503,
    );
  }

  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (hostname !== projectRef.toLowerCase() + '.supabase.co') {
      throw new AppError(
        'DATABASE_PROJECT_MISMATCH',
        'The booking database project does not match its approved configuration.',
        503,
      );
    }
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('DATABASE_CONFIG_INVALID', 'The booking database URL is invalid.', 503);
  }

  return { url, key };
}

/** Only Vercel server-side functions can access these credentials. */
export function database() {
  const { url, key } = validateDatabaseConfig(process.env);
  if (!db) {
    db = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return db;
}
export async function listBookings() {
  const result = [];
  // Explicit paging avoids Supabase's default 1,000-row response cap.
  for (let from = 0; from < 10000; from += 1000) {
    const { data, error } = await database().from(TABLE).select('*')
      .order('booked_for', { ascending: false }).order('start_time', { ascending: false })
      .range(from, from + 999);
    if (error) throw error;
    result.push(...(data || []));
    if (!data || data.length < 1000) return { bookings: result, capped: false };
  }
  return { bookings: result, capped: true };
}
export async function occupiedTimes(date, resource) {
  const { data, error } = await database().from(TABLE)
    .select('start_time,end_time')
    .eq('booked_for', date).eq('resource', resource).neq('status', 'cancelled');
  if (error) throw error;
  return (data || []).map(({ start_time, end_time }) => ({
    start_time: start_time.slice(0, 5), end_time: end_time.slice(0, 5)
  }));
}
export async function createBooking(booking) {
  const { data, error } = await database().from(TABLE).insert(booking).select('*').single();
  if (error) throw error;
  return data;
}
export async function editBooking(id, booking) {
  const { data, error } = await database().from(TABLE).update(booking).eq('id', id).select('*').maybeSingle();
  if (error) throw error;
  if (!data) throw new AppError('NOT_FOUND', 'Booking not found.', 404);
  return data;
}
export async function cancelBooking(id) {
  const { data, error } = await database().from(TABLE).update({ status: 'cancelled' }).eq('id', id).select('*').maybeSingle();
  if (error) throw error;
  if (!data) throw new AppError('NOT_FOUND', 'Booking not found.', 404);
  return data;
}
export async function healthCheck() {
  const { error } = await database().from(TABLE).select('id', { head: true }).limit(1);
  if (error) throw error;
  return true;
}
