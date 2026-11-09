import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product, CartItem, StoreConfig } from '../types';
import type { StoreCategory } from '../types/saas';
import { INITIAL_PRODUCTS, INITIAL_STORE_CONFIG, OFFICIAL_LOGO_URL } from '../data/defaultData';
import { supabase, PRODUCT_IMAGE_BUCKET } from '../lib/supabase';
import { useStoreIdentity } from './StoreIdentityContext';
import { categoryService } from '../lib/categoryService';
import type { CatalogCategoryInput } from '../lib/catalogTypes';

interface StoreContextType {
  products: Product[];
  config: StoreConfig;
  cart: CartItem[];
  cartCount: number;
  cartTotal: number;
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  categories: StoreCategory[];
  refreshCategories: () => Promise<void>;
  saveCategory: (input: CatalogCategoryInput, categoryId?: string) => Promise<StoreCategory>;
  toggleCategoryActive: (categoryId: string, active: boolean) => Promise<void>;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  isAdminOpen: boolean;
  setIsAdminOpen: (open: boolean) => void;
  addToCart: (product: Product, quantity?: number, notes?: string) => void;
  updateQuantity: (cartId: string, delta: number) => void;
  removeFromCart: (cartId: string) => void;
  updateNotes: (cartId: string, notes: string) => void;
  clearCart: () => void;
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  setProductImage: (id: string, dataUrl: string) => Promise<void>;
  deleteProductImage: (id: string) => Promise<void>;
  updateConfig: (updates: Partial<StoreConfig>) => void;
  resetToDefaults: () => void;
  refreshMenuFromServer: () => Promise<void>;
  isLegacyStore: boolean;
}

const LEGACY_STORE_SLUG = 'mgw-x-salada';
const legacyStorageKeys = { PRODUCTS: 'mgw_products_v2', CONFIG: 'mgw_config_v2', CART: 'mgw_cart_v1' };
const getStorageKeys = (slug: string | null) =>
  slug === LEGACY_STORE_SLUG
    ? legacyStorageKeys
    : {
        PRODUCTS: `store_${slug ?? 'unknown'}_products_v1`,
        CONFIG: `store_${slug ?? 'unknown'}_config_v1`,
        CART: `store_${slug ?? 'unknown'}_cart_v1`,
      };

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const toProduct = (row: any): Product => ({
  id: row.id,
  name: row.name,
  category: row.category,
  description: row.description || '',
  price: Number(row.price),
  imageUrl: row.image_url || OFFICIAL_LOGO_URL,
  active: row.active !== false,
  highlight: row.highlight || undefined,
  includedItems: Array.isArray(row.included_items) ? row.included_items : [],
});

const toProductRow = (p: Product, storeId?: string) => ({
  id: p.id,
  name: p.name,
  category: p.category,
  description: p.description,
  price: p.price,
  image_url: p.imageUrl,
  active: p.active,
  highlight: p.highlight || null,
  included_items: p.includedItems || [],
  ...(storeId ? { store_id: storeId } : {}),
});

const toConfig = (row: any): StoreConfig => ({
  storeName: row.store_name || INITIAL_STORE_CONFIG.storeName,
  slogan: row.slogan || INITIAL_STORE_CONFIG.slogan,
  whatsappNumber: row.whatsapp_number || INITIAL_STORE_CONFIG.whatsappNumber,
  openingHours: row.opening_hours || INITIAL_STORE_CONFIG.openingHours,
  address: row.address || INITIAL_STORE_CONFIG.address,
  deliveryEstimate: row.delivery_estimate || INITIAL_STORE_CONFIG.deliveryEstimate,
  deliveryFeeNote: row.delivery_fee_note || INITIAL_STORE_CONFIG.deliveryFeeNote,
  isOpen: row.is_open !== false,
});

