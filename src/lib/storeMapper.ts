import type { Store, StoreStatus } from '../types/saas';

type DatabaseRow = Record<string, unknown>;
const STORE_STATUSES = new Set<StoreStatus>(['draft', 'active', 'suspended', 'archived']);

function asRow(value: unknown): DatabaseRow | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as DatabaseRow)
    : null;
}

function requiredString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function validTimestamp(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function validSlug(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

/**
 * Converte uma linha de public.stores para o contrato do domínio.
 * Registros incompletos ou com status/slug inválidos são rejeitados.
 */
export function mapStoreRow(value: unknown): Store | null {
  const row = asRow(value);
  if (!row) return null;

  const id = requiredString(row.id);
  const name = requiredString(row.name);
  const slug = requiredString(row.slug);
  const status = row.status;
  const createdBy = requiredString(row.created_by);
  const createdAt = row.created_at;
  const updatedAt = row.updated_at;

  if (
    !id ||
    !name ||
    !slug ||
    !validSlug(slug) ||
    typeof status !== 'string' ||
    !STORE_STATUSES.has(status as StoreStatus) ||
    !createdBy ||
    !validTimestamp(createdAt) ||
    !validTimestamp(updatedAt)
  ) {
    return null;
  }

  return {
    id,
    name,
    slug,
    status: status as StoreStatus,
    createdBy,
    createdAt,
    updatedAt,
  };
}
