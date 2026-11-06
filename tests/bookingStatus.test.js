import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BOOKING_STATUSES,
  bookingStatus,
  bookingId,
  isStatusOnlyPatch,
} from '../server/validation.js';

const id = '13b0b4ac-2a12-4f4c-a2c3-12a3e5c12f7b';

test('administrator status dropdown uses the exact persisted booking statuses', () => {
  assert.deepEqual(BOOKING_STATUSES, ['pending', 'confirmed', 'completed', 'cancelled']);
  for (const status of BOOKING_STATUSES)
    assert.equal(bookingStatus(status), status);
  for (const status of ['deleted', 'removed', '', null, undefined, 'CONFIRMED']) {
    assert.throws(() => bookingStatus(status), error => error.code === 'INVALID_STATUS');
  }
});

test('status-only updates require exactly an existing booking id and a status', () => {
  assert.equal(isStatusOnlyPatch({ id, status: 'cancelled' }), true);
  assert.equal(isStatusOnlyPatch({ id, status: 'confirmed' }), true);
  assert.equal(bookingId(id), id);
  assert.equal(isStatusOnlyPatch({ id, status: 'cancelled', booked_by: 'Different person' }), false);
  assert.equal(isStatusOnlyPatch({ id }), false);
  assert.equal(isStatusOnlyPatch({ status: 'cancelled' }), false);
  assert.equal(isStatusOnlyPatch(null), false);
  assert.equal(isStatusOnlyPatch([]), false);
});

test('cancelled status is reversible to confirmed, not a deletion state', () => {
  assert.equal(bookingStatus('cancelled'), 'cancelled');
  assert.equal(bookingStatus('confirmed'), 'confirmed');
  assert.equal(BOOKING_STATUSES.includes('deleted'), false);
});
