import { supabase, SUPER_ADMIN_UUID } from './supabase';
import type { Store, StoreId, StoreMembership, StoreRole, StoreStatus, UserId } from '../types/saas';
import { normalizeStoreSlug } from './storeResolver';
import { mapStoreRow } from './storeMapper';
import { mapStoreRegistryRows } from './storeRegistry';
import { mapStoreMembershipRow } from './storeAccessMapper';

export const DEFAULT_MGW_STORE: Store = {
  id: '00000000-0000-4000-a000-000000000001',
  name: 'MGW X-SALADA',
  slug: 'mgw-x-salada',
  status: 'active',
  createdBy: SUPER_ADMIN_UUID,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

// Local cache is retained only as a cache; it is never treated as authoritative.
const STORES_STORAGE_KEY = 'saas_stores_registry_v1';
const MEMBERSHIPS_STORAGE_KEY = 'saas_memberships_registry_v1';

export function getLocalStores(): Store[] {
  try {
    const raw = localStorage.getItem(STORES_STORAGE_KEY);
    return raw ? mapStoreRegistryRows(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

export function saveLocalStores(stores: Store[]): void {
  try { localStorage.setItem(STORES_STORAGE_KEY, JSON.stringify(stores)); }
  catch (err) { console.warn('Erro ao atualizar cache local de lojas:', err); }
}

export function getLocalMemberships(): StoreMembership[] {
  try {
    const raw = localStorage.getItem(MEMBERSHIPS_STORAGE_KEY);
    return raw ? JSON.parse(raw) as StoreMembership[] : [];
  } catch { return []; }
}

export function saveLocalMemberships(memberships: StoreMembership[]): void {
  try { localStorage.setItem(MEMBERSHIPS_STORAGE_KEY, JSON.stringify(memberships)); }
  catch (err) { console.warn('Erro ao atualizar cache local de membros:', err); }
}

export interface CreateStoreInput {
  name: string;
  slug?: string;
  status?: StoreStatus;
}

export function validateStoreInput(
  input: CreateStoreInput,
  existingStores: readonly Store[],
): { name: string; slug: string; status: StoreStatus } {
  const name = input.name?.trim();
  if (!name || name.length < 2 || name.length > 120) {
    throw new Error('O nome do estabelecimento deve ter entre 2 e 120 caracteres.');
  }
  const slug = normalizeStoreSlug(input.slug?.trim() || name);
  if (!slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    throw new Error('Identificador (slug) inválido. Use letras minúsculas, números e hífens.');
  }
  if (existingStores.some((store) => store.slug === slug)) {
    throw new Error(`O identificador "${slug}" já está em uso por outro estabelecimento.`);
  }
  const status = input.status ?? 'active';
  if (!(['draft', 'active', 'suspended', 'archived'] as StoreStatus[]).includes(status)) {
    throw new Error('Status de estabelecimento inválido.');
  }
  return { name, slug, status };
}

function throwDatabaseError(error: { message?: string; code?: string } | null, fallback: string): never {
  if (error) {
    const message = error.code === '23505'
      ? 'Este identificador já está em uso. Escolha outro endereço.'
      : error.message || fallback;
    throw new Error(message);
  }
  throw new Error(fallback);
}

export const storeService = {
  async listStores(): Promise<Store[]> {
    const { data, error } = await supabase.from('stores').select('*').order('name', { ascending: true });
    if (error) throwDatabaseError(error, 'Não foi possível carregar os estabelecimentos no banco.');
    const stores = mapStoreRegistryRows(data ?? []);
    if ((data ?? []).length !== stores.length) {
      throw new Error('O banco retornou estabelecimentos inválidos. Verifique os dados antes de continuar.');
    }
    saveLocalStores(stores);
    return stores;
  },

  async createStore(input: CreateStoreInput, creatorId: UserId): Promise<Store> {
    if (!creatorId || creatorId !== SUPER_ADMIN_UUID) {
      throw new Error('Somente o Super Admin autorizado pode cadastrar estabelecimentos.');
    }
    const existing = await this.listStores();
    const validated = validateStoreInput(input, existing);
    const { data, error } = await supabase.rpc('create_store_for_platform_admin', {
      p_name: validated.name,
      p_slug: validated.slug,
      p_status: validated.status,
    });
    if (error) throwDatabaseError(error, 'Não foi possível gravar o estabelecimento no Supabase.');
    const created = mapStoreRow(data);
    if (!created) throw new Error('O banco não confirmou o cadastro. A loja não foi adicionada.');
    const refreshed = await this.listStores();
    if (!refreshed.some((store) => store.id === created.id)) {
      throw new Error('O estabelecimento foi criado, mas não apareceu na consulta de confirmação. Atualize a lista e verifique o banco.');
    }
    return created;
  },

  async updateStoreStatus(storeId: StoreId, status: StoreStatus): Promise<void> {
    const { data, error } = await supabase.from('stores')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', storeId).select('*').maybeSingle();
    if (error) throwDatabaseError(error, 'Não foi possível atualizar o status da loja.');
    if (!mapStoreRow(data)) throw new Error('Loja não encontrada ou sem permissão para alterar o status.');
    await this.listStores();
  },

  async updateStoreDetails(storeId: StoreId, updates: { name?: string; slug?: string }): Promise<Store> {
    const stores = await this.listStores();
    const store = stores.find((item) => item.id === storeId);
    if (!store) throw new Error('Estabelecimento não encontrado.');
    const name = updates.name?.trim() || store.name;
    const slug = updates.slug ? normalizeStoreSlug(updates.slug) : store.slug;
    if (name.length < 2 || name.length > 120 || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
      throw new Error('Nome ou identificador inválido.');
    }
    if (stores.some((item) => item.id !== storeId && item.slug === slug)) {
      throw new Error(`O identificador "${slug}" já está em uso.`);
    }
    const { data, error } = await supabase.from('stores')
      .update({ name, slug, updated_at: new Date().toISOString() })
      .eq('id', storeId).select('*').maybeSingle();
    if (error) throwDatabaseError(error, 'Não foi possível atualizar os dados da loja.');
    const updated = mapStoreRow(data);
    if (!updated) throw new Error('Loja não encontrada ou sem permissão para atualizar.');
    await this.listStores();
    return updated;
  },

  async listMemberships(storeId?: StoreId): Promise<StoreMembership[]> {
    let query = supabase.from('store_memberships').select('*');
    if (storeId) query = query.eq('store_id', storeId);
    const { data, error } = await query;
    if (error) throwDatabaseError(error, 'Não foi possível consultar os vínculos da equipe.');
    const memberships = (data ?? []).map(mapStoreMembershipRow);
    if (memberships.some((item) => item === null)) {
      throw new Error('O banco retornou vínculos de equipe inválidos.');
    }
    return memberships as StoreMembership[];
  },

  async addMembership(storeId: StoreId, userId: UserId, role: StoreRole): Promise<StoreMembership> {
    const { data, error } = await supabase.from('store_memberships')
      .insert({ store_id: storeId, user_id: userId, role, active: true })
      .select('*').single();
    if (error) throwDatabaseError(error, 'Não foi possível adicionar o membro à loja.');
    const membership = mapStoreMembershipRow(data);
    if (!membership) throw new Error('O banco não confirmou o vínculo do membro.');
    return membership;
  },

  isSuperAdminUser(_email?: string | null, userId?: string | null): boolean {
    // Email is informational only. Privilege is bound to the confirmed Auth UUID
    // and is enforced again by the database RLS/RPC.
    return Boolean(userId && userId === SUPER_ADMIN_UUID);
  },
};
