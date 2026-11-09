# Revisão da migration SaaS — rascunho técnico

**Status: NÃO EXECUTAR.** Este documento é uma especificação revisável, não uma migration oficial do Supabase. Não foi criado em `supabase/migrations`, não foi aplicado ao banco e não altera dados de produção.

## 1. Escopo desta proposta

Preparar a primeira migração multi-loja mantendo o cardápio MGW funcional. O desenho considera:
- uma loja MGW identificada pelo slug proposto `mgw-x-salada`;
- seis produtos legados;
- uma linha de configurações legada (`id = 1`);
- categoria legada `individual | combo` como tipo de produto;
- categorias comerciais novas, uma categoria opcional por produto;
- preservação dos IDs, URLs de imagens, dados de pedido e fluxo WhatsApp.

Não inclui cobrança, domínio personalizado, migração física dos objetos Storage nem ativação de painel Super Admin.

## 2. Bloqueios que impedem execução

Antes de transformar este desenho em migration executável, precisam ser confirmados:
1. UUID do usuário Auth que será owner inicial da MGW (não usar e-mail como chave de autorização).
2. Aprovação explícita do slug `mgw-x-salada`.
3. Confirmação das decisões de catálogo documentadas em `SAAS-CATALOG-MVP-DECISIONS.md`.
4. Estado atual do esquema, policies, grants, triggers, funções e constraints diretamente no projeto, imediatamente antes da execução.
5. Backup verificável e procedimento de rollback testado.
6. Ambiente de teste separado ou estratégia de validação sem alterar produção. Não criar recurso pago sem autorização.

Sem esses itens, a migração fica bloqueada.

## 3. Pré-verificações obrigatórias

A futura migration deverá abortar se qualquer pressuposto falhar:
- tabelas legadas `public.store_products` e `public.store_settings` existem;
- existem exatamente seis produtos MGW esperados e uma configuração legada, ou os números foram revisados manualmente;
- nenhum produto já está associado a uma loja diferente;
- slug MGW não está ocupado por outra loja;
- usuário owner inicial existe em `auth.users` e seu UUID foi confirmado;
- colunas e constraints reais correspondem ao esquema auditado;
- extensão/funções necessárias para UUID estão disponíveis.

Não presumir que o estado do banco permaneceu igual desde a auditoria. Reconsultar antes da execução.

## 4. Estrutura de destino proposta

### `public.stores`
- `id uuid primary key default gen_random_uuid()`
- `name text not null`
- `slug text not null unique`
- `status text not null` com valores `draft | active | suspended | archived`
- `created_by uuid references auth.users(id)`
- `created_at`, `updated_at`

### `public.store_memberships`
- `id uuid primary key default gen_random_uuid()`
- `store_id uuid not null references stores(id)`
- `user_id uuid not null references auth.users(id)`
- `role text not null` com valores `owner | admin | editor | staff`
- `active boolean not null default true`
- timestamps
- `unique (store_id, user_id)`

### `public.platform_admins`
- `user_id uuid primary key references auth.users(id)`
- `role = 'super_admin'`
- `active boolean not null default true`
- `created_at`

O cadastro do primeiro Super Admin deve ser uma operação separada e confiável. Não provisionar por e-mail nem permitir autoelevação pelo cliente.

### `public.store_categories`
- `id uuid primary key default gen_random_uuid()`
- `store_id uuid not null references stores(id)`
- `name text not null`
- `slug text not null`
- `description text null`
- `sort_order integer not null default 0`
- `active boolean not null default true`
- timestamps
- `unique (store_id, slug)`
- índice por `(store_id, active, sort_order)`

### `public.store_products` (expansão compatível)
Adicionar:
- `store_id uuid null` durante a transição, depois validar preenchimento e tornar NOT NULL;
- `product_type text null` durante a transição, preenchido a partir do `category` legado;
- `category_id uuid null`.

Adicionar FK composta para impedir referência cruzada entre lojas:
`foreign key (store_id, category_id) references store_categories(store_id, id)`.
A constraint e a ordem das colunas devem ser conferidas no PostgreSQL antes da migration final. Manter `category` legado durante todo o período de compatibilidade.

### `public.store_settings` (transição)
Adicionar `store_id uuid null` inicialmente. A proposta final é uma configuração por loja, com unicidade em `store_id`. Preservar a linha `id = 1` até a validação do frontend novo e rollback. Campos atuais permanecem; novos campos de branding (`logo_url`, `primary_color`, `secondary_color`) só serão adicionados após confirmar contrato final.

