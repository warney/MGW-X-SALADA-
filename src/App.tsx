/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { CategoryNav } from './components/CategoryNav';
import { ProductCard } from './components/ProductCard';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { FloatingCartBar } from './components/FloatingCartBar';
import { AdminModal } from './components/AdminModal';
import { Footer } from './components/Footer';
import { Utensils, Sparkles, Layers, AlertCircle, Coffee, Pizza, IceCream, Beef } from 'lucide-react';
import { cleanPhoneNumber } from './utils/formatters';
import { useStoreIdentity } from './context/StoreIdentityContext';

const CATEGORY_PRESENTATION: Record<string, { title: string; description: string; icon: React.ElementType; iconClass: string }> = {
  individual: {
    title: 'X-Salada Individual',
    description: 'O clássico artesanal preparado na chapa com ingredientes selecionados',
    icon: Utensils,
    iconClass: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
  },
  combo: {
    title: 'Combos Especiais com Guaraná Tuchaua',
    description: 'A melhor combinação: X-Saladas no capricho + Refrigerante Guaraná Tuchaua gelado',
    icon: Sparkles,
    iconClass: 'bg-red-600/20 border-red-500/30 text-red-400',
  },
  lanches: {
    title: 'Lanches & Hambúrgueres',
    description: 'Sanduíches preparados com ingredientes selecionados e muito sabor',
    icon: Beef,
    iconClass: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
  },
  bebidas: {
    title: 'Bebidas Geladas',
    description: 'Refrigerantes, sucos naturais e bebidas refrescantes',
    icon: Coffee,
    iconClass: 'bg-blue-500/15 border-blue-500/30 text-blue-400',
  },
  sobremesas: {
    title: 'Sobremesas Especiais',
    description: 'Doces, açaí e sobremesas deliciosas para fechar seu pedido',
    icon: IceCream,
    iconClass: 'bg-pink-500/15 border-pink-500/30 text-pink-400',
  },
};

