import { supabase } from './supabase';
import type { StoreCategory, StoreId } from '../types/saas';
import { normalizeCatalogPage } from './catalogPagination';
import { mapCatalogProduct, mapCatalogCategory } from './catalogMappers';
import { validateCatalogProduct, validateCatalogCategory } from './catalogValidation';
import type { CatalogProductInput, CatalogCategoryInput, CatalogProductType } from './catalogTypes';



export interface CatalogProduct {
  id: string;
  storeId: StoreId;
  name: string;
  productType: CatalogProductType;
  categoryId: string | null;
  description: string;
  price: number;
  imageUrl: string | null;
  active: boolean;
  highlight: string | null;
  includedItems: string[];
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogPageOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string | null;
  productType?: CatalogProductType;
  includeInactive?: boolean;
}

export interface CatalogPage<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

/**
 * Repositório de catálogo preparado para o esquema multi-loja.
 * Não deve ser conectado à UI antes da migração de banco e RLS.
 * Cada leitura/escrita inclui store_id; RLS continua sendo a barreira de segurança.
 */
export const catalogRepository = {
  async listProducts(storeId: StoreId, options: CatalogPageOptions = {}): Promise<CatalogPage<CatalogProduct>> {
    if (!storeId?.trim()) throw new Error('Selecione uma loja para consultar o catálogo.');
    const paging = normalizeCatalogPage(options);
    let query = supabase.from('store_products').select('*', { count: 'exact' }).eq('store_id', storeId);
    if (!options.includeInactive) query = query.eq('active', true);
    if (options.categoryId) query = query.eq('category_id', options.categoryId);
    if (options.productType) query = query.eq('product_type', options.productType);
    if (options.search?.trim()) query = query.ilike('name', `%${options.search.trim().replace(/[%_]/g, '\\$&')}%`);
    const { data, error, count } = await query.order('sort_order', { ascending: true })
      .order('name', { ascending: true }).range(paging.from, paging.to);
    if (error) throw error;
    return { items: (data ?? []).map(mapCatalogProduct), page: paging.page, pageSize: paging.pageSize, total: count ?? 0 };
  },

  async saveProduct(storeId: StoreId, input: CatalogProductInput, productId?: string): Promise<CatalogProduct> {
    if (!storeId?.trim()) throw new Error('Selecione uma loja antes de salvar.');
    const valid = validateCatalogProduct(input);
    const payload = {
      store_id: storeId,
      name: valid.name,
      product_type: valid.productType,
      category_id: valid.categoryId ?? null,
      description: valid.description?.trim() ?? '',
      price: valid.price,
      image_url: valid.imageUrl ?? null,
      active: valid.active ?? true,
      highlight: valid.highlight ?? null,
      included_items: valid.productType === 'combo' ? valid.includedItems ?? [] : [],
      sort_order: valid.sortOrder ?? 0,
    };
    const result = productId
      ? await supabase.from('store_products').update(payload).eq('id', productId).eq('store_id', storeId).select('*').maybeSingle()
      : await supabase.from('store_products').insert(payload).select('*').single();
    if (result.error) throw result.error;
    if (!result.data) throw new Error('Produto não encontrado nesta loja ou sem permissão para alterá-lo.');
    return mapCatalogProduct(result.data);
  },

  async setProductActive(storeId: StoreId, productId: string, active: boolean): Promise<void> {
    if (!storeId?.trim() || !productId?.trim()) throw new Error('Loja e produto são obrigatórios.');
    const { data, error } = await supabase.from('store_products').update({ active })
      .eq('id', productId).eq('store_id', storeId).select('id').maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Produto não encontrado nesta loja ou sem permissão.');
  },

  async listCategories(storeId: StoreId, includeInactive = false): Promise<StoreCategory[]> {
    if (!storeId?.trim()) throw new Error('Selecione uma loja para consultar as categorias.');
    let query = supabase.from('store_categories').select('*').eq('store_id', storeId);
    if (!includeInactive) query = query.eq('active', true);
    const { data, error } = await query.order('sort_order', { ascending: true }).order('name', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(mapCatalogCategory);
  },

  async saveCategory(storeId: StoreId, input: CatalogCategoryInput, categoryId?: string): Promise<StoreCategory> {
    if (!storeId?.trim()) throw new Error('Selecione uma loja antes de salvar.');
    const { name, slug } = validateCatalogCategory(input);
    const payload = { store_id: storeId, name, slug, description: input.description?.trim() || null,
      active: input.active ?? true, sort_order: input.sortOrder ?? 0 };
    const result = categoryId
      ? await supabase.from('store_categories').update(payload).eq('id', categoryId).eq('store_id', storeId).select('*').maybeSingle()
      : await supabase.from('store_categories').insert(payload).select('*').single();
    if (result.error) throw result.error;
    if (!result.data) throw new Error('Categoria não encontrada nesta loja ou sem permissão.');
    return mapCatalogCategory(result.data);
  },

  async setCategoryActive(storeId: StoreId, categoryId: string, active: boolean): Promise<void> {
    if (!storeId?.trim() || !categoryId?.trim()) throw new Error('Loja e categoria são obrigatórias.');
    const { data, error } = await supabase.from('store_categories').update({ active })
      .eq('id', categoryId).eq('store_id', storeId).select('id').maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Categoria não encontrada nesta loja ou sem permissão.');
  },
};
