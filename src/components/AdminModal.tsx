import React, { useState, useEffect, useCallback } from 'react';
import {
  Lock,
  LayoutDashboard,
  ShoppingBag,
  Image as ImageIcon,
  Layers,
  Store as StoreIcon,
  Users,
  ExternalLink,
  Building2,
  ChevronRight,
  LogOut,
  AlertCircle,
  Eye,
  ArrowLeft,
  Menu,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useStoreIdentity } from '../context/StoreIdentityContext';
import { supabase, ADMIN_EMAIL, SUPER_ADMIN_EMAIL } from '../lib/supabase';
import { resolveAuthIdentity } from '../lib/authIdentity';
import { storeService } from '../lib/storeService';
import { StoreDashboard } from './admin/StoreDashboard';
import { ProductsManager } from './admin/ProductsManager';
import { PhotosManager } from './admin/PhotosManager';
import { CategoriesManager } from './admin/CategoriesManager';
import { StoreSettingsManager } from './admin/StoreSettingsManager';
import { TeamManager } from './admin/TeamManager';
import { SuperAdminDashboard } from './admin/SuperAdminDashboard';

export type AdminTab = 'dashboard' | 'products' | 'images' | 'categories' | 'store' | 'team';

export const AdminModal: React.FC = () => {
  const { products, config, isAdminOpen, setIsAdminOpen, categories, isLegacyStore } = useStore();
  const { stores, store, storeSlug, navigateToStore } = useStoreIdentity();

  const [emailInput, setEmailInput] = useState(ADMIN_EMAIL);
  const [passwordInput, setPasswordInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [adminMode, setAdminMode] = useState<'platform' | 'store'>('store');
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const canManageSelectedStore = useCallback(async (userId: string) => {
    if (!store?.id) return false;
    const { data, error } = await supabase
      .from('store_memberships')
      .select('id')
      .eq('store_id', store.id)
      .eq('user_id', userId)
      .eq('active', true)
      .maybeSingle();
    return !error && Boolean(data);
  }, [store?.id]);

  // Revalidate access against the persisted membership whenever the panel opens.
  useEffect(() => {
    if (!isAdminOpen) return;
    let cancelled = false;
    const verifySession = async () => {
      const { data } = await supabase.auth.getSession();
      const identity = resolveAuthIdentity(data.session?.user);
      if (!identity) {
        if (!cancelled) {
          setIsAuthenticated(false);
          setIsSuperAdmin(false);
        }
        return;
      }
      const superAdmin = storeService.isSuperAdminUser(identity.email, identity.userId);
      const allowed = superAdmin || await canManageSelectedStore(identity.userId);
      if (!cancelled) {
        setIsAuthenticated(allowed);
        setIsSuperAdmin(superAdmin && allowed);
      }
    };
    void verifySession();
    return () => { cancelled = true; };
  }, [isAdminOpen, canManageSelectedStore]);

  const handleExitAdmin = useCallback(() => {
    setIsAdminOpen(false);
    setPasswordInput('');
    setAuthError('');
    setIsMobileMenuOpen(false);
    if (typeof window !== 'undefined' && window.location.hash === '#admin') {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, [setIsAdminOpen]);

  if (!isAdminOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const cleanEmail = emailInput.trim().toLowerCase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: passwordInput,
    });

    if (error) {
      setAuthError('Não foi possível entrar. Confira o e-mail e a senha informados.');
      return;
    }

    const identity = resolveAuthIdentity(data.user);
    if (!identity) {
      setAuthError('Não foi possível validar a identidade da sessão.');
      return;
    }
    const superAdmin = storeService.isSuperAdminUser(identity.email, identity.userId);
    const allowed = superAdmin || await canManageSelectedStore(identity.userId);
    if (!allowed) {
      setAuthError('Sua conta não possui acesso administrativo a este estabelecimento.');
      return;
    }

    setIsAuthenticated(true);
    setIsSuperAdmin(superAdmin);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setIsSuperAdmin(false);
    setPasswordInput('');
  };

  const publicMenuUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${storeSlug === 'mgw-x-salada' ? '/' : `/s/${storeSlug}`}`
    : (storeSlug === 'mgw-x-salada' ? '/' : `/s/${storeSlug}`);

  const navItems: Array<{ id: AdminTab; label: string; icon: React.FC<{ className?: string }>; badge?: number | string }> = [
    {
      id: 'dashboard',
      label: 'Visão Geral',
      icon: LayoutDashboard,
    },
    {
      id: 'products',
      label: 'Produtos & Preços',
      icon: ShoppingBag,
      badge: products.length,
    },
    {
      id: 'images',
      label: 'Fotos do Cardápio',
      icon: ImageIcon,
      badge: products.filter((p) => p.imageUrl && !p.imageUrl.includes('file_000000007d38820e')).length || undefined,
    },
    {
      id: 'categories',
      label: 'Categorias & Seções',
      icon: Layers,
      badge: categories.length,
    },
    {
      id: 'store',
      label: 'Dados da Loja & WhatsApp',
      icon: StoreIcon,
    },
    {
      id: 'team',
      label: 'Equipe & Acessos',
      icon: Users,
    },
  ];

  /* -------------------------------------------------------------
   * 1. UNINITIALIZED / UNAUTHENTICATED FULL-SCREEN LOGIN VIEW
   * ------------------------------------------------------------- */
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-[#09090b] text-zinc-100 flex flex-col justify-between antialiased selection:bg-amber-500 selection:text-black">
        {/* Top Header */}
        <header className="w-full border-b border-zinc-800/80 bg-zinc-950 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-sm sm:text-base text-white leading-tight">
                  {config.storeName || store?.name || 'MGW X-SALADA'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-semibold text-[10px]">
                  PAINEL SAAS
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">Ambiente Administrativo Seguro</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExitAdmin}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer min-h-[40px]"
            title="Voltar ao Cardápio Público"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span>Voltar ao Cardápio</span>
          </button>
        </header>

        {/* Login Container (Centered Full Page) */}
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 mx-auto flex items-center justify-center text-amber-400 shadow-md">
                <Lock className="w-7 h-7" />
              </div>
              <h1 className="font-display font-black text-xl sm:text-2xl text-white">
                Painel Administrativo
              </h1>
              <p className="text-xs text-zinc-400">
                Acesse para gerenciar cardápio, produtos, WhatsApp e horários de atendimento.
              </p>
              <p className="text-[11px] text-zinc-500 font-mono mt-1">{SUPER_ADMIN_EMAIL}</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4 text-left">
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                    E-mail do Administrador
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="email@exemplo.com"
                    autoComplete="username"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500 placeholder-zinc-600 min-h-[44px]"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                    Senha de Acesso
                  </label>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Sua senha"
                    autoComplete="current-password"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500 placeholder-zinc-600 min-h-[44px]"
                  />
                </div>

                {authError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{authError}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-amber-950/40 min-h-[46px]"
              >
                Entrar no Painel
              </button>
            </form>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleExitAdmin}
                className="text-xs text-zinc-400 hover:text-white transition-colors"
              >
                ← Voltar para o Cardápio Público
              </button>
            </div>
          </div>
        </main>

        <footer className="w-full border-t border-zinc-900 py-3.5 text-center text-xs text-zinc-500">
          MGW Digital Menu • Plataforma SaaS de Cardápios Digitais
        </footer>
      </div>
    );
  }

  /* -------------------------------------------------------------
   * 2. AUTHENTICATED FULL-SCREEN SAAS WORKSPACE
   * ------------------------------------------------------------- */
  return (
    <div className="min-h-screen w-full bg-[#09090b] text-zinc-100 flex flex-col antialiased selection:bg-amber-500 selection:text-black">
      {/* 2.1 Top Main Header Bar (spans full viewport width) */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-800/90 bg-zinc-950/95 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
            <Lock className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-black text-sm sm:text-base text-white leading-tight">
                {config.storeName || store?.name || 'MGW X-SALADA'}
              </h1>
              {isSuperAdmin && (
                <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black text-[10px] tracking-wide shadow-sm">
                  SUPER ADMIN
                </span>
              )}
              {!isSuperAdmin && (
                <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-semibold text-[10px]">
                  GESTÃO
                </span>
              )}
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  config.isOpen
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-red-500/15 text-red-400 border-red-500/30'
                }`}
              >
                {config.isOpen ? 'ABERTO' : 'FECHADO'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block">
              {isSuperAdmin && adminMode === 'platform'
                ? 'Gestão Global de Estabelecimentos SaaS'
                : 'Painel Administrativo do Estabelecimento'}
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Direct Public Menu Link (opens in new tab) */}
          <a
            href={publicMenuUrl}
            target="_blank"
            rel="noreferrer"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-200 transition-colors"
            title="Abrir cardápio em nova aba"
          >
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span>Ver Cardápio Público</span>
            <ExternalLink className="w-3 h-3 text-zinc-500" />
          </a>

          {/* Return to Cardápio Button */}
          <button
            type="button"
            onClick={handleExitAdmin}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-xs tracking-wide transition-all shadow-md shadow-amber-950/30 cursor-pointer min-h-[40px]"
            title="Voltar ao Cardápio"
          >
            <ArrowLeft className="w-4 h-4 text-black" />
            <span className="hidden sm:inline">Voltar ao Cardápio</span>
            <span className="sm:hidden">Cardápio</span>
          </button>

          {/* Mobile hamburger menu toggle */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
            aria-label="Abrir menu de navegação"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* 2.2 Super Admin Platform Switcher Bar (if super admin) */}
      {isSuperAdmin && (
        <div className="w-full bg-zinc-900/90 border-b border-zinc-800 px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 p-1 bg-black/60 rounded-xl border border-zinc-800">
            <button
              type="button"
              onClick={() => {
                setAdminMode('store');
                setIsMobileMenuOpen(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                adminMode === 'store'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <StoreIcon className="w-3.5 h-3.5" />
              <span>Operação do Cardápio</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAdminMode('platform');
                setIsMobileMenuOpen(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                adminMode === 'platform'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Plataforma SaaS Multi-Lojas</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-zinc-400">
            <span className="hidden sm:inline">
              Super Admin: <strong className="text-zinc-200 font-mono">{SUPER_ADMIN_EMAIL}</strong>
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer text-xs font-semibold"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Desconectar</span>
            </button>
          </div>
        </div>
      )}

      {/* 2.3 Main Platform View OR Store Management View */}
      {isSuperAdmin && adminMode === 'platform' ? (
        <main className="flex-1 w-full p-4 sm:p-6 lg:p-8 xl:p-10 overflow-y-auto">
          <SuperAdminDashboard
            onSelectStoreToManage={(targetStore) => {
              navigateToStore(targetStore.slug);
              setAdminMode('store');
              setActiveTab('dashboard');
            }}
          />
        </main>
      ) : (
        /* Store Management Workspace */
        <div className="flex-1 flex flex-col md:flex-row w-full overflow-hidden">
          {/* Desktop Left Sidebar */}
          <aside className="hidden md:flex w-64 lg:w-72 bg-zinc-950 border-r border-zinc-800/80 flex-col justify-between shrink-0 p-4 lg:p-5 sticky top-[61px] h-[calc(100vh-61px)] overflow-y-auto">
            <div className="space-y-4">
              {/* Store Identity Box */}
              <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                    Estabelecimento Ativo
                  </span>
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      config.isOpen ? 'bg-emerald-400' : 'bg-red-400'
                    }`}
                    title={config.isOpen ? 'Loja Aberta' : 'Loja Fechada'}
                  />
                </div>

                {stores.length > 1 ? (
                  <select
                    value={storeSlug ?? 'mgw-x-salada'}
                    onChange={(e) => navigateToStore(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-white font-bold text-xs px-2.5 py-1.5 rounded-xl focus:border-amber-500 focus:outline-none"
                  >
                    {stores.map((s) => (
                      <option key={s.id} value={s.slug}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="font-display font-black text-sm text-white truncate">
                    {config.storeName || store?.name || 'MGW X-SALADA'}
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-0.5">
                  <span className="truncate">
                    {config.isOpen ? 'Aberto para pedidos' : 'Fechado no momento'}
                  </span>
                  {isLegacyStore && (
                    <span className="text-[9px] uppercase font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded">
                      Oficial
                    </span>
                  )}
                </div>
              </div>

              {/* Navigation Items */}
              <nav className="space-y-1" aria-label="Navegação do painel">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(item.id);
                        if (item.id !== 'products') {
                          setIsCreatingProduct(false);
                        }
                      }}
                      className={`w-full px-3.5 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer min-h-[44px] ${
                        isActive
                          ? 'bg-amber-500 text-black shadow-md shadow-amber-950/20'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-900/70'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-zinc-400'}`} />
                        <span>{item.label}</span>
                      </div>

                      {item.badge !== undefined && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                            isActive
                              ? 'bg-black/20 text-black'
                              : 'bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Sidebar Footer */}
            <div className="pt-4 border-t border-zinc-800/80 space-y-2">
              <a
                href={publicMenuUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-bold flex items-center justify-between transition-colors min-h-[40px]"
              >
                <div className="flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ver Cardápio Público</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
              </a>

              <button
                type="button"
                onClick={handleExitAdmin}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer min-h-[40px]"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
                <span>Voltar ao Cardápio</span>
              </button>

              {!isSuperAdmin && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full px-3 py-2 rounded-xl text-zinc-400 hover:text-red-400 text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sair da conta</span>
                </button>
              )}
            </div>
          </aside>

          {/* Mobile Top Horizontal Tab Bar (sticky below header) */}
          <div className="md:hidden sticky top-[61px] z-30 w-full bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800 px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    if (item.id !== 'products') {
                      setIsCreatingProduct(false);
                    }
                    setIsMobileMenuOpen(false);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 min-h-[40px] cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-black shadow-md'
                      : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isActive ? 'bg-black/20 text-black' : 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Mobile Drawer (if opened via hamburger) */}
          {isMobileMenuOpen && (
            <div className="md:hidden fixed inset-0 z-50 bg-black/90 p-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-sm text-white">Menu Administrativo</span>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-xl text-zinc-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="space-y-1.5">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(item.id);
                          if (item.id !== 'products') {
                            setIsCreatingProduct(false);
                          }
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-between ${
                          isActive
                            ? 'bg-amber-500 text-black'
                            : 'text-zinc-300 hover:bg-zinc-900'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </div>
                        {item.badge !== undefined && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-black/20">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="space-y-2 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={handleExitAdmin}
                  className="w-full py-3 px-4 rounded-xl bg-amber-500 text-black font-bold text-xs uppercase flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar ao Cardápio</span>
                </button>
              </div>
            </div>
          )}

          {/* Main Content Workspace (Full Width, Natural Scroll) */}
          <main className="flex-1 w-full min-w-0 p-4 sm:p-6 lg:p-8 xl:p-10 overflow-y-auto bg-[#09090b] space-y-6">
            {/* Breadcrumb Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800/80">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span>{config.storeName || store?.name || 'MGW X-SALADA'}</span>
                <ChevronRight className="w-3 h-3 text-zinc-600" />
                <span className="text-white font-bold">
                  {navItems.find((n) => n.id === activeTab)?.label}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span>WhatsApp:</span>
                <strong className="text-zinc-200 font-mono">
                  {config.whatsappNumber || 'Não configurado'}
                </strong>
              </div>
            </div>

            {/* Subcomponents Rendering */}
            {activeTab === 'dashboard' && (
              <StoreDashboard
                onNavigateTab={(tab) => {
                  if (tab === 'whatsapp') {
                    setActiveTab('store');
                  } else {
                    setActiveTab(tab);
                  }
                }}
                onOpenNewProduct={() => {
                  setActiveTab('products');
                  setIsCreatingProduct(true);
                }}
              />
            )}

            {activeTab === 'products' && (
              <ProductsManager
                isCreatingOpenInitial={isCreatingProduct}
                onCloseCreateForm={() => setIsCreatingProduct(false)}
              />
            )}

            {activeTab === 'images' && <PhotosManager />}

            {activeTab === 'categories' && <CategoriesManager />}

            {activeTab === 'store' && <StoreSettingsManager />}

            {activeTab === 'team' && <TeamManager />}
          </main>
        </div>
      )}
    </div>
  );
};
