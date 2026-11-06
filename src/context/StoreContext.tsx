import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, StoreConfig } from '../types';
import { INITIAL_PRODUCTS, INITIAL_STORE_CONFIG, OFFICIAL_LOGO_URL } from '../data/defaultData';
import {
  saveImageToStorage,
  removeImageFromStorage,
  getImageFromStorage,
} from '../utils/imageStorage';

interface StoreContextType {
  products: Product[];
  config: StoreConfig;
  cart: CartItem[];
  cartCount: number;
  cartTotal: number;
  activeCategory: 'all' | 'individual' | 'combo';
  setActiveCategory: (cat: 'all' | 'individual' | 'combo') => void;
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
  updateProduct: (id: string, updates: Partial<Product>) => void;
  setProductImage: (id: string, dataUrl: string) => Promise<void>;
  deleteProductImage: (id: string) => Promise<void>;
  updateConfig: (updates: Partial<StoreConfig>) => void;
  resetToDefaults: () => void;
  refreshMenuFromServer: () => Promise<void>;
}

const STORAGE_KEYS = {
  PRODUCTS: 'mgw_products_v2',
  CONFIG: 'mgw_config_v2',
  CART: 'mgw_cart_v1',
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved =
        localStorage.getItem(STORAGE_KEYS.PRODUCTS) || localStorage.getItem('mgw_products_v1');
      if (saved) {
        const parsed: Product[] = JSON.parse(saved);
        return parsed.map((p) => {
          if (p.id === 'xsalada-tradicional' && p.price === 10) {
            return { ...p, price: 12.0 };
          }
          return p;
        });
      }
    } catch (e) {
      console.error('Failed to load products from localStorage', e);
    }
    return INITIAL_PRODUCTS;
  });

  const [config, setConfig] = useState<StoreConfig>(() => {
    try {
      const saved =
        localStorage.getItem(STORAGE_KEYS.CONFIG) || localStorage.getItem('mgw_config_v1');
      if (saved) {
        const parsed: StoreConfig = JSON.parse(saved);
        if (
          !parsed.whatsappNumber ||
          parsed.whatsappNumber === '92999999999' ||
          parsed.whatsappNumber === ''
        ) {
          return { ...parsed, whatsappNumber: '559281112510' };
        }
        return parsed;
      }
    } catch (e) {
      console.error('Failed to load store config from localStorage', e);
    }
    return INITIAL_STORE_CONFIG;
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CART);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load cart from localStorage', e);
    }
    return [];
  });

  const [activeCategory, setActiveCategory] = useState<'all' | 'individual' | 'combo'>('all');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Sincroniza cardápio público oficial com o servidor backend
  const refreshMenuFromServer = async () => {
    try {
      const res = await fetch('/api/menu');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (Array.isArray(data.products) && data.products.length > 0) {
            setProducts(data.products);
            localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(data.products));
          }
          if (data.config) {
            setConfig(data.config);
            localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(data.config));
          }
        }
      }
    } catch (err) {
      console.debug('Usando dados em cache local', err);
    }
  };

  // Carrega do servidor na montagem e ao focar a janela
  useEffect(() => {
    refreshMenuFromServer();

    const handleFocus = () => {
      refreshMenuFromServer();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Hydrate custom images from IndexedDB if stored
  useEffect(() => {
    const hydrateImages = async () => {
      try {
        const promises = products.map(async (p) => {
          const stored = await getImageFromStorage(p.id);
          if (stored && stored !== p.imageUrl) {
            return { id: p.id, imageUrl: stored };
          }
          return null;
        });

        const updates = (await Promise.all(promises)).filter(Boolean) as {
          id: string;
          imageUrl: string;
        }[];

        if (updates.length > 0) {
          setProducts((prev) =>
            prev.map((prod) => {
              const match = updates.find((u) => u.id === prod.id);
              return match ? { ...prod, imageUrl: match.imageUrl } : prod;
            })
          );
        }
      } catch (err) {
        console.warn('Erro ao hidratar imagens do IndexedDB', err);
      }
    };

    hydrateImages();
  }, []);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.error('Error saving products', e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
    } catch (e) {
      console.error('Error saving config', e);
    }
  }, [config]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    } catch (e) {
      console.error('Error saving cart', e);
    }
  }, [cart]);

  const addToCart = (product: Product, quantity = 1, notes = '') => {
    setCart((prev) => {
      const trimmedNotes = notes.trim();
      const existingIndex = prev.findIndex(
        (item) => item.productId === product.id && (item.notes || '').trim() === trimmedNotes
      );

      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + quantity,
        };
        return next;
      }

      const newItem: CartItem = {
        cartId: `${product.id}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        productId: product.id,
        product,
        quantity,
        notes: trimmedNotes || undefined,
      };

      return [...prev, newItem];
    });
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.cartId === cartId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null);
    });
  };

  const removeFromCart = (cartId: string) => {
    setCart((prev) => prev.filter((item) => item.cartId !== cartId));
  };

  const updateNotes = (cartId: string, notes: string) => {
    setCart((prev) =>
      prev.map((item) => (item.cartId === cartId ? { ...item, notes } : item))
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    let nextProducts: Product[] = [];
    setProducts((prev) => {
      nextProducts = prev.map((p) => (p.id === id ? { ...p, ...updates } : p));
      return nextProducts;
    });

    setCart((prev) =>
      prev.map((item) => {
        if (item.productId === id) {
          return {
            ...item,
            product: { ...item.product, ...updates },
          };
        }
        return item;
      })
    );

    // Salva automaticamente no servidor para persistir no cardápio público
    fetch('/api/menu/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products: nextProducts }),
    }).catch((err) => {
      console.warn('Erro ao sincronizar produto com o servidor público:', err);
    });
  };

  const setProductImage = async (id: string, dataUrl: string) => {
    // 1. Atualiza estado e cache local
    updateProduct(id, { imageUrl: dataUrl });
    await saveImageToStorage(id, dataUrl);

    // 2. Salva no servidor para todo o público ter acesso imediato à foto
    try {
      await fetch('/api/menu/product-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: id, imageUrl: dataUrl }),
      });
    } catch (err) {
      console.warn('Erro ao salvar imagem no servidor:', err);
    }
  };

  const deleteProductImage = async (id: string) => {
    // 1. Volta para a Logo Oficial MGW X-Salada
    updateProduct(id, { imageUrl: OFFICIAL_LOGO_URL });
    await removeImageFromStorage(id);

    // 2. Remove do servidor
    try {
      await fetch(`/api/menu/product-image/${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('Erro ao remover imagem do servidor:', err);
    }
  };

  const updateConfig = (updates: Partial<StoreConfig>) => {
    let nextConfig: StoreConfig;
    setConfig((prev) => {
      nextConfig = { ...prev, ...updates };
      return nextConfig;
    });

    // Salva automaticamente no servidor para todo o público ver o novo WhatsApp, status, etc.
    fetch('/api/menu/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: updates }),
    }).catch((err) => {
      console.warn('Erro ao sincronizar configurações com o servidor público:', err);
    });
  };

  const resetToDefaults = () => {
    setProducts(INITIAL_PRODUCTS);
    setConfig(INITIAL_STORE_CONFIG);
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.CONFIG);

    fetch('/api/menu/reset', { method: 'POST' }).catch((err) => {
      console.warn('Erro ao resetar cardápio no servidor:', err);
    });
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cart.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );

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
        updateProduct,
        setProductImage,
        deleteProductImage,
        updateConfig,
        resetToDefaults,
        refreshMenuFromServer,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
