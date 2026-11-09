import test from 'node:test';
import assert from 'node:assert/strict';
import { mapStoreSettingsRow } from './storeSettingsMapper';

function row() {
  return {
    store_id: 'store-1',
    store_name: 'Lanchonete Central',
    slogan: 'Sabor de verdade',
    logo_url: 'https://example.com/logo.png',
    primary_color: '#123456',
    secondary_color: '#abcdef',
    whatsapp_number: '5592999999999',
    address: 'Manaus - AM',
    opening_hours: '18h às 23h',
    delivery_estimate: '40 a 60 minutos',
    delivery_fee_note: 'Consulte a taxa',
    is_open: true,
  };
}

test('maps all public store settings fields', () => {
  const result = mapStoreSettingsRow(row());
  assert.equal(result?.storeId, 'store-1');
  assert.equal(result?.settings.storeName, 'Lanchonete Central');
  assert.equal(result?.settings.logoUrl, 'https://example.com/logo.png');
  assert.equal(result?.settings.isOpen, true);
});

test('preserves false is_open and trims optional strings', () => {
  const result = mapStoreSettingsRow({
    ...row(),
    is_open: false,
    slogan: '  Slogan  ',
    address: '  ',
  });
  assert.equal(result?.settings.isOpen, false);
  assert.equal(result?.settings.slogan, 'Slogan');
  assert.equal(result?.settings.address, undefined);
});

test('rejects missing identity, name, or boolean availability', () => {
  assert.equal(mapStoreSettingsRow(null), null);
  assert.equal(mapStoreSettingsRow({ ...row(), store_id: '' }), null);
  assert.equal(mapStoreSettingsRow({ ...row(), store_name: ' ' }), null);
  assert.equal(mapStoreSettingsRow({ ...row(), is_open: 'true' }), null);
});

test('does not invent optional values when fields are absent', () => {
  const result = mapStoreSettingsRow({
    store_id: 'store-1',
    store_name: 'Loja',
    is_open: true,
  });
  assert.deepEqual(result?.settings, { storeName: 'Loja', isOpen: true });
});
