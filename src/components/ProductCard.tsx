import React, { useState } from 'react';
import { Plus, Minus, Check, MessageSquare } from 'lucide-react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { formatCurrency } from '../utils/formatters';
import { OFFICIAL_LOGO_URL } from '../data/defaultData';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useStore();
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);

  const isDefaultLogo = product.imageUrl === OFFICIAL_LOGO_URL;

  const handleIncrement = () => setQuantity((q) => Math.min(q + 1, 99));
  const handleDecrement = () => setQuantity((q) => Math.max(q - 1, 1));

  const handleAddToCart = () => {
    addToCart(product, quantity, notes);

    // Trigger smooth bounce/pulse scale animation
    setIsBouncing(false);
    requestAnimationFrame(() => {
      setIsBouncing(true);
    });

    setJustAdded(true);
    setNotes('');
    setIsNotesOpen(false);
    setQuantity(1);

    setTimeout(() => {
      setIsBouncing(false);
    }, 600);

    setTimeout(() => {
      setJustAdded(false);
    }, 1800);
  };

  return (
    <div className="group relative flex flex-col justify-between rounded-3xl bg-zinc-900/90 border border-zinc-800/80 hover:border-amber-500/50 transition-all duration-300 shadow-xl overflow-hidden hover:shadow-2xl hover:shadow-amber-500/10 w-full">
      {/* Top Media Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-950 flex items-center justify-center">
        <img
          src={product.imageUrl}
          alt={product.name}
          referrerPolicy="no-referrer"
          className={`w-full h-full transition-transform duration-500 ${
            isDefaultLogo
              ? 'object-contain p-6 bg-gradient-to-b from-zinc-950 via-zinc-900 to-black'
              : 'object-cover object-center group-hover:scale-105'
          }`}
          onError={(e) => {
            // Fallback gracefully to official logo
            e.currentTarget.src = OFFICIAL_LOGO_URL;
            e.currentTarget.className = 'w-full h-full object-contain p-6 bg-black';
          }}
        />

        {/* Gradient Scrim (subtle for photos, dark for readability) */}
        {!isDefaultLogo && (
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-black/30 pointer-events-none" />
        )}

        {/* Highlight pill */}
        {product.highlight && (
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-amber-500 text-black font-extrabold text-[10px] sm:text-[11px] uppercase tracking-wider shadow-md">
            {product.highlight}
          </div>
        )}

        {/* Category indicator */}
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-zinc-700/60 text-zinc-300 text-[10px] font-bold uppercase tracking-wider">
          {product.category === 'individual' ? 'Individual' : 'Combo Especial'}
        </div>

        {/* Price Badge over image */}
        <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-black/85 backdrop-blur-md border border-amber-500/40 text-amber-400 font-display font-extrabold text-base sm:text-lg md:text-xl shadow-lg">
          {formatCurrency(product.price)}
        </div>
      </div>

      {/* Content Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3 sm:space-y-4">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-display font-bold text-base sm:text-lg md:text-xl text-white group-hover:text-amber-300 transition-colors leading-snug">
              {product.name}
            </h3>
          </div>

          <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
            {product.description}
          </p>

          {/* Included Ingredients bullet points */}
          {product.includedItems && product.includedItems.length > 0 && (
            <div className="mt-2.5 space-y-1">
              {product.includedItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-[11px] text-zinc-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  <span className="truncate">{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Observation Accordion */}
        <div className="pt-2 border-t border-zinc-800/80">
          {!isNotesOpen ? (
            <button
              type="button"
              onClick={() => setIsNotesOpen(true)}
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1.5 font-medium transition-colors py-1 cursor-pointer min-h-[36px]"
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[11px] sm:text-xs">Observação? (sem tomate, bem passado...)</span>
            </button>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="text-[11px]">Observação para este item:</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsNotesOpen(false);
                    setNotes('');
                  }}
                  className="text-zinc-400 hover:text-zinc-200 text-[11px] p-1"
                >
                  Cancelar
                </button>
              </div>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: sem cebola, ovo bem passado, etc."
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-amber-500 focus:outline-none text-xs text-white placeholder-zinc-600 min-h-[40px]"
                maxLength={100}
              />
            </div>
          )}
        </div>

        {/* Action Row: Quantity + Add Button */}
        <div className="pt-1 flex items-center gap-2 sm:gap-3">
          {/* Quantity Selector with touch-friendly hitboxes (min 44px) */}
          <div className="flex items-center rounded-2xl bg-zinc-950 border border-zinc-800 p-0.5 sm:p-1 shrink-0 h-11 sm:h-12">
            <button
              type="button"
              onClick={handleDecrement}
              disabled={quantity <= 1}
              className="w-9 h-full rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 transition-colors cursor-pointer"
              aria-label="Diminuir quantidade"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-7 sm:w-8 text-center font-mono font-bold text-xs sm:text-sm text-white select-none">
              {quantity}
            </span>
            <button
              type="button"
              onClick={handleIncrement}
              className="w-9 h-full rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              aria-label="Aumentar quantidade"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Cart CTA */}
          <button
            type="button"
            onClick={handleAddToCart}
            className={`flex-1 min-h-[44px] sm:min-h-[48px] py-2.5 sm:py-3 px-3 sm:px-4 rounded-2xl font-bold text-xs sm:text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer select-none leading-none ${
              isBouncing ? 'animate-bounce-scale animate-pulse-ring' : ''
            } ${
              justAdded
                ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-950/60'
                : 'bg-gradient-to-r from-red-600 via-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-lg shadow-red-950/40 active:scale-95'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-4 h-4 text-white shrink-0" />
                <span className="uppercase tracking-wider">ADICIONADO!</span>
              </>
            ) : (
              <>
                <span className="truncate">ADICIONAR</span>
                <span className="font-mono text-[11px] sm:text-xs opacity-90 shrink-0">
                  ({formatCurrency(product.price * quantity)})
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
