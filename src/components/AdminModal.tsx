import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Lock,
  Phone,
  DollarSign,
  Store,
  RotateCcw,
  Save,
  Check,
  AlertTriangle,
  ExternalLink,
  Image as ImageIcon,
  Upload,
  Trash2,
  RefreshCw,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Eye,
  Info
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Product } from '../types';
import { formatCurrency, cleanPhoneNumber, formatPhoneDisplay } from '../utils/formatters';
import { processUploadedImage } from '../utils/imageStorage';
import { OFFICIAL_LOGO_URL } from '../data/defaultData';
import { supabase, ADMIN_EMAIL } from '../lib/supabase';
import { resolveAuthIdentity } from '../lib/authIdentity';

interface PreviewModalData {
  productId: string;
  productName: string;
  dataUrl: string;
  sizeKb: number;
  width: number;
  height: number;
}

export const AdminModal: React.FC = () => {
  const {
    products,
    config,
    isAdminOpen,
    setIsAdminOpen,
    updateProduct,
    setProductImage,
    deleteProductImage,
    updateConfig,
    resetToDefaults,
  } = useStore();

  const [emailInput, setEmailInput] = useState(ADMIN_EMAIL);
  const [passwordInput, setPasswordInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'images' | 'prices' | 'store'>('images');
  const [saveFeedback, setSaveFeedback] = useState(false);

  // Form local states for editing
  const [tempWhatsapp, setTempWhatsapp] = useState(config.whatsappNumber);
  const [tempStoreName, setTempStoreName] = useState(config.storeName);
  const [tempSlogan, setTempSlogan] = useState(config.slogan);
  const [tempAddress, setTempAddress] = useState(config.address);
  const [tempHours, setTempHours] = useState(config.openingHours);
  const [tempIsOpen, setTempIsOpen] = useState(config.isOpen);


  // Image management state
  const [previewModal, setPreviewModal] = useState<PreviewModalData | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageSuccess, setImageSuccess] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!isAdminOpen) return;
    supabase.auth.getSession().then(({ data }) => {
      const identity = resolveAuthIdentity(data.session?.user);
      setIsAuthenticated(identity?.email === ADMIN_EMAIL);
    });
  }, [isAdminOpen]);

  // Hidden file input ref mapped by product ID
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  if (!isAdminOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (emailInput.trim().toLowerCase() !== ADMIN_EMAIL) {
      setAuthError('E-mail sem autorização para acessar este painel.');
      return;
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailInput.trim(),
      password: passwordInput,
    });
    const identity = resolveAuthIdentity(data.user);
    if (error || identity?.email !== ADMIN_EMAIL) {
      setAuthError('Não foi possível entrar. Confira o e-mail e a senha.');
      return;
    }
    setIsAuthenticated(true);
    setTempWhatsapp(config.whatsappNumber);
    setTempStoreName(config.storeName);
    setTempSlogan(config.slogan);
    setTempAddress(config.address);
    setTempHours(config.openingHours);
    setTempIsOpen(config.isOpen);
  };

  const handleSaveStoreConfig = () => {
    updateConfig({
      whatsappNumber: cleanPhoneNumber(tempWhatsapp),
      storeName: tempStoreName,
      slogan: tempSlogan,
      address: tempAddress,
      openingHours: tempHours,
      isOpen: tempIsOpen,
    });

    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 2000);
  };

  const handlePriceChange = (productId: string, newPriceStr: string) => {
    const parsed = parseFloat(newPriceStr.replace(',', '.'));
    if (!isNaN(parsed) && parsed >= 0) {
      updateProduct(productId, { price: parsed });
    }
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
        'Olá! Este é um teste de configuração do Cardápio Digital MGW X-Salada.'
      )}`,
      '_blank'
    );
  };

  // Process selected file from phone or computer
  const handleFileChange = async (
    productId: string,
    productName: string,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageError(null);
    setImageSuccess(null);
    setIsProcessing(true);

    try {
      // Process and compress image (resize to max 1000px, compress to ~70-120KB)
      const result = await processUploadedImage(file, 1000, 0.85);

      // Open preview modal so admin can review BEFORE saving
      setPreviewModal({
        productId,
        productName,
        dataUrl: result.dataUrl,
        sizeKb: result.sizeKb,
        width: result.width,
        height: result.height,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao processar imagem.';
      setImageError(msg);
    } finally {
      setIsProcessing(false);
      // Reset input value so same file can be selected again if needed
      event.target.value = '';
    }
  };

  // Confirm and persist the image
  const handleConfirmSaveImage = async () => {
    if (!previewModal) return;

    try {
      await setProductImage(previewModal.productId, previewModal.dataUrl);
      setImageSuccess(`Foto de "${previewModal.productName}" salva e atualizada com sucesso no cardápio!`);
      setPreviewModal(null);
      setImageError(null);

      setTimeout(() => {
        setImageSuccess(null);
      }, 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao salvar a imagem no armazenamento.';
      setImageError(msg);
    }
  };

  // Delete/revert image to official logo
  const handleDeleteImage = async (productId: string, productName: string) => {
    const confirmed = window.confirm(
      `Deseja realmente excluir a foto de "${productName}"?\n\nO produto voltará a exibir a logo oficial MGW X-SALADA no cardápio.`
    );

    if (!confirmed) return;

    try {
      await deleteProductImage(productId);
      setImageSuccess(`A foto de "${productName}" foi removida. O produto agora exibe a logo oficial MGW X-SALADA.`);
      setImageError(null);

      setTimeout(() => {
        setImageSuccess(null);
      }, 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao remover imagem.';
      setImageError(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4">
      <div className="relative w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden my-4 sm:my-6">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base sm:text-lg text-white leading-tight">
                Painel Administrativo da Loja
              </h2>
              <p className="text-[11px] sm:text-xs text-zinc-400">
                Gerencie fotos dos produtos, WhatsApp, preços e informações
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setIsAdminOpen(false);
              setIsAuthenticated(false);
              setPasswordInput('');
              setImageError(null);
              setImageSuccess(null);
              setPreviewModal(null);
            }}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
            aria-label="Fechar painel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Authentication Wall */}
        {!isAuthenticated ? (
          <div className="p-6 sm:p-8 max-w-sm mx-auto text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 mx-auto flex items-center justify-center text-amber-400">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="font-display font-bold text-xl text-white">Área Protegida</h3>
              <p className="text-xs text-zinc-400">
                Digite a senha de administrador da loja para alterar fotos, preços e configurações.
              </p>
              <p className="text-[11px] text-zinc-500 mt-1">
                Acesso restrito ao administrador autorizado.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-3">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="E-mail do administrador"
                  autoComplete="username"
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-center text-sm text-white focus:outline-none focus:border-amber-500 placeholder-zinc-600"
                  autoFocus
                />
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Senha do Supabase"
                  autoComplete="current-password"
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-center text-sm text-white focus:outline-none focus:border-amber-500 placeholder-zinc-600"
                />
                {authError && <p className="text-xs text-red-400 mt-2 font-medium">{authError}</p>}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-colors cursor-pointer min-h-[44px]"
              >
                Entrar no Painel
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Admin Workspace */
          <div className="flex flex-col">
            {/* Admin Tabs */}
            <div className="px-3 sm:px-6 pt-2 bg-zinc-900/60 border-b border-zinc-800 flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar">
              {/* TAB 1: IMAGENS DOS PRODUTOS (NEW HIGHLIGHTED TAB) */}
              <button
                type="button"
                onClick={() => setActiveTab('images')}
                className={`px-3 sm:px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 shrink-0 min-h-[42px] ${
                  activeTab === 'images'
                    ? 'border-amber-500 text-amber-400 bg-zinc-900'
                    : 'border-transparent text-zinc-400 hover:text-white'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                <span>Fotos dos Produtos</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                  {products.length}
                </span>
              </button>

              {/* TAB 2: WHATSAPP */}
              <button
                type="button"
                onClick={() => setActiveTab('whatsapp')}
                className={`px-3 sm:px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 shrink-0 min-h-[42px] ${
                  activeTab === 'whatsapp'
                    ? 'border-amber-500 text-amber-400 bg-zinc-900'
                    : 'border-transparent text-zinc-400 hover:text-white'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>WhatsApp da Loja</span>
              </button>

              {/* TAB 3: PREÇOS & CARDÁPIO */}
              <button
                type="button"
                onClick={() => setActiveTab('prices')}
                className={`px-3 sm:px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 shrink-0 min-h-[42px] ${
                  activeTab === 'prices'
                    ? 'border-amber-500 text-amber-400 bg-zinc-900'
                    : 'border-transparent text-zinc-400 hover:text-white'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Preços & Itens</span>
              </button>

              {/* TAB 4: DADOS DA LOJA */}
              <button
                type="button"
                onClick={() => setActiveTab('store')}
                className={`px-3 sm:px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 shrink-0 min-h-[42px] ${
                  activeTab === 'store'
                    ? 'border-amber-500 text-amber-400 bg-zinc-900'
                    : 'border-transparent text-zinc-400 hover:text-white'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Dados da Loja</span>
              </button>
            </div>

            {/* Global Success / Error Alerts */}
            {imageSuccess && (
              <div className="mx-4 sm:mx-6 mt-4 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{imageSuccess}</span>
              </div>
            )}

            {imageError && (
              <div className="mx-4 sm:mx-6 mt-4 p-3 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{imageError}</span>
              </div>
            )}

            {/* Tab Contents */}
            <div className="p-4 sm:p-6 space-y-6 max-h-[65vh] overflow-y-auto">
              {/* TAB 1: GERENCIADOR DE IMAGENS INDIVIDUAIS */}
              {activeTab === 'images' && (
                <div className="space-y-4">
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-bold text-amber-400">
                      <ImageIcon className="w-4 h-4" />
                      <span>Gerenciamento de Fotografias dos Produtos</span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Cadastre fotos individuais tiradas pelo celular ou imagens da sua galeria para cada produto. Se você excluir ou não enviar uma foto, o cardápio exibirá automaticamente a <strong>Logo Oficial MGW X-SALADA</strong>.
                    </p>
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400" /> JPG, JPEG, PNG ou WEBP
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400" /> Otimização automática para celular
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400" /> Salvo e persistido no navegador
                      </span>
                    </div>
                  </div>

                  {/* List of Products for Image Management */}
                  <div className="space-y-4">
                    {products.map((product) => {
                      const isDefaultLogo = product.imageUrl === OFFICIAL_LOGO_URL;

                      return (
                        <div
                          key={product.id}
                          className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-display font-bold text-sm sm:text-base text-white">
                                  {product.name}
                                </h4>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 uppercase font-bold">
                                  {product.category === 'individual' ? 'Individual' : 'Combo'}
                                </span>
                              </div>
                              <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">
                                {product.description}
                              </p>
                            </div>

                            {/* Badge: Custom image vs default logo */}
                            <div className="shrink-0">
                              {isDefaultLogo ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-semibold">
                                  <Info className="w-3 h-3" /> Imagem Padrão (Logo MGW)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold">
                                  <Check className="w-3 h-3" /> Foto Cadastrada
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Image preview and actions row */}
                          <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                            {/* Current Image preview thumbnail */}
                            <div className="relative w-full sm:w-36 aspect-[4/3] rounded-xl overflow-hidden bg-zinc-950 border border-zinc-700/60 shrink-0">
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                referrerPolicy="no-referrer"
                                className={`w-full h-full ${
                                  isDefaultLogo ? 'object-contain p-2 bg-black' : 'object-cover'
                                }`}
                                onError={(e) => {
                                  e.currentTarget.src = OFFICIAL_LOGO_URL;
                                }}
                              />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex-1 w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                              {/* Hidden file input */}
                              <input
                                ref={(el) => {
                                  fileInputRefs.current[product.id] = el;
                                }}
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                className="hidden"
                                onChange={(e) => handleFileChange(product.id, product.name, e)}
                              />

                              {/* Button: Adicionar Imagem / Substituir Imagem */}
                              <button
                                type="button"
                                onClick={() => fileInputRefs.current[product.id]?.click()}
                                disabled={isProcessing}
                                className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md min-h-[44px]"
                              >
                                {isDefaultLogo ? (
                                  <>
                                    <Upload className="w-4 h-4" />
                                    <span>Adicionar Imagem</span>
                                  </>
                                ) : (
                                  <>
                                    <RefreshCw className="w-4 h-4" />
                                    <span>Substituir Imagem</span>
                                  </>
                                )}
                              </button>

                              {/* Button: Excluir Imagem (shown when not using default logo) */}
                              {!isDefaultLogo && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteImage(product.id, product.name)}
                                  className="py-3 px-4 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-700/50 text-red-200 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
                                  title="Remover fotografia e voltar para a logo oficial"
                                >
                                  <Trash2 className="w-4 h-4 text-red-400" />
                                  <span>Excluir Imagem</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: WHATSAPP */}
              {activeTab === 'whatsapp' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-emerald-400">
                      <Phone className="w-4 h-4" />
                      <span>Número de WhatsApp para Receber os Pedidos</span>
                    </div>

                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Número oficial configurado para receber os pedidos: <code className="text-amber-400 font-mono font-bold">559281112510</code>. O link direto do botão de finalização utiliza este número.
                    </p>

                    <div className="space-y-2 pt-2">
                      <label className="text-xs font-semibold text-zinc-400">
                        Número com DDD (apenas números):
                      </label>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-zinc-500">
                            +55
                          </span>
                          <input
                            type="text"
                            value={tempWhatsapp}
                            onChange={(e) => setTempWhatsapp(e.target.value)}
                            placeholder="Ex: 9281112510 ou 559281112510"
                            className="w-full pl-12 pr-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono text-sm focus:border-amber-500 focus:outline-none min-h-[44px]"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={handleTestWhatsapp}
                          className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0 min-h-[44px]"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Testar Número</span>
                        </button>
                      </div>

                      {tempWhatsapp && (
                        <p className="text-xs text-zinc-400">
                          Formato reconhecido:{' '}
                          <span className="text-amber-400 font-mono font-bold">
                            {formatPhoneDisplay(tempWhatsapp)}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: PREÇOS & CARDÁPIO */}
              {activeTab === 'prices' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-display font-bold text-sm text-white">
                        Gerenciar Preços e Disponibilidade
                      </h4>
                      <p className="text-xs text-zinc-400">
                        Altere os preços do X-Salada individual (R$ 12,00) e de todos os 5 combos
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          product.active
                            ? 'bg-zinc-900/90 border-zinc-800'
                            : 'bg-zinc-950/60 border-zinc-900 opacity-60'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              referrerPolicy="no-referrer"
                              className="w-12 h-12 rounded-xl object-cover bg-zinc-950 border border-zinc-800 shrink-0"
                              onError={(e) => {
                                e.currentTarget.src = OFFICIAL_LOGO_URL;
                              }}
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <h5 className="font-display font-bold text-sm text-white">
                                  {product.name}
                                </h5>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 uppercase font-bold">
                                  {product.category === 'individual' ? 'Individual' : 'Combo'}
                                </span>
                              </div>
                              <p className="text-xs text-zinc-400 truncate max-w-xs sm:max-w-md">
                                {product.description}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                            {/* Price editor */}
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-zinc-400 font-bold">R$</span>
                              <input
                                type="number"
                                step="0.50"
                                min="0"
                                defaultValue={product.price}
                                onBlur={(e) => handlePriceChange(product.id, e.target.value)}
                                className="w-20 px-2 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-500 text-right min-h-[40px]"
                              />
                            </div>

                            {/* Active toggle */}
                            <button
                              type="button"
                              onClick={() => updateProduct(product.id, { active: !product.active })}
                              className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer min-h-[40px] ${
                                product.active
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
                              }`}
                            >
                              {product.active ? 'Ativo' : 'Pausado'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: DADOS DA LOJA */}
              {activeTab === 'store' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Nome da Loja */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-300 uppercase">
                        Nome do Estabelecimento
                      </label>
                      <input
                        type="text"
                        value={tempStoreName}
                        onChange={(e) => setTempStoreName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-amber-500 focus:outline-none min-h-[42px]"
                      />
                    </div>

                    {/* Slogan */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-300 uppercase">
                        Slogan da Marca
                      </label>
                      <input
                        type="text"
                        value={tempSlogan}
                        onChange={(e) => setTempSlogan(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-amber-500 focus:outline-none min-h-[42px]"
                      />
                    </div>
                  </div>

                  {/* Endereço de Retirada */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-300 uppercase">
                      Endereço para Retirada no Balcão
                    </label>
                    <input
                      type="text"
                      value={tempAddress}
                      onChange={(e) => setTempAddress(e.target.value)}
                      placeholder="Ex: Av. Principal, 123 - Centro"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-amber-500 focus:outline-none min-h-[42px]"
                    />
                  </div>

                  {/* Horário */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-300 uppercase">
                      Horário de Atendimento
                    </label>
                    <input
                      type="text"
                      value={tempHours}
                      onChange={(e) => setTempHours(e.target.value)}
                      placeholder="Ex: Terça a Domingo das 18h às 23h30"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-amber-500 focus:outline-none min-h-[42px]"
                    />
                  </div>

                  {/* Status da Loja: Aberto / Fechado */}
                  <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-xs text-white">Status da Hamburgueria</h5>
                      <p className="text-[11px] text-zinc-400">
                        Controle se a loja está aceitando pedidos agora
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setTempIsOpen(!tempIsOpen)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[42px] ${
                        tempIsOpen
                          ? 'bg-emerald-500 text-black font-extrabold shadow-md'
                          : 'bg-red-500/30 text-red-400 border border-red-500/40'
                      }`}
                    >
                      {tempIsOpen ? 'ABERTO AGORA' : 'FECHADO NO MOMENTO'}
                    </button>
                  </div>

                </div>
              )}
            </div>

            {/* Admin Footer */}
            <div className="p-4 sm:p-6 bg-zinc-900 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  if (confirm('Tem certeza que deseja restaurar as configurações padrão de fábrica?')) {
                    resetToDefaults();
                    setIsAdminOpen(false);
                  }
                }}
                className="text-xs text-zinc-500 hover:text-red-400 transition-colors flex items-center gap-1.5 cursor-pointer order-2 sm:order-1 py-2 min-h-[40px]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar Padrões</span>
              </button>

              <button
                type="button"
                onClick={handleSaveStoreConfig}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wide shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer order-1 sm:order-2 min-h-[44px]"
              >
                {saveFeedback ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Salvo com Sucesso!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Salvar Alterações</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* PREVIEW MODAL BEFORE SAVING IMAGE */}
      {previewModal && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div>
                <h3 className="font-display font-bold text-base sm:text-lg text-white">
                  Pré-visualização da Imagem
                </h3>
                <p className="text-xs text-zinc-400">
                  {previewModal.productName}
                </p>
              </div>
              <button
                onClick={() => setPreviewModal(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Image Preview Box */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-black border border-zinc-800 shadow-inner">
              <img
                src={previewModal.dataUrl}
                alt="Prévia da foto"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md text-[10px] text-zinc-300 font-mono">
                {previewModal.width}x{previewModal.height}px · ~{previewModal.sizeKb}KB
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Deseja salvar esta imagem para o produto <strong>{previewModal.productName}</strong>? Ela ficará visível imediatamente para os clientes no cardápio público.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPreviewModal(null)}
                className="flex-1 py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs uppercase transition-colors min-h-[44px]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmSaveImage}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold text-xs uppercase tracking-wide transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 min-h-[44px]"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar e Salvar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
