import React, { useState } from 'react';
import {
  ShoppingBag,
  Layers,
  Phone,
  DollarSign,
  TrendingUp,
  Clock,
  MapPin,
  ExternalLink,
  Copy,
  Check,
  Plus,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Share2,
  Flame,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useStoreIdentity } from '../../context/StoreIdentityContext';
import { formatCurrency, formatPhoneDisplay } from '../../utils/formatters';

interface StoreDashboardProps {
  onNavigateTab: (tab: 'dashboard' | 'products' | 'categories' | 'images' | 'whatsapp' | 'store' | 'team') => void;
  onOpenNewProduct: () => void;
}

export const StoreDashboard: React.FC<StoreDashboardProps> = ({ onNavigateTab, onOpenNewProduct }) => {
  const { products, config, categories, isLegacyStore, updateConfig } = useStore();
  const { store, storeSlug } = useStoreIdentity();
  const [copiedLink, setCopiedLink] = useState(false);

  const activeProducts = products.filter((p) => p.active);
  const inactiveProducts = products.filter((p) => !p.active);
  const totalProducts = products.length;

  const prices = products.map((p) => p.price).filter((p) => Number.isFinite(p) && p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;

  const storeUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${storeSlug === 'mgw-x-salada' ? '/' : `/s/${storeSlug}`}`
    : '';

  const handleCopyLink = () => {
    if (storeUrl) {
      navigator.clipboard.writeText(storeUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleToggleStoreOpen = () => {
    updateConfig({ isOpen: !config.isOpen });
  };

  // Group products by category to calculate category distribution
  const categoryCounts = categories.map((cat) => {
    const count = products.filter((p) => p.category === cat.slug).length;
    const percentage = totalProducts > 0 ? Math.round((count / totalProducts) * 100) : 0;
    return {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      count,
      percentage,
    };
  });

  return (
    <div className="space-y-6">
      {/* Store Banner & Status Overview */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 p-5 sm:p-6 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-40 bg-amber-500/10 blur-[80px] pointer-events-none rounded-full" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-display font-black text-xl sm:text-2xl text-white tracking-tight">
                {config.storeName || store?.name || 'MGW X-SALADA'}
              </span>
              {isLegacyStore && (
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  OFICIAL MGW
                </span>
              )}
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                  config.isOpen
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-red-500/15 text-red-400 border-red-500/30'
                }`}
              >
                {config.isOpen ? 'ABERTO PARA PEDIDOS' : 'FECHADO NO MOMENTO'}
              </span>
            </div>

            <p className="text-xs text-zinc-400 max-w-xl">
              "{config.slogan || 'Sempre uma boa escolha!'}" • Cardápio digital online com finalização direta pelo WhatsApp.
            </p>

            {/* Quick Link bar */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 border border-zinc-800 text-xs font-mono text-zinc-300">
                <span className="text-zinc-500">Link:</span>
                <span className="text-amber-300 truncate max-w-[240px] sm:max-w-xs">{storeUrl}</span>
              </div>

              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer min-h-[36px]"
                title="Copiar link do cardápio"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Copiar Link</span>
                  </>
                )}
              </button>

              <a
                href={storeUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors min-h-[36px]"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Abrir Cardápio</span>
              </a>
            </div>
          </div>

          {/* Quick Open/Close Action Toggle */}
          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleToggleStoreOpen}
              className={`w-full sm:w-auto px-5 py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer min-h-[44px] ${
                config.isOpen
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black shadow-emerald-950/40'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-red-400 border border-red-500/40 shadow-red-950/30'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${config.isOpen ? 'bg-black animate-pulse' : 'bg-red-500'}`} />
              <span>{config.isOpen ? 'Loja Aberta (Clique p/ Fechar)' : 'Loja Fechada (Clique p/ Abrir)'}</span>
            </button>
            <span className="text-[11px] text-zinc-400">
              Horário:{' '}
              <strong className="text-zinc-200">{config.openingHours || 'Não configurado'}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Operational Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Produtos */}
        <div
          onClick={() => onNavigateTab('products')}
          className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Produtos Cadastrados</span>
            <ShoppingBag className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white tabular-nums">{totalProducts}</span>
            <span className="text-xs text-zinc-400">
              ({activeProducts.length} ativos)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-amber-400 font-medium flex items-center gap-1">
            <span>Gerenciar itens</span>
            <span aria-hidden="true">→</span>
          </div>
        </div>

        {/* Card 2: Categorias */}
        <div
          onClick={() => onNavigateTab('categories')}
          className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Categorias</span>
            <Layers className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white tabular-nums">{categories.length}</span>
            <span className="text-xs text-zinc-400">seções no menu</span>
          </div>
          <div className="mt-2 text-[11px] text-blue-400 font-medium flex items-center gap-1">
            <span>Organizar seções</span>
            <span aria-hidden="true">→</span>
          </div>
        </div>

        {/* Card 3: Ticket Médio dos Produtos */}
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Preço Médio do Cardápio</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tabular-nums">
              {formatCurrency(avgPrice)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-zinc-400">
            Varia de <span className="font-mono text-zinc-200">{formatCurrency(minPrice)}</span> a{' '}
            <span className="font-mono text-zinc-200">{formatCurrency(maxPrice)}</span>
          </div>
        </div>

        {/* Card 4: WhatsApp de Pedidos */}
        <div
          onClick={() => onNavigateTab('whatsapp')}
          className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">WhatsApp Ativo</span>
            <Phone className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2">
            <span className="text-base sm:text-lg font-bold text-white font-mono">
              {config.whatsappNumber ? formatPhoneDisplay(config.whatsappNumber) : 'Não configurado'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-400 font-medium flex items-center gap-1">
            <span>{config.whatsappNumber ? 'Pronto para pedidos' : 'Configurar agora'}</span>
            <span aria-hidden="true">→</span>
          </div>
        </div>
      </div>

      {/* Two-Column Detail View: Category Distribution & WhatsApp Order Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Left: Category Distribution */}
        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-sm text-white">Distribuição por Categoria</h3>
            </div>
            <button
              onClick={() => onNavigateTab('categories')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
            >
              Editar seções
            </button>
          </div>

          <div className="space-y-3">
            {categoryCounts.map((cat) => (
              <div key={cat.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-200">{cat.name}</span>
                  <span className="text-zinc-400 font-mono">
                    {cat.count} {cat.count === 1 ? 'item' : 'itens'} ({cat.percentage}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-950 overflow-hidden border border-zinc-800/60">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(cat.percentage, 4)}%` }}
                  />
                </div>
              </div>
            ))}

            {categoryCounts.length === 0 && (
              <p className="text-xs text-zinc-500 py-4 text-center">Nenhuma categoria registrada.</p>
            )}
          </div>

          <div className="pt-2 flex items-center justify-between text-xs border-t border-zinc-800/80">
            <span className="text-zinc-400">Total no catálogo:</span>
            <strong className="text-white font-mono">{totalProducts} produtos cadastrados</strong>
          </div>
        </div>

        {/* Right: Quick Action Shortcuts & WhatsApp Preview */}
        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm text-white">Ações Rápidas de Gestão</h3>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={onOpenNewProduct}
                className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-amber-500/50 text-left transition-all group flex flex-col justify-between min-h-[72px]"
              >
                <Plus className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <div>
                  <span className="block text-xs font-bold text-white leading-tight">Novo Produto</span>
                  <span className="text-[10px] text-zinc-400">Adicionar ao cardápio</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('images')}
                className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-amber-500/50 text-left transition-all group flex flex-col justify-between min-h-[72px]"
              >
                <ImageIcon className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                <div>
                  <span className="block text-xs font-bold text-white leading-tight">Fotos do Cardápio</span>
                  <span className="text-[10px] text-zinc-400">Upload de imagens</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('whatsapp')}
                className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-amber-500/50 text-left transition-all group flex flex-col justify-between min-h-[72px]"
              >
                <Phone className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                <div>
                  <span className="block text-xs font-bold text-white leading-tight">WhatsApp da Loja</span>
                  <span className="text-[10px] text-zinc-400">Número de atendimento</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('store')}
                className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-amber-500/50 text-left transition-all group flex flex-col justify-between min-h-[72px]"
              >
                <Clock className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                <div>
                  <span className="block text-xs font-bold text-white leading-tight">Horários & Local</span>
                  <span className="text-[10px] text-zinc-400">Endereço e entrega</span>
                </div>
              </button>
            </div>
          </div>

          {/* WhatsApp formatted message preview sample */}
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 text-xs space-y-1.5">
            <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Exemplo da Mensagem Recebida no WhatsApp
            </span>
            <p className="font-mono text-[11px] text-zinc-300 leading-relaxed bg-black/60 p-2.5 rounded-lg border border-zinc-800/50 select-all">
              🍔 *NOVO PEDIDO - {config.storeName || 'MGW X-SALADA'}*<br />
              👤 *Cliente:* João Silva<br />
              📦 *Itens:* 1x X-Salada Tradicional (R$ 12,00)<br />
              💰 *Total:* R$ 12,00<br />
              🛵 *Entrega:* Balcão / Retirada
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
