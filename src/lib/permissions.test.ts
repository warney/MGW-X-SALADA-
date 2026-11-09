import test from 'node:test';
import assert from 'node:assert/strict';
import { getStorePermissions, hasPlatformRole, hasStorePermission } from './permissions';

test('owner e admin podem gerenciar configurações e membros', () => {
  for (const role of ['owner', 'admin'] as const) {
    assert.equal(hasStorePermission(role, 'settings.manage'), true);
    assert.equal(hasStorePermission(role, 'members.manage'), true);
  }
});

test('editor gerencia catálogo, mas não membros nem configurações', () => {
  assert.equal(hasStorePermission('editor', 'products.manage'), true);
  assert.equal(hasStorePermission('editor', 'categories.manage'), true);
  assert.equal(hasStorePermission('editor', 'members.manage'), false);
  assert.equal(hasStorePermission('editor', 'settings.manage'), false);
});

test('staff tem somente permissões de leitura operacional', () => {
  assert.deepEqual(getStorePermissions('staff'), [
    'store.read', 'categories.read', 'products.read',
  ]);
  assert.equal(hasStorePermission('staff', 'products.manage'), false);
});

test('papel ausente não concede permissões', () => {
  assert.equal(hasStorePermission(null, 'products.read'), false);
  assert.deepEqual(getStorePermissions(undefined), []);
});

test('papel de loja não concede Super Admin', () => {
  assert.equal(hasPlatformRole(null, 'super_admin'), false);
  assert.equal(hasPlatformRole('super_admin', 'super_admin'), true);
});
