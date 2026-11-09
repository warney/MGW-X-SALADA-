import type { PlatformAdmin, StoreMembership, StoreRole } from '../types/saas';

type DatabaseRow = Record<string, unknown>;

const STORE_ROLES = new Set<StoreRole>(['owner', 'admin', 'editor', 'staff']);

function asRow(value: unknown): DatabaseRow | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as DatabaseRow)
    : null;
}

function requiredString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function optionalTimestamp(value: unknown): string | null {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
    ? value
    : null;
}

/**
 * Converte uma linha de store_memberships para o contrato do domínio.
 * Rejeita linhas incompletas ou com papel inválido; não concede permissões.
 */
export function mapStoreMembershipRow(value: unknown): StoreMembership | null {
  const row = asRow(value);
  if (!row) return null;

  const id = requiredString(row.id);
  const storeId = requiredString(row.store_id);
  const userId = requiredString(row.user_id);
  const role = row.role;
  const createdAt = optionalTimestamp(row.created_at);
  const updatedAt = optionalTimestamp(row.updated_at);

  if (
    !id ||
    !storeId ||
    !userId ||
    typeof role !== 'string' ||
    !STORE_ROLES.has(role as StoreRole) ||
    typeof row.active !== 'boolean' ||
    !createdAt ||
    !updatedAt
  ) {
    return null;
  }

  return {
    id,
    storeId,
    userId,
    role: role as StoreRole,
    active: row.active,
    createdAt,
    updatedAt,
  };
}

/**
 * Converte uma linha de platform_admins para o contrato do domínio.
 * A função apenas valida formato; a autorização real continua sendo do RLS.
 */
export function mapPlatformAdminRow(value: unknown): PlatformAdmin | null {
  const row = asRow(value);
  if (!row) return null;

  const userId = requiredString(row.user_id);
  const createdAt = optionalTimestamp(row.created_at);

  if (
    !userId ||
    row.role !== 'super_admin' ||
    typeof row.active !== 'boolean' ||
    !createdAt
  ) {
    return null;
  }

  return {
    userId,
    role: 'super_admin',
    active: row.active,
    createdAt,
  };
}
