import test from 'node:test';
import assert from 'node:assert/strict';
import { validateDatabaseConfig } from '../server/repository.js';

const dedicated = {
  SUPABASE_URL: 'https://bookingsonlyexample.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-only-key-not-for-production',
  BOOKING_SUPABASE_PROJECT_REF: 'bookingsonlyexample',
};

test('booking database requires server-side credentials and an explicit project reference', () => {
  assert.throws(
    () => validateDatabaseConfig({}),
    error => error.code === 'DATABASE_NOT_CONFIGURED' && error.status === 503,
  );
  assert.throws(
    () => validateDatabaseConfig({ ...dedicated, BOOKING_SUPABASE_PROJECT_REF: '' }),
    error => error.code === 'DATABASE_NOT_CONFIGURED',
  );
});

test('booking project reference must match the Supabase URL', () => {
  assert.deepEqual(validateDatabaseConfig(dedicated), {
    url: dedicated.SUPABASE_URL,
    key: dedicated.SUPABASE_SERVICE_ROLE_KEY,
  });

  assert.throws(
    () => validateDatabaseConfig({
      ...dedicated,
      SUPABASE_URL: 'https://anotherproject.supabase.co',
    }),
    error => error.code === 'DATABASE_PROJECT_MISMATCH',
  );
});

test('invalid URL fails closed rather than selecting another project', () => {
  assert.throws(
    () => validateDatabaseConfig({ ...dedicated, SUPABASE_URL: 'not-a-url' }),
    error => error.code === 'DATABASE_CONFIG_INVALID',
  );
});
