import React, { useState, useEffect } from 'react';
import {
  Store as StoreIcon,
  Phone,
  Clock,
  MapPin,
  Truck,
  ExternalLink,
  Save,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { cleanPhoneNumber, formatPhoneDisplay } from '../../utils/formatters';

export const StoreSettingsManager: React.FC = () => {
  const { config, updateConfig, resetToDefaults } = useStore();

  const [tempWhatsapp, setTempWhatsapp] = useState(config.whatsappNumber);
  const [tempStoreName, setTempStoreName] = useState(config.storeName);
  const [tempSlogan, setTempSlogan] = useState(config.slogan);
  const [tempAddress, setTempAddress] = useState(config.address);
  const [tempHours, setTempHours] = useState(config.openingHours);
  const [tempDeliveryEstimate, setTempDeliveryEstimate] = useState(config.deliveryEstimate);
  const [tempDeliveryFeeNote, setTempDeliveryFeeNote] = useState(config.deliveryFeeNote);
  const [tempIsOpen, setTempIsOpen] = useState(config.isOpen);
  const [saveFeedback, setSaveFeedback] = useState(false);

  useEffect(() => {
    setTempWhatsapp(config.whatsappNumber);
    setTempStoreName(config.storeName);
    setTempSlogan(config.slogan);
    setTempAddress(config.address);
    setTempHours(config.openingHours);
    setTempDeliveryEstimate(config.deliveryEstimate);
    setTempDeliveryFeeNote(config.deliveryFeeNote);
    setTempIsOpen(config.isOpen);
  }, [config]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig({
      whatsappNumber: cleanPhoneNumber(tempWhatsapp),
      storeName: tempStoreName.trim(),
      slogan: tempSlogan.trim(),
      address: tempAddress.trim(),
      openingHours: tempHours.trim(),
      deliveryEstimate: tempDeliveryEstimate.trim(),
      deliveryFeeNote: tempDeliveryFeeNote.trim(),
      isOpen: tempIsOpen,
    });

    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 2500);
  };

  const handleTestWhatsapp = () => {
    const cleaned = cleanPhoneNumber(tempWhatsapp || config.whatsappNumber);
    if (!cleaned) {
      alert('Por favor, informe primeiro o número com DDD (ex: 9281112510 ou 559281112510)');
      return;
    }
    const fullNumber = cleaned.startsWith('55') ? cleaned : `55${cleaned}`;
    window.open(
      `https://wa.me/${fullNumber}?text=${encodeURIComponent(
        `Olá! Este é um teste de configuração do Cardápio Digital ${tempStoreName || 'MGW'}.`
      )}`,
      '_blank'
    );
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Status da Loja: Aberto / Fechado Hero Control */}
      <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-sm text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            Status Operacional da Loja
          </h4>
          <p className="text-xs text-zinc-400 mt-0.5">
            Defina se os clientes podem finalizar novos pedidos pelo WhatsApp agora.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setTempIsOpen(!tempIsOpen)}
          className={`px-5 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer min-h-[44px] ${
            tempIsOpen
              ? 'bg-emerald-500 text-black shadow-emerald-950/40'
              : 'bg-zinc-800 text-red-400 border border-red-500/40 shadow-red-950/20'
          }`}
        >
          <span className={`w-2.5 h-2.5 rounded-full ${tempIsOpen ? 'bg-black animate-pulse' : 'bg-red-500'}`} />
          <span>{tempIsOpen ? 'ABERTO PARA PEDIDOS' : 'FECHADO NO MOMENTO'}</span>
        </button>
      </div>

      {/* Grid: 2 Colunas de Configurações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Bloco 1: WhatsApp & Atendimento */}
        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
            <Phone className="w-4 h-4 text-emerald-400" />
            <h4 className="font-bold text-sm text-white">WhatsApp & Contato</h4>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              WhatsApp para Recebimento de Pedidos *
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-zinc-500">
                  +55
                </span>
                <input
                  type="text"
                  required
                  placeholder="DDD + Número (ex: 9281112510)"
                  value={tempWhatsapp}
                  onChange={(e) => setTempWhatsapp(e.target.value)}
                  className="w-full pl-11 pr-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-white focus:outline-none focus:border-amber-500 min-h-[40px]"
                />
              </div>

              <button
                type="button"
                onClick={handleTestWhatsapp}
                className="px-3.5 py-2.5 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer min-h-[40px] shrink-0"
                title="Testar envio no WhatsApp"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Testar</span>
              </button>
            </div>
            {tempWhatsapp && (
              <span className="text-[11px] text-zinc-400 mt-1 block">
                Visualização:{' '}
                <strong className="text-amber-400 font-mono">
                  {formatPhoneDisplay(tempWhatsapp)}
                </strong>
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Horário de Atendimento
            </label>
            <input
              type="text"
              placeholder="Ex: Terça a Domingo: 18h00 às 23h30"
              value={tempHours}
              onChange={(e) => setTempHours(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 min-h-[40px]"
            />
          </div>
        </div>

        {/* Bloco 2: Entrega & Retirada */}
        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
            <Truck className="w-4 h-4 text-blue-400" />
            <h4 className="font-bold text-sm text-white">Entrega & Retirada</h4>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Endereço para Retirada no Balcão
            </label>
            <input
              type="text"
              placeholder="Ex: Rua Principal, Balcão de Retirada"
              value={tempAddress}
              onChange={(e) => setTempAddress(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 min-h-[40px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Estimativa de Tempo
              </label>
              <input
                type="text"
                placeholder="Ex: 35 - 50 min"
                value={tempDeliveryEstimate}
                onChange={(e) => setTempDeliveryEstimate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 min-h-[40px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Taxa de Entrega
              </label>
              <input
                type="text"
                placeholder="Ex: A consultar por bairro"
                value={tempDeliveryFeeNote}
                onChange={(e) => setTempDeliveryFeeNote(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 min-h-[40px]"
              />
            </div>
          </div>
        </div>

        {/* Bloco 3: Marca & Apresentação */}
        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4 md:col-span-2">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
            <StoreIcon className="w-4 h-4 text-amber-400" />
            <h4 className="font-bold text-sm text-white">Identidade da Marca</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Nome do Estabelecimento *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: MGW X-SALADA"
                value={tempStoreName}
                onChange={(e) => setTempStoreName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-500 min-h-[40px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Slogan da Marca
              </label>
              <input
                type="text"
                placeholder="Ex: Sempre uma boa escolha!"
                value={tempSlogan}
                onChange={(e) => setTempSlogan(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-500 min-h-[40px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-zinc-800">
        <button
          type="button"
          onClick={() => {
            if (confirm('Deseja restaurar as configurações originais padrão de fábrica?')) {
              resetToDefaults();
            }
          }}
          className="text-xs text-zinc-500 hover:text-red-400 transition-colors flex items-center gap-1.5 cursor-pointer py-2"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restaurar Padrões de Fábrica</span>
        </button>

        <button
          type="submit"
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-amber-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
        >
          {saveFeedback ? (
            <>
              <Check className="w-4 h-4" />
              <span>Salvo com Sucesso!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Salvar Configurações</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
