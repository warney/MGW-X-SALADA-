import { supabase } from './supabase';
import type { StoreCategory, StoreId } from '../types/saas';
import { normalizeCatalogPage } from './catalogPagination';

export type CatalogProductType = 'individual' | 'combo';

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

export interface CatalogProductInput {
  name: string;
  productType: CatalogProductType;
  categoryId?: string | null;
  description?: string;
  price: number;
  imageUrl?: string | null;
  active?: boolean;
  highlight?: string | null;
  includedItems?: string[];
  sortOrder?: number;
}

export interface CatalogCategoryInput {
  name: string;
  slug: string;
  description?: string;
  active?: boolean;
  sortOrder?: number;
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

function requiredText(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${field} é obrigatório.`);
  return normalized;
}

function validateProduct(input: CatalogProductInput): CatalogProductInput {
  const name = requiredText(input.name, 'Nome do produto');
  if (!Number.isFinite(input.price) || input.price < 0) {
    throw new Error('O preço deve ser um número válido maior ou igual a zero.');
  }
  if (input.productType !== 'individual' && input.productType !== 'combo') {
    throw new Error('Tipo de produto inválido.');
  }
  if (input.productType === 'individual' && (input.includedItems?.length ?? 0) > 0) {
    throw new Error('Itens incluídos só podem ser informados para combos.');
  }
  return { ...input, name, categoryId: input.categoryId?.trim() || null };
}

function mapProduct(row: any): CatalogProduct {
  if (!row || typeof row.id !== 'string' || typeof row.store_id !== 'string' ||
      typeof row.name !== 'string' || !['individual', 'combo'].includes(row.product_type) ||
      !Number.isFinite(Number(row.price)) || typeof row.created_at !== 'string' ||
      typeof row.updated_at !== 'string') {
    throw new Error('O banco retornou um produto em formato inválido.');
  }
  return {
    id: row.id,
    storeId: row.store_id,
    name: row.name,
    productType: row.product_type,
    categoryId: typeof row.category_id === 'string' ? row.category_id : null,
    description: typeof row.description === 'string' ? row.description : '',
    price: Number(row.price),
    imageUrl: typeof row.image_url === 'string' ? row.image_url : null,
    active: row.active !== false,
    highlight: typeof row.highlight === 'string' ? row.highlight : null,
    includedItems: Array.isArray(row.included_items) ? row.included_items.filter((item: unknown): item is string => typeof item === 'string') : [],
    sortOrder: Number.isInteger(row.sort_order) ? row.sort_order : 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCategory(row: any): StoreCategory {
  if (!row || typeof row.id !== 'string' || typeof row.store_id !== 'string' ||
      typeof row.name !== 'string' || typeof row.slug !== 'string' ||
      typeof row.created_at !== 'string' || typeof row.updated_at !== 'string') {
    throw new Error('O banco retornou uma categoria em formato inválido.');
  }
  return {
    id: row.id,
    storeId: row.store_id,
    name: row.name,
    slug: row.slug,
    description: typeof row.description === 'string' ? row.description : undefined,
    active: row.active !== false,
    sortOrder: Number.isInteger(row.sort_order) ? row.sort_order : 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
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
    return { items: (data ?? []).map(mapProduct), page: paging.page, pageSize: paging.pageSize, total: count ?? 0 };
  },

  async saveProduct(storeId: StoreId, input: CatalogProductInput, productId?: string): Promise<CatalogProduct> {
    if (!storeId?.trim()) throw new Error('Selecione uma loja antes de salvar.');
    const valid = validateProduct(input);
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
    return mapProduct(result.data);
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
    return (data ?? []).map(mapCategory);
  },

  async saveCategory(storeId: StoreId, input: CatalogCategoryInput, categoryId?: string): Promise<StoreCategory> {
    if (!storeId?.trim()) throw new Error('Selecione uma loja antes de salvar.');
    const name = requiredText(input.name, 'Nome da categoria');
    const slug = requiredText(input.slug, 'Identificador da categoria').toLowerCase();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Identificador inválido; use letras minúsculas, números e hífens.');
    const payload = { store_id: storeId, name, slug, description: input.description?.trim() || null,
      active: input.active ?? true, sort_order: input.sortOrder ?? 0 };
    const result = categoryId
      ? await supabase.from('store_categories').update(payload).eq('id', categoryId).eq('store_id', storeId).select('*').maybeSingle()
      : await supabase.from('store_categories').insert(payload).select('*').single();
    if (result.error) throw result.error;
    if (!result.data) throw new Error('Categoria não encontrada nesta loja ou sem permissão.');
    return mapCategory(result.data);
  },

  async setCategoryActive(storeId: StoreId, categoryId: string, active: boolean): Promise<void> {
    if (!storeId?.trim() || !categoryId?.trim()) throw new Error('Loja e categoria são obrigatórias.');
    const { data, error } = await supabase.from('store_categories').update({ active })
      .eq('id', categoryId).eq('store_id', storeId).select('id').maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Categoria não encontrada nesta loja ou sem permissão.');
  },
};
