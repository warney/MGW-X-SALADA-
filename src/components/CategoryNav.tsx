import React from 'react';
import { Layers } from 'lucide-react';
import { useStore } from '../context/StoreContext';

const CATEGORY_LABELS: Record<string, string> = {
  individual: 'X-Salada Individual',
  combo: 'Combos com Tuchaua',
};

const formatCategoryName = (category: string) =>
  category
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export const CategoryNav: React.FC = () => {
  const { activeCategory, setActiveCategory, products } = useStore();
  const activeProducts = products.filter((product) => product.active);
  const categories = Array.from(new Set(activeProducts.map((product) => product.category)));

  return (
    <div className="sticky top-[52px] sm:top-[57px] z-30 bg-black/95 backdrop-blur-md py-2 sm:py-2.5 border-b border-zinc-800/90 w-full shadow-md">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
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
            {activeProducts.length}
          </span>
        </button>

        {categories.map((category) => {
          const count = activeProducts.filter((product) => product.category === category).length;
          const label = CATEGORY_LABELS[category] ?? formatCategoryName(category);

          return (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 min-h-[42px] cursor-pointer shrink-0 ${
                activeCategory === category
                  ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-md shadow-red-950/50'
                  : 'bg-zinc-900/80 text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{label}</span>
              <span className="text-[10px] sm:text-[11px] px-1.5 py-0.2 rounded-full bg-black/40 font-mono">
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