const toConfigRow = (c: StoreConfig, storeId?: string) => ({
  id: 1,
  store_name: c.storeName,
  slogan: c.slogan,
  whatsapp_number: c.whatsappNumber,
  opening_hours: c.openingHours,
  address: c.address,
  delivery_estimate: c.deliveryEstimate,
  delivery_fee_note: c.deliveryFeeNote,
  is_open: c.isOpen,
  ...(storeId ? { store_id: storeId } : {}),
});

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { storeSlug, store } = useStoreIdentity();
  const isLegacyStore = storeSlug === LEGACY_STORE_SLUG;
  const storageKeys = getStorageKeys(storeSlug);

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(storageKeys.PRODUCTS);
      if (saved) return JSON.parse(saved);
      if (isLegacyStore) return INITIAL_PRODUCTS;
      return [
        {
          id: `prod-${storeSlug}-1`,
          name: 'Hambúrguer Especial',
          category: 'lanches',
          description: 'Hambúrguer artesanal especial com ingredientes selecionados.',
          price: 18.0,
          imageUrl: OFFICIAL_LOGO_URL,
          active: true,
          highlight: 'Destaque',
          includedItems: ['Pão artesanal', 'Blend suculento', 'Queijo derretido'],
        },
      ];
    } catch {
      return isLegacyStore ? INITIAL_PRODUCTS : [];
    }
  });

  const [config, setConfig] = useState<StoreConfig>(() => {
    try {
      const saved = localStorage.getItem(storageKeys.CONFIG);
      if (saved) return { ...INITIAL_STORE_CONFIG, ...JSON.parse(saved) };
      if (isLegacyStore) return INITIAL_STORE_CONFIG;
      return {
        ...INITIAL_STORE_CONFIG,
        storeName: store?.name || 'Cardápio Digital',
        slogan: 'Os melhores sabores direto para você!',
        whatsappNumber: '559281112510',
      };
    } catch {
      return isLegacyStore ? INITIAL_STORE_CONFIG : { ...INITIAL_STORE_CONFIG, storeName: store?.name || 'Cardápio' };
    }
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(storageKeys.CART);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  const refreshCategories = useCallback(async () => {
    const storeId = store?.id || storeSlug || 'default';
    const list = await categoryService.listCategories(storeId, storeSlug ?? undefined, true);
    setCategories(list);
  }, [store?.id, storeSlug]);

  useEffect(() => {
    refreshCategories();
  }, [refreshCategories]);

  const refreshMenuFromServer = useCallback(async () => {
    if (isLegacyStore) {
      try {
        const [{ data: productRows, error: productsError }, { data: settingsRow, error: settingsError }] = await Promise.all([
          supabase.from('store_products').select('*').order('id'),
          supabase.from('store_settings').select('*').eq('id', 1).maybeSingle(),
        ]);
        if (!productsError && productRows && productRows.length > 0) {
          const next = productRows.map(toProduct);
          setProducts(next);
          localStorage.setItem(storageKeys.PRODUCTS, JSON.stringify(next));
        }
        if (!settingsError && settingsRow) {
          const next = toConfig(settingsRow);
          setConfig(next);
          localStorage.setItem(storageKeys.CONFIG, JSON.stringify(next));
        }
      } catch (err) {
        console.warn('Erro ao atualizar cardápio MGW do servidor:', err);
      }
    } else if (store?.id) {
      // Para lojas adicionais, tenta consultar store_products por store_id se existir
      try {
        const { data, error } = await supabase.from('store_products').select('*').eq('store_id', store.id);
        if (!error && Array.isArray(data) && data.length > 0) {
          const next = data.map(toProduct);
          setProducts(next);
          localStorage.setItem(storageKeys.PRODUCTS, JSON.stringify(next));
        }
      } catch {
        // Tabela multi-loja ainda não migrada
      }
    }
  }, [isLegacyStore, store?.id, storageKeys.PRODUCTS, storageKeys.CONFIG]);

  useEffect(() => {
    refreshMenuFromServer().catch((err) => console.error('Falha ao sincronizar cardápio:', err));
    const onFocus = () => refreshMenuFromServer().catch((err) => console.warn(err));
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refreshMenuFromServer]);

  useEffect(() => {
    localStorage.setItem(storageKeys.CART, JSON.stringify(cart));
  }, [cart, storageKeys.CART]);

  useEffect(() => {
    localStorage.setItem(storageKeys.PRODUCTS, JSON.stringify(products));
  }, [products, storageKeys.PRODUCTS]);

  useEffect(() => {
    localStorage.setItem(storageKeys.CONFIG, JSON.stringify(config));
  }, [config, storageKeys.CONFIG]);

  const addToCart = (product: Product, quantity = 1, notes = '') =>
    setCart((prev) => {
      const clean = notes.trim();
      const index = prev.findIndex((i) => i.productId === product.id && (i.notes || '').trim() === clean);
      if (index >= 0) {
        const next = [...prev];
        next[index] = { ...next[index], quantity: next[index].quantity + quantity };
        return next;
      }
      return [
        ...prev,
        {
          cartId: `${product.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          productId: product.id,
          product,
          quantity,
          notes: clean || undefined,
        },
      ];
    });

  const updateQuantity = (cartId: string, delta: number) =>
    setCart((prev) =>
      prev
        .map((i) => (i.cartId === cartId ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );

  const removeFromCart = (cartId: string) => setCart((prev) => prev.filter((i) => i.cartId !== cartId));
  const updateNotes = (cartId: string, notes: string) => setCart((prev) => prev.map((i) => (i.cartId === cartId ? { ...i, notes } : i)));
  const clearCart = () => setCart([]);

  const addProduct = async (product: Product) => {
    if (products.some((item) => item.id === product.id)) {
      throw new Error('Já existe um produto com este identificador.');
    }

    if (isLegacyStore) {
      const { error } = await supabase.from('store_products').insert(toProductRow(product));
      if (error) throw error;
    } else {
      try {
        await supabase.from('store_products').insert(toProductRow(product, store?.id));
      } catch {
        // Fallback local
      }
    }

    setProducts((prev) => [...prev, product]);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    const current = products.find((p) => p.id === id);
    if (!current) return;
    const next = { ...current, ...updates };

    if (!isLegacyStore) {
      setProducts((prev) => prev.map((p) => (p.id === id ? next : p)));
      setCart((prev) => prev.map((i) => (i.productId === id ? { ...i, product: next } : i)));
      try {
        supabase.from('store_products').update(toProductRow(next, store?.id)).eq('id', id);
      } catch {
        // Fallback local
      }
      return;
    }

    void (async () => {
      const { error } = await supabase
        .from('store_products')
        .update(toProductRow(next))
        .eq('id', id)
        .select('id')
        .maybeSingle();

      if (error) {
        console.error('Erro ao salvar produto no Supabase:', error);
        return;
      }
      setProducts((prev) => prev.map((p) => (p.id === id ? next : p)));
      setCart((prev) => prev.map((i) => (i.productId === id ? { ...i, product: next } : i)));
    })().catch((error) => console.error('Falha inesperada ao salvar produto:', error));
  };

  const setProductImage = async (id: string, dataUrl: string) => {
    const product = products.find((p) => p.id === id);
    if (!product) throw new Error('Produto não encontrado.');

    let publicUrl = dataUrl;
    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const storagePrefix = isLegacyStore ? id : `${storeSlug ?? 'store'}/${id}`;
      const path = `${storagePrefix}/${Date.now()}.webp`;

      const { error: uploadError } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).upload(path, blob, {
        contentType: blob.type || 'image/webp',
        upsert: false,
        cacheControl: '31536000',
      });

      if (!uploadError) {
        const { data } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);
        if (data?.publicUrl) {
          publicUrl = data.publicUrl;
        }
      }
    } catch (uploadErr) {
      console.warn('Storage indisponível, utilizando imagem compactada localmente:', uploadErr);
    }

    const updated = { ...product, imageUrl: publicUrl };

    if (isLegacyStore) {
      const { error: saveError } = await supabase
        .from('store_products')
        .upsert(toProductRow(updated), { onConflict: 'id' });
      if (saveError) {
        console.warn('Erro ao salvar no banco, persistido localmente:', saveError);
      }
    }

    setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
    setCart((prev) => prev.map((i) => (i.productId === id ? { ...i, product: updated } : i)));
  };

  const deleteProductImage = async (id: string) => {
    const product = products.find((p) => p.id === id);
    if (!product) throw new Error('Produto não encontrado.');
    const oldUrl = product.imageUrl;
    const updated = { ...product, imageUrl: OFFICIAL_LOGO_URL };

    if (isLegacyStore) {
      const { error } = await supabase.from('store_products').upsert(toProductRow(updated), { onConflict: 'id' });
      if (error) console.warn('Erro ao atualizar produto no banco:', error);
    }

    setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
    setCart((prev) => prev.map((i) => (i.productId === id ? { ...i, product: updated } : i)));

    const marker = `/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/`;
    if (oldUrl.includes(marker)) {
      try {
        const objectPath = oldUrl.split(marker)[1].split('?')[0];
        await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([decodeURIComponent(objectPath)]);
      } catch (removeError) {
        console.warn('Imagem antiga não removida do Storage:', removeError);
      }
    }
  };

  const updateConfig = (updates: Partial<StoreConfig>) => {
    const next = { ...config, ...updates };
    setConfig(next);
    if (isLegacyStore) {
      supabase
        .from('store_settings')
        .upsert(toConfigRow(next), { onConflict: 'id' })
        .then(({ error }) => {
          if (error) console.error('Erro ao salvar configurações no Supabase:', error);
        });
    }
  };

  const resetToDefaults = () => {
    if (!isLegacyStore) return;
    setProducts(INITIAL_PRODUCTS);
    setConfig(INITIAL_STORE_CONFIG);
    Promise.all([
      supabase.from('store_products').upsert(INITIAL_PRODUCTS.map((p) => toProductRow(p)), { onConflict: 'id' }),
      supabase.from('store_settings').upsert(toConfigRow(INITIAL_STORE_CONFIG), { onConflict: 'id' }),
    ]).then(([p, c]) => {
      if (p.error || c.error) console.error('Erro ao restaurar dados padrão:', p.error || c.error);
    });
  };

  const saveCategory = async (input: CatalogCategoryInput, categoryId?: string) => {
    const storeId = store?.id || storeSlug || 'default';
    const saved = await categoryService.saveCategory(storeId, input, categoryId, storeSlug ?? undefined);
    await refreshCategories();
    return saved;
  };

  const toggleCategoryActive = async (categoryId: string, active: boolean) => {
    const storeId = store?.id || storeSlug || 'default';
    await categoryService.toggleCategoryActive(storeId, categoryId, active, storeSlug ?? undefined);
    await refreshCategories();
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <StoreContext.Provider
      value={{
        products,
        config,
        cart,
        cartCount,
        cartTotal,
        activeCategory,
        setActiveCategory,
        categories,
        refreshCategories,
        saveCategory,
        toggleCategoryActive,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        isAdminOpen,
        setIsAdminOpen,
        addToCart,
        updateQuantity,
        removeFromCart,
        updateNotes,
        clearCart,
        addProduct,
        updateProduct,
        setProductImage,
        deleteProductImage,
        updateConfig,
        resetToDefaults,
        refreshMenuFromServer,
        isLegacyStore,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a StoreProvider');
  return context;
};
