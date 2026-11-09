# Estratégia compatível de migração do cardápio legado

**Status: desenho técnico para revisão — NÃO EXECUTAR.** Nenhuma tabela, coluna, policy ou dado foi alterado.

## 1. Decisão central
Não transformar a tabela `public.store_settings` atual diretamente em uma tabela multi-loja na primeira migração. Ela tem `id` como PK e CHECK `id = 1`; além disso, o frontend legado lê e grava usando `.eq('id', 1)` e `upsert(..., { onConflict: 'id' })`. Remover o CHECK ou trocar a PK agora quebraria o contrato atual e o rollback.

Proposta: manter `store_settings` intacta durante a transição e criar uma nova tabela multi-loja `store_public_settings` (nome provisório) com `store_id` como PK/FK para `stores.id`. A nova aplicação migra para essa tabela por etapas. A tabela legada fica congelada para a loja MGW até o corte final e só poderá ser arquivada depois de comprovada a compatibilidade.

## 2. Contratos de dados propostos

### `store_settings` (legada)
- Não alterar PK, CHECK, colunas ou policy nesta etapa.
- Manter exatamente a linha `id = 1` para o cardápio legado MGW.
- Nenhuma loja nova pode usar essa tabela.
- Durante a coexistência, somente a versão legada MGW poderá gravar nela.

### `store_public_settings` (nova)
- `store_id uuid primary key references stores(id)`.
- Campos públicos necessários ao menu: `store_name`, `slogan`, `whatsapp_number`, `opening_hours`, `address`, `delivery_estimate`, `delivery_fee_note`, `is_open`, `logo_url`, `primary_color`, `secondary_color`.
- Campos de administração que não devam ser públicos devem ficar em tabela separada ou ser excluídos do DTO público.
- `created_at` e `updated_at` com defaults/trigger definidos e testados.
- RLS: público lê apenas configurações de loja ativa; owner/admin podem editar somente sua loja; editor/staff sem escrita.
- Não incluir secrets, tokens ou dados privados de clientes.

### `store_products` (compatibilidade gradual)
- Adicionar `store_id` e `product_type` em expansão compatível; manter `category` legado (`individual|combo`) até remover o frontend antigo.
- `category_id` opcional aponta para `store_categories`; `category` não é categoria comercial.
- A nova aplicação deve sempre filtrar por `store_id` resolvido e respeitar estado ativo de loja/produto/categoria.
- Antes de existir a nova aplicação em produção, não cadastrar produtos de outra loja nesta tabela: a versão antiga consulta `select('*')` sem filtro e poderia exibir produtos de terceiros no cardápio MGW.
- Antes do corte, trocar `upsert` por `id` isolado por uma operação que valide o escopo da loja e conflito composto/ID globalmente único.

### `store_categories`
- Categorias comerciais reais, independentes do tipo `individual|combo`.
- `store_id`, `name`, `slug`, `active`, `sort_order`, timestamps.
- Uma categoria opcional por produto no MVP; FK composta `(store_id, category_id)` impede associação cruzada.
- Produtos sem `category_id` continuam visíveis na seção de tipo legado durante o período de compatibilidade.

## 3. Migração inicial sem interromper o MGW
1. Revalidar schema e dados imediatamente antes da migração.
2. Criar as estruturas SaaS e criar MGW como `draft` com slug aprovado.
3. Associar os seis produtos legados à loja MGW e copiar `category` para `product_type`, sem modificar `category`.
4. Criar uma linha em `store_public_settings` copiando os campos da linha legada `id = 1`; manter a linha original sem alteração.
5. Criar categorias comerciais sem atribuí-las automaticamente aos seis produtos; `category_id` permanece NULL.
6. Validar igualdade dos campos e contagens entre legado e novo registro.
7. Manter MGW como único catálogo ativo e não permitir produtos de outras lojas enquanto a versão legada estiver servindo o domínio atual.

## 4. Compatibilidade do frontend em duas fases

