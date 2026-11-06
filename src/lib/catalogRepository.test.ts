import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCatalogPage } from './catalogRepository';

test('uses safe defaults for catalog pagination', () => {
  assert.deepEqual(normalizeCatalogPage(), { page: 1, pageSize: 20, from: 0, to: 19 });
});

test('calculates offsets for later pages', () => {
  assert.deepEqual(normalizeCatalogPage({ page: 3, pageSize: 20 }), {
    page: 3, pageSize: 20, from: 40, to: 59,
  });
});

test('clamps page size to the supported range without limiting catalog size', () => {
  assert.equal(normalizeCatalogPage({ pageSize: 500 }).pageSize, 100);
  assert.equal(normalizeCatalogPage({ pageSize: 0 }).pageSize, 1);
});

test('normalizes invalid page numbers to the first page', () => {
  assert.equal(normalizeCatalogPage({ page: -2 }).page, 1);
  assert.equal(normalizeCatalogPage({ page: 1.5 }).page, 1);
});
