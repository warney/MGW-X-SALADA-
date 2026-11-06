import React, { createContext, useContext, useMemo } from 'react';
import type { Store, StoreSlug } from '../types/saas';
import { resolveStore, type StoreResolutionSource } from '../lib/storeResolver';

interface StoreIdentityContextValue {
  /** Slug identificado pela URL ou pelo fallback legado explícito. */
  storeSlug: StoreSlug | null;
  /** Registro completo quando a lista de lojas já estiver disponível. */
  store: Store | null;
  source: StoreResolutionSource | null;
  isExplicitSelection: boolean;
}

const StoreIdentityContext = createContext<StoreIdentityContextValue | undefined>(undefined);

interface StoreIdentityProviderProps {
  children: React.ReactNode;
  /** Lista opcional, ainda não conectada ao Supabase nesta etapa. */
  stores?: readonly Store[];
  fallbackSlug?: StoreSlug;
  hostToSlug?: Readonly<Record<string, StoreSlug>>;
}

export const StoreIdentityProvider: React.FC<StoreIdentityProviderProps> = ({
  children,
  stores = [],
  fallbackSlug,
  hostToSlug,
}) => {
  const value = useMemo(() => {
    const pathname = window.location.pathname;
    const hostname = window.location.hostname;
    const pathMatch = pathname.match(/^\/s\/([^/]+)(?:\/|$)/i);
    const hostSlug = hostToSlug?.[hostname.toLowerCase()];
    const requestedSlug = pathMatch
      ? decodeURIComponent(pathMatch[1])
      : hostSlug || fallbackSlug || null;

    const resolution = resolveStore(stores, {
      pathname,
      hostname,
      hostToSlug,
      fallbackSlug,
    });

    return {
      storeSlug: requestedSlug,
      store: resolution.store,
      source: pathMatch ? 'path' as const
        : hostSlug ? 'host' as const
        : fallbackSlug ? 'fallback' as const
        : null,
      isExplicitSelection: Boolean(pathMatch || hostSlug),
    };
  }, [stores, fallbackSlug, hostToSlug]);

  return (
    <StoreIdentityContext.Provider value={value}>
      {children}
    </StoreIdentityContext.Provider>
  );
};

/**
 * Identidade/seleção da loja fica separada do StoreContext legado,
 * que continua responsável apenas por catálogo, carrinho e checkout MGW.
 */
export function useStoreIdentity(): StoreIdentityContextValue {
  const context = useContext(StoreIdentityContext);
  if (!context) {
    throw new Error('useStoreIdentity must be used within StoreIdentityProvider');
  }
  return context;
}
