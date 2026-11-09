-- CANDIDATA DE MIGRACAO MULTI-LOJA. NAO EXECUTAR EM PRODUCAO.
-- Preserva store_settings legado e os IDs/imagens dos seis produtos.
-- Exige frontend escopado e ambiente Supabase isolado antes de qualquer aplicacao.
begin;
select pg_advisory_xact_lock(hashtext('mgw-saas-first-multistore-migration'));
do $preflight$
begin
 if to_regclass('public.store_products') is null or to_regclass('public.store_settings') is null then raise exception 'Tabelas legadas ausentes'; end if;
 if (select count(*) from public.store_products)<>6 then raise exception 'Quantidade de produtos divergiu'; end if;
 if (select count(*) from public.store_settings)<>1 then raise exception 'Quantidade de configuracoes divergiu'; end if;
 if exists(select 1 from information_schema.columns where table_schema='public' and table_name='store_products' and column_name='store_id') then raise exception 'store_id ja existe; reconciliar manualmente'; end if;
 if not exists(select 1 from auth.users where id='9ea5631d-5045-480b-bd77-8d2ca50c6222'::uuid and lower(email)=lower('warney.fernandes22@gmail.com') and email_confirmed_at is not null and banned_until is null) then raise exception 'Conta Auth inicial nao confere'; end if;
