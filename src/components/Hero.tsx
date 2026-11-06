import React from 'react';
import { ArrowDown, Flame, CheckCircle2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { OFFICIAL_LOGO_URL, HERO_BURGER_IMAGE } from '../data/defaultData';

export const Hero: React.FC = () => {
  const { config, setIsCartOpen, cartCount } = useStore();

  const scrollToMenu = () => {
    const menuEl = document.getElementById('cardapio-section');
    if (menuEl) {
      menuEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-zinc-950 via-zinc-900 to-black pt-4 sm:pt-6 pb-6 sm:pb-10 border-b border-zinc-800/60 w-full">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-56 sm:h-64 bg-amber-500/10 blur-[100px] pointer-events-none rounded-full" />
      <div className="absolute top-16 right-4 w-40 h-40 bg-red-600/10 blur-[80px] pointer-events-none rounded-full" />

      <div className="max-w-6xl mx-auto px-3 sm:px-4 relative z-10">
        {/* Highlight Banner / Card */}
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-zinc-800/80 bg-zinc-900/60 shadow-2xl">
          {/* Background image overlay */}
          <div className="absolute inset-0">
            <img
              src={HERO_BURGER_IMAGE}
              alt="Hambúrguer artesanal MGW X-Salada"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center opacity-25 sm:opacity-40 scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent sm:bg-gradient-to-r sm:from-black sm:via-black/85 sm:to-transparent" />
          </div>

          <div className="relative p-4 sm:p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
            {/* Left Content */}
            <div className="flex-1 text-center md:text-left space-y-3.5 sm:space-y-4 max-w-xl">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] sm:text-xs font-semibold tracking-wide">
                <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>Cardápio Digital Oficial</span>
              </div>

              {/* Title & Slogan */}
              <div className="space-y-1">
                <h1 className="font-display font-black text-2xl sm:text-4xl md:text-5xl text-white tracking-tight leading-tight">
                  Bem-vindo à <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-red-500">MGW X-Salada!</span>
                </h1>
                <p className="text-base sm:text-lg md:text-xl font-medium text-amber-200/90 italic font-display">
                  "{config.slogan || 'Sempre uma boa escolha!'}"
                </p>
              </div>

              {/* Short description */}
              <p className="text-zinc-300 text-xs sm:text-sm md:text-base leading-relaxed">
                O legítimo X-Salada com pão brioche macio, hambúrguer suculento, queijo derretido, presunto de peru, ovo e salada fresca. Acompanhado do inconfundível <strong className="text-amber-400 font-semibold">Guaraná Tuchaua</strong> geladinho!
              </p>

              {/* Trust markers */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-3 pt-1 text-[11px] sm:text-xs text-zinc-300">
                <span className="flex items-center gap-1.5 bg-black/50 px-2.5 sm:px-3 py-1 rounded-lg border border-zinc-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Pão Brioche
                </span>
                <span className="flex items-center gap-1.5 bg-black/50 px-2.5 sm:px-3 py-1 rounded-lg border border-zinc-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Guaraná Tuchaua
                </span>
                <span className="flex items-center gap-1.5 bg-black/50 px-2.5 sm:px-3 py-1 rounded-lg border border-zinc-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Pedido via WhatsApp
                </span>
              </div>

              {/* CTA Button */}
              <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3 w-full">
                <button
                  onClick={scrollToMenu}
                  className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-extrabold text-sm sm:text-base tracking-wide shadow-xl shadow-red-950/60 active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer group min-h-[48px]"
                >
                  <span>FAÇA SEU PEDIDO</span>
                  <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-y-1 transition-transform" />
                </button>

                {cartCount > 0 && (
                  <button
                    onClick={() => setIsCartOpen(true)}
                    className="w-full sm:w-auto px-5 py-3.5 sm:py-4 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 border border-amber-500/40 text-amber-300 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 min-h-[48px]"
                  >
                    <span>Ver Carrinho ({cartCount})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Right: Official Logo Showcase */}
            <div className="relative shrink-0 flex flex-col items-center">
              <div className="relative w-40 h-40 sm:w-52 sm:h-52 md:w-64 md:h-64 rounded-full p-2 bg-gradient-to-b from-amber-400/40 via-red-600/30 to-zinc-900 border-2 border-amber-500/50 shadow-2xl flex items-center justify-center">
                <img
                  src={OFFICIAL_LOGO_URL}
                  alt="Logo Oficial MGW X-Salada"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-300"
                />
              </div>

              <div className="mt-2.5 flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-zinc-400">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>MGW X-SALADA • ORIGINAL</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
