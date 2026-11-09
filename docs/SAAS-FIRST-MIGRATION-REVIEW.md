# SQL de migração SaaS — rascunho corrigido para revisão

**Status: NÃO EXECUTAR.** Arquivo de estudo, fora de `supabase/migrations`. Nenhuma alteração no banco foi feita.

## Identidade inicial

A conta `warney.fernandes22@gmail.com` foi validada anteriormente por consulta somente leitura. UUID de referência para o bootstrap inicial:

`9ea5631d-5045-480b-bd77-8d2ca50c6222`

A senha permanece exclusivamente no Supabase Auth. Não será solicitada, copiada para SQL, armazenada no GitHub ou codificada no frontend.

## Correção estrutural aplicada

O rascunho SQL anterior tentava adicionar `store_id` à tabela legada `store_settings` e impor unicidade por loja. Isso conflita com a estrutura de produção, que possui `id integer primary key check (id = 1)`.

A proposta foi corrigida:

- **Não altera** `public.store_settings`; permanece com a única linha legada.
- Cria `public.store_public_settings`, com uma linha por `store_id`.
- Cria `stores`, `store_memberships`, `platform_admins` e `store_categories`.
- Expande `store_products` com `store_id`, `product_type`, `category_id` e `sort_order`.
- Mantém os seis produtos e IDs; copia o tipo legado de `category` para `product_type`.
- Mantém `category_id` nulo nos seis produtos; nenhuma categoria comercial é inventada.
- Mantém URLs e objetos de imagem atuais sem mover os arquivos.
- Cria a MGW com slug `mgw-x-salada` em estado `draft`; não habilita publicação nem segunda loja.

## Por que ainda não é executável

O SQL continua sendo apenas uma proposta estrutural. Não inclui policies finais, grants, funções de autorização nem políticas de Storage. As tabelas novas ficam fechadas por RLS até a implementação da autorização.

Bloqueios antes de qualquer execução:

1. Backup integral verificável e rollback testado. O backup manual atual é parcial.
2. Teste em ambiente Supabase isolado.
3. Reconsulta do schema, policies, grants, triggers e objetos Storage imediatamente antes da migration.
4. Implementação e revisão das policies por loja, papéis e leitura pública.
5. Remoção controlada das policies legadas por e-mail somente no corte validado.
6. Policies Storage compatíveis com objetos antigos e caminho novo `{store_id}/{product_id}/{filename}`.
7. Testes negativos de isolamento entre duas lojas, staff/editor/admin/owner e usuário anônimo.
8. Atualização de todos os caminhos frontend antes de ativar outra loja.

## Critérios de avanço

- Revisar SQL, RLS, grants e Storage linha a linha.
- Validar migration em ambiente isolado com dados equivalentes.
- Testar restauração e rollback.
- Confirmar que o frontend não consulta catálogo global e que carrinho/checkout não misturam lojas.
- Obter autorização explícita separada antes de qualquer execução no Supabase de produção.

**Nenhuma tabela, policy, grant, função, sessão Auth, objeto Storage, produto ou configuração foi alterada.** O commit deste documento altera somente a documentação no branch de desenvolvimento.
