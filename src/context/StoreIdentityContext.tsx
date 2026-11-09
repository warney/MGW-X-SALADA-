import React, { createContext, useContext, useMemo } from 'react';
import type { Store, StoreSlug } from '../types/saas';
import { normalizeStoreSlug, resolveStore, type StoreResolutionSource } from '../lib/storeResolver';

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
  stores,
  fallbackSlug,
  hostToSlug,
}) => {
  const value = useMemo(() => {
    const pathname = window.location.pathname;
    const hostname = window.location.hostname.toLowerCase();
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

    const resolution = resolveStore(stores ?? [], {
      pathname,
      hostname,
      hostToSlug,
      fallbackSlug,
    });

    // Com registro fornecido, só aceitamos lojas efetivamente encontradas.
    // Sem registro, preservamos a referência provisória usada na transição.
    const storeSlug = stores === undefined
      ? candidateSlug
      : resolution.store?.slug ?? null;

    const source: StoreResolutionSource | null = stores === undefined
      ? candidateSlug
        ? pathMatch ? 'path' : hostSlug ? 'host' : fallbackSlug ? 'fallback' : null
        : null
      : resolution.source;

    return {
      storeSlug,
      store: resolution.store,
      source,
      isExplicitSelection: Boolean(pathMatch || hostSlug) && Boolean(storeSlug),
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
