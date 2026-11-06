import { describe, expect, it } from 'vitest';
import { validateCatalogCategory, validateCatalogProduct } from './catalogValidation';

describe('validateCatalogProduct', () => {
  it('normalizes name and empty category', () => {
    expect(validateCatalogProduct({ name: '  X-Salada ', productType: 'individual', price: 12, categoryId: '  ' }))
      .toMatchObject({ name: 'X-Salada', categoryId: null });
  });
  it('rejects negative, non-finite and invalid prices', () => {
    for (const price of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => validateCatalogProduct({ name: 'Produto', productType: 'individual', price })).toThrow();
    }
  });
  it('rejects included items on individual products', () => {
    expect(() => validateCatalogProduct({ name: 'Produto', productType: 'individual', price: 1, includedItems: ['Refrigerante'] })).toThrow(/combos/);
  });
  it('allows included items on combos', () => {
    expect(validateCatalogProduct({ name: 'Combo', productType: 'combo', price: 20, includedItems: ['Lanche'] }).includedItems).toEqual(['Lanche']);
  });
});

describe('validateCatalogCategory', () => {
  it('normalizes the name and slug', () => {
    expect(validateCatalogCategory({ name: '  Bebidas ', slug: 'BEBIDAS' })).toMatchObject({ name: 'Bebidas', slug: 'bebidas' });
  });
  it('rejects invalid slugs', () => {
    for (const slug of [' Bebidas', 'bebidas quentes', '-bebidas', 'bebidas-']) {
      expect(() => validateCatalogCategory({ name: 'Bebidas', slug })).toThrow(/Identificador inválido/);
    }
  });
});
