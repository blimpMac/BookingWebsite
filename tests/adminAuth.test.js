import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, scryptSync } from 'node:crypto';
import { configured, verifyAdmin, makeCookie, authorized } from '../server/adminAuth.js';
import { requireJsonSameOrigin } from '../server/http.js';

test('server-side admin verification and session signature', () => {
  const backup = {
    ADMIN_USERNAME: process.env.ADMIN_USERNAME,
    ADMIN_PASSWORD_SCRYPT: process.env.ADMIN_PASSWORD_SCRYPT,
    SESSION_SECRET: process.env.SESSION_SECRET,
  };
  const password = 'test-password-only-never-used-in-production';
  const salt = randomBytes(16);
  const digest = scryptSync(password, salt, 64, {N:16384,r:8,p:1});
  try {
    process.env.ADMIN_USERNAME = 'TestAdmin';
    process.env.ADMIN_PASSWORD_SCRYPT = salt.toString('hex') + ':' + digest.toString('hex');
    process.env.SESSION_SECRET = randomBytes(32).toString('hex');
    assert.equal(configured(), true);
    assert.equal(verifyAdmin('TestAdmin',password), true);
    assert.equal(verifyAdmin('TestAdmin','invalid'), false);
    assert.equal(verifyAdmin('Other',password), false);
    const cookie = makeCookie().split(';')[0];
    assert.equal(authorized({ headers: { cookie } }), true);
    assert.equal(authorized({ headers: { cookie: cookie + 'tampered' } }), false);
  } finally {
    for (const [key, value] of Object.entries(backup)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test('same-origin JSON protects mutation requests', () => {
  const good = { headers: {
    origin: 'https://greenlight-booking.vercel.app',
    host: 'greenlight-booking.vercel.app',
    'content-type': 'application/json'
  }};
  assert.equal(requireJsonSameOrigin(good), true);
  assert.equal(requireJsonSameOrigin({headers:{...good.headers,origin:'https://another-site.com'}}), false);
  assert.equal(requireJsonSameOrigin({headers:{...good.headers,'content-type':'text/plain'}}), false);
});
