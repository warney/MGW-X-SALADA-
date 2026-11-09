import React, { useState } from 'react';
import {
  Search,
  Plus,
  DollarSign,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  Trash2,
  Edit2,
  Check,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { OFFICIAL_LOGO_URL } from '../../data/defaultData';
import { formatCurrency } from '../../utils/formatters';
import type { Product } from '../../types';

interface ProductsManagerProps {
  isCreatingOpenInitial?: boolean;
  onCloseCreateForm?: () => void;
}

export const ProductsManager: React.FC<ProductsManagerProps> = ({
  isCreatingOpenInitial = false,
  onCloseCreateForm,
}) => {
  const { products, updateProduct, addProduct, categories, isLegacyStore } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price-asc' | 'price-desc'>('name');

  const [isCreating, setIsCreating] = useState(isCreatingOpenInitial);
  const [newProductName, setNewProductName] = useState('');
  const [newProductDescription, setNewProductDescription] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductCategory, setNewProductCategory] = useState<string>(
    categories[0]?.slug || (isLegacyStore ? 'individual' : 'lanches')
  );
  const [newProductHighlight, setNewProductHighlight] = useState('');
  const [productCreateError, setProductCreateError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successFeedback, setSuccessFeedback] = useState('');

  // Handle fast price change
  const handlePriceChange = (productId: string, rawValue: string) => {
    const parsed = parseFloat(rawValue.replace(',', '.'));
    if (!isNaN(parsed) && parsed >= 0) {
      updateProduct(productId, { price: parsed });
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductCreateError('');
    setSuccessFeedback('');
    const name = newProductName.trim();
    const description = newProductDescription.trim();
    const price = Number(newProductPrice.replace(',', '.'));

    if (!name) {
      setProductCreateError('Informe o nome do produto.');
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setProductCreateError('Informe um preço numérico válido.');
      return;
    }

    const catSlug = newProductCategory || (isLegacyStore ? 'individual' : 'lanches');
    const isCombo = catSlug === 'combo';

    const newProd: Product = {
      id: `prod-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      description,
      price,
      category: catSlug as any,
      imageUrl: OFFICIAL_LOGO_URL,
      active: true,
      highlight: newProductHighlight.trim() || undefined,
      includedItems: isCombo ? [name] : [],
    };

    setIsSubmitting(true);
    try {
      await addProduct(newProd);
      setSuccessFeedback(`Produto "${name}" cadastrado com sucesso!`);
      setNewProductName('');
      setNewProductDescription('');
      setNewProductPrice('');
      setNewProductHighlight('');
      setIsCreating(false);
      onCloseCreateForm?.();
      setTimeout(() => setSuccessFeedback(''), 3000);
    } catch (err: unknown) {
      setProductCreateError(err instanceof Error ? err.message : 'Falha ao cadastrar produto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter and sort items
  const filteredProducts = products
    .filter((p) => {
      const query = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !query ||
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query);
      const matchesCategory =
        selectedCategory === 'all' || p.category === selectedCategory;
      const matchesStatus =
        selectedStatus === 'all' ||
        (selectedStatus === 'active' && p.active) ||
        (selectedStatus === 'inactive' && !p.active);
      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="space-y-6">
      {/* Top Controls: Search, Filter, Sort and Add Button */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex-1 flex flex-wrap items-center gap-2">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome ou ingrediente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 min-h-[40px]"
            />
          </div>

          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-amber-500 min-h-[40px]"
          >
            <option value="all">Todas as Categorias</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-amber-500 min-h-[40px]"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Visíveis no Cardápio</option>
            <option value="inactive">Ocultos / Pausados</option>
          </select>

          {/* Order by */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-amber-500 min-h-[40px]"
          >
            <option value="name">Ordenar por Nome</option>
            <option value="price-asc">Menor Preço</option>
            <option value="price-desc">Maior Preço</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => setIsCreating(!isCreating)}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl shadow-lg shadow-amber-950/30 flex items-center justify-center gap-2 min-h-[40px] cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>{isCreating ? 'Fechar Formulário' : 'Novo Produto'}</span>
        </button>
      </div>

      {successFeedback && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successFeedback}</span>
        </div>
      )}

      {/* Form de Criação de Produto (com preview ao vivo) */}
      {isCreating && (
        <form
          onSubmit={handleCreateProduct}
          className="p-5 rounded-2xl bg-zinc-900 border border-amber-500/30 space-y-4 shadow-xl"
        >
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <h4 className="font-bold text-sm text-amber-400 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Adicionar Novo Item ao Cardápio
            </h4>
            <span className="text-[10px] text-zinc-400">Preencha os dados e confirme</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Nome do Produto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: X-Bacon Especial"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 min-h-[38px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Preço (R$) *</label>
                  <input
                    type="text"
                    required
                    inputMode="decimal"
                    placeholder="Ex: 18,50"
                    value={newProductPrice}
                    onChange={(e) => setNewProductPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 min-h-[38px] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Categoria *</label>
                  <select
                    value={newProductCategory}
                    onChange={(e) => setNewProductCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 min-h-[38px]"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.slug}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Selo de Destaque (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: O Mais Pedido, Novidade, Super Econômico"
                  value={newProductHighlight}
                  onChange={(e) => setNewProductHighlight(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 min-h-[38px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Ingredientes & Descrição
                </label>
                <textarea
                  rows={2}
                  placeholder="Pão brioche, hambúrguer artesanal, queijo cheddar..."
                  value={newProductDescription}
                  onChange={(e) => setNewProductDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Live Card Preview Box */}
            <div className="flex flex-col justify-between p-4 rounded-xl bg-zinc-950 border border-zinc-800">
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                Pré-visualização do Card
              </span>

              <div className="mt-2 p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h5 className="font-bold text-sm text-white">
                      {newProductName || 'Nome do seu produto'}
                    </h5>
                    <span className="text-[10px] font-bold text-amber-400 uppercase">
                      {categories.find((c) => c.slug === newProductCategory)?.name || newProductCategory}
                    </span>
                  </div>
                  <span className="text-sm font-black font-mono text-emerald-400">
                    {newProductPrice ? `R$ ${newProductPrice}` : 'R$ 0,00'}
                  </span>
                </div>

                <p className="text-xs text-zinc-400 line-clamp-2">
                  {newProductDescription || 'Descrição dos ingredientes do produto selecionado.'}
                </p>

                {newProductHighlight && (
                  <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                    {newProductHighlight}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs min-h-[38px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs min-h-[38px] disabled:opacity-50"
                >
                  {isSubmitting ? 'Salvando...' : 'Adicionar ao Cardápio'}
                </button>
              </div>
            </div>
          </div>

          {productCreateError && (
            <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{productCreateError}</span>
            </div>
          )}
        </form>
      )}

      {/* Lista de Produtos Cadastrados */}
      <div className="space-y-3">
        {filteredProducts.map((product) => {
          const categoryName =
            categories.find((c) => c.slug === product.category)?.name || product.category;

          return (
            <div
              key={product.id}
              className={`p-4 rounded-2xl border transition-all ${
                product.active
                  ? 'bg-zinc-900/80 border-zinc-800'
                  : 'bg-zinc-950/60 border-zinc-900 opacity-60'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                {/* Product Info & Thumbnail */}
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-xl object-cover bg-zinc-950 border border-zinc-800 shrink-0"
                    onError={(e) => {
                      e.currentTarget.src = OFFICIAL_LOGO_URL;
                    }}
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm sm:text-base text-white truncate">
                        {product.name}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 uppercase">
                        {categoryName}
                      </span>
                      {product.highlight && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          {product.highlight}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 line-clamp-1">{product.description}</p>
                  </div>
                </div>

                {/* Inline Price Editor & Visibility Toggle */}
                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/80">
                  {/* Price input */}
                  <div className="flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1 rounded-xl border border-zinc-800">
                    <span className="text-xs text-zinc-400 font-bold font-mono">R$</span>
                    <input
                      type="number"
                      step="0.50"
                      min="0"
                      defaultValue={product.price}
                      onBlur={(e) => handlePriceChange(product.id, e.target.value)}
                      className="w-20 bg-transparent text-sm font-mono font-bold text-amber-400 text-right focus:outline-none min-h-[32px]"
                      title="Clique para alterar o preço e clique fora para salvar"
                    />
                  </div>

                  {/* Toggle Active/Inactive */}
                  <button
                    type="button"
                    onClick={() => updateProduct(product.id, { active: !product.active })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 min-h-[38px] cursor-pointer ${
                      product.active
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-white'
                    }`}
                  >
                    {product.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{product.active ? 'Ativo' : 'Oculto'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredProducts.length === 0 && (
          <div className="py-12 text-center text-zinc-500 text-xs space-y-2">
            <Layers className="w-8 h-8 mx-auto text-zinc-600 opacity-60" />
            <p>Nenhum produto encontrado com os filtros aplicados.</p>
          </div>
        )}
      </div>
    </div>
  );
};
