import { supabase } from './supabase';
import type { StoreCategory, StoreId } from '../types/saas';
import { validateCatalogCategory } from './catalogValidation';
import { mapCatalogCategory } from './catalogMappers';
import type { CatalogCategoryInput } from './catalogTypes';

export const DEFAULT_MGW_CATEGORIES: StoreCategory[] = [
  {
    id: 'cat-mgw-individual',
    storeId: '00000000-0000-4000-a000-000000000001',
    name: 'X-Salada Individual',
    slug: 'individual',
    description: 'O clássico artesanal preparado na chapa com ingredientes selecionados',
    sortOrder: 1,
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-mgw-combo',
    storeId: '00000000-0000-4000-a000-000000000001',
    name: 'Combos com Tuchaua',
    slug: 'combo',
    description: 'A melhor combinação: X-Saladas no capricho + Refrigerante Guaraná Tuchaua gelado',
    sortOrder: 2,
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

export const DEFAULT_GENERIC_CATEGORIES: (storeId: string) => StoreCategory[] = (storeId) => [
  {
    id: `cat-${storeId}-lanches`,
    storeId,
    name: 'Lanches',
    slug: 'lanches',
    description: 'Hambúrgueres e sanduíches artesanais',
    sortOrder: 1,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: `cat-${storeId}-bebidas`,
    storeId,
    name: 'Bebidas',
    slug: 'bebidas',
    description: 'Refrigerantes, sucos naturais e águas',
    sortOrder: 2,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: `cat-${storeId}-sobremesas`,
    storeId,
    name: 'Sobremesas',
    slug: 'sobremesas',
    description: 'Doces, açaí e sobremesas especiais',
    sortOrder: 3,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const getStorageKey = (slugOrId: string) => `store_${slugOrId}_categories_v1`;

function getLocalCategories(storeId: StoreId, storeSlug?: string): StoreCategory[] {
  const key = getStorageKey(storeSlug || storeId);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Falha silenciosa
  }

  const isMgw = storeSlug === 'mgw-x-salada' || storeId.includes('mgw');
  return isMgw ? DEFAULT_MGW_CATEGORIES : DEFAULT_GENERIC_CATEGORIES(storeId);
}

function saveLocalCategories(storeId: StoreId, categories: StoreCategory[], storeSlug?: string): void {
  const key = getStorageKey(storeSlug || storeId);
  try {
    localStorage.setItem(key, JSON.stringify(categories));
  } catch (err) {
    console.warn('Erro ao salvar categorias no armazenamento local:', err);
  }
}

export const categoryService = {
  async listCategories(storeId: StoreId, storeSlug?: string, includeInactive = false): Promise<StoreCategory[]> {
    try {
      let query = supabase.from('store_categories').select('*').eq('store_id', storeId);
      if (!includeInactive) query = query.eq('active', true);
      const { data, error } = await query.order('sort_order', { ascending: true });
      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map(mapCatalogCategory);
      }
    } catch {
      // Falha esperada enquanto a tabela store_categories não for migrada
    }

    const local = getLocalCategories(storeId, storeSlug);
    return includeInactive ? local : local.filter((c) => c.active);
  },

  async saveCategory(
    storeId: StoreId,
    input: CatalogCategoryInput,
    categoryId?: string,
    storeSlug?: string
  ): Promise<StoreCategory> {
    const validated = validateCatalogCategory(input);
    const existing = await this.listCategories(storeId, storeSlug, true);

    const now = new Date().toISOString();

    if (categoryId) {
      const target = existing.find((c) => c.id === categoryId);
      if (!target) throw new Error('Categoria não encontrada.');

      const duplicate = existing.find((c) => c.id !== categoryId && c.slug === validated.slug);
      if (duplicate) throw new Error(`Já existe uma categoria com o identificador "${validated.slug}".`);

      const updated: StoreCategory = {
        ...target,
        name: validated.name,
        slug: validated.slug,
        description: input.description?.trim() || undefined,
        sortOrder: input.sortOrder ?? target.sortOrder,
        active: input.active ?? target.active,
        updatedAt: now,
      };

      try {
        await supabase.from('store_categories').update({
          name: updated.name,
          slug: updated.slug,
          description: updated.description ?? null,
          sort_order: updated.sortOrder,
          active: updated.active,
          updated_at: now,
        }).eq('id', categoryId).eq('store_id', storeId);
      } catch {
        // Fallback local
      }

      const list = existing.map((c) => (c.id === categoryId ? updated : c));
      saveLocalCategories(storeId, list, storeSlug);
      return updated;
    } else {
      const duplicate = existing.find((c) => c.slug === validated.slug);
      if (duplicate) throw new Error(`Já existe uma categoria com o identificador "${validated.slug}".`);

      const newCat: StoreCategory = {
        id: globalThis.crypto?.randomUUID?.() ?? `cat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        storeId,
        name: validated.name,
        slug: validated.slug,
        description: input.description?.trim() || undefined,
        sortOrder: input.sortOrder ?? (existing.length + 1),
        active: input.active ?? true,
        createdAt: now,
        updatedAt: now,
      };

      try {
        await supabase.from('store_categories').insert({
          id: newCat.id,
          store_id: storeId,
          name: newCat.name,
          slug: newCat.slug,
          description: newCat.description ?? null,
          sort_order: newCat.sortOrder,
          active: newCat.active,
        });
      } catch {
        // Fallback local
      }

      const list = [...existing, newCat];
      saveLocalCategories(storeId, list, storeSlug);
      return newCat;
    }
  },

  async toggleCategoryActive(
    storeId: StoreId,
    categoryId: string,
    active: boolean,
    storeSlug?: string
  ): Promise<void> {
    try {
      await supabase.from('store_categories').update({ active }).eq('id', categoryId).eq('store_id', storeId);
    } catch {
      // Fallback local
    }

    const existing = await this.listCategories(storeId, storeSlug, true);
    const updated = existing.map((c) => (c.id === categoryId ? { ...c, active, updatedAt: new Date().toISOString() } : c));
    saveLocalCategories(storeId, updated, storeSlug);
  },
};
