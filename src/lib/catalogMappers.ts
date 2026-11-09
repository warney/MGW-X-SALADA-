import type { StoreCategory } from '../types/saas';
import type { CatalogProduct } from './catalogTypes';
import type { CatalogProductType } from './catalogTypes';

type Row = Record<string, unknown>;

function asRow(value: unknown, entity: string): Row {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`O banco retornou ${entity} em formato inválido.`);
  }
  return value as Row;
}

function requiredString(row: Row, key: string, entity: string): string {
  const value = row[key];
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`O banco retornou ${entity} em formato inválido.`);
  }
  return value;
}

function optionalString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function optionalInteger(value: unknown): number {
  return typeof value === 'number' && Number.isInteger(value) ? value : 0;
}

export function mapCatalogProduct(value: unknown): CatalogProduct {
  const row = asRow(value, 'um produto');
  const productType = row.product_type;
  const price = Number(row.price);
  if ((productType !== 'individual' && productType !== 'combo') ||
      !Number.isFinite(price) || price < 0 ||
      typeof row.active !== 'boolean' ||
      !Array.isArray(row.included_items) ||
      row.included_items.some((item: unknown) => typeof item !== 'string')) {
    throw new Error('O banco retornou um produto em formato inválido.');
  }

  return {
    id: requiredString(row, 'id', 'um produto'),
    storeId: requiredString(row, 'store_id', 'um produto'),
    name: requiredString(row, 'name', 'um produto'),
    productType: productType as CatalogProductType,
    categoryId: optionalString(row.category_id),
    description: typeof row.description === 'string' ? row.description : '',
    price,
    imageUrl: optionalString(row.image_url),
    active: row.active,
    highlight: optionalString(row.highlight),
    includedItems: row.included_items as string[],
    sortOrder: optionalInteger(row.sort_order),
    createdAt: requiredString(row, 'created_at', 'um produto'),
    updatedAt: requiredString(row, 'updated_at', 'um produto'),
  };
}

export function mapCatalogCategory(value: unknown): StoreCategory {
  const row = asRow(value, 'uma categoria');
  if (typeof row.active !== 'boolean') {
    throw new Error('O banco retornou uma categoria em formato inválido.');
  }
  return {
    id: requiredString(row, 'id', 'uma categoria'),
    storeId: requiredString(row, 'store_id', 'uma categoria'),
    name: requiredString(row, 'name', 'uma categoria'),
    slug: requiredString(row, 'slug', 'uma categoria'),
    description: typeof row.description === 'string' ? row.description : undefined,
    active: row.active,
    sortOrder: optionalInteger(row.sort_order),
    createdAt: requiredString(row, 'created_at', 'uma categoria'),
    updatedAt: requiredString(row, 'updated_at', 'uma categoria'),
  };
}
