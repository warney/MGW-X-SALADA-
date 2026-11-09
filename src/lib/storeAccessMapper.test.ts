import test from 'node:test';
import assert from 'node:assert/strict';
import { mapPlatformAdminRow, mapStoreMembershipRow } from './storeAccessMapper';

const timestamp = '2026-11-06T12:00:00.000Z';

test('maps a valid active membership row', () => {
  assert.deepEqual(
    mapStoreMembershipRow({
      id: 'membership-1',
      store_id: 'store-1',
      user_id: 'user-1',
      role: 'owner',
      active: true,
      created_at: timestamp,
      updated_at: timestamp,
    }),
    {
      id: 'membership-1',
      storeId: 'store-1',
      userId: 'user-1',
      role: 'owner',
      active: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  );
});

test('preserves inactive membership state without granting access', () => {
  const mapped = mapStoreMembershipRow({
    id: 'membership-2',
    store_id: 'store-1',
    user_id: 'user-1',
    role: 'staff',
    active: false,
    created_at: timestamp,
    updated_at: timestamp,
  });

  assert.equal(mapped?.active, false);
  assert.equal(mapped?.role, 'staff');
});

test('rejects invalid membership roles and malformed rows', () => {
  assert.equal(
    mapStoreMembershipRow({
      id: 'membership-1',
      store_id: 'store-1',
      user_id: 'user-1',
      role: 'super_admin',
      active: true,
      created_at: timestamp,
      updated_at: timestamp,
    }),
    null,
  );
  assert.equal(mapStoreMembershipRow(null), null);
  assert.equal(mapStoreMembershipRow({}), null);
});

test('maps a valid platform admin row', () => {
  assert.deepEqual(
    mapPlatformAdminRow({
      user_id: 'user-1',
      role: 'super_admin',
      active: true,
      created_at: timestamp,
    }),
    {
      userId: 'user-1',
      role: 'super_admin',
      active: true,
      createdAt: timestamp,
    },
  );
});

test('rejects platform admin rows with any other role or missing active flag', () => {
  assert.equal(
    mapPlatformAdminRow({
      user_id: 'user-1',
      role: 'owner',
      active: true,
      created_at: timestamp,
    }),
    null,
  );
  assert.equal(
    mapPlatformAdminRow({
      user_id: 'user-1',
      role: 'super_admin',
      created_at: timestamp,
    }),
    null,
  );
  assert.equal(mapPlatformAdminRow(undefined), null);
});
