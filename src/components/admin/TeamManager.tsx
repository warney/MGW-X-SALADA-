import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import type { StoreMembership, StoreRole } from '../../types/saas';
import { storeService } from '../../lib/storeService';
import { useStoreIdentity } from '../../context/StoreIdentityContext';

const ROLE_LABELS: Record<StoreRole, { title: string; desc: string; badge: string }> = {
  owner: {
    title: 'Proprietário (Owner)',
    desc: 'Controle total da loja, configurações, equipe e catálogo.',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  admin: {
    title: 'Administrador',
    desc: 'Gerencia catálogo, configurações da loja e equipe.',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  },
  editor: {
    title: 'Editor de Conteúdo',
    desc: 'Cadastra e edita produtos, fotos, preços e categorias.',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  },
  staff: {
    title: 'Atendente (Staff)',
    desc: 'Apenas visualização do cardápio e consulta operacional.',
    badge: 'bg-zinc-800 text-zinc-300 border-zinc-700',
  },
};

export const TeamManager: React.FC = () => {
  const { store } = useStoreIdentity();
  const [memberships, setMemberships] = useState<StoreMembership[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [userEmailOrId, setUserEmailOrId] = useState('');
  const [selectedRole, setSelectedRole] = useState<StoreRole>('editor');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadMemberships = async () => {
    if (!store?.id) return;
    const list = await storeService.listMemberships(store.id);
    setMemberships(list);
  };

  useEffect(() => {
    loadMemberships();
  }, [store?.id]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store?.id) return;
    setErrorMsg('');
    setSuccessMsg('');
    const input = userEmailOrId.trim();
    if (!input) {
      setErrorMsg('Informe o ID ou e-mail do usuário.');
      return;
    }

    setIsSubmitting(true);
    try {
      await storeService.addMembership(store.id, input, selectedRole);
      setSuccessMsg(`Membro adicionado como ${ROLE_LABELS[selectedRole].title}!`);
      setUserEmailOrId('');
      setIsAdding(false);
      await loadMemberships();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Falha ao adicionar membro.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div>
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            Equipe e Controle de Acesso (RBAC)
          </h3>
          <p className="text-xs text-zinc-400">
            Gerencie os colaboradores autorizados a acessar o painel deste estabelecimento.
          </p>
        </div>

        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs flex items-center gap-1.5 min-h-[38px] cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Adicionar Colaborador</span>
          </button>
        )}
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Form de Adicionar Colaborador */}
      {isAdding && (
        <form onSubmit={handleAddMember} className="p-4 rounded-2xl bg-zinc-900 border border-amber-500/30 space-y-3">
          <h4 className="font-bold text-xs text-amber-400 uppercase tracking-wider">
            Conceder Acesso ao Estabelecimento
          </h4>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              UUID do Usuário ou E-mail *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: usuario@email.com ou UUID Supabase Auth"
              value={userEmailOrId}
              onChange={(e) => setUserEmailOrId(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 min-h-[38px]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Papel / Nível de Permissão *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(Object.keys(ROLE_LABELS) as StoreRole[]).map((role) => (
                <label
                  key={role}
                  className={`p-3 rounded-xl border flex flex-col gap-1 cursor-pointer transition-all ${
                    selectedRole === role
                      ? 'bg-amber-500/10 border-amber-500 text-white'
                      : 'bg-zinc-950/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-zinc-200">{ROLE_LABELS[role].title}</span>
                    <input
                      type="radio"
                      name="role"
                      value={role}
                      checked={selectedRole === role}
                      onChange={() => setSelectedRole(role)}
                      className="accent-amber-500"
                    />
                  </div>
                  <span className="text-[11px] text-zinc-400 leading-tight">{ROLE_LABELS[role].desc}</span>
                </label>
              ))}
            </div>
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
              onClick={() => setIsAdding(false)}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs min-h-[36px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs min-h-[36px] disabled:opacity-50"
            >
              {isSubmitting ? 'Concedendo...' : 'Conceder Acesso'}
            </button>
          </div>
        </form>
      )}

      {/* Lista de Membros */}
      <div className="space-y-2.5">
        {memberships.map((m) => {
          const roleConfig = ROLE_LABELS[m.role] || ROLE_LABELS.staff;

          return (
            <div
              key={m.id}
              className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between gap-3"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span className="font-mono text-xs text-zinc-200">{m.userId}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleConfig.badge}`}>
                    {roleConfig.title}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">{roleConfig.desc}</p>
              </div>

              <span className="text-[11px] text-zinc-500">
                {m.active ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          );
        })}

        {memberships.length === 0 && (
          <div className="py-8 text-center text-zinc-500 text-xs">
            Nenhum membro explicitamente vinculado a este estabelecimento.
          </div>
        )}
      </div>
    </div>
  );
};
