import type {
  PlatformAdmin,
  StoreId,
  StoreMembership,
  StorePermission,
  StoreRole,
} from '../types/saas';
import { getStorePermissions, hasPlatformRole } from './permissions';

export interface StoreAccess {
  storeId: StoreId;
  role: StoreRole | null;
  isPlatformAdmin: boolean;
  canAccessStore: boolean;
  permissions: readonly StorePermission[];
}

/**
 * Resolve o acesso de um usuário à loja selecionada usando vínculos já
 * carregados por uma camada confiável. Não consulta o Supabase e não substitui
 * as políticas RLS; serve apenas para orientar a interface.
 */
export function resolveStoreAccess(
  storeId: StoreId | null | undefined,
  memberships: readonly StoreMembership[],
  platformAdmin: PlatformAdmin | null | undefined,
): StoreAccess | null {
  if (!storeId) return null;

  const isPlatformAdmin = Boolean(
    platformAdmin?.active &&
    hasPlatformRole(platformAdmin.role, 'super_admin'),
  );

  const membership = memberships.find(
    (item) => item.storeId === storeId && item.active,
  );

  const role = membership?.role ?? null;

  return {
    storeId,
    role,
    isPlatformAdmin,
    canAccessStore: isPlatformAdmin || role !== null,
    permissions: getStorePermissions(role),
  };
}
