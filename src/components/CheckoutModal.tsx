import React, { useState } from 'react';
import {
  X,
  Send,
  Truck,
  Store,
  CreditCard,
  Banknote,
  QrCode,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { CustomerData } from '../types';
import { formatCurrency, cleanPhoneNumber } from '../utils/formatters';
import { generateOrderMessage, buildWhatsAppUrl } from '../utils/whatsapp';

export const CheckoutModal: React.FC = () => {
  const {
    cart,
    cartTotal,
    config,
    isCheckoutOpen,
    setIsCheckoutOpen,
    setIsAdminOpen,
  } = useStore();

  const [customer, setCustomer] = useState<CustomerData>({
    name: '',
    phone: '',
    orderType: 'entrega',
    address: {
      street: '',
      number: '',
      neighborhood: '',
      reference: '',
    },
    paymentMethod: 'pix',
    needsChange: false,
    changeFor: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  if (!isCheckoutOpen) return null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!customer.name.trim()) {
      errs.name = 'Por favor, informe seu nome completo.';
    }

    if (customer.orderType === 'entrega') {
      if (!customer.address.street.trim()) {
        errs.street = 'Informe a rua ou avenida para entrega.';
      }
      if (!customer.address.number.trim()) {
        errs.number = 'Informe o número da residência.';
      }
      if (!customer.address.neighborhood.trim()) {
        errs.neighborhood = 'Informe o bairro.';
      }
    }

    if (customer.paymentMethod === 'dinheiro' && customer.needsChange) {
      if (!customer.changeFor?.trim()) {
        errs.changeFor = 'Informe para quanto precisa de troco (ex: R$ 50,00).';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFinalizeWhatsApp = () => {
    if (!validate()) {
      const firstErrorEl = document.querySelector('[data-error="true"]');
      if (firstErrorEl) {
        firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    const cleanedNumber = cleanPhoneNumber(config.whatsappNumber);
    if (!cleanedNumber) {
      alert(
        'Atenção: O número de WhatsApp da loja ainda não foi cadastrado no Painel Admin! Acesse o Admin com a senha padrão (admin) para cadastrar o WhatsApp do seu restaurante.'
      );
      setIsAdminOpen(true);
      return;
    }

    const message = generateOrderMessage({
      customer,
      cart,
      total: cartTotal,
      config,
    });

    const { url } = buildWhatsAppUrl(config.whatsappNumber, message);

    // Open WhatsApp in new window/app
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const currentGeneratedMessage = generateOrderMessage({
    customer: {
      ...customer,
      name: customer.name || '[Seu Nome]',
      address: {
        street: customer.address.street || '[Sua Rua]',
        number: customer.address.number || '[Nº]',
        neighborhood: customer.address.neighborhood || '[Seu Bairro]',
        reference: customer.address.reference,
      },
    },
    cart,
    total: cartTotal,
    config,
  });

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(currentGeneratedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isStoreNumberSet = !!cleanPhoneNumber(config.whatsappNumber);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4">
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden my-4 sm:my-6">
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="font-display font-extrabold text-base sm:text-xl text-white">
              Dados para Finalizar Pedido
            </h2>
            <p className="text-[11px] sm:text-xs text-zinc-400">
              Preencha rapidinho para enviarmos direto ao WhatsApp da loja
            </p>
          </div>
          <button
            onClick={() => setIsCheckoutOpen(false)}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice if Store WhatsApp number is not configured yet */}
        {!isStoreNumberSet && (
          <div className="mx-4 sm:mx-6 mt-4 p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-amber-300">Aviso do Dono da Loja:</strong>{' '}
                Cadastre o número do WhatsApp da MGW X-Salada no Painel Administrativo para redirecionar o pedido para o seu número real.
              </div>
            </div>
            <button
              onClick={() => {
                setIsAdminOpen(true);
              }}
              className="px-2.5 py-1 rounded-lg bg-amber-500 text-black font-bold text-[11px] hover:bg-amber-400 transition-colors shrink-0"
            >
              Configurar
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 max-h-[75vh] overflow-y-auto">
          {/* 1. Nome do Cliente */}
          <div className="space-y-1.5" data-error={!!errors.name}>
            <label className="block text-xs font-bold text-zinc-200 uppercase tracking-wide">
              Seu Nome Completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={customer.name}
              onChange={(e) => {
                setCustomer({ ...customer, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              placeholder="Ex: Warney Fernandes"
              className={`w-full px-4 py-3 rounded-2xl bg-zinc-900 border text-base sm:text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors min-h-[46px] ${
                errors.name ? 'border-red-500 ring-1 ring-red-500' : 'border-zinc-800 focus:border-amber-500'
              }`}
            />
            {errors.name && (
              <p className="text-xs text-red-400 font-medium">{errors.name}</p>
            )}
          </div>

          {/* 2. Tipo de Atendimento: Entrega ou Retirada */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-zinc-200 uppercase tracking-wide">
              Como deseja receber seu pedido? <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => setCustomer({ ...customer, orderType: 'entrega' })}
                className={`p-3 sm:p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[50px] ${
                  customer.orderType === 'entrega'
                    ? 'bg-amber-500/15 border-amber-500 text-white font-bold ring-1 ring-amber-500 shadow-md'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
                }`}
              >
                <Truck className={`w-5 h-5 ${customer.orderType === 'entrega' ? 'text-amber-400' : 'text-zinc-400'}`} />
                <span className="text-xs sm:text-sm font-semibold">Entrega (Delivery)</span>
              </button>

              <button
                type="button"
                onClick={() => setCustomer({ ...customer, orderType: 'retirada' })}
                className={`p-3 sm:p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[50px] ${
                  customer.orderType === 'retirada'
                    ? 'bg-amber-500/15 border-amber-500 text-white font-bold ring-1 ring-amber-500 shadow-md'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
                }`}
              >
                <Store className={`w-5 h-5 ${customer.orderType === 'retirada' ? 'text-amber-400' : 'text-zinc-400'}`} />
                <span className="text-xs sm:text-sm font-semibold">Retirada no Local</span>
              </button>
            </div>
          </div>

          {/* Se ENTREGA: Endereço completo, número, bairro, referência */}
          {customer.orderType === 'entrega' ? (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-3.5 sm:space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wide">
                <Truck className="w-4 h-4" />
                <span>Endereço de Entrega</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Rua / Avenida */}
                <div className="sm:col-span-2 space-y-1" data-error={!!errors.street}>
                  <label className="text-xs text-zinc-300 font-medium">
                    Rua / Avenida <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customer.address.street}
                    onChange={(e) => {
                      setCustomer({
                        ...customer,
                        address: { ...customer.address, street: e.target.value },
                      });
                      if (errors.street) setErrors({ ...errors, street: '' });
                    }}
                    placeholder="Ex: Av. Sete de Setembro"
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border text-base sm:text-xs text-white placeholder-zinc-600 focus:outline-none min-h-[44px] ${
                      errors.street ? 'border-red-500' : 'border-zinc-800 focus:border-amber-500'
                    }`}
                  />
                  {errors.street && <p className="text-[11px] text-red-400">{errors.street}</p>}
                </div>

                {/* Número */}
                <div className="space-y-1" data-error={!!errors.number}>
                  <label className="text-xs text-zinc-300 font-medium">
                    Número <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customer.address.number}
                    onChange={(e) => {
                      setCustomer({
                        ...customer,
                        address: { ...customer.address, number: e.target.value },
                      });
                      if (errors.number) setErrors({ ...errors, number: '' });
                    }}
                    placeholder="Ex: 1420"
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border text-base sm:text-xs text-white placeholder-zinc-600 focus:outline-none min-h-[44px] ${
                      errors.number ? 'border-red-500' : 'border-zinc-800 focus:border-amber-500'
                    }`}
                  />
                  {errors.number && <p className="text-[11px] text-red-400">{errors.number}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Bairro */}
                <div className="space-y-1" data-error={!!errors.neighborhood}>
                  <label className="text-xs text-zinc-300 font-medium">
                    Bairro <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customer.address.neighborhood}
                    onChange={(e) => {
                      setCustomer({
                        ...customer,
                        address: { ...customer.address, neighborhood: e.target.value },
                      });
                      if (errors.neighborhood) setErrors({ ...errors, neighborhood: '' });
                    }}
                    placeholder="Ex: Centro"
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border text-base sm:text-xs text-white placeholder-zinc-600 focus:outline-none min-h-[44px] ${
                      errors.neighborhood ? 'border-red-500' : 'border-zinc-800 focus:border-amber-500'
                    }`}
                  />
                  {errors.neighborhood && (
                    <p className="text-[11px] text-red-400">{errors.neighborhood}</p>
                  )}
                </div>

                {/* Ponto de Referência (Opcional) */}
                <div className="space-y-1">
                  <label className="text-xs text-zinc-300 font-medium">
                    Ponto de Referência <span className="text-zinc-500">(Opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={customer.address.reference || ''}
                    onChange={(e) =>
                      setCustomer({
                        ...customer,
                        address: { ...customer.address, reference: e.target.value },
                      })
                    }
                    placeholder="Ex: Próximo à praça / portão azul"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-amber-500 text-base sm:text-xs text-white placeholder-zinc-600 focus:outline-none min-h-[44px]"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Se RETIRADA */
            <div className="p-4 rounded-2xl bg-zinc-900/90 border border-amber-500/30 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wide">
                <Store className="w-4 h-4" />
                <span>Retirada no Balcão</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Você buscará o pedido pessoalmente em nosso estabelecimento assim que estiver pronto.
              </p>
              <div className="p-3 rounded-xl bg-black/60 border border-zinc-800 text-xs text-zinc-200 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Endereço da Loja:</strong>{' '}
                  {config.address || 'Balcão de Atendimento MGW X-Salada'}
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    Horário: {config.openingHours}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. Forma de Pagamento */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-zinc-200 uppercase tracking-wide">
              Forma de Pagamento <span className="text-red-500">*</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Pix */}
              <button
                type="button"
                onClick={() => setCustomer({ ...customer, paymentMethod: 'pix', needsChange: false })}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all min-h-[50px] cursor-pointer ${
                  customer.paymentMethod === 'pix'
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 font-bold ring-1 ring-emerald-500'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <QrCode className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-medium">Pix</span>
              </button>

              {/* Dinheiro */}
              <button
                type="button"
                onClick={() => setCustomer({ ...customer, paymentMethod: 'dinheiro' })}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all min-h-[50px] cursor-pointer ${
                  customer.paymentMethod === 'dinheiro'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold ring-1 ring-amber-500'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <Banknote className="w-5 h-5 text-amber-400" />
                <span className="text-xs font-medium">Dinheiro</span>
              </button>

              {/* Débito */}
              <button
                type="button"
                onClick={() => setCustomer({ ...customer, paymentMethod: 'debito', needsChange: false })}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all min-h-[50px] cursor-pointer ${
                  customer.paymentMethod === 'debito'
                    ? 'bg-blue-500/15 border-blue-500 text-blue-300 font-bold ring-1 ring-blue-500'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <CreditCard className="w-5 h-5 text-blue-400" />
                <span className="text-xs font-medium">Débito</span>
              </button>

              {/* Crédito */}
              <button
                type="button"
                onClick={() => setCustomer({ ...customer, paymentMethod: 'credito', needsChange: false })}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all min-h-[50px] cursor-pointer ${
                  customer.paymentMethod === 'credito'
                    ? 'bg-purple-500/15 border-purple-500 text-purple-300 font-bold ring-1 ring-purple-500'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <CreditCard className="w-5 h-5 text-purple-400" />
                <span className="text-xs font-medium">Crédito</span>
              </button>
            </div>

            {/* Se DINHEIRO */}
            {customer.paymentMethod === 'dinheiro' && (
              <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-200 font-medium">Precisa de troco?</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCustomer({ ...customer, needsChange: false, changeFor: '' })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all min-h-[38px] ${
                        !customer.needsChange
                          ? 'bg-zinc-800 text-white border border-zinc-700'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      Não
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomer({ ...customer, needsChange: true })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all min-h-[38px] ${
                        customer.needsChange
                          ? 'bg-amber-500 text-black font-bold'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      Sim
                    </button>
                  </div>
                </div>

                {customer.needsChange && (
                  <div className="pt-2 border-t border-zinc-800/80 space-y-1" data-error={!!errors.changeFor}>
                    <label className="text-xs text-zinc-300 font-medium">
                      Troco para quanto? <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={customer.changeFor || ''}
                      onChange={(e) => {
                        setCustomer({ ...customer, changeFor: e.target.value });
                        if (errors.changeFor) setErrors({ ...errors, changeFor: '' });
                      }}
                      placeholder="Ex: R$ 50,00 ou R$ 100,00"
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border text-base sm:text-xs text-white placeholder-zinc-600 focus:outline-none min-h-[44px] ${
                        errors.changeFor ? 'border-red-500' : 'border-zinc-800 focus:border-amber-500'
                      }`}
                    />
                    {errors.changeFor && (
                      <p className="text-[11px] text-red-400">{errors.changeFor}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Resumo Rápido dos Itens */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-semibold text-zinc-300">Resumo dos Itens ({cart.length})</span>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="text-amber-400 hover:text-amber-300 text-[11px] underline p-1"
              >
                {showPreview ? 'Ocultar prévia' : 'Ver mensagem formatada'}
              </button>
            </div>

            <div className="space-y-1 text-xs">
              {cart.map((item) => (
                <div key={item.cartId} className="flex justify-between text-zinc-300 gap-2">
                  <span className="truncate">
                    {item.quantity}x {item.product.name}
                  </span>
                  <span className="font-mono text-zinc-200 shrink-0">
                    {formatCurrency(item.product.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-sm sm:text-base font-bold text-white">
              <span>Total a Pagar</span>
              <span className="font-mono text-amber-400 text-lg sm:text-xl">
                {formatCurrency(cartTotal)}
              </span>
            </div>

            {/* Live Message Preview accordion */}
            {showPreview && (
              <div className="mt-3 p-3 rounded-xl bg-black border border-zinc-800 text-[11px] font-mono text-zinc-300 space-y-2 whitespace-pre-wrap overflow-x-auto">
                <div className="flex items-center justify-between pb-1 border-b border-zinc-800 text-zinc-400 font-sans">
                  <span>Prévia da mensagem pronta:</span>
                  <button
                    type="button"
                    onClick={handleCopyMessage}
                    className="flex items-center gap-1 text-amber-400 hover:text-amber-300 text-xs p-1"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
                {currentGeneratedMessage}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer: Big Green WhatsApp Button */}
        <div className="p-4 sm:p-6 bg-zinc-900 border-t border-zinc-800 space-y-2.5 sm:space-y-3">
          <button
            type="button"
            onClick={handleFinalizeWhatsApp}
            className="w-full py-3.5 sm:py-4 px-4 sm:px-6 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.98] text-white font-extrabold text-sm sm:text-base tracking-wide shadow-xl shadow-emerald-950/60 transition-all flex items-center justify-center gap-2.5 sm:gap-3 cursor-pointer group glow-whatsapp min-h-[50px] sm:min-h-[54px]"
          >
            <Send className="w-5 h-5 fill-white group-hover:translate-x-0.5 transition-transform shrink-0" />
            <span className="font-display">FINALIZAR PEDIDO PELO WHATSAPP</span>
          </button>

          <p className="text-[11px] text-center text-zinc-400 leading-tight">
            Ao clicar, seu WhatsApp abrirá com o pedido montado automaticamente. O pedido só será processado após você apertar <strong>ENVIAR</strong> no WhatsApp.
          </p>
        </div>
      </div>
    </div>
  );
};
