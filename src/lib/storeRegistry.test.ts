import test from 'node:test';
import assert from 'node:assert/strict';
import { mapStoreRegistryRows } from './storeRegistry';

const timestamp = '2026-11-06T12:00:00.000Z';
function row(id: string, slug: string) {
  return {
    id,
    name: `Store ${id}`,
    slug,
    status: 'active',
    created_by: 'user-1',
    created_at: timestamp,
    updated_at: timestamp,
  };
}

test('maps a list of valid stores', () => {
  const stores = mapStoreRegistryRows([row('1', 'loja-um'), row('2', 'loja-dois')]);
  assert.equal(stores.length, 2);
  assert.equal(stores[0].slug, 'loja-um');
});

test('returns an empty list for non-array input', () => {
  assert.deepEqual(mapStoreRegistryRows(null), []);
  assert.deepEqual(mapStoreRegistryRows({}), []);
});

test('omits malformed rows while retaining valid stores', () => {
  const stores = mapStoreRegistryRows([
    row('1', 'loja-um'),
    { ...row('2', 'loja-dois'), status: 'unknown' },
  ]);
  assert.deepEqual(stores.map(store => store.id), ['1']);
});

test('omits every row involved in a duplicate ID or slug', () => {
  const stores = mapStoreRegistryRows([
    row('1', 'loja-um'),
    row('1', 'loja-dois'),
    row('3', 'loja-um'),
    row('4', 'loja-quatro'),
  ]);
  assert.deepEqual(stores.map(store => store.id), ['4']);
});
