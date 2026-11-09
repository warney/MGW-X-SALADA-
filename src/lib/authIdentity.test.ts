import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveAuthIdentity } from './authIdentity';

test('uses authenticated user ID as the stable identity', () => {
  assert.deepEqual(
    resolveAuthIdentity({ id: ' user-123 ', email: 'User@Example.com' }),
    { userId: 'user-123', email: 'user@example.com' },
  );
});

test('returns null when there is no authenticated user ID', () => {
  assert.equal(resolveAuthIdentity(null), null);
  assert.equal(resolveAuthIdentity(undefined), null);
  assert.equal(resolveAuthIdentity({ id: '   ', email: 'user@example.com' }), null);
});

test('does not require an email to identify an authenticated user', () => {
  assert.deepEqual(
    resolveAuthIdentity({ id: 'user-456', email: null }),
    { userId: 'user-456', email: null },
  );
});

test('normalizes an empty email to null', () => {
  assert.deepEqual(
    resolveAuthIdentity({ id: 'user-789', email: '   ' }),
    { userId: 'user-789', email: null },
  );
});
