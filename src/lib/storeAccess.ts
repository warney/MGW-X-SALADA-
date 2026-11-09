import type {
  PlatformAdmin,
  StoreId,
  StoreMembership,
  StorePermission,
  StoreRole,
  UserId,
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
 * Resolve o acesso da identidade autenticada à loja selecionada.
 * Os registros recebidos devem vir de uma consulta confiável; ainda assim,
 * cada vínculo e o registro de plataforma são conferidos contra userId.
 * Não consulta o Supabase e não substitui as políticas RLS.
 */
export function resolveStoreAccess(
  userId: UserId | null | undefined,
  storeId: StoreId | null | undefined,
  memberships: readonly StoreMembership[],
  platformAdmin: PlatformAdmin | null | undefined,
): StoreAccess | null {
  if (!userId || !storeId) return null;

  const isPlatformAdmin = Boolean(
    platformAdmin?.userId === userId &&
    platformAdmin.active &&
    hasPlatformRole(platformAdmin.role, 'super_admin'),
  );

  const membership = memberships.find(
    (item) =>
      item.userId === userId &&
      item.storeId === storeId &&
      item.active,
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
