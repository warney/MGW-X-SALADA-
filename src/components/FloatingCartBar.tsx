import React from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatCurrency } from '../utils/formatters';

export const FloatingCartBar: React.FC = () => {
  const { cartCount, cartTotal, setIsCartOpen, isCartOpen, isCheckoutOpen } = useStore();

  if (cartCount === 0 || isCartOpen || isCheckoutOpen) return null;

  return (
    <aside
      aria-label="Resumo do pedido flutuante"
      className="fixed bottom-3 left-0 right-0 z-30 px-4 sm:px-6 pointer-events-none"
    >
      <div className="max-w-md mx-auto pointer-events-auto">
        <button
          onClick={() => setIsCartOpen(true)}
          className="w-full h-14 rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-bold text-sm shadow-2xl shadow-red-950/80 border border-amber-400/30 flex items-center justify-between px-4 sm:px-5 active:scale-[0.98] transition-transform cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-black/40 flex items-center justify-center text-amber-300 font-extrabold text-xs">
              {cartCount}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[11px] uppercase tracking-wider text-amber-200/90 font-semibold leading-none">
                Ver Pedido
              </span>
              <span className="font-mono text-sm sm:text-base font-extrabold text-white leading-tight">
                {formatCurrency(cartTotal)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide bg-black/30 px-3 py-1.5 rounded-xl border border-white/10">
            <span>Avançar</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </button>
      </div>
    </aside>
  );
};
