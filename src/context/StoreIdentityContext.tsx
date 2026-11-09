import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import type { Store, StoreSlug } from '../types/saas';
import { normalizeStoreSlug, resolveStore, type StoreResolutionSource } from '../lib/storeResolver';
import { storeService, getLocalStores, DEFAULT_MGW_STORE } from '../lib/storeService';
import { supabase } from '../lib/supabase';
import { resolveAuthIdentity } from '../lib/authIdentity';

export interface StoreIdentityContextValue {
  /** Slug identificado pela URL ou pelo fallback legado explícito. */
  storeSlug: StoreSlug | null;
  /** Registro completo quando a lista de lojas já estiver disponível. */
  store: Store | null;
  source: StoreResolutionSource | null;
  isExplicitSelection: boolean;
  /** Lista de todas as lojas conhecidas */
  stores: readonly Store[];
  /** Navega suavemente para outra loja */
  navigateToStore: (slug: string) => void;
  /** Recarrega lista de lojas do Supabase ou armazenamento */
  refreshStores: () => Promise<void>;
  /** Usuário autenticado atual */
  user: any;
  /** Indica se o usuário atual é Super Admin da plataforma */
  isSuperAdmin: boolean;
}

const StoreIdentityContext = createContext<StoreIdentityContextValue | undefined>(undefined);

interface StoreIdentityProviderProps {
  children: React.ReactNode;
  /**
   * Quando omitida, o slug é apenas uma referência provisória de URL.
   * Quando informada (inclusive como []), funciona como registro autoritativo:
   * slugs desconhecidos não são aceitos como identidade de loja.
   */
  stores?: readonly Store[];
  fallbackSlug?: StoreSlug;
  hostToSlug?: Readonly<Record<string, StoreSlug>>;
}

export const StoreIdentityProvider: React.FC<StoreIdentityProviderProps> = ({
  children,
  stores: explicitStores,
  fallbackSlug = 'mgw-x-salada',
  hostToSlug,
}) => {
  const [currentPath, setCurrentPath] = useState(() => (typeof window !== 'undefined' ? window.location.pathname : '/'));
  const [internalStores, setInternalStores] = useState<Store[]>([]);
  const [user, setUser] = useState<any>(null);

  // Carrega lista de lojas caso não tenham sido passadas explicitamente
  const refreshStores = useCallback(async () => {
    if (explicitStores !== undefined) return;
    try {
      const list = await storeService.listStores();
      setInternalStores(list);
    } catch (error) {
      console.error('Falha ao carregar lojas do Supabase:', error);
      setInternalStores([]);
    }
  }, [explicitStores]);

  useEffect(() => {
    refreshStores();
    // Monitora sessão Supabase
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [refreshStores]);

  // Monitora alterações de histórico do navegador (popstate)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateToStore = useCallback((slug: string) => {
    const targetSlug = normalizeStoreSlug(slug);
    const nextPath = targetSlug === 'mgw-x-salada' ? '/' : `/s/${targetSlug}`;
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
      setCurrentPath(nextPath);
    }
  }, []);

  const activeStores = explicitStores !== undefined ? explicitStores : internalStores;

  const value = useMemo<StoreIdentityContextValue>(() => {
    const pathname = currentPath;
    const hostname = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
    const pathMatch = pathname.match(/^\/s\/([^/]+)(?:\/|$)/i);

    let pathSlug: string | null = null;
    if (pathMatch) {
      try {
        pathSlug = normalizeStoreSlug(decodeURIComponent(pathMatch[1])) || null;
      } catch {
        pathSlug = null;
      }
    }

    const hostSlug = hostToSlug?.[hostname] ?? null;
    const candidateSlug = pathMatch
      ? pathSlug
      : hostSlug || (fallbackSlug ? normalizeStoreSlug(fallbackSlug) : null);

    const resolution = resolveStore(activeStores, {
      pathname,
      hostname,
      hostToSlug,
      fallbackSlug,
    });

    // Se a lista de lojas foi passada explicitamente, segue regra estrita:
    // só aceita lojas encontradas.
    // Sem lista explícita, aceitamos o candidateSlug ou o resultado da resolução.
    let resolvedStore = resolution.store;
    if (!resolvedStore && candidateSlug === DEFAULT_MGW_STORE.slug) {
      resolvedStore = activeStores.find((s) => s.slug === DEFAULT_MGW_STORE.slug) ?? DEFAULT_MGW_STORE;
    }

    const storeSlug = explicitStores !== undefined
      ? resolution.store?.slug ?? null
      : resolvedStore?.slug ?? candidateSlug;

    const source: StoreResolutionSource | null = explicitStores !== undefined
      ? resolution.source
      : resolvedStore
      ? resolution.source ?? (pathMatch ? 'path' : hostSlug ? 'host' : 'fallback')
      : null;

    const identity = resolveAuthIdentity(user);
    const isSuperAdmin = storeService.isSuperAdminUser(identity?.email, identity?.userId);

    return {
      storeSlug,
      store: resolvedStore,
      source,
      isExplicitSelection: Boolean(pathMatch || hostSlug) && Boolean(storeSlug),
      stores: activeStores,
      navigateToStore,
      refreshStores,
      user,
      isSuperAdmin,
    };
  }, [currentPath, explicitStores, internalStores, fallbackSlug, hostToSlug, user, navigateToStore, refreshStores, activeStores]);

  return (
    <StoreIdentityContext.Provider value={value}>
      {children}
    </StoreIdentityContext.Provider>
  );
};

/**
 * Identidade/seleção da loja fica separada do StoreContext legado,
 * que continua responsável apenas por catálogo, carrinho e checkout.
 */
export function useStoreIdentity(): StoreIdentityContextValue {
  const context = useContext(StoreIdentityContext);
  if (!context) {
    throw new Error('useStoreIdentity must be used within StoreIdentityProvider');
  }
  return context;
}
