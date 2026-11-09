import test from 'node:test';
import assert from 'node:assert/strict';
import { validateStoreInput, storeService, DEFAULT_MGW_STORE } from './storeService';
import { SUPER_ADMIN_EMAIL, SUPER_ADMIN_UUID } from './supabase';

test('storeService: detects Super Admin by email and by UUID', () => {
  assert.equal(storeService.isSuperAdminUser(SUPER_ADMIN_EMAIL, 'any-id'), true);
  assert.equal(storeService.isSuperAdminUser('WARNEY.FERNANDES22@GMAIL.COM', null), true);
  assert.equal(storeService.isSuperAdminUser(null, SUPER_ADMIN_UUID), true);
  assert.equal(storeService.isSuperAdminUser('outro@gmail.com', 'other-uuid'), false);
  assert.equal(storeService.isSuperAdminUser(null, null), false);
});

test('validateStoreInput: validates name and normalizes slug', () => {
  const result = validateStoreInput(
    { name: 'Pizzaria Bella Itália', slug: 'pizzaria-bella-italia' },
    [DEFAULT_MGW_STORE],
  );
  assert.equal(result.name, 'Pizzaria Bella Itália');
  assert.equal(result.slug, 'pizzaria-bella-italia');
  assert.equal(result.status, 'active');
});

test('validateStoreInput: generates slug automatically from name when slug omitted', () => {
  const result = validateStoreInput(
    { name: 'Açaí do Norte Tradicional' },
    [DEFAULT_MGW_STORE],
  );
  assert.equal(result.name, 'Açaí do Norte Tradicional');
  assert.equal(result.slug, 'acai-do-norte-tradicional');
});

test('validateStoreInput: rejects duplicate slug', () => {
  assert.throws(
    () => validateStoreInput({ name: 'Outra Loja', slug: 'mgw-x-salada' }, [DEFAULT_MGW_STORE]),
    /já está em uso/,
  );
});

test('validateStoreInput: rejects invalid names and empty inputs', () => {
  assert.throws(() => validateStoreInput({ name: 'A' }, []), /entre 2 e 120 caracteres/);
  assert.throws(() => validateStoreInput({ name: '   ' }, []), /entre 2 e 120 caracteres/);
});
