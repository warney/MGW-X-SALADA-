import type { UserId } from '../types/saas';

/**
 * Identidade mínima derivada da sessão autenticada do Supabase.
 * O ID é a chave para vínculos e permissões; e-mail é apenas informativo
 * e nunca deve conceder acesso por si só.
 */
export interface AuthIdentity {
  userId: UserId;
  email: string | null;
}

export interface AuthUserLike {
  id?: string | null;
  email?: string | null;
}

export function resolveAuthIdentity(
  user: AuthUserLike | null | undefined,
): AuthIdentity | null {
  const userId = user?.id?.trim();
  if (!userId) return null;

  const email = user?.email?.trim().toLowerCase() || null;

  return { userId, email };
}
