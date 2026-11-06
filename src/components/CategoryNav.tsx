import React from 'react';
import { Utensils, Sparkles, Layers } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const CategoryNav: React.FC = () => {
  const { activeCategory, setActiveCategory, products } = useStore();

  const countAll = products.filter((p) => p.active).length;
  const countIndividual = products.filter((p) => p.active && p.category === 'individual').length;
  const countCombos = products.filter((p) => p.active && p.category === 'combo').length;

  return (
    <div className="sticky top-[52px] sm:top-[57px] z-30 bg-black/95 backdrop-blur-md py-2 sm:py-2.5 border-b border-zinc-800/90 w-full shadow-md">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
        {/* All */}
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 min-h-[42px] cursor-pointer shrink-0 ${
            activeCategory === 'all'
              ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-md shadow-red-950/50'
              : 'bg-zinc-900/80 text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5 shrink-0" />
          <span>Cardápio Completo</span>
          <span className="text-[10px] sm:text-[11px] px-1.5 py-0.2 rounded-full bg-black/40 font-mono">
            {countAll}
          </span>
        </button>

        {/* Individual */}
        <button
          onClick={() => setActiveCategory('individual')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 min-h-[42px] cursor-pointer shrink-0 ${
            activeCategory === 'individual'
              ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-md shadow-red-950/50'
              : 'bg-zinc-900/80 text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-800'
          }`}
        >
          <Utensils className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>X-Salada Individual</span>
          <span className="text-[10px] sm:text-[11px] px-1.5 py-0.2 rounded-full bg-black/40 font-mono">
            {countIndividual}
          </span>
        </button>

        {/* Combos */}
        <button
          onClick={() => setActiveCategory('combo')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 min-h-[42px] cursor-pointer shrink-0 ${
            activeCategory === 'combo'
              ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-md shadow-red-950/50'
              : 'bg-zinc-900/80 text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Combos com Tuchaua</span>
          <span className="text-[10px] sm:text-[11px] px-1.5 py-0.2 rounded-full bg-black/40 font-mono">
            {countCombos}
          </span>
        </button>
      </div>
    </div>
  );
};
