import type { StorePublicSettings } from '../types/saas';

export interface MappedStoreSettings {
  storeId: string;
  settings: StorePublicSettings;
}

type DatabaseRow = Record<string, unknown>;

function asRow(value: unknown): DatabaseRow | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as DatabaseRow)
    : null;
}

function requiredString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

/** Converte uma linha de public.store_settings para configurações de domínio. */
export function mapStoreSettingsRow(value: unknown): MappedStoreSettings | null {
  const row = asRow(value);
  if (!row) return null;

  const storeId = requiredString(row.store_id);
  const storeName = requiredString(row.store_name);

  if (!storeId || !storeName || typeof row.is_open !== 'boolean') return null;

  return {
    storeId,
    settings: {
      storeName,
      slogan: optionalString(row.slogan),
      logoUrl: optionalString(row.logo_url),
      primaryColor: optionalString(row.primary_color),
      secondaryColor: optionalString(row.secondary_color),
      whatsappNumber: optionalString(row.whatsapp_number),
      address: optionalString(row.address),
      openingHours: optionalString(row.opening_hours),
      deliveryEstimate: optionalString(row.delivery_estimate),
      deliveryFeeNote: optionalString(row.delivery_fee_note),
      isOpen: row.is_open,
    },
  };
}
