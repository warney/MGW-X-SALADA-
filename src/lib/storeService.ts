import { supabase, SUPER_ADMIN_EMAIL, SUPER_ADMIN_UUID } from './supabase';
import type { Store, StoreId, StoreMembership, StoreRole, StoreStatus, UserId } from '../types/saas';
import { normalizeStoreSlug } from './storeResolver';
import { mapStoreRow } from './storeMapper';
import { mapStoreRegistryRows } from './storeRegistry';

export const DEFAULT_MGW_STORE: Store = {
  id: '00000000-0000-4000-a000-000000000001',
  name: 'MGW X-SALADA',
  slug: 'mgw-x-salada',
  status: 'active',
  createdBy: SUPER_ADMIN_UUID,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const STORES_STORAGE_KEY = 'saas_stores_registry_v1';
const MEMBERSHIPS_STORAGE_KEY = 'saas_memberships_registry_v1';

export function getLocalStores(): Store[] {
  try {
    const raw = localStorage.getItem(STORES_STORAGE_KEY);
    if (!raw) return [DEFAULT_MGW_STORE];
    const parsed = JSON.parse(raw);
    const mapped = mapStoreRegistryRows(parsed);
    if (!mapped.some((s) => s.slug === DEFAULT_MGW_STORE.slug)) {
      mapped.unshift(DEFAULT_MGW_STORE);
    }
    return mapped;
  } catch {
    return [DEFAULT_MGW_STORE];
  }
}

export function saveLocalStores(stores: Store[]): void {
  try {
    localStorage.setItem(STORES_STORAGE_KEY, JSON.stringify(stores));
  } catch (err) {
    console.warn('Erro ao salvar lojas no armazenamento local:', err);
  }
}

export function getLocalMemberships(): StoreMembership[] {
  try {
    const raw = localStorage.getItem(MEMBERSHIPS_STORAGE_KEY);
    if (!raw) {
      return [
        {
          id: 'membership-mgw-owner',
          storeId: DEFAULT_MGW_STORE.id,
          userId: SUPER_ADMIN_UUID,
          role: 'owner',
          active: true,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveLocalMemberships(memberships: StoreMembership[]): void {
  try {
    localStorage.setItem(MEMBERSHIPS_STORAGE_KEY, JSON.stringify(memberships));
  } catch (err) {
    console.warn('Erro ao salvar membros no armazenamento local:', err);
  }
}

export interface CreateStoreInput {
  name: string;
  slug?: string;
  status?: StoreStatus;
}

export function validateStoreInput(input: CreateStoreInput, existingStores: readonly Store[]): { name: string; slug: string; status: StoreStatus } {
  const name = input.name?.trim();
  if (!name || name.length < 2 || name.length > 120) {
    throw new Error('O nome do estabelecimento deve ter entre 2 e 120 caracteres.');
  }

  const rawSlug = input.slug?.trim() || name;
  const slug = normalizeStoreSlug(rawSlug);
  if (!slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    throw new Error('Identificador (slug) inválido. Use letras minúsculas, números e hífens.');
  }

  if (existingStores.some((s) => s.slug === slug)) {
    throw new Error(`O identificador "${slug}" já está em uso por outro estabelecimento.`);
  }

  const status: StoreStatus = input.status ?? 'active';
  const validStatuses: StoreStatus[] = ['draft', 'active', 'suspended', 'archived'];
  if (!validStatuses.includes(status)) {
    throw new Error('Status de estabelecimento inválido.');
  }

  return { name, slug, status };
}

export const storeService = {
  /**
   * Consulta a lista de estabelecimentos. Tenta Supabase primeiro; se a tabela não existir,
   * utiliza o registro local garantindo sempre a presença da MGW X-Salada.
   */
  async listStores(): Promise<Store[]> {
    try {
      const { data, error } = await supabase.from('stores').select('*').order('name');
      if (!error && Array.isArray(data) && data.length > 0) {
        const mapped = mapStoreRegistryRows(data);
        if (mapped.length > 0) {
          saveLocalStores(mapped);
          return mapped;
        }
      }
    } catch {
      // Falha esperada enquanto a tabela 'stores' não for aplicada no Supabase.
    }
    return getLocalStores();
  },

  /**
   * Cria um novo estabelecimento no sistema multi-loja.
   */
  async createStore(input: CreateStoreInput, creatorId: UserId): Promise<Store> {
    const existing = await this.listStores();
    const validated = validateStoreInput(input, existing);

    const now = new Date().toISOString();
    const newStore: Store = {
      id: globalThis.crypto?.randomUUID?.() ?? `store-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: validated.name,
      slug: validated.slug,
      status: validated.status,
      createdBy: creatorId,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const { data, error } = await supabase
        .from('stores')
        .insert({
          id: newStore.id,
          name: newStore.name,
          slug: newStore.slug,
          status: newStore.status,
          created_by: creatorId,
        })
        .select('*')
        .maybeSingle();

      if (!error && data) {
        const mapped = mapStoreRow(data);
        if (mapped) return mapped;
      }
    } catch {
      // Fallback local se a tabela de stores ainda não estiver provisionada
    }

    const updatedList = [...existing, newStore];
    saveLocalStores(updatedList);

    // Concede permissão de owner ao criador
    const memberships = getLocalMemberships();
    memberships.push({
      id: `membership-${Date.now()}`,
      storeId: newStore.id,
      userId: creatorId,
      role: 'owner',
      active: true,
      createdAt: now,
      updatedAt: now,
    });
    saveLocalMemberships(memberships);

    return newStore;
  },

  /**
   * Atualiza o status de publicação da loja (ex.: ativar, suspender).
   */
  async updateStoreStatus(storeId: StoreId, status: StoreStatus): Promise<void> {
    try {
      await supabase.from('stores').update({ status, updated_at: new Date().toISOString() }).eq('id', storeId);
    } catch {
      // Ignora erro se tabela não existir
    }

    const stores = getLocalStores();
    const updated = stores.map((s) => (s.id === storeId ? { ...s, status, updatedAt: new Date().toISOString() } : s));
    saveLocalStores(updated);
  },

  /**
   * Atualiza detalhes cadastrais da loja.
   */
  async updateStoreDetails(storeId: StoreId, updates: { name?: string; slug?: string }): Promise<Store> {
    const stores = getLocalStores();
    const store = stores.find((s) => s.id === storeId);
    if (!store) throw new Error('Estabelecimento não encontrado.');

    const name = updates.name?.trim() || store.name;
    const slug = updates.slug ? normalizeStoreSlug(updates.slug) : store.slug;

    if (slug !== store.slug && stores.some((s) => s.id !== storeId && s.slug === slug)) {
      throw new Error(`O identificador "${slug}" já está em uso.`);
    }

    const now = new Date().toISOString();
    const updatedStore: Store = {
      ...store,
      name,
      slug,
      updatedAt: now,
    };

    try {
      await supabase.from('stores').update({ name, slug, updated_at: now }).eq('id', storeId);
    } catch {
      // Ignora se tabela remota ausente
    }

    const updatedList = stores.map((s) => (s.id === storeId ? updatedStore : s));
    saveLocalStores(updatedList);
    return updatedStore;
  },

  /**
   * Lista membros da loja ou verifica papéis.
   */
  async listMemberships(storeId?: StoreId): Promise<StoreMembership[]> {
    try {
      let query = supabase.from('store_memberships').select('*');
      if (storeId) query = query.eq('store_id', storeId);
      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        return data.map((row: any) => ({
          id: String(row.id),
          storeId: String(row.store_id),
          userId: String(row.user_id),
          role: row.role as StoreRole,
          active: Boolean(row.active),
          createdAt: String(row.created_at),
          updatedAt: String(row.updated_at),
        }));
      }
    } catch {
      // Fallback local
    }

    const local = getLocalMemberships();
    return storeId ? local.filter((m) => m.storeId === storeId) : local;
  },

  /**
   * Adiciona um novo membro à equipe do estabelecimento.
   */
  async addMembership(storeId: StoreId, userId: UserId, role: StoreRole): Promise<StoreMembership> {
    const now = new Date().toISOString();
    const newMembership: StoreMembership = {
      id: `membership-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      storeId,
      userId,
      role,
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await supabase.from('store_memberships').insert({
        store_id: storeId,
        user_id: userId,
        role,
        active: true,
      });
    } catch {
      // Fallback local
    }

    const current = getLocalMemberships();
    const filtered = current.filter((m) => !(m.storeId === storeId && m.userId === userId));
    filtered.push(newMembership);
    saveLocalMemberships(filtered);

    return newMembership;
  },

  /**
   * Verifica se o usuário autenticado possui perfil de Super Admin da plataforma.
   */
  isSuperAdminUser(email?: string | null, userId?: string | null): boolean {
    if (!email && !userId) return false;
    const cleanEmail = email?.trim().toLowerCase();
    return cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase() || userId === SUPER_ADMIN_UUID;
  },
};
