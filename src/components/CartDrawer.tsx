import React from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag, MessageSquareQuote } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatCurrency } from '../utils/formatters';
import { OFFICIAL_LOGO_URL } from '../data/defaultData';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    cartCount,
    cartTotal,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    clearCart,
    setIsCheckoutOpen,
  } = useStore();

  if (!isCartOpen) return null;

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex w-full sm:max-w-md">
        <div className="w-full bg-zinc-950 border-l border-zinc-800 flex flex-col shadow-2xl h-full">
          {/* Header */}
          <div className="px-4 sm:px-6 py-4 bg-zinc-900/95 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center text-white shadow-md shrink-0">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display font-bold text-base sm:text-lg text-white">Meu Carrinho</h2>
                <p className="text-xs text-zinc-400">
                  {cartCount === 0
                    ? 'Nenhum item selecionado'
                    : `${cartCount} ${cartCount === 1 ? 'item selecionado' : 'itens selecionados'}`}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Fechar carrinho"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
                <div className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600">
                  <ShoppingBag className="w-10 h-10" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-display font-bold text-lg text-white">
                    Seu carrinho está vazio
                  </h3>
                  <p className="text-xs text-zinc-400 max-w-xs">
                    Que tal escolher um delicioso X-Salada ou um combo com Guaraná Tuchaua gelado?
                  </p>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wide transition-colors min-h-[44px]"
                >
                  Ver Cardápio
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-xs text-zinc-400 pb-2 border-b border-zinc-800/80">
                  <span>Itens adicionados ({cartCount})</span>
                  <button
                    onClick={clearCart}
                    className="text-red-400 hover:text-red-300 transition-colors text-[11px] underline p-1 min-h-[36px] flex items-center"
                  >
                    Esvaziar carrinho
                  </button>
                </div>

                <div className="space-y-3">
                  {cart.map((item) => {
                    const itemTotal = item.product.price * item.quantity;
                    const isLogo = item.product.imageUrl === OFFICIAL_LOGO_URL;

                    return (
                      <div
                        key={item.cartId}
                        className="p-3 sm:p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex gap-3 items-start justify-between"
                      >
                        {/* Thumbnail */}
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-950 shrink-0 border border-zinc-800 flex items-center justify-center">
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            referrerPolicy="no-referrer"
                            className={`w-full h-full ${
                              isLogo ? 'object-contain p-1.5' : 'object-cover'
                            }`}
                            onError={(e) => {
                              e.currentTarget.src = OFFICIAL_LOGO_URL;
                            }}
                          />
                        </div>

                        {/* Item Details */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-display font-bold text-sm text-white truncate">
                            {item.product.name}
                          </h4>
                          <p className="text-xs font-mono font-semibold text-amber-400 mt-0.5">
                            {formatCurrency(item.product.price)} un.
                          </p>

                          {item.notes && (
                            <div className="mt-1 flex items-start gap-1 text-[11px] text-amber-300/90 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                              <MessageSquareQuote className="w-3 h-3 shrink-0 mt-0.5" />
                              <span className="italic truncate">{item.notes}</span>
                            </div>
                          )}

                          {/* Stepper Controls */}
                          <div className="flex items-center gap-3 mt-2.5">
                            <div className="flex items-center rounded-lg bg-zinc-950 border border-zinc-800 p-0.5">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.cartId, -1)}
                                className="w-7 h-7 sm:w-6 sm:h-6 rounded flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                                aria-label="Diminuir quantidade"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-7 text-center font-mono font-bold text-xs sm:text-sm text-white">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.cartId, 1)}
                                className="w-7 h-7 sm:w-6 sm:h-6 rounded flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                                aria-label="Aumentar quantidade"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <span className="font-mono font-bold text-sm text-zinc-200">
                              {formatCurrency(itemTotal)}
                            </span>
                          </div>
                        </div>

                        {/* Remove item button with 44px tap target */}
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.cartId)}
                          className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center shrink-0"
                          title="Remover do pedido"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Footer with Subtotal & Continuar Pedido Button */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-6 bg-zinc-900 border-t border-zinc-800 space-y-3.5 sm:space-y-4">
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Subtotal ({cartCount} itens)</span>
                  <span className="font-mono text-white">{formatCurrency(cartTotal)}</span>
                </div>
                <div className="flex items-center justify-between text-base font-bold text-white pt-2 border-t border-zinc-800">
                  <span className="font-display">Total do Pedido</span>
                  <span className="font-mono text-xl sm:text-2xl text-amber-400">{formatCurrency(cartTotal)}</span>
                </div>
              </div>

              {/* CONTINUAR PEDIDO BUTTON */}
              <button
                type="button"
                onClick={handleProceedToCheckout}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-extrabold text-sm sm:text-base tracking-wide shadow-xl shadow-red-950/60 active:scale-98 transition-all flex items-center justify-center gap-3 cursor-pointer min-h-[50px]"
              >
                <span>CONTINUAR PEDIDO</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
