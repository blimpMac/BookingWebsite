import { AppError } from './errors.js';

export const BOOKING_STATUSES = Object.freeze(['pending', 'confirmed', 'completed', 'cancelled']);
const clean = (value, limit) => typeof value === 'string' ? value.trim().slice(0, limit) : '';

export function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const parsed = new Date(value + 'T00:00:00Z');
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
export function validTime(value) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value || '');
}
export function bookingInput(body, { publicSubmission = false } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body))
    throw new AppError('BAD_INPUT', 'Booking details are required.');
  const booking = {
    booked_for: clean(body.booked_for, 10),
    start_time: clean(body.start_time, 5),
    end_time: clean(body.end_time, 5),
    resource: clean(body.resource, 120),
    booked_by: clean(body.booked_by, 120),
    department: clean(body.department, 120),
    purpose: clean(body.purpose, 1000),
    notes: publicSubmission ? '' : clean(body.notes, 1000),
    status: publicSubmission ? 'pending' : clean(body.status, 30) || 'confirmed'
  };
  if (!validDate(booking.booked_for)) throw new AppError('INVALID_DATE', 'Select a valid booking date.');
  if (!validTime(booking.start_time) || !validTime(booking.end_time) || booking.end_time <= booking.start_time)
    throw new AppError('INVALID_TIME', 'Choose a valid time range (end after start).');
  if (!booking.resource || !booking.booked_by)
    throw new AppError('MISSING_FIELDS', 'Name and resource are required.');
  if (publicSubmission && !booking.department)
    throw new AppError('MISSING_DEPARTMENT', 'Select your department before submitting.');
  if (!BOOKING_STATUSES.includes(booking.status))
    throw new AppError('INVALID_STATUS', 'Invalid booking status.');
  if (publicSubmission && booking.booked_for < new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }))
    throw new AppError('DATE_IN_PAST', 'Please select today or a later date.');
  return booking;
}
/** A status-only admin update must never rewrite reservation fields. */
export function isStatusOnlyPatch(body) {
  return body !== null && typeof body === 'object' &&
    !Array.isArray(body) &&
    Object.keys(body).length === 2 &&
    Object.prototype.hasOwnProperty.call(body, 'id') &&
    Object.prototype.hasOwnProperty.call(body, 'status');
}

export function bookingStatus(value) {
  if (typeof value !== 'string' || !BOOKING_STATUSES.includes(value))
    throw new AppError('INVALID_STATUS', 'Choose a valid booking status.');
  return value;
}

export function bookingId(id) {
  if (typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
    throw new AppError('INVALID_ID', 'Invalid booking identifier.');
  return id;
}
