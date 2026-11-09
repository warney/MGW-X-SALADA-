-- RASCUNHO CORRIGIDO — NÃO EXECUTAR EM PRODUÇÃO.
-- Esta versão corrige a incompatibilidade estrutural do rascunho anterior.
-- Projeto: zvjancomlonxzzqtwxqj
--
-- GARANTIAS DESTA PROPOSTA:
-- 1. NÃO altera public.store_settings (tabela legada id=1).
-- 2. Cria public.store_public_settings para configurações por loja.
-- 3. Mantém os seis produtos e seus IDs/imagens; category_id inicia NULL.
-- 4. Não publica a loja nem ativa frontend multi-tenant.
-- 5. NÃO é migration executável: policies RLS, grants e Storage serão
--    adicionados somente após revisão isolada e testes de isolamento.
--
-- PRÉ-REQUISITOS AINDA PENDENTES:
-- backup restaurável verificado; ambiente Supabase isolado; revisão de RLS;
-- teste de políticas legadas por e-mail; validação de Storage e rollback.
-- Nunca incluir senhas, tokens, anon/service_role keys neste arquivo.

begin;

do $preflight$
begin
  if to_regclass('public.store_products') is null
     or to_regclass('public.store_settings') is null then
    raise exception 'Preflight: tabelas legadas ausentes';
  end if;
  if (select count(*) from public.store_products) <> 6 then
    raise exception 'Preflight: quantidade de produtos mudou; interrompido';
  end if;
  if (select count(*) from public.store_settings) <> 1 then
    raise exception 'Preflight: quantidade de configurações mudou; interrompido';
  end if;
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='store_products'
               and column_name='store_id') then
    raise exception 'Preflight: store_id já existe; revisar estado atual';
  end if;
  if not exists (
    select 1 from auth.users
    where id = '9ea5631d-5045-480b-bd77-8d2ca50c6222'::uuid
      and lower(email) = lower('warney.fernandes22@gmail.com')
      and email_confirmed_at is not null and banned_until is null
  ) then
    raise exception 'Preflight: conta Auth do owner não confere';
  end if;
end
$preflight$;

create schema if not exists private;

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  status text not null default 'draft'
    check (status in ('draft','active','suspended','archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.store_memberships (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  role text not null check (role in ('owner','admin','editor','staff')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, user_id)
);

create table public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete restrict,
  role text not null default 'super_admin' check (role = 'super_admin'),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.store_categories (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete restrict,
  name text not null check (length(trim(name)) between 1 and 80),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, slug),
  unique (store_id, id)
);

-- Configurações públicas isoladas por loja. A tabela legada permanece intacta.
create table public.store_public_settings (
  store_id uuid primary key references public.stores(id) on delete restrict,
  store_name text not null,
  slogan text not null default '',
  logo_url text,
  whatsapp_number text not null default '',
  opening_hours text not null default '',
  address text not null default '',
  delivery_estimate text not null default '',
  delivery_fee_note text not null default '',
  is_open boolean not null default true,
  updated_at timestamptz not null default now()
);

create index store_memberships_user_store_active_idx
  on public.store_memberships (user_id, store_id) where active;
create index store_categories_store_active_order_idx
  on public.store_categories (store_id, active, sort_order);

insert into public.stores (name, slug, status, created_by)
values ('MGW X-SALADA', 'mgw-x-salada', 'draft',
        '9ea5631d-5045-480b-bd77-8d2ca50c6222'::uuid);

insert into public.store_memberships (store_id, user_id, role)
select id, '9ea5631d-5045-480b-bd77-8d2ca50c6222'::uuid, 'owner'
from public.stores where slug = 'mgw-x-salada';

insert into public.platform_admins (user_id, role, active)
values ('9ea5631d-5045-480b-bd77-8d2ca50c6222'::uuid, 'super_admin', true);

alter table public.store_products
  add column store_id uuid,
  add column product_type text,
  add column category_id uuid,
  add column sort_order integer not null default 0;

update public.store_products
set store_id = (select id from public.stores where slug = 'mgw-x-salada'),
    product_type = category
where store_id is null;

alter table public.store_products
  add constraint store_products_product_type_check
    check (product_type in ('individual','combo')),
  add constraint store_products_store_fk
    foreign key (store_id) references public.stores(id) on delete restrict,
  add constraint store_products_store_category_fk
    foreign key (store_id, category_id)
    references public.store_categories(store_id, id) on delete restrict;

create index store_products_store_active_idx
  on public.store_products (store_id, active);
create index store_products_store_category_idx
  on public.store_products (store_id, category_id);
create index store_products_store_sort_name_idx
  on public.store_products (store_id, sort_order, name);

do $verify$
begin
  if (select count(*) from public.store_products
      where store_id is null or product_type is null) <> 0 then
    raise exception 'Verificação falhou: produto sem loja ou tipo';
  end if;
  if (select count(*) from public.store_products) <> 6 then
    raise exception 'Verificação falhou: contagem de produtos';
  end if;
  if (select count(*) from public.store_settings) <> 1 then
    raise exception 'Verificação falhou: tabela legada store_settings foi alterada';
  end if;
  if (select count(*) from public.store_products where category_id is not null) <> 0 then
    raise exception 'Verificação falhou: categorias foram atribuídas sem decisão do proprietário';
  end if;
end
$verify$;

-- RLS é habilitada, mas sem policies/grants a Data API não poderá usar
-- estas tabelas. A etapa de autorização deve ser aplicada em migration
-- separada, testada com anon, authenticated, owner, editor e staff.
alter table public.stores enable row level security;
alter table public.store_memberships enable row level security;
alter table public.platform_admins enable row level security;
alter table public.store_categories enable row level security;
alter table public.store_public_settings enable row level security;

commit;

-- FIM DO RASCUNHO. NÃO EXECUTAR: ainda não inclui policies/grants/Storage.
-- O frontend legado continua sendo a única via ativa até a migração completa.
