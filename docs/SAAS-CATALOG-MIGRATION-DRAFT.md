# Rascunho de migração do catálogo SaaS

**Status: proposta para revisão — não executar.**  
Este documento não é uma migration SQL e não autoriza alterações no Supabase.

## Objetivo

Preparar a separação de catálogo e configurações por estabelecimento, preservando o cardápio MGW, seus seis produtos, a configuração atual, as imagens e o fluxo de pedido pelo WhatsApp.

## Decisão importante: tipo de produto não é categoria

No sistema atual, `store_products.category` aceita apenas `individual` e `combo`. Esses valores representam o formato/tipo do item exibido no cardápio, não categorias comerciais como Lanches, Bebidas ou Sobremesas.

Na estrutura futura, não reutilizar esse campo como categoria configurável.

Proposta:
- `product_type`: mantém os valores legados `individual` e `combo` (com possibilidade de expandir após decisão).
- `category_id`: referência opcional a uma categoria criada pela própria loja.
- `store_categories`: categorias comerciais independentes por loja.

A interface poderá continuar mostrando as seções Individual e Combo, enquanto filtros e navegação por categorias comerciais serão independentes. Não remover nem renomear a apresentação existente nesta etapa.

## Modelo de dados proposto

### `store_categories`

- `id`: UUID, chave primária.
- `store_id`: UUID obrigatório, FK para `stores`.
- `name`: nome visível.
- `slug`: identificador normalizado e único dentro da loja.
- `description`: texto opcional.
- `sort_order`: inteiro para ordenação.
- `active`: booleano.
- `created_at`, `updated_at`: timestamps.

Índices/constraints propostos:
- unicidade de `(store_id, slug)`;
- índice de consulta por `(store_id, active, sort_order)`;
- FK com comportamento de exclusão restritivo ou controlado; não apagar categoria automaticamente se houver produtos associados.

### `store_products`

Manter os campos atuais sempre que possível:
- `id`, `name`, `description`, `price`, `image_url`, `active`, `highlight`, `included_items`, `updated_at`.

Adicionar:
- `store_id`: UUID obrigatório após a migração;
- `category_id`: UUID opcional, FK para `store_categories`;
- `product_type`: recebe os valores atuais de `category` (`individual` ou `combo`).

A coluna antiga `category` deve permanecer durante uma fase de compatibilidade. Só poderá ser removida em uma migration posterior, após confirmação de que nenhuma versão publicada do app depende dela.

### `store_settings`

Converter de uma única linha global (`id = 1`) para uma linha por loja:
- `store_id`: UUID, chave primária e FK para `stores`;
- preservar `store_name`, `slogan`, `whatsapp_number`, `opening_hours`, `address`, `delivery_estimate`, `delivery_fee_note`, `is_open`;
- adicionar, após validar a necessidade e os nomes finais, `logo_url`, `primary_color`, `secondary_color`;
- preservar `updated_at`.

A linha atual MGW deve ser copiada para a loja MGW sem perder os valores. A linha antiga não deve ser apagada até concluir validação e rollback.

## Migração da MGW

1. Criar/identificar a linha da loja MGW com slug aprovado.
2. Associar os seis produtos existentes ao ID dessa loja.
3. Copiar o valor atual de `category` para `product_type`, mantendo `individual` e `combo` sem reinterpretar.
4. Manter `category_id` nulo inicialmente; não inventar categorias comerciais para os produtos.
5. Copiar a configuração atual para a linha de settings da MGW.
6. Preservar IDs dos produtos, `included_items`, URLs de imagem e timestamps sempre que possível.
7. Conferir contagens, valores, imagens e funcionamento do pedido WhatsApp antes de qualquer corte do modelo antigo.

A migração precisa ser idempotente: reexecutá-la não pode duplicar loja, produtos, categorias ou configurações.

## Storage e imagens

- Não mover nem renomear objetos do bucket `product-images` nesta primeira migração.
- Preservar as URLs existentes para que o cardápio continue exibindo as imagens.
- Novos uploads deverão usar caminho isolado por loja, por exemplo `{store_id}/{product_id}/{filename}`.
- A política de Storage deverá validar a associação do usuário à mesma loja; ocultar caminhos na interface não é segurança.
- A migração dos objetos antigos para pastas por loja fica para etapa separada, com cópia, verificação e rollback.

## Segurança e integridade

- RLS deve restringir leitura pública às informações necessárias para cardápios publicados.
- Escritas devem exigir associação ativa à loja e papel autorizado.
- Toda consulta e alteração de produto/configuração deve incluir e validar `store_id`.
- Constraints e índices únicos devem sempre considerar `store_id`.
- Não confiar em `store_id` enviado pelo navegador sem validação por RLS.
- Não usar `service_role` no cliente.

## Questões que precisam de decisão antes do SQL executável

1. Confirmar se categorias comerciais (ex.: Lanches, Bebidas) serão usadas já no MVP ou se a primeira versão terá apenas Individual/Combo.
2. Definir se um produto poderá pertencer a uma única categoria ou a várias. A proposta inicial é uma categoria opcional por produto.
3. Aprovar o slug definitivo da loja MGW.
4. Definir se categorias inativas escondem produtos no cardápio público ou apenas no painel.
5. Aprovar o comportamento de exclusão/arquivamento de categorias e produtos.

## Critérios para aprovar a futura migration

- Backup verificável e plano de rollback documentado.
- Migration versionada, transacional quando possível e idempotente.
- Comparação antes/depois dos seis produtos e uma configuração MGW.
- Teste de acesso cruzado com duas lojas e usuários distintos.
- Testes de RLS e Storage com usuário anônimo, membro autorizado e membro de outra loja.
- Nenhuma alteração na produção até revisão explícita e autorização do usuário.

---
**Nenhum banco, Storage, dado de produção, branch `main` ou configuração de produção foi alterado por este rascunho.**
