import type { StorePermission, StoreRole, PlatformRole } from '../types/saas';

/**
 * Matriz de permissões da interface SaaS.
 * É uma regra de apresentação/experiência, nunca substitui RLS no banco.
 */
const ROLE_PERMISSIONS: Record<StoreRole, readonly StorePermission[]> = {
  owner: [
    'store.read', 'store.update',
    'members.read', 'members.manage',
    'categories.read', 'categories.manage',
    'products.read', 'products.manage',
    'settings.read', 'settings.manage',
    'subscription.read',
  ],
  admin: [
    'store.read', 'store.update',
    'members.read', 'members.manage',
    'categories.read', 'categories.manage',
    'products.read', 'products.manage',
    'settings.read', 'settings.manage',
    'subscription.read',
  ],
  editor: [
    'store.read',
    'categories.read', 'categories.manage',
    'products.read', 'products.manage',
    'settings.read',
  ],
  staff: [
    'store.read',
    'categories.read',
    'products.read',
  ],
};

export function hasStorePermission(
  role: StoreRole | null | undefined,
  permission: StorePermission,
): boolean {
  return role ? ROLE_PERMISSIONS[role]?.includes(permission) ?? false : false;
}

/** Papel de plataforma é deliberadamente separado dos papéis de loja. */
export function hasPlatformRole(
  role: PlatformRole | null | undefined,
  requiredRole: PlatformRole,
): boolean {
  return role === requiredRole;
}

export function getStorePermissions(
  role: StoreRole | null | undefined,
): readonly StorePermission[] {
  return role ? ROLE_PERMISSIONS[role] ?? [] : [];
}
