import React from 'react';
import { ShoppingBag, Lock, Clock } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { OFFICIAL_LOGO_URL } from '../data/defaultData';
import { formatCurrency } from '../utils/formatters';

export const Header: React.FC = () => {
  const { config, cartCount, cartTotal, setIsCartOpen, setIsAdminOpen } = useStore();

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800/80 w-full">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Zone */}
        <a href="#" className="flex items-center gap-2 sm:gap-3 shrink-0 group">
          <img
            src={OFFICIAL_LOGO_URL}
            alt="MGW X-Salada Logo"
            referrerPolicy="no-referrer"
            className="w-9 h-9 sm:w-11 sm:h-11 object-contain drop-shadow-md rounded-full bg-black/40 ring-1 ring-amber-500/30 group-hover:scale-105 transition-transform shrink-0"
          />
          <div className="flex flex-col">
            <span className="font-display font-extrabold text-sm sm:text-base md:text-lg tracking-tight text-white group-hover:text-amber-400 transition-colors leading-none">
              MGW <span className="text-amber-400">X-SALADA</span>
            </span>
            <span className="text-[10px] sm:text-[11px] text-zinc-400 tracking-wide font-medium mt-0.5">
              CARDÁPIO DIGITAL
            </span>
          </div>
        </a>

        {/* Operating status & hours (hidden on mobile, visible on desktop) */}
        <div className="hidden lg:flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800">
            <span
              className={`w-2 h-2 rounded-full ${
                config.isOpen ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-red-500'
              }`}
            />
            <span className="text-zinc-200 font-medium">
              {config.isOpen ? 'Aberto Agora' : 'Fechado no Momento'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-zinc-400">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="truncate max-w-[220px]">{config.openingHours}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Admin shortcut button with 44px touch target */}
          <button
            onClick={() => setIsAdminOpen(true)}
            className="p-2 sm:px-3 sm:py-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-colors text-xs font-medium flex items-center justify-center gap-1.5 min-h-[42px] min-w-[42px] cursor-pointer"
            title="Área Administrativa (Fotos, WhatsApp e Preços)"
            aria-label="Painel Administrativo"
          >
            <Lock className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="hidden sm:inline">Admin</span>
          </button>

          {/* Cart Trigger Button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-red-950/40 active:scale-95 transition-all min-h-[42px] cursor-pointer"
            aria-label={`Carrinho com ${cartCount} itens`}
          >
            <ShoppingBag className="w-4 h-4 text-white shrink-0" />
            <span className="font-bold hidden sm:inline">Meu Carrinho</span>

            {cartCount > 0 ? (
              <span className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-full text-xs font-bold text-amber-300">
                <span>{cartCount}</span>
                <span className="hidden md:inline font-mono">· {formatCurrency(cartTotal)}</span>
              </span>
            ) : (
              <span className="text-[11px] text-amber-200/80 hidden sm:inline">Vazio</span>
            )}

            {cartCount > 0 && (
              <span className="sm:hidden absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-black text-[11px] font-black shadow-md">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
