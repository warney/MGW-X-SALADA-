import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveStoreAccess } from './storeAccess';
import type { PlatformAdmin, StoreMembership } from '../types/saas';

const membership = (overrides: Partial<StoreMembership> = {}): StoreMembership => ({
  id: 'membership-1',
  storeId: 'store-a',
  userId: 'user-a',
  role: 'editor',
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const superAdmin = (overrides: Partial<PlatformAdmin> = {}): PlatformAdmin => ({
  userId: 'user-root',
  role: 'super_admin',
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

test('returns null when user or store is not selected', () => {
  assert.equal(resolveStoreAccess(null, 'store-a', [], null), null);
  assert.equal(resolveStoreAccess('user-a', null, [], null), null);
});

test('grants only the active membership belonging to the authenticated user and selected store', () => {
  const access = resolveStoreAccess(
    'user-a',
    'store-a',
    [
      membership({ userId: 'user-other', role: 'owner' }),
      membership({ id: 'membership-b', storeId: 'store-b', role: 'owner' }),
      membership(),
    ],
    null,
  );

  assert.equal(access?.role, 'editor');
  assert.equal(access?.canAccessStore, true);
  assert.ok(access?.permissions.includes('products.manage'));
  assert.equal(access?.permissions.includes('members.manage'), false);
});

test('does not grant access from another user membership', () => {
  const access = resolveStoreAccess(
    'user-a',
    'store-a',
    [membership({ userId: 'user-b', role: 'owner' })],
    null,
  );

  assert.equal(access?.role, null);
  assert.equal(access?.canAccessStore, false);
  assert.deepEqual(access?.permissions, []);
});

test('does not grant access from an inactive membership', () => {
  const access = resolveStoreAccess('user-a', 'store-a', [membership({ active: false })], null);

  assert.equal(access?.role, null);
  assert.equal(access?.canAccessStore, false);
  assert.deepEqual(access?.permissions, []);
});

test('active platform admin can access a store without membership when user IDs match', () => {
  const access = resolveStoreAccess('user-root', 'store-a', [], superAdmin());

  assert.equal(access?.isPlatformAdmin, true);
  assert.equal(access?.canAccessStore, true);
  assert.deepEqual(access?.permissions, []);
});

test('does not accept a platform admin record belonging to another user', () => {
  const access = resolveStoreAccess('user-a', 'store-a', [], superAdmin());

  assert.equal(access?.isPlatformAdmin, false);
  assert.equal(access?.canAccessStore, false);
});

test('inactive platform admin does not receive platform access', () => {
  const access = resolveStoreAccess(
    'user-root',
    'store-a',
    [],
    superAdmin({ active: false }),
  );

  assert.equal(access?.isPlatformAdmin, false);
  assert.equal(access?.canAccessStore, false);
});
