import type { Store } from '../types/saas';
import { mapStoreRow } from './storeMapper';

/**
 * Valida a coleção retornada pelo cadastro de lojas.
 * Linhas inválidas e qualquer registro com ID ou slug duplicado são omitidos.
 * Não consulta banco nem decide autorização/publicação.
 */
export function mapStoreRegistryRows(value: unknown): Store[] {
  if (!Array.isArray(value)) return [];

  const mapped = value
    .map(mapStoreRow)
    .filter((store): store is Store => store !== null);

  const idCounts = new Map<string, number>();
  const slugCounts = new Map<string, number>();

  for (const store of mapped) {
    idCounts.set(store.id, (idCounts.get(store.id) ?? 0) + 1);
    slugCounts.set(store.slug, (slugCounts.get(store.slug) ?? 0) + 1);
  }

  return mapped.filter(
    store => idCounts.get(store.id) === 1 && slugCounts.get(store.slug) === 1,
  );
}