### Fase A — aplicação de transição (MGW somente)
- Resolver a identidade MGW por slug/host com fallback controlado.
- Carregar produtos com filtro explícito `store_id` e configurações em `store_public_settings`.
- Mapear `product_type` e `category_id` sem alterar o layout existente durante a primeira implantação.
- Continuar lendo o campo `category` para compatibilidade até validar todos os componentes que dependem dele.
- Atualizar AdminModal para salvar produtos/configurações no escopo da loja e não fazer upsert global por ID.
- Atualizar upload de imagem para caminho `{store_id}/{product_id}/{filename}`; manter URLs e objetos antigos.
- Testar carrinho, checkout e WhatsApp antes de liberar o novo frontend.

### Fase B — ativar múltiplas lojas
- Somente após a Fase A estar publicada e verificada em todos os domínios/rotas.
- Criar loja adicional como `draft`; validar isolamento anon/authenticated.
- Ativar catálogo de teste com produtos próprios e garantir que MGW não os recebe.
- Liberar loja adicional somente após testes cruzados e policies de Storage aprovados.

## 5. Contrato de exibição do cardápio
- Navegação e agrupamento visual devem usar `store_categories`/`category_id`, não `product_type`.
- Tipo do produto controla apenas comportamento/estrutura (individual ou combo).
- Enquanto `category_id` for NULL, MGW pode manter agrupamento legado individual/combos para preservar o visual existente.
- Categoria inativa oculta os produtos associados no público, mas não os apaga e continua visível no painel.
- A ordem das categorias vem de `sort_order`; produtos podem manter ordenação por campo explícito ou ordem definida pelo painel.
- Paginação/busca/filtros devem ser adicionados para catálogos maiores sem limite técnico artificial.

## 6. Corte e rollback
- Não remover a tabela legada nem o campo `category` na primeira release.
- Não remover policies por e-mail até nova aplicação, memberships, RLS e Storage estarem testados.
- O corte das policies antigas deve ocorrer em janela única e controlada, com plano de retorno.
- Rollback de frontend: voltar para o commit estável anterior enquanto os dados legados permanecem intactos.
- Rollback de banco: preservar tabelas novas e dados de lojas adicionais; não executar DROP CASCADE.
- Não ativar outras lojas enquanto qualquer versão pública ainda consultar todos os produtos sem escopo.

## 7. Testes obrigatórios
1. A versão legada continua carregando exatamente os seis produtos MGW e a configuração id=1 durante a fase de transição.
2. A nova versão MGW carrega os mesmos seis produtos e os campos da configuração copiados.
3. Alterar nome/horário/WhatsApp no novo painel atualiza somente a linha `store_public_settings` da loja selecionada.
4. Alterar produto atualiza somente produto da loja selecionada.
5. Produtos de loja B nunca aparecem no cardápio MGW, nem por consulta direta.
6. Categoria de loja B não pode ser associada a produto MGW.
7. Categoria inativa esconde os produtos associados no público, sem perda de dados.
8. Carrinho não mistura itens de lojas diferentes.
9. Upload/replace/delete de imagem de loja B não pode ser feito por membro de MGW.
10. URLs das duas imagens existentes permanecem válidas após a migração.
11. Checkout continua montando o pedido WhatsApp com nome, preço, quantidade e observações corretos.
12. Catálogos com 6, 40 e 100 produtos carregam e podem ser administrados sem limite fixo.

## 8. Bloqueios antes do SQL executável
- Definir se `store_public_settings` terá apenas campos públicos ou se haverá tabela privada separada.
- Confirmar contrato final de branding (logo e cores) e se esses campos serão incluídos no MVP.
- Confirmar estratégia de IDs globais/escopo de upsert para produtos.
- Confirmar comportamento de versões antigas já abertas em celulares/cache durante o corte.
- Backup integral, ensaio de restauração e ambiente isolado continuam pendentes.
- Revisar a migration SQL e as policies com base no schema real atualizado.

**Conclusão:** manter a tabela `store_settings` legada intacta e introduzir uma nova tabela multi-loja é o caminho de menor risco para preservar o menu atual. Isso não ativa lojas adicionais por si só; o frontend precisa passar a filtrar por loja antes de qualquer segunda loja receber catálogo.