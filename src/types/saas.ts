export type StoreId = string;
export type StoreSlug = string;
export type UserId = string;
export type StoreStatus = 'draft' | 'active' | 'suspended' | 'archived';
export type StoreRole = 'owner' | 'admin' | 'editor' | 'staff';
export type PlatformRole = 'super_admin';
export type StorePermission =
  | 'store.read' | 'store.update'
  | 'members.read' | 'members.manage'
  | 'categories.read' | 'categories.manage'
  | 'products.read' | 'products.manage'
  | 'settings.read' | 'settings.manage'
  | 'subscription.read';

export interface Store {
  id: StoreId;
  name: string;
  slug: StoreSlug;
  status: StoreStatus;
  createdBy: UserId;
  createdAt: string;
  updatedAt: string;
}

export interface StoreMembership {
  id: string;
  storeId: StoreId;
  userId: UserId;
  role: StoreRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformAdmin {
  userId: UserId;
  role: PlatformRole;
  active: boolean;
  createdAt: string;
}

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

export interface StorePublicSettings {
  storeName: string;
  slogan?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  whatsappNumber?: string;
  openingHours?: string;
  address?: string;
  deliveryEstimate?: string;
  deliveryFeeNote?: string;
  isOpen: boolean;
}