const formatCategoryName = (category: string) =>
  category
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const MenuContent: React.FC = () => {
  const { products, activeCategory, config, setIsAdminOpen } = useStore();
  const { storeSlug, store, stores, isExplicitSelection, navigateToStore } = useStoreIdentity();

  // Se o visitante acessou uma URL específica (/s/:slug) que não existe
  if (isExplicitSelection && !store && stores.length > 0) {
    return (
      <main className="min-h-screen bg-[#050505] text-zinc-100 flex items-center justify-center px-6">
        <section className="max-w-md text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 mx-auto flex items-center justify-center text-amber-400">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold">Estabelecimento não encontrado</h1>
          <p className="text-sm text-zinc-400">
            O cardápio digital que você tentou acessar não foi localizado ou o endereço foi digitado incorretamente.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigateToStore('mgw-x-salada')}
              className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white rounded-xl font-bold text-xs min-h-[42px] cursor-pointer"
            >
              Ir para MGW X-Salada
            </button>
            <button
              onClick={() => setIsAdminOpen(true)}
              className="w-full sm:w-auto px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl font-semibold text-xs min-h-[42px] cursor-pointer"
            >
              Acessar Painel Admin
            </button>
          </div>
        </section>
        <AdminModal />
      </main>
    );
  }

  // Se a loja existe mas está em rascunho ou suspensa
  if (store && store.status !== 'active') {
    return (
      <main className="min-h-screen bg-[#050505] text-zinc-100 flex items-center justify-center px-6">
        <section className="max-w-md text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 mx-auto flex items-center justify-center text-amber-400">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold">
            {store.status === 'draft' ? 'Cardápio em Preparação' : 'Atendimento Temporariamente Indisponível'}
          </h1>
          <p className="text-sm text-zinc-400">
            {store.status === 'draft'
              ? `O cardápio de "${store.name}" está sendo preparado pela equipe e estará disponível em breve.`
              : `O atendimento de "${store.name}" está suspenso temporariamente.`}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigateToStore('mgw-x-salada')}
              className="w-full sm:w-auto px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl font-semibold text-xs min-h-[42px] cursor-pointer"
            >
              Ver MGW X-Salada
            </button>
            <button
              onClick={() => setIsAdminOpen(true)}
              className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-xl font-bold text-xs min-h-[42px] cursor-pointer"
            >
              Acessar Painel da Loja
            </button>
          </div>
        </section>
        <AdminModal />
      </main>
    );
  }

  const isStoreNumberSet = !!cleanPhoneNumber(config.whatsappNumber);
  const activeProducts = products.filter((product) => product.active);
  const categories = Array.from(new Set(activeProducts.map((product) => product.category)));
  const visibleCategories =
    activeCategory === 'all'
      ? categories
      : categories.filter((category) => category === activeCategory);

  return (
    <div className="min-h-screen flex flex-col bg-[#050505] text-zinc-100 w-full overflow-x-hidden selection:bg-amber-500 selection:text-black">
      {!isStoreNumberSet && (
        <div className="bg-gradient-to-r from-amber-600 to-red-600 px-3 sm:px-4 py-2 text-xs font-semibold text-white shadow-md w-full">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-white" />
              <span>
                <strong>Atenção Proprietário:</strong> O número do WhatsApp da loja ainda não foi configurado.
              </span>
            </div>
            <button
              onClick={() => setIsAdminOpen(true)}
              className="px-3 py-1 rounded-lg bg-black text-amber-400 font-bold hover:bg-zinc-900 transition-colors text-[11px] shrink-0 min-h-[32px] cursor-pointer"
            >
              Configurar WhatsApp
            </button>
          </div>
        </div>
      )}

      <Header />

      <main className="flex-1 w-full">
        <Hero />
        <CategoryNav />

        <section id="cardapio-section" className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-10 space-y-8 sm:space-y-12">
          {visibleCategories.map((category) => {
            const categoryProducts = activeProducts.filter((product) => product.category === category);
            if (categoryProducts.length === 0) return null;

            const presentation = CATEGORY_PRESENTATION[category] ?? {
              title: formatCategoryName(category),
              description: '',
              icon: Layers,
              iconClass: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
            };
            const CategoryIcon = presentation.icon;

            return (
              <div key={category} className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-2.5 sm:pb-3 border-b border-zinc-800">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl border flex items-center justify-center shrink-0 ${presentation.iconClass}`}>
                      <CategoryIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <h2 className="font-display font-extrabold text-xl sm:text-2xl md:text-3xl text-white tracking-tight">
                        {presentation.title}
                      </h2>
                      {presentation.description && (
                        <p className="text-[11px] sm:text-xs md:text-sm text-zinc-400">
                          {presentation.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {categoryProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            );
          })}

          {activeProducts.length === 0 && (
            <div className="py-16 text-center space-y-3">
              <p className="text-zinc-400 text-sm">
                Nenhum produto ativo no momento.
              </p>
              <button
                onClick={() => setIsAdminOpen(true)}
                className="px-4 py-2.5 bg-zinc-800 text-amber-400 text-xs rounded-xl font-bold min-h-[44px] cursor-pointer"
              >
                Acessar Admin para Ativar Produtos
              </button>
            </div>
          )}
        </section>
      </main>

      <FloatingCartBar />
      <CartDrawer />
      <CheckoutModal />
      <AdminModal />
      <Footer />
    </div>
  );
};

/**
 * Remonta todo o estado do estabelecimento quando o slug muda.
 * Isso impede que produtos, configurações e carrinho da loja anterior
 * permaneçam em memória durante uma navegação entre lojas.
 */
export default function App() {
  const { storeSlug } = useStoreIdentity();

  return (
    <StoreProvider key={storeSlug ?? 'unknown-store'}>
      <MenuContent />
    </StoreProvider>
  );
}
