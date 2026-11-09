import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_MGW_CATEGORIES, DEFAULT_GENERIC_CATEGORIES } from './categoryService';

test('categoryService: default MGW categories contain individual and combo', () => {
  const slugs = DEFAULT_MGW_CATEGORIES.map((c) => c.slug);
  assert.ok(slugs.includes('individual'));
  assert.ok(slugs.includes('combo'));
  assert.equal(DEFAULT_MGW_CATEGORIES.every((c) => c.active), true);
});

test('categoryService: default generic categories provides 3 standard categories', () => {
  const cats = DEFAULT_GENERIC_CATEGORIES('test-store');
  assert.equal(cats.length, 3);
  assert.equal(cats[0].storeId, 'test-store');
  assert.equal(cats[0].slug, 'lanches');
  assert.equal(cats[1].slug, 'bebidas');
  assert.equal(cats[2].slug, 'sobremesas');
});
