-- RASCUNHO — NÃO EXECUTAR NO PROJETO SUPABASE.
-- Este arquivo documenta a proposta de autorização SaaS.
-- A migração executável deverá ser gerada/revisada com Supabase CLI,
-- após confirmar o usuário Auth inicial, os dados MGW e o plano de rollback.
--
-- Princípios:
-- * Não altera store_products, store_settings nem políticas legadas.
-- * Não remove o acesso administrativo atual da MGW.
-- * Nenhum usuário pode criar/alterar seu próprio papel pelo cliente.
-- * Super Admin é cadastrado somente por operação administrativa confiável.

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  status text not null default 'draft'
    check (status in ('draft', 'active', 'suspended', 'archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.store_memberships (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'editor', 'staff')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, user_id)
);

create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'super_admin' check (role = 'super_admin'),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists store_memberships_user_store_idx
  on public.store_memberships (user_id, store_id)
  where active = true;

create index if not exists stores_status_slug_idx
  on public.stores (status, slug);

alter table public.stores enable row level security;
alter table public.store_memberships enable row level security;
alter table public.platform_admins enable row level security;

-- Funções auxiliares com escopo fixo. SECURITY DEFINER é usado somente
-- para consultar as tabelas de autorização sem recursão de RLS.
create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.platform_admins pa
    where pa.user_id = (select auth.uid())
      and pa.active = true
      and pa.role = 'super_admin'
  );
$$;

create or replace function public.has_store_role(
  requested_store_id uuid,
  allowed_roles text[] default array['owner', 'admin', 'editor', 'staff']::text[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.store_memberships sm
      where sm.store_id = requested_store_id
        and sm.user_id = (select auth.uid())
        and sm.active = true
        and sm.role = any(allowed_roles)
    );
$$;

revoke all on function public.is_platform_admin() from public, anon;
revoke all on function public.has_store_role(uuid, text[]) from public, anon;
grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.has_store_role(uuid, text[]) to authenticated;

-- Stores: visitantes leem apenas lojas ativas; membros podem ver a própria
-- loja mesmo em rascunho/suspensa; Super Admin pode ver todas.
grant select on public.stores to anon, authenticated;
revoke insert, update, delete on public.stores from anon, authenticated;

drop policy if exists "Public can read active stores" on public.stores;
create policy "Public can read active stores"
  on public.stores for select to anon, authenticated
  using (
    status = 'active'
    or (select public.is_platform_admin())
    or (select public.has_store_role(id))
  );

-- Memberships: o usuário vê o próprio vínculo; owners/admins veem membros
-- da loja. Nenhuma escrita direta pelo navegador nesta fase.
grant select on public.store_memberships to authenticated;
revoke all on public.store_memberships from anon;
revoke insert, update, delete on public.store_memberships from authenticated;

drop policy if exists "Users can read own memberships" on public.store_memberships;
create policy "Users can read own memberships"
  on public.store_memberships for select to authenticated
  using (
    user_id = (select auth.uid())
    or (select public.is_platform_admin())
    or (select public.has_store_role(
      store_id, array['owner', 'admin']::text[]
    ))
  );

-- A tabela de Super Admin não é exposta ao cliente. Seu cadastro e manutenção
-- ficam restritos a uma operação administrativa confiável.
revoke all on public.platform_admins from anon, authenticated;

-- IMPORTANTE: não inserir membership ou Super Admin automaticamente por e-mail.
-- Antes da migração real, identificar e confirmar o UUID do usuário Auth correto.
-- O registro inicial da MGW e a associação do owner serão definidos em migração
-- de dados separada, com backup e plano de reversão aprovados.
