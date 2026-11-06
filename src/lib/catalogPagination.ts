export interface CatalogPaginationOptions {
  page?: number;
  pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export function normalizeCatalogPage(options: CatalogPaginationOptions = {}) {
  const page = Number.isInteger(options.page) && (options.page ?? 0) > 0 ? options.page! : 1;
  const requestedSize = Number.isInteger(options.pageSize) ? options.pageSize! : DEFAULT_PAGE_SIZE;
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, requestedSize));
  return { page, pageSize, from: (page - 1) * pageSize, to: page * pageSize - 1 };
}