## 5. Ordem de migração proposta

1. Executar prechecks e obter contagens/assinaturas dos dados legados.
2. Criar `stores`, `store_memberships`, `platform_admins` e `store_categories` com RLS habilitada desde o início.
3. Criar a loja MGW em estado `draft`, com slug aprovado e ID estável capturado pela própria migration.
4. Criar membership `owner` usando o UUID Auth confirmado; sem associação automática por e-mail.
5. Adicionar as colunas compatíveis em `store_products` e `store_settings`.
6. Preencher `store_id` nos seis produtos e na configuração MGW.
7. Copiar `category` para `product_type` sem alterar os valores. Não criar nem atribuir categorias comerciais automaticamente; `category_id` fica NULL.
8. Validar contagens, valores, IDs, `included_items`, URLs e timestamps.
9. Criar constraints e índices finais; somente depois de confirmar zero nulos/órfãos tornar `store_id` NOT NULL.
10. Aplicar policies RLS e grants específicos por operação e papel. Não copiar policies antigas cegamente; documentar como cada policy antiga será mantida, substituída ou removida.
11. Manter compatibilidade do frontend legado até a nova versão consultar os dados com escopo de loja.
12. Publicar a loja MGW como `active` apenas após teste completo de catálogo, painel, carrinho e WhatsApp.

## 6. Segurança RLS — critérios para SQL final

A migration final precisa conter políticas separadas e testadas para:
- leitura pública somente de loja ativa, produtos ativos e categorias ativas;
- leitura de dados privados apenas por usuário autenticado com membership ativa na loja;
- escrita de produtos/categorias/configurações limitada a owner/admin/editor conforme matriz de permissões;
- staff sem permissão de escrita;
- membership e plataforma protegidas contra insert/update/delete pelo cliente;
- isolamento por `store_id` em toda consulta e mutação;
- Storage validado por membership da mesma loja no caminho do objeto.

Não confiar em `store_id` enviado pelo browser. Não usar `user_metadata` para autorização. Nunca colocar `service_role` no frontend. UPDATE policies precisam de SELECT policy compatível e `USING` + `WITH CHECK`. Qualquer função privilegiada precisa de revisão de segurança específica; preferir invoker quando possível.

A política legada que permite o e-mail administrativo fixo não pode ser removida até o novo fluxo estar implantado, testado e houver plano de rollback. Não manter uma policy antiga ampla que permita contornar o isolamento multi-loja depois do corte.

## 7. Plano de rollback proposto

O rollback deve ser planejado por fases:
- **Antes do corte do frontend:** remover apenas colunas/tabelas novas criadas nesta migration, depois de confirmar que não receberam dados externos; restaurar policies antigas somente se a migration as tiver alterado.
- **Depois de dados novos:** não apagar tabelas/colunas que contenham dados de lojas adicionais. Primeiro exportar e preservar dados; reverter o frontend para leitura legada somente para MGW.
- **Depois de novas imagens:** manter os objetos Storage; não apagar arquivos durante rollback.
- **Depois de novas lojas ativas:** rollback automático destrutivo não é permitido; exigir procedimento de recuperação por loja.

A migration executável deverá incluir um procedimento de reversão correspondente ao estágio real de implantação. Não usar `DROP ... CASCADE`.

## 8. Testes de aceitação obrigatórios

- Contagem e conteúdo dos seis produtos MGW antes/depois.
- Uma configuração MGW preservada.
- Mesmos IDs de produtos e URLs de imagens.
- Carrinho e checkout WhatsApp funcionais.
- Usuário MGW não acessa outra loja.
- Usuário de outra loja não acessa MGW.
- Usuário anônimo só vê catálogo público ativo.
- Staff não altera catálogo.
- Editor altera apenas o escopo autorizado.
- Owner/admin gerenciam apenas sua loja.
- Ninguém consegue conceder a si próprio papel ou Super Admin.
- Categoria inativa oculta os produtos associados no público, sem apagar os dados.
- Verificação de policies, grants e Storage.

## 9. Próxima ação segura

Depois de confirmar os bloqueios, gerar a migration formal pelo fluxo Supabase CLI apropriado, revisar o SQL gerado e validar em ambiente não produtivo. A execução em produção exigirá uma autorização separada e explícita.

---
**Este documento não é executável e nenhuma alteração foi feita no Supabase, no Storage, na branch `main` ou no ambiente de produção.**
