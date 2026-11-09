import React, { useState } from 'react';
import { Layers, Plus, Check, Edit2, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import type { StoreCategory } from '../../types/saas';

export const CategoriesManager: React.FC = () => {
  const { categories, saveCategory, toggleCategoryActive, products } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [nameInput, setNameInput] = useState('');
  const [slugInput, setSlugInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startEdit = (cat: StoreCategory) => {
    setEditingId(cat.id);
    setNameInput(cat.name);
    setSlugInput(cat.slug);
    setDescInput(cat.description || '');
    setIsAdding(false);
    setErrorMsg('');
  };

  const cancelForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setNameInput('');
    setSlugInput('');
    setDescInput('');
    setErrorMsg('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      const normalizedSlug = slugInput.trim() || nameInput.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      await saveCategory(
        {
          name: nameInput,
          slug: normalizedSlug,
          description: descInput || undefined,
        },
        editingId ?? undefined
      );

      setSuccessMsg(editingId ? 'Categoria atualizada com sucesso!' : 'Categoria criada com sucesso!');
      cancelForm();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Falha ao salvar categoria.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div>
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            Gerenciador de Categorias do Cardápio
          </h3>
          <p className="text-xs text-zinc-400">
            Organize os produtos em seções personalizadas para seus clientes.
          </p>
        </div>

        {!isAdding && !editingId && (
          <button
            onClick={() => {
              setIsAdding(true);
              setNameInput('');
              setSlugInput('');
              setDescInput('');
              setErrorMsg('');
            }}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs flex items-center gap-1.5 min-h-[38px] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nova Categoria</span>
          </button>
        )}
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Form de Criação / Edição */}
      {(isAdding || editingId) && (
        <form onSubmit={handleSave} className="p-4 rounded-2xl bg-zinc-900 border border-amber-500/30 space-y-3">
          <h4 className="font-bold text-xs text-amber-400 uppercase tracking-wider">
            {editingId ? 'Editar Categoria' : 'Criar Nova Categoria'}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Nome da Categoria *</label>
              <input
                type="text"
                required
                placeholder="Ex: Bebidas Artesanais"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 min-h-[38px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Identificador (Slug)</label>
              <input
                type="text"
                placeholder="Ex: bebidas-artesanais"
                value={slugInput}
                onChange={(e) => setSlugInput(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 min-h-[38px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Descrição (opcional)</label>
            <input
              type="text"
              placeholder="Ex: Sucos naturais feitos na hora e refrigerantes gelados"
              value={descInput}
              onChange={(e) => setDescInput(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 min-h-[38px]"
            />
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={cancelForm}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs min-h-[36px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs min-h-[36px] disabled:opacity-50"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Categoria'}
            </button>
          </div>
        </form>
      )}

      {/* Lista de Categorias */}
      <div className="space-y-2.5">
        {categories.map((cat) => {
          const productCount = products.filter((p) => p.category === cat.slug).length;

          return (
            <div
              key={cat.id}
              className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                cat.active
                  ? 'bg-zinc-900/80 border-zinc-800'
                  : 'bg-zinc-950/60 border-zinc-900 opacity-60'
              }`}
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">{cat.name}</span>
                  <span className="font-mono text-[11px] text-zinc-500 bg-black/40 px-2 py-0.5 rounded-full border border-zinc-800">
                    {cat.slug}
                  </span>
                  {!cat.active && (
                    <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
                      Inativa
                    </span>
                  )}
                </div>
                {cat.description && (
                  <p className="text-xs text-zinc-400">{cat.description}</p>
                )}
                <span className="text-[11px] text-amber-400/90 font-medium">
                  {productCount} {productCount === 1 ? 'produto cadastrado' : 'produtos cadastrados'}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleCategoryActive(cat.id, !cat.active)}
                  className={`p-2 rounded-xl text-xs font-semibold border transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center ${
                    cat.active
                      ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                      : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30'
                  }`}
                  title={cat.active ? 'Desativar categoria' : 'Ativar categoria'}
                >
                  {cat.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => startEdit(cat)}
                  className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-xs min-h-[36px] min-w-[36px] flex items-center justify-center"
                  title="Editar categoria"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {categories.length === 0 && (
          <div className="py-8 text-center text-zinc-500 text-xs">
            Nenhuma categoria configurada para este cardápio.
          </div>
        )}
      </div>
    </div>
  );
};
