import test from 'node:test';
import assert from 'node:assert/strict';
import { mapStoreRow } from './storeMapper';

const timestamp = '2026-11-06T12:00:00.000Z';

test('maps a valid active store row', () => {
  assert.deepEqual(
    mapStoreRow({
      id: 'store-1',
      name: 'Loja Exemplo',
      slug: 'loja-exemplo',
      status: 'active',
      created_by: 'user-1',
      created_at: timestamp,
      updated_at: timestamp,
    }),
    {
      id: 'store-1',
      name: 'Loja Exemplo',
      slug: 'loja-exemplo',
      status: 'active',
      createdBy: 'user-1',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  );
});

test('accepts every declared store lifecycle status', () => {
  for (const status of ['draft', 'active', 'suspended', 'archived']) {
    const mapped = mapStoreRow({
      id: 'store-1',
      name: 'Loja',
      slug: 'loja',
      status,
      created_by: 'user-1',
      created_at: timestamp,
      updated_at: timestamp,
    });
    assert.equal(mapped?.status, status);
  }
});

test('rejects malformed slugs and unknown statuses', () => {
  const base = {
    id: 'store-1',
    name: 'Loja',
    slug: 'Loja Invalida',
    status: 'active',
    created_by: 'user-1',
    created_at: timestamp,
    updated_at: timestamp,
  };
  assert.equal(mapStoreRow(base), null);
  assert.equal(mapStoreRow({ ...base, slug: 'loja', status: 'deleted' }), null);
});

test('rejects incomplete or invalid rows', () => {
  assert.equal(mapStoreRow(null), null);
  assert.equal(mapStoreRow({}), null);
  assert.equal(
    mapStoreRow({
      id: 'store-1',
      name: 'Loja',
      slug: 'loja',
      status: 'active',
      created_by: 'user-1',
      created_at: 'not-a-date',
      updated_at: timestamp,
    }),
    null,
  );
});
