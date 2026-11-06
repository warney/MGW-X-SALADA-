import type { Store, StoreSlug } from '../types/saas';

export type StoreResolutionSource = 'path' | 'host' | 'fallback';

export interface StoreResolution {
  store: Store | null;
  source: StoreResolutionSource | null;
}

/**
 * Normaliza um nome para uso como slug de URL.
 * A normalização é utilitária; unicidade deve ser validada no banco.
 */
export function normalizeStoreSlug(value: string): StoreSlug {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Resolve uma loja sem consultar o banco e sem alterar o estado da aplicação.
 *
 * Prioridade:
 * 1. Primeiro segmento após /s/ (ex.: /s/minha-loja).
 * 2. Subdomínio conhecido (mapeado explicitamente pelo chamador).
 * 3. Slug de fallback legado, usado durante a migração da MGW.
 *
 * O fallback deve ser informado explicitamente: esta função não presume que
 * qualquer ambiente ou domínio desconhecido pertence à MGW.
 */
export function resolveStore(
  stores: readonly Store[],
  options: {
    pathname?: string;
    hostname?: string;
    hostToSlug?: Readonly<Record<string, StoreSlug>>;
    fallbackSlug?: StoreSlug;
  } = {},
): StoreResolution {
  const findBySlug = (slug?: string): Store | null => {
    if (!slug) return null;
    const normalized = normalizeStoreSlug(slug);
    return stores.find((store) => normalizeStoreSlug(store.slug) === normalized) ?? null;
  };

  const pathMatch = options.pathname?.match(/^\/s\/([^/]+)(?:\/|$)/i);
  if (pathMatch) {
    let decodedSlug: string;
    try {
      decodedSlug = decodeURIComponent(pathMatch[1]);
    } catch {
      return { store: null, source: null };
    }
    const store = findBySlug(decodedSlug);
    return { store, source: store ? 'path' : null };
  }

  const hostname = options.hostname?.toLowerCase().split(':')[0];
  const hostSlug = hostname && options.hostToSlug
    ? options.hostToSlug[hostname]
    : undefined;
  if (hostSlug) {
    const store = findBySlug(hostSlug);
    return { store, source: store ? 'host' : null };
  }

  const fallback = findBySlug(options.fallbackSlug);
  return { store: fallback, source: fallback ? 'fallback' : null };
}
