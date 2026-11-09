import assert from 'node:assert/strict';
import test from 'node:test';
import { validateCatalogCategory, validateCatalogProduct } from './catalogValidation';

test('normalizes product name and empty category', () => {
  assert.deepEqual(
    validateCatalogProduct({ name: '  X-Salada ', productType: 'individual', price: 12, categoryId: '  ' }),
    { name: 'X-Salada', productType: 'individual', price: 12, categoryId: null },
  );
});

test('rejects negative, non-finite and invalid prices', () => {
  for (const price of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(() => validateCatalogProduct({ name: 'Produto', productType: 'individual', price }));
  }
});

test('rejects included items on individual products', () => {
  assert.throws(
    () => validateCatalogProduct({ name: 'Produto', productType: 'individual', price: 1, includedItems: ['Refrigerante'] }),
    /combos/,
  );
});

test('allows included items on combos', () => {
  assert.deepEqual(
    validateCatalogProduct({ name: 'Combo', productType: 'combo', price: 20, includedItems: ['Lanche'] }).includedItems,
    ['Lanche'],
  );
});

test('normalizes category name and slug', () => {
  assert.deepEqual(
    validateCatalogCategory({ name: '  Bebidas ', slug: 'BEBIDAS' }),
    { name: 'Bebidas', slug: 'bebidas' },
  );
});

test('rejects invalid category slugs', () => {
  for (const slug of ['bebidas quentes', 'bebidas/quentes', '-bebidas', 'bebidas-']) {
    assert.throws(() => validateCatalogCategory({ name: 'Bebidas', slug }), /Identificador inválido/);
  }
});