end $preflight$;
create schema if not exists private;
revoke all on schema private from public,anon,authenticated;
create table public.stores(
 id uuid primary key default gen_random_uuid(),
 name text not null check(length(trim(name)) between 2 and 120),
 slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 status text not null default 'draft' check(status in('draft','active','suspended','archived')),
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table public.store_memberships(
 id uuid primary key default gen_random_uuid(),
 store_id uuid not null references public.stores(id) on delete restrict,
 user_id uuid not null references auth.users(id) on delete restrict,
 role text not null check(role in('owner','admin','editor','staff')),
 active boolean not null default true,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(store_id,user_id)
);
create table public.platform_admins(
 user_id uuid primary key references auth.users(id) on delete restrict,
 role text not null default 'super_admin' check(role='super_admin'),
 active boolean not null default true,created_at timestamptz not null default now()
);
create table public.store_categories(
 id uuid primary key default gen_random_uuid(),
 store_id uuid not null references public.stores(id) on delete restrict,
 name text not null check(length(trim(name)) between 1 and 80),
 slug text not null check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 description text,sort_order integer not null default 0,active boolean not null default true,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(store_id,slug),unique(store_id,id)
);
create table public.store_public_settings(
 store_id uuid primary key references public.stores(id) on delete restrict,
 store_name text not null check(length(trim(store_name)) between 2 and 120),
 slogan text not null default '',logo_url text,whatsapp_number text not null default '',
 opening_hours text not null default '',address text not null default '',
 delivery_estimate text not null default '',delivery_fee_note text not null default '',
 is_open boolean not null default true,updated_at timestamptz not null default now()
);
create index store_memberships_user_active_idx on public.store_memberships(user_id,store_id) where active;
create index store_categories_store_active_order_idx on public.store_categories(store_id,active,sort_order);
create index stores_status_idx on public.stores(status);
insert into public.stores(name,slug,status,created_by) values('MGW X-SALADA','mgw-x-salada','draft','9ea5631d-5045-480b-bd77-8d2ca50c6222');
alter table public.store_products add column store_id uuid,add column product_type text,add column category_id uuid,add column sort_order integer not null default 0;
update public.store_products p set store_id=s.id,product_type=p.category from public.stores s where s.slug='mgw-x-salada';
alter table public.store_products alter column store_id set not null,alter column product_type set not null,
 add constraint store_products_type_check check(product_type in('individual','combo')),
 add constraint store_products_store_fk foreign key(store_id) references public.stores(id) on delete restrict,
 add constraint store_products_store_category_fk foreign key(store_id,category_id) references public.store_categories(store_id,id) on delete restrict;
create index store_products_store_active_idx on public.store_products(store_id,active);
create index store_products_store_category_idx on public.store_products(store_id,category_id,active);
create index store_products_store_sort_idx on public.store_products(store_id,sort_order);
insert into public.store_public_settings(store_id,store_name,slogan,whatsapp_number,opening_hours,address,delivery_estimate,delivery_fee_note,is_open)
select s.id,ss.store_name,ss.slogan,ss.whatsapp_number,ss.opening_hours,ss.address,ss.delivery_estimate,ss.delivery_fee_note,ss.is_open
from public.stores s cross join public.store_settings ss where s.slug='mgw-x-salada';
insert into public.store_memberships(store_id,user_id,role)
select id,'9ea5631d-5045-480b-bd77-8d2ca50c6222'::uuid,'owner' from public.stores where slug='mgw-x-salada';
insert into public.platform_admins(user_id) values('9ea5631d-5045-480b-bd77-8d2ca50c6222'::uuid);
create or replace function private.is_platform_admin() returns boolean language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.platform_admins p where p.user_id=(select auth.uid()) and p.active and p.role='super_admin') $$;
create or replace function private.has_store_role(target_store uuid,allowed_roles text[]) returns boolean language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.store_memberships m where m.store_id=target_store and m.user_id=(select auth.uid()) and m.active and m.role=any(allowed_roles)) $$;
revoke all on function private.is_platform_admin() from public,anon;
revoke all on function private.has_store_role(uuid,text[]) from public,anon;
grant usage on schema private to authenticated;
grant execute on function private.is_platform_admin() to authenticated;
grant execute on function private.has_store_role(uuid,text[]) to authenticated;
alter table public.stores enable row level security;
alter table public.store_memberships enable row level security;
alter table public.platform_admins enable row level security;
alter table public.store_categories enable row level security;
alter table public.store_public_settings enable row level security;
create policy stores_public_active_read on public.stores for select to anon,authenticated using(status='active');
create policy stores_member_read on public.stores for select to authenticated using(private.has_store_role(id,array['owner','admin','editor','staff']) or private.is_platform_admin());
create policy memberships_self_or_admin_read on public.store_memberships for select to authenticated using(user_id=(select auth.uid()) or private.has_store_role(store_id,array['owner','admin']) or private.is_platform_admin());
create policy platform_admin_self_read on public.platform_admins for select to authenticated using(user_id=(select auth.uid()) and active);
create policy categories_public_active_read on public.store_categories for select to anon,authenticated using(active and exists(select 1 from public.stores s where s.id=store_id and s.status='active'));
create policy categories_member_read on public.store_categories for select to authenticated using(private.has_store_role(store_id,array['owner','admin','editor','staff']) or private.is_platform_admin());
create policy categories_editor_insert on public.store_categories for insert to authenticated with check(private.has_store_role(store_id,array['owner','admin','editor']));
create policy categories_editor_update on public.store_categories for update to authenticated using(private.has_store_role(store_id,array['owner','admin','editor'])) with check(private.has_store_role(store_id,array['owner','admin','editor']));
create policy categories_admin_delete on public.store_categories for delete to authenticated using(private.has_store_role(store_id,array['owner','admin']));
create policy public_settings_public_read on public.store_public_settings for select to anon,authenticated using(exists(select 1 from public.stores s where s.id=store_id and s.status='active'));
create policy public_settings_member_read on public.store_public_settings for select to authenticated using(private.has_store_role(store_id,array['owner','admin','editor','staff']) or private.is_platform_admin());
create policy public_settings_admin_insert on public.store_public_settings for insert to authenticated with check(private.has_store_role(store_id,array['owner','admin']));
create policy public_settings_admin_update on public.store_public_settings for update to authenticated using(private.has_store_role(store_id,array['owner','admin'])) with check(private.has_store_role(store_id,array['owner','admin']));
create policy products_member_read on public.store_products for select to authenticated using(private.has_store_role(store_id,array['owner','admin','editor','staff']) or private.is_platform_admin());
create policy products_member_insert on public.store_products for insert to authenticated with check(private.has_store_role(store_id,array['owner','admin','editor']));
create policy products_member_update on public.store_products for update to authenticated using(private.has_store_role(store_id,array['owner','admin','editor'])) with check(private.has_store_role(store_id,array['owner','admin','editor']));
create policy products_admin_delete on public.store_products for delete to authenticated using(private.has_store_role(store_id,array['owner','admin']));
grant select on public.stores,public.store_categories,public.store_public_settings to anon,authenticated;
grant select,insert,update,delete on public.store_categories to authenticated;
grant select on public.store_memberships,public.platform_admins to authenticated;
grant insert,update on public.store_public_settings to authenticated;
grant select,insert,update,delete on public.store_products to authenticated;
grant select on public.store_products to anon;
do $verify$
declare mgw uuid;
begin
 select id into mgw from public.stores where slug='mgw-x-salada';
 if mgw is null or (select count(*) from public.store_products where store_id=mgw)<>6 then raise exception 'Validacao de produtos MGW falhou'; end if;
 if (select count(*) from public.store_public_settings where store_id=mgw)<>1 then raise exception 'Configuracao MGW ausente'; end if;
 if exists(select 1 from public.store_products where store_id is null or product_type is null) then raise exception 'Produto sem loja/tipo'; end if;
 if (select count(*) from public.store_products where category_id is not null)<>0 then raise exception 'Categoria atribuida indevidamente'; end if;
 if (select count(*) from public.store_settings)<>1 then raise exception 'Tabela legada alterada'; end if;
end $verify$;
commit;
-- ATENCAO: policies legadas permissivas continuam coexistindo e combinam por OR.
-- Nao criar segunda loja nem executar em producao antes do frontend escopado,
-- corte controlado das policies legadas e policies Storage por prefixo.
