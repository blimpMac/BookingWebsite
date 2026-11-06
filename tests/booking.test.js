import test from 'node:test';
import assert from 'node:assert/strict';
import { bookingInput, bookingId, validDate, validTime } from '../server/validation.js';
import { toPublicError } from '../server/errors.js';

const valid = {
  booked_for: '2099-11-20', start_time: '09:00', end_time: '10:00',
  resource: 'Conference Room', booked_by: 'Sample User', department: 'Engineering', status: 'confirmed'
};

test('date parsing rejects impossible dates and accepts leap dates', () => {
  assert.equal(validDate('2026-02-31'), false);
  assert.equal(validDate('2028-02-29'), true);
  assert.equal(validDate('invalid'), false);
});

test('time parsing rejects invalid hours and formats', () => {
  assert.equal(validTime('09:30'), true);
  assert.equal(validTime('24:00'), false);
  assert.equal(validTime('9:30'), false);
});

test('booking validation prevents end-before-start and missing details', () => {
  assert.throws(() => bookingInput({ ...valid, end_time: '08:00' }), /time range/);
  assert.throws(() => bookingInput({ ...valid, booked_by: '' }), /Name and resource/);
});

test('public submission always uses pending status and strips privileged fields', () => {
  const booking = bookingInput({ ...valid, status: 'confirmed', notes: 'Private', admin: true }, { publicSubmission: true });
  assert.equal(booking.status, 'pending');
  assert.equal(booking.notes, '');
  assert.equal(booking.admin, undefined);
});

test('validates IDs before database access', () => {
  assert.throws(() => bookingId('not-a-real-id'), /Invalid booking/);
  assert.equal(bookingId('76543210-1234-1234-1234-123456789012'), '76543210-1234-1234-1234-123456789012');
});

test('maps database overlap to readable 409 response code', () => {
  const mapped = toPublicError({ code:'23P01' });
  assert.equal(mapped.status, 409);
  assert.equal(mapped.code, 'BOOKING_OVERLAP');
});

test('public booking requires a department so the schedule can display it', () => {
  assert.throws(
    () => bookingInput({ ...valid, department: '' }, { publicSubmission: true }),
    error => error.code === 'MISSING_DEPARTMENT'
  );
  assert.equal(bookingInput(valid, { publicSubmission: true }).department, 'Engineering');
  // Admin edits to old records remain possible even without department.
  assert.equal(bookingInput({ ...valid, department: '' }).department, '');
});
