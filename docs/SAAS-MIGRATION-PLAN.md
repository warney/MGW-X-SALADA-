# Plano de evolução SaaS — MGW X-SALADA

## Objetivo
Evoluir o cardápio atual para uma plataforma multiestabelecimento, preservando o comportamento e o visual do cardápio MGW. Cada estabelecimento terá catálogo, configurações, identidade visual, usuários e permissões próprios.

## Estado atual confirmado no código
- Aplicação React 19 + TypeScript + Vite.
- O `StoreProvider` carrega todos os registros de `store_products` e uma única linha de `store_settings` com `id = 1`.
- Os dados de produtos e configurações são gravados diretamente pelo navegador no Supabase.
- A categoria está limitada a `individual | combo` no tipo TypeScript e a apresentação possui seções específicas para essas duas categorias.
- O carrinho é local e o checkout encaminha o pedido ao WhatsApp configurado.
- O painel atual autentica um único e-mail administrativo fixo.
- O bucket de imagens atual é `product-images`, sem isolamento por estabelecimento no caminho dos objetos.
- O servidor Express atual não oferece API de negócio para o SaaS; o app acessa Supabase pelo cliente.

## Princípios obrigatórios
1. Não modificar a branch `main` durante o desenvolvimento.
2. Não executar migrações nem alterações no projeto Supabase de produção nesta fase.
3. Não criar projeto ou database branch Supabase pago.
4. Não expor `service_role` ou secret keys no navegador.
5. Não remover nem substituir os dados existentes da MGW.
6. Preservar carrinho, checkout por WhatsApp, imagens e estrutura visual atual.
7. Toda mudança de banco deve ter migração revisada, backup e plano de reversão.
8. Cada loja deve acessar apenas seus próprios dados, com RLS validando associação e papel do usuário.

## Modelo de dados alvo (proposta, ainda não aplicada)
- `stores`: identidade e ciclo de vida do estabelecimento (id, name, slug, status, created_at).
- `store_memberships`: associação usuário/loja e papel (owner, admin, editor, staff).
- `store_settings`: configurações vinculadas por `store_id`, incluindo logo, cores, WhatsApp, endereço, horários e entrega.
- `store_categories`: categorias configuráveis por loja.
- `store_products`: produtos vinculados por `store_id` e, quando aplicável, `category_id`.
- `platform_admins`: lista controlada de superadministradores, sem autoelevação pelo cliente.
- `store_subscriptions`: plano, validade e estado comercial da loja.

A migração deve preservar a loja MGW como primeiro registro e associar a ela os seis produtos, a configuração existente e as referências às imagens atuais. A forma exata de manter compatibilidade temporária com o esquema legado será definida antes da primeira migração.

## Sequência de implementação
### Fase A — fundação no código (sem tocar no banco)
1. Criar tipos de domínio para Store, StoreRole, StoreCategory e identidade da loja.
2. Definir resolução de loja por slug/host com fallback explícito para a loja MGW durante a transição.
3. Separar a identidade/seleção da loja da lógica de catálogo e carrinho.
4. Generalizar a navegação de categorias sem alterar classes, espaçamentos ou aparência do cardápio atual.
5. Adicionar testes ou verificações estáticas para garantir que o fluxo MGW continue compatível.

### Fase B — autenticação e autorização
1. Substituir a regra de e-mail fixo por associação usuário/loja e papéis.
2. Implementar verificações de autorização no banco via RLS.
3. Criar área Super Admin separada do painel de cada estabelecimento.
4. Impedir que um usuário altere sua própria função ou se torne Super Admin.

### Fase C — banco e Storage
1. Revisar e aprovar migração SQL em arquivo versionado.
2. Criar tabelas e índices com constraints e políticas RLS por loja.
3. Migrar os dados MGW de forma idempotente, mantendo IDs e URLs existentes quando possível.
4. Organizar novos uploads em caminhos por loja, por exemplo `{store_id}/{product_id}/{filename}`.
5. Validar isolamento entre duas lojas antes de considerar a migração concluída.

### Fase D — publicação e operação
1. Publicar cardápios por slug.
2. Permitir personalização de logo, nome, cores, produtos e categorias.
3. Implementar status de loja e licenças/planos.
4. Só depois avaliar domínio próprio por estabelecimento e cobrança recorrente.

## Primeiro incremento aprovado para implementação
O primeiro incremento de código deve ser estritamente aditivo: criar os tipos e contratos de domínio SaaS, sem mudar consultas Supabase, tabelas, autenticação, UI, layout ou deploy. A alteração será feita somente nesta branch e revisada antes de qualquer etapa funcional.

## Critérios de aceite do primeiro incremento
- Tipos claros para loja, papel de membro e categoria.
- Nenhuma alteração em `src/context/StoreContext.tsx`, `src/App.tsx`, `src/lib/supabase.ts` ou arquivos de UI.
- Nenhuma migração SQL ou mudança no Supabase.
- Nenhuma mudança em `main` ou no site publicado.
- Diferenças pequenas, rastreáveis e fáceis de reverter.
