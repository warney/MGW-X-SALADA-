import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeStoreSlug, resolveStore } from './storeResolver';
import type { Store } from '../types/saas';

const mgw: Store = {
  id: 'store-mgw',
  name: 'MGW X-SALADA',
  slug: 'mgw-x-salada',
  status: 'active',
  createdBy: 'user-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const secondStore: Store = {
  ...mgw,
  id: 'store-second',
  name: 'Lanchonete Exemplo',
  slug: 'lanchonete-exemplo',
};

test('normaliza nomes em slugs sem acentos e espaços', () => {
  assert.equal(normalizeStoreSlug('  Lanchonête & Café  '), 'lanchonete-cafe');
});

test('resolve loja pelo caminho /s/:slug', () => {
  assert.deepEqual(resolveStore([mgw, secondStore], {
    pathname: '/s/lanchonete-exemplo',
    fallbackSlug: mgw.slug,
  }), { store: secondStore, source: 'path' });
});

test('caminho desconhecido não seleciona outra loja nem usa fallback', () => {
  assert.deepEqual(resolveStore([mgw], {
    pathname: '/s/loja-inexistente',
    fallbackSlug: mgw.slug,
  }), { store: null, source: null });
});

test('resolve host apenas quando existe mapeamento explícito', () => {
  assert.deepEqual(resolveStore([mgw], {
    hostname: 'mgw.example.com',
    hostToSlug: { 'mgw.example.com': mgw.slug },
  }), { store: mgw, source: 'host' });
});

test('usa fallback somente quando informado e encontrado', () => {
  assert.deepEqual(resolveStore([mgw], { fallbackSlug: mgw.slug }), {
    store: mgw,
    source: 'fallback',
  });
  assert.deepEqual(resolveStore([mgw]), { store: null, source: null });
});

test('slug com codificação inválida falha de forma segura', () => {
  assert.deepEqual(resolveStore([mgw], { pathname: '/s/%E0%A4%A' }), {
    store: null,
    source: null,
  });
});
