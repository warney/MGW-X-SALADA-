import type { CatalogProductInput, CatalogCategoryInput } from './catalogTypes';

export function requiredCatalogText(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${field} é obrigatório.`);
  return normalized;
}

export function validateCatalogProduct(input: CatalogProductInput): CatalogProductInput {
  const name = requiredCatalogText(input.name, 'Nome do produto');
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

export function validateCatalogCategory(input: CatalogCategoryInput) {
  const name = requiredCatalogText(input.name, 'Nome da categoria');
  const slug = requiredCatalogText(input.slug, 'Identificador da categoria').toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error('Identificador inválido; use letras minúsculas, números e hífens.');
  }
  return { ...input, name, slug };
}
