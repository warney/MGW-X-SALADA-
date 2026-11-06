import React from 'react';
import { Lock, Phone, MapPin, Clock } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { OFFICIAL_LOGO_URL } from '../data/defaultData';
import { formatPhoneDisplay } from '../utils/formatters';

export const Footer: React.FC = () => {
  const { config, setIsAdminOpen } = useStore();

  return (
    <footer className="bg-zinc-950 border-t border-zinc-900 pt-8 sm:pt-12 pb-24 sm:pb-20 text-zinc-400 text-xs w-full">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 space-y-6 sm:space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-6 pb-6 sm:pb-8 border-b border-zinc-900 text-center md:text-left">
          {/* Brand lockup */}
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
            <img
              src={OFFICIAL_LOGO_URL}
              alt="MGW X-Salada"
              referrerPolicy="no-referrer"
              className="w-12 h-12 sm:w-14 sm:h-14 object-contain rounded-full bg-black/60 p-1 ring-1 ring-amber-500/30 shrink-0"
            />
            <div>
              <h3 className="font-display font-extrabold text-base sm:text-lg text-white">
                {config.storeName || 'MGW X-SALADA'}
              </h3>
              <p className="text-amber-400/90 font-medium italic text-xs">
                "{config.slogan || 'Sempre uma boa escolha!'}"
              </p>
            </div>
          </div>

          {/* Quick Info */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-zinc-400 text-xs">
            {config.whatsappNumber && (
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-mono text-zinc-200">
                  {formatPhoneDisplay(config.whatsappNumber)}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{config.openingHours}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span>{config.address}</span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-zinc-500 text-[11px] text-center sm:text-left">
          <p>
            © {new Date().getFullYear()} MGW X-SALADA. Todos os direitos reservados.
          </p>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setIsAdminOpen(true)}
              className="hover:text-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer py-1 min-h-[36px]"
            >
              <Lock className="w-3 h-3 text-amber-500" />
              <span>Acesso Administrativo</span>
            </button>
            <span>•</span>
            <span className="text-zinc-500">
              Pedidos direto no WhatsApp
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
