import assert from 'node:assert/strict';
import test from 'node:test';
import { mapCatalogCategory, mapCatalogProduct } from './catalogMappers';

const productRow = {
  id: 'product-1', store_id: 'store-1', name: 'X-Salada', product_type: 'individual',
  category_id: null, description: 'Lanche', price: '18.5', image_url: null,
  active: true, highlight: null, included_items: [], sort_order: 2,
  created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-02T00:00:00Z',
};

test('maps a valid product row into the catalog domain model', () => {
  assert.deepEqual(mapCatalogProduct(productRow), {
    id: 'product-1', storeId: 'store-1', name: 'X-Salada', productType: 'individual',
    categoryId: null, description: 'Lanche', price: 18.5, imageUrl: null,
    active: true, highlight: null, includedItems: [], sortOrder: 2,
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z',
  });
});

test('rejects malformed product rows instead of silently accepting them', () => {
  assert.throws(() => mapCatalogProduct({ ...productRow, active: 'true' }), /produto em formato inválido/);
  assert.throws(() => mapCatalogProduct({ ...productRow, included_items: ['Combo', 3] }), /produto em formato inválido/);
  assert.throws(() => mapCatalogProduct({ ...productRow, product_type: 'bundle' }), /produto em formato inválido/);
  assert.throws(() => mapCatalogProduct(null), /produto em formato inválido/);
});

test('maps a valid category row', () => {
  assert.deepEqual(mapCatalogCategory({
    id: 'category-1', store_id: 'store-1', name: 'Bebidas', slug: 'bebidas',
    description: null, active: true, sort_order: 1,
    created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-02T00:00:00Z',
  }), {
    id: 'category-1', storeId: 'store-1', name: 'Bebidas', slug: 'bebidas',
    description: undefined, active: true, sortOrder: 1,
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z',
  });
});

test('rejects malformed category rows', () => {
  assert.throws(() => mapCatalogCategory({ id: 'category-1', active: 1 }), /categoria em formato inválido/);
});
