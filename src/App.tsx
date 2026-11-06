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
import { Utensils, Sparkles, AlertCircle } from 'lucide-react';
import { cleanPhoneNumber } from './utils/formatters';

const MenuContent: React.FC = () => {
  const { products, activeCategory, config, setIsAdminOpen } = useStore();

  const isStoreNumberSet = !!cleanPhoneNumber(config.whatsappNumber);

  // Filter products based on active category
  const activeProducts = products.filter((p) => p.active);

  const individualProducts = activeProducts.filter((p) => p.category === 'individual');
  const comboProducts = activeProducts.filter((p) => p.category === 'combo');

  const showIndividualSection =
    activeCategory === 'all' || activeCategory === 'individual';
  const showCombosSection =
    activeCategory === 'all' || activeCategory === 'combo';

  return (
    <div className="min-h-screen flex flex-col bg-[#050505] text-zinc-100 w-full overflow-x-hidden selection:bg-amber-500 selection:text-black">
      {/* Top Banner if WhatsApp is not yet configured by the store owner */}
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
              className="px-3 py-1 rounded-lg bg-black text-amber-400 font-bold hover:bg-zinc-900 transition-colors text-[11px] shrink-0 min-h-[32px]"
            >
              Configurar WhatsApp
            </button>
          </div>
        </div>
      )}

      {/* Main Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1 w-full">
        {/* Hero Section */}
        <Hero />

        {/* Category Navigation Bar */}
        <CategoryNav />

        {/* Menu Section */}
        <section id="cardapio-section" className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-10 space-y-8 sm:space-y-12">
          {/* CATEGORIA 1: X-SALADA INDIVIDUAL */}
          {showIndividualSection && individualProducts.length > 0 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-2.5 sm:pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                    <Utensils className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <h2 className="font-display font-extrabold text-xl sm:text-2xl md:text-3xl text-white tracking-tight">
                      X-Salada Individual
                    </h2>
                    <p className="text-[11px] sm:text-xs md:text-sm text-zinc-400">
                      O clássico artesanal preparado na chapa com ingredientes selecionados
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {individualProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}

          {/* CATEGORIA 2: COMBOS COM TUCHAUA */}
          {showCombosSection && comboProducts.length > 0 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-2.5 sm:pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-red-600/20 border border-red-500/30 text-red-400 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <h2 className="font-display font-extrabold text-xl sm:text-2xl md:text-3xl text-white tracking-tight">
                      Combos Especiais com Guaraná Tuchaua
                    </h2>
                    <p className="text-[11px] sm:text-xs md:text-sm text-zinc-400">
                      A melhor combinação: X-Saladas no capricho + Refrigerante Guaraná Tuchaua gelado
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {comboProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}

          {/* Empty state if all items disabled */}
          {activeProducts.length === 0 && (
            <div className="py-16 text-center space-y-3">
              <p className="text-zinc-400 text-sm">
                Nenhum produto ativo no momento.
              </p>
              <button
                onClick={() => setIsAdminOpen(true)}
                className="px-4 py-2.5 bg-zinc-800 text-amber-400 text-xs rounded-xl font-bold min-h-[44px]"
              >
                Acessar Admin para Ativar Produtos
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Floating Bottom Cart Bar for quick mobile ordering */}
      <FloatingCartBar />

      {/* Modals & Drawers */}
      <CartDrawer />
      <CheckoutModal />
      <AdminModal />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <MenuContent />
    </StoreProvider>
  );
}
