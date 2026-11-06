export type CatalogProductType = 'individual' | 'combo';
export interface CatalogProductInput {
  name: string; productType: CatalogProductType; categoryId?: string | null;
  description?: string; price: number; imageUrl?: string | null; active?: boolean;
  highlight?: string | null; includedItems?: string[]; sortOrder?: number;
}
export interface CatalogCategoryInput {
  name: string; slug: string; description?: string; active?: boolean; sortOrder?: number;
}
