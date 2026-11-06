-- RASCUNHO PARA REVISÃO — NÃO EXECUTAR.
-- Não está em supabase/migrations. Não aplicar no projeto Supabase.
-- Projeto esperado: zvjancomlonxzzqtwxqj
-- Proprietário inicial confirmado por leitura de auth.users:
-- warney.fernandes22@gmail.com
-- UUID: 9ea5631d-5045-480b-bd77-8d2ca50c6222
--
-- Este arquivo é um plano SQL para revisão. Antes de torná-lo migration:
-- 1) revalidar o schema real, policies, grants, constraints e dados;
-- 2) obter backup integral verificável e rollback testado;
-- 3) validar em ambiente isolado;
-- 4) resolver as policies legadas por e-mail antes de abrir acesso SaaS;
-- 5) revisar SECURITY DEFINER, grants, RLS e Storage.
--
-- NUNCA inserir senha, token, chave API ou service_role no SQL.
-- A conta Auth existente mantém sua senha gerenciada pelo Supabase Auth.

begin;

-- PRECHECKS: abortar se a realidade não corresponder ao plano.
do $preflight$
begin
  if to_regclass('public.store_products') is null
     or to_regclass('public.store_settings') is null then
    raise exception 'Preflight: tabelas legadas ausentes';
  end if;

  if (select count(*) from public.store_products) <> 6 then
    raise exception 'Preflight: quantidade de produtos mudou; revisar antes de migrar';
  end if;

  if (select count(*) from public.store_settings) <> 1 then
    raise exception 'Preflight: quantidade de configurações mudou; revisar antes de migrar';
  end if;

  if not exists (
    select 1 from auth.users
    where id = '9ea5631d-5045-480b-bd77-8d2ca50c6222'::uuid
      and lower(email) = lower('warney.fernandes22@gmail.com')
      and email_confirmed_at is not null
      and banned_until is null
  ) then
    raise exception 'Preflight: conta Auth do owner não confere';
  end if;

  if exists (select 1 from public.stores where slug = 'mgw-x-salada') then
    raise exception 'Preflight: slug mgw-x-salada já existe';
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

-- Tabela de plataforma sem acesso direto via Data API.
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

create index store_memberships_user_store_active_idx
  on public.store_memberships (user_id, store_id) where active;
create index store_categories_store_active_order_idx
  on public.store_categories (store_id, active, sort_order);
create index store_products_store_active_idx
  on public.store_products (store_id, active);
create index store_products_store_category_idx
  on public.store_products (store_id, category_id);

-- Criar a loja como draft. Não publicar até frontend e testes estarem prontos.
insert into public.stores (name, slug, status, created_by)
values ('MGW X-SALADA', 'mgw-x-salada', 'draft',
        '9ea5631d-5045-480b-bd77-8d2ca50c6222'::uuid);

insert into public.store_memberships (store_id, user_id, role, active)
select id, '9ea5631d-5045-480b-bd77-8d2ca50c6222'::uuid, 'owner', true
from public.stores where slug = 'mgw-x-salada';

-- Bootstrap do único Super Admin inicial. Sem autoelevação pelo cliente.
insert into public.platform_admins (user_id, role, active)
values ('9ea5631d-5045-480b-bd77-8d2ca50c6222'::uuid, 'super_admin', true);

-- Expansão compatível: manter a coluna category antiga durante a transição.
alter table public.store_products
  add column store_id uuid,
  add column product_type text,
  add column category_id uuid;

alter table public.store_settings
  add column store_id uuid;

update public.store_products
set store_id = (select id from public.stores where slug = 'mgw-x-salada'),
    product_type = category
where store_id is null;

update public.store_settings
set store_id = (select id from public.stores where slug = 'mgw-x-salada')
where store_settings.id = 1 and store_id is null;

-- Integridade de tipo e associação entre produto e categoria da mesma loja.
alter table public.store_products
  add constraint store_products_product_type_check
  check (product_type in ('individual','combo')),
  add constraint store_products_store_fk
  foreign key (store_id) references public.stores(id) on delete restrict,
  add constraint store_products_store_category_fk
  foreign key (store_id, category_id)
  references public.store_categories(store_id, id)
  on delete restrict;

alter table public.store_settings
  add constraint store_settings_store_fk
  foreign key (store_id) references public.stores(id) on delete restrict,
  add constraint store_settings_store_unique unique (store_id);

-- STOP: revisar contagens/valores antes de NOT NULL.
do $verify$
begin
  if (select count(*) from public.store_products where store_id is null or product_type is null) <> 0 then
    raise exception 'Verificação falhou: produto sem loja ou tipo';
  end if;
  if (select count(*) from public.store_products) <> 6 then
    raise exception 'Verificação falhou: contagem de produtos';
  end if;
  if (select count(*) from public.store_settings where store_id is null) <> 0 then
    raise exception 'Verificação falhou: configuração sem loja';
  end if;
end
$verify$;

alter table public.store_products alter column store_id set not null;
alter table public.store_products alter column product_type set not null;
alter table public.store_settings alter column store_id set not null;

-- RLS habilitada. Policies serão adicionadas em etapa separada após revisão
-- da implementação das funções privadas, grants e policies legadas.
alter table public.stores enable row level security;
alter table public.store_memberships enable row level security;
alter table public.platform_admins enable row level security;
alter table public.store_categories enable row level security;

-- ATENÇÃO: sem policies, tabelas novas permanecem fechadas por RLS.
-- Não remover policies legadas por e-mail neste rascunho.
-- Não conceder grants genéricos a anon/authenticated.
-- Não criar policies Storage sem validar os nomes/caminhos atuais.

commit;

-- ROLLBACK CONCEITUAL (NÃO EXECUTAR ÀS CEGAS):
-- Reverter frontend primeiro. Exportar/preservar dados de lojas adicionais.
-- Em fase inicial, remover apenas colunas/tabelas novas após confirmar que
-- nenhum dado de terceiros foi gravado. Não usar DROP CASCADE.
-- A reversão real deve ser escrita e testada em ambiente isolado.
