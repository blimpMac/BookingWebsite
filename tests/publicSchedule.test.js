import test from 'node:test';
import assert from 'node:assert/strict';
import { manilaCalendarDate, toPublicScheduleEntry } from '../server/publicSchedule.js';

test('public schedule never includes a booker name, department, notes or ID', () => {
  const privateRecord = {
    id: 'not-for-public',
    booked_for: '2026-11-06',
    resource: 'Conference Room',
    start_time: '09:30:00',
    end_time: '10:30:00',
    booked_by: 'Private person',
    department: 'Finance',
    purpose: 'Confidential meeting',
    notes: 'Private notes',
    status: 'pending',
    created_at: '2026-11-06T00:00:00Z',
  };
  assert.deepEqual(toPublicScheduleEntry(privateRecord), {
    resource: 'Conference Room',
    start_time: '09:30',
    end_time: '10:30',
    status: 'pending',
  });
  const publicText = JSON.stringify(toPublicScheduleEntry(privateRecord));
  for (const secret of ['Private person', 'Finance', 'Confidential meeting', 'Private notes', 'not-for-public']) {
    assert.equal(publicText.includes(secret), false);
  }
});

test('today is computed in Philippine time across the UTC day boundary', () => {
  assert.equal(manilaCalendarDate(new Date('2026-11-06T15:59:59Z')), '2026-11-06');
  assert.equal(manilaCalendarDate(new Date('2026-11-06T16:00:00Z')), '2026-11-07');
  assert.equal(manilaCalendarDate(new Date('2026-12-31T16:00:00Z')), '2027-01-01');
});
