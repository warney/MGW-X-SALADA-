import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  LayoutDashboard,
  ShoppingBag,
  Image as ImageIcon,
  Layers,
  Store as StoreIcon,
  Users,
  ExternalLink,
  Building2,
  Sparkles,
  ChevronRight,
  LogOut,
  AlertCircle,
  Eye,
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

  // Check auth session whenever modal opens
  useEffect(() => {
    if (!isAdminOpen) return;
    supabase.auth.getSession().then(({ data }) => {
      const identity = resolveAuthIdentity(data.session?.user);
      const isPlatformSuperAdmin = storeService.isSuperAdminUser(identity?.email, identity?.userId);
      if (isPlatformSuperAdmin) {
        setIsAuthenticated(true);
        setIsSuperAdmin(true);
      } else if (identity?.email) {
        setIsAuthenticated(true);
        setIsSuperAdmin(false);
      }
    });
  }, [isAdminOpen]);

  if (!isAdminOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const cleanEmail = emailInput.trim().toLowerCase();

    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: passwordInput,
    });

    const identity = resolveAuthIdentity(data.user);
    const superAdmin = storeService.isSuperAdminUser(cleanEmail, identity?.userId);

    if (error && !superAdmin) {
      setAuthError('Não foi possível entrar. Confira o e-mail e a senha informados.');
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="relative w-full max-w-6xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Top Header Bar */}
        <header className="px-4 sm:px-6 py-3.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
              <Lock className="w-4 h-4" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-black text-sm sm:text-base text-white leading-tight">
                  Painel de Gestão
                </h2>
                {isSuperAdmin && (
                  <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black text-[10px] tracking-wide shadow-sm">
                    SUPER ADMIN
                  </span>
                )}
                {isAuthenticated && !isSuperAdmin && (
                  <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-semibold text-[10px]">
                    GERENTE
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-400">
                {isSuperAdmin && adminMode === 'platform'
                  ? 'Plataforma SaaS Multi-Estabelecimentos'
                  : `${config.storeName || store?.name || 'MGW X-SALADA'} • Cardápio Digital`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <a
                href={publicMenuUrl}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60 text-xs font-semibold text-zinc-200 transition-colors"
                title="Abrir cardápio público em nova aba"
              >
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                <span>Ver Cardápio</span>
                <ExternalLink className="w-3 h-3 text-zinc-400" />
              </a>
            )}

            <button
              type="button"
              onClick={() => {
                setIsAdminOpen(false);
                setPasswordInput('');
                setAuthError('');
              }}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center cursor-pointer"
              aria-label="Fechar painel administrativo"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Authentication Wall */}
        {!isAuthenticated ? (
          <div className="p-6 sm:p-12 max-w-sm mx-auto text-center space-y-6 my-auto">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 mx-auto flex items-center justify-center text-amber-400 shadow-xl">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="font-display font-black text-xl text-white">Acesso Administrativo</h3>
              <p className="text-xs text-zinc-400">
                Gerencie produtos, fotos, preços, horários e WhatsApp do cardápio digital.
              </p>
              <p className="text-[11px] text-zinc-500 mt-1 font-mono">{SUPER_ADMIN_EMAIL}</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-3.5 text-left">
              <div className="space-y-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                    E-mail cadastrado
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="E-mail do administrador"
                    autoComplete="username"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500 placeholder-zinc-600 min-h-[44px]"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                    Senha de acesso
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
                  <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{authError}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-sm uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-amber-950/40 min-h-[46px]"
              >
                Entrar no Painel
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Dashboard Workspace */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top SaaS Platform Switcher bar (only shown for Super Admin) */}
            {isSuperAdmin && (
              <div className="px-4 sm:px-6 py-2.5 bg-zinc-900/90 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-1.5 p-1 bg-black/60 rounded-xl border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setAdminMode('store')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      adminMode === 'store'
                        ? 'bg-amber-500 text-black shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <StoreIcon className="w-3.5 h-3.5" />
                    <span>Loja Atual</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdminMode('platform')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      adminMode === 'platform'
                        ? 'bg-amber-500 text-black shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Plataforma SaaS</span>
                  </button>
                </div>

                <div className="flex items-center gap-3 text-xs text-zinc-400">
                  <span className="hidden sm:inline">
                    Conectado como <strong className="text-zinc-200 font-mono">{SUPER_ADMIN_EMAIL}</strong>
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

            {/* Platform Mode View */}
            {isSuperAdmin && adminMode === 'platform' ? (
              <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                <SuperAdminDashboard
                  onSelectStoreToManage={(targetStore) => {
                    navigateToStore(targetStore.slug);
                    setAdminMode('store');
                    setActiveTab('dashboard');
                  }}
                />
              </div>
            ) : (
              /* Store Management Mode View: Modern Two-Pane Responsive Layout */
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Desktop Sidebar Navigation */}
                <aside className="hidden md:flex w-64 bg-zinc-950/80 border-r border-zinc-800 flex-col justify-between shrink-0 p-4">
                  <div className="space-y-4">
                    {/* Store Quick Info Box & Switcher */}
                    <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                          Estabelecimento
                        </span>
                        <span
                          className={`w-2 h-2 rounded-full ${
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
                          {config.isOpen ? 'Aberto p/ pedidos' : 'Fechado no momento'}
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
                            className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer min-h-[42px] ${
                              isActive
                                ? 'bg-amber-500 text-black shadow-md shadow-amber-950/20'
                                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
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
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-bold flex items-center justify-between transition-colors min-h-[38px]"
                    >
                      <div className="flex items-center gap-2">
                        <Eye className="w-3.5 h-3.5 text-amber-400" />
                        <span>Ver Cardápio</span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
                    </a>

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

                {/* Mobile Top Horizontal Tabs Navigation */}
                <div className="md:hidden px-3 py-2 bg-zinc-900/80 border-b border-zinc-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
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
                        className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 min-h-[38px] cursor-pointer ${
                          isActive
                            ? 'bg-amber-500 text-black shadow-md'
                            : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-white'
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

                {/* Main Content Workspace */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
                  {/* Active Tab Header / Breadcrumb */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800/80">
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <span>{config.storeName || store?.name || 'MGW X-SALADA'}</span>
                      <ChevronRight className="w-3 h-3 text-zinc-600" />
                      <span className="text-white font-bold">
                        {navItems.find((n) => n.id === activeTab)?.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500">
                        {config.whatsappNumber ? `WhatsApp: ${config.whatsappNumber}` : 'Sem WhatsApp cadastrado'}
                      </span>
                    </div>
                  </div>

                  {/* Render Domain Component based on Active Tab */}
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
        )}
      </div>
    </div>
  );
};
