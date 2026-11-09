/**
 * Contratos de domínio para a futura arquitetura multiestabelecimento (SaaS).
 *
 * Este arquivo é aditivo e intencionalmente independente dos tipos legados.
 * Não altera o comportamento atual do cardápio MGW, autenticação, banco ou UI.
 */

export type StoreId = string;
export type UserId = string;
export type StoreSlug = string;

/** Estado de publicação e disponibilidade de um estabelecimento. */
export type StoreStatus = 'draft' | 'active' | 'suspended' | 'archived';

/** Papéis dentro de um estabelecimento. */
export type StoreRole = 'owner' | 'admin' | 'editor' | 'staff';

/** Papéis administrativos da plataforma, separados dos papéis da loja. */
export type PlatformRole = 'super_admin';

/** Permissões possíveis no painel de uma loja. */
export type StorePermission =
  | 'store.read'
  | 'store.update'
  | 'members.read'
  | 'members.manage'
  | 'categories.read'
  | 'categories.manage'
  | 'products.read'
  | 'products.manage'
  | 'settings.read'
  | 'settings.manage'
  | 'subscription.read';

/** Vínculo de um usuário com um estabelecimento. */
export interface StoreMembership {
  id: string;
  storeId: StoreId;
  userId: UserId;
  role: StoreRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Cadastro principal de um estabelecimento. */
export interface Store {
  id: StoreId;
  name: string;
  slug: StoreSlug;
  status: StoreStatus;
  createdBy: UserId;
  createdAt: string;
  updatedAt: string;
}

/** Categoria gerenciada individualmente por cada estabelecimento. */
export interface StoreCategory {
  id: string;
  storeId: StoreId;
  name: string;
  slug: string;
  description?: string;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Configurações públicas e de apresentação de um estabelecimento. */
export interface StoreBranding {
  storeName: string;
  slogan?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

/** Configurações operacionais do cardápio e contato da loja. */
export interface StorePublicSettings extends StoreBranding {
  whatsappNumber?: string;
  address?: string;
  openingHours?: string;
  deliveryEstimate?: string;
  deliveryFeeNote?: string;
  isOpen: boolean;
}

/** Administrador da plataforma; não equivale a owner/admin de uma loja. */
export interface PlatformAdmin {
  userId: UserId;
  role: PlatformRole;
  active: boolean;
  createdAt: string;
}

/** Estado comercial da licença/assinatura de um estabelecimento. */
export type StoreSubscriptionStatus =
  | 'trial'
  | 'active'
  | 'expired'
  | 'cancelled'
  | 'suspended';

/** Período de cobrança suportado pelo domínio. */
export type BillingInterval = 'monthly' | 'yearly' | 'lifetime';

/** Contrato de assinatura; integração de cobrança será definida em etapa futura. */
export interface StoreSubscription {
  id: string;
  storeId: StoreId;
  planCode: string;
  status: StoreSubscriptionStatus;
  billingInterval: BillingInterval;
  startsAt: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** Contexto mínimo para identificar a loja ativa em fluxos autenticados. */
export interface StoreContextIdentity {
  storeId: StoreId;
  storeSlug: StoreSlug;
  role: StoreRole;
}
