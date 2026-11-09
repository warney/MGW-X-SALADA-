import React, { useState } from 'react';
import {
  Building2,
  Plus,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Archive,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Settings,
  Users,
  Store as StoreIcon,
  ShoppingBag,
} from 'lucide-react';
import type { Store, StoreStatus } from '../../types/saas';
import { storeService } from '../../lib/storeService';
import { useStoreIdentity } from '../../context/StoreIdentityContext';

interface SuperAdminDashboardProps {
  onSelectStoreToManage: (store: Store) => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ onSelectStoreToManage }) => {
  const { stores, refreshStores, navigateToStore } = useStoreIdentity();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | StoreStatus>('all');
  const [isCreatingModalOpen, setIsCreatingModalOpen] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreSlug, setNewStoreSlug] = useState('');
  const [newStoreStatus, setNewStoreStatus] = useState<StoreStatus>('active');
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredStores = stores.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalStores = stores.length;
  const activeStores = stores.filter((s) => s.status === 'active').length;
  const draftStores = stores.filter((s) => s.status === 'draft').length;
  const suspendedStores = stores.filter((s) => s.status === 'suspended').length;

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');
    setIsSubmitting(true);

    try {
      const created = await storeService.createStore(
        {
          name: newStoreName,
          slug: newStoreSlug || undefined,
          status: newStoreStatus,
        },
        '9ea5631d-5045-480b-bd77-8d2ca50c6222'
      );

      setCreateSuccess(`Estabelecimento "${created.name}" cadastrado com sucesso!`);
      setNewStoreName('');
      setNewStoreSlug('');
      setNewStoreStatus('active');
      await refreshStores();
      setTimeout(() => {
        setIsCreatingModalOpen(false);
        setCreateSuccess('');
      }, 1500);
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Falha ao cadastrar estabelecimento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (store: Store) => {
    const nextStatus: StoreStatus = store.status === 'active' ? 'suspended' : 'active';
    try {
      await storeService.updateStoreStatus(store.id, nextStatus);
      await refreshStores();
    } catch (err) {
      console.error('Erro ao atualizar status da loja:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* SaaS Platform Header & KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Total de Lojas</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-white">{totalStores}</span>
            <Building2 className="w-4 h-4 text-amber-400" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-emerald-950/40 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Lojas Ativas</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-emerald-300">{activeStores}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-amber-950/40 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">Em Rascunho</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-amber-300">{draftStores}</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-red-400 uppercase tracking-wider">Suspensas</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-red-300">{suspendedStores}</span>
            <Archive className="w-4 h-4 text-red-400" />
          </div>
        </div>
      </div>

      {/* Action Bar: Search, Filters & New Store Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome ou slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 min-h-[40px]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-amber-500 min-h-[40px]"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Ativas</option>
            <option value="draft">Rascunhos</option>
            <option value="suspended">Suspensas</option>
          </select>
        </div>

        <button
          onClick={() => setIsCreatingModalOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-black font-extrabold text-xs rounded-xl shadow-lg shadow-amber-950/30 flex items-center justify-center gap-2 min-h-[40px] cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Novo Estabelecimento</span>
        </button>
      </div>

      {/* Stores List */}
      <div className="space-y-3">
        {filteredStores.map((store) => {
          const isMgw = store.slug === 'mgw-x-salada';
          const statusBadgeColor =
            store.status === 'active'
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              : store.status === 'draft'
              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
              : 'bg-red-500/15 text-red-400 border-red-500/30';

          const statusText =
            store.status === 'active' ? 'Ativa' : store.status === 'draft' ? 'Rascunho' : 'Suspensa';

          return (
            <div
              key={store.id}
              className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-white text-sm sm:text-base">{store.name}</span>
                  {isMgw && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-500/30">
                      OFICIAL MGW
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadgeColor}`}>
                    {statusText}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                  <span className="font-mono text-zinc-500">/s/{store.slug}</span>
                  <span>•</span>
                  <span>Criada em: {new Date(store.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    navigateToStore(store.slug);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors min-h-[36px]"
                  title="Visualizar cardápio público"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Ver Cardápio</span>
                </button>

                <button
                  onClick={() => onSelectStoreToManage(store)}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors min-h-[36px]"
                  title="Gerenciar produtos, fotos e WhatsApp da loja"
                >
                  <Settings className="w-3.5 h-3.5 text-amber-400" />
                  <span>Gerenciar Loja</span>
                </button>

                {!isMgw && (
                  <button
                    onClick={() => handleToggleStatus(store)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors min-h-[36px] ${
                      store.status === 'active'
                        ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30'
                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {store.status === 'active' ? 'Suspender' : 'Ativar'}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filteredStores.length === 0 && (
          <div className="py-12 text-center text-zinc-500 text-xs space-y-2">
            <Building2 className="w-8 h-8 mx-auto text-zinc-600 opacity-60" />
            <p>Nenhum estabelecimento encontrado com os filtros selecionados.</p>
          </div>
        )}
      </div>

      {/* Modal de Criação de Estabelecimento */}
      {isCreatingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <StoreIcon className="w-4 h-4 text-amber-400" />
                Cadastrar Novo Estabelecimento
              </h3>
              <button
                onClick={() => setIsCreatingModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStore} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Nome do Estabelecimento *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Pizzaria Forno Nobre"
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 min-h-[40px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Identificador de URL (Slug)
                </label>
                <input
                  type="text"
                  placeholder="Ex: pizzaria-forno-nobre (opcional)"
                  value={newStoreSlug}
                  onChange={(e) => setNewStoreSlug(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 min-h-[40px]"
                />
                <p className="text-[10px] text-zinc-500 mt-1">
                  Deixe vazio para gerar automaticamente a partir do nome.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Status Inicial
                </label>
                <select
                  value={newStoreStatus}
                  onChange={(e) => setNewStoreStatus(e.target.value as StoreStatus)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 min-h-[40px]"
                >
                  <option value="active">Ativa (Visível imediatamente)</option>
                  <option value="draft">Rascunho (Em preparação)</option>
                </select>
              </div>

              {createError && (
                <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{createError}</span>
                </div>
              )}

              {createSuccess && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{createSuccess}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingModalOpen(false)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs min-h-[40px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs min-h-[40px] disabled:opacity-50"
                >
                  {isSubmitting ? 'Cadastrando...' : 'Criar Estabelecimento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
