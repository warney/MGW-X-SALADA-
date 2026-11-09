import React, { useState, useRef } from 'react';
import {
  Image as ImageIcon,
  Upload,
  RefreshCw,
  Trash2,
  Check,
  Search,
  CheckCircle2,
  AlertCircle,
  Info,
  X,
  Sparkles,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { OFFICIAL_LOGO_URL } from '../../data/defaultData';
import { processUploadedImage } from '../../utils/imageStorage';

interface PreviewModalData {
  productId: string;
  productName: string;
  dataUrl: string;
  sizeKb: number;
  width: number;
  height: number;
}

export const PhotosManager: React.FC = () => {
  const { products, setProductImage, deleteProductImage } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [previewModal, setPreviewModal] = useState<PreviewModalData | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageSuccess, setImageSuccess] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

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
      const result = await processUploadedImage(file, 1000, 0.85);
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
      event.target.value = '';
    }
  };

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

  const handleDeleteImage = async (productId: string, productName: string) => {
    const confirmed = window.confirm(
      `Deseja realmente excluir a foto de "${productName}"?\n\nO produto voltará a exibir a logo oficial padrão no cardápio.`
    );

    if (!confirmed) return;

    try {
      await deleteProductImage(productId);
      setImageSuccess(`A foto de "${productName}" foi removida.`);
      setImageError(null);

      setTimeout(() => {
        setImageSuccess(null);
      }, 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao remover imagem.';
      setImageError(msg);
    }
  };

  const filteredProducts = products.filter((p) => {
    const q = searchTerm.trim().toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Informative Guidance Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 space-y-2">
        <div className="flex items-center gap-2 text-sm font-bold text-amber-400">
          <ImageIcon className="w-4 h-4" />
          <span>Galeria & Gerenciador de Fotos dos Produtos</span>
        </div>
        <p className="text-xs text-zinc-300 leading-relaxed max-w-2xl">
          Tire fotos diretamente do seu celular ou escolha da galeria. As imagens são redimensionadas e comprimidas em alta resolução WebP para carregar com rapidez máxima para seus clientes.
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-zinc-400">
          <span className="flex items-center gap-1">
            <Check className="w-3 h-3 text-emerald-400" /> JPG, JPEG, PNG ou WEBP
          </span>
          <span aria-hidden="true">•</span>
          <span className="flex items-center gap-1">
            <Check className="w-3 h-3 text-emerald-400" /> Compressão automática
          </span>
          <span aria-hidden="true">•</span>
          <span className="flex items-center gap-1">
            <Check className="w-3 h-3 text-emerald-400" /> Atualização em tempo real no cardápio
          </span>
        </div>
      </div>

      {imageSuccess && (
        <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{imageSuccess}</span>
        </div>
      )}

      {imageError && (
        <div className="p-3 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{imageError}</span>
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filtrar por nome do produto..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 min-h-[42px]"
        />
      </div>

      {/* Grid of Product Photo Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredProducts.map((product) => {
          const isDefaultLogo = product.imageUrl === OFFICIAL_LOGO_URL;

          return (
            <div
              key={product.id}
              className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-white">{product.name}</h4>
                    <span className="text-[10px] uppercase font-bold text-zinc-400">
                      {product.category}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isDefaultLogo
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    {isDefaultLogo ? 'Logo Padrão' : 'Foto Própria'}
                  </span>
                </div>

                {/* Thumbnail Display */}
                <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-black border border-zinc-800">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className={`w-full h-full ${
                      isDefaultLogo ? 'object-contain p-4' : 'object-cover'
                    }`}
                    onError={(e) => {
                      e.currentTarget.src = OFFICIAL_LOGO_URL;
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80">
                <input
                  ref={(el) => {
                    fileInputRefs.current[product.id] = el;
                  }}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handleFileChange(product.id, product.name, e)}
                />

                <button
                  type="button"
                  onClick={() => fileInputRefs.current[product.id]?.click()}
                  disabled={isProcessing}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[38px]"
                >
                  {isDefaultLogo ? (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Adicionar Foto</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Trocar Foto</span>
                    </>
                  )}
                </button>

                {!isDefaultLogo && (
                  <button
                    type="button"
                    onClick={() => handleDeleteImage(product.id, product.name)}
                    className="p-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-700/40 text-red-300 transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
                    title="Remover fotografia e voltar para o logotipo"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Preview Confirmation Modal */}
      {previewModal && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div>
                <h3 className="font-display font-bold text-base text-white">
                  Pré-visualização da Fotografia
                </h3>
                <p className="text-xs text-zinc-400">{previewModal.productName}</p>
              </div>
              <button
                onClick={() => setPreviewModal(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

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
              Deseja salvar esta imagem para <strong>{previewModal.productName}</strong>? Ela ficará visível no cardápio público imediatamente.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPreviewModal(null)}
                className="flex-1 py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs uppercase min-h-[44px]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmSaveImage}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold text-xs uppercase tracking-wide transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 min-h-[44px]"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Foto</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
