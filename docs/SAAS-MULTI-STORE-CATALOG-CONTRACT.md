# Contrato técnico do catálogo multi-loja

**Status:** proposta técnica para revisão.  
**Escopo:** contrato de dados e comportamento do catálogo; não implementa telas, não altera banco e não autoriza migração.

## 1. Decisões que este contrato respeita

- Cada loja possui catálogo independente.
- Não existe limite técnico artificial de 6, 40 ou 100 produtos.
- Categorias comerciais (ex.: Lanches, Bebidas, Sobremesas) são entidades próprias da loja.
- Tipo do produto é separado da categoria: `individual` ou `combo`.
- Cada produto pode ter zero ou uma categoria comercial.
- Produtos e categorias são desativados/arquivados logicamente por padrão; não há exclusão em cascata.
- Categoria inativa e produtos associados ficam ocultos no menu público, mas continuam visíveis no painel para reativação/edição.
- A tabela legada `store_settings` permanece intacta. A configuração multi-loja usa `store_public_settings`.
- O fluxo atual de pedido pelo WhatsApp e o carrinho devem ser preservados.

## 2. Modelo lógico

### Produto

Campos esperados na camada de domínio:

| Campo | Regra |
|---|---|
| `id` | Identificador estável |
| `store_id` | Obrigatório; identifica a loja proprietária |
| `name` | Obrigatório, após trim |
| `product_type` | `individual` ou `combo` |
| `category_id` | Opcional; deve pertencer à mesma loja |
| `description` | Opcional |
| `price` | Numérico, finito e >= 0 |
| `image_url` | Opcional |
| `active` | Booleano; controla publicação |
| `highlight` | Booleano |
| `included_items` | Usado para detalhar combos; manter formato legado durante compatibilidade |
| `sort_order` | Inteiro para ordenação manual |
| `created_at`, `updated_at` | Datas geridas de forma consistente |

Não renomear nem descartar o campo legado `category` até a versão antiga do frontend deixar de depender dele. Na transição, mapear `category` para `product_type` sem alterar o valor original.

### Categoria comercial

- `id`, `store_id`, `name`, `slug`, `active`, `sort_order`, `created_at`, `updated_at`.
- `slug` único dentro da loja, não globalmente.
- Nome e slug normalizados; impedir duplicatas dentro da mesma loja.
- Desativar categoria não apaga produtos nem referências.

### Configuração pública

A camada multi-loja lê `store_public_settings`, uma linha por `store_id`, com nome público, slogan, WhatsApp, horário, endereço, estimativa de entrega, aviso de taxa, estado aberto/fechado e identidade visual. Dados privados ou credenciais não pertencem a esta tabela pública. A tabela legada `store_settings` continua preservada durante a migração.

## 3. Contrato de acesso aos dados

Toda operação recebe o contexto explícito da loja selecionada. Não existe consulta de catálogo sem `store_id`.

- Listagem pública: filtrar por `store_id` e `active = true`; validar também se a categoria associada está ativa.
- Painel: filtrar por `store_id`, incluindo itens inativos quando solicitado.
- Buscar/editar/desativar: filtrar simultaneamente por `id` e `store_id`; tratar zero linhas afetadas como não encontrado/sem acesso.
- Criar: gravar o `store_id` selecionado e validar que a categoria pertence à mesma loja.
- Categoria: todas as operações usam `store_id`; nunca confiar em ID fornecido pelo cliente sem validar associação.
- Configuração: ler e salvar apenas a linha de `store_public_settings` da loja selecionada.
- Segurança real é aplicada no banco por RLS. Filtros no frontend melhoram correção, mas não substituem RLS.
- Não usar `user_metadata` como fonte de autorização, nem expor `service_role` no navegador.

É proibido usar consultas globais como `select('*')` sem filtro de loja. O frontend legado atual ainda consulta todos os produtos; por isso, nenhuma segunda loja pode ser ativada antes da implantação e verificação da versão com escopo por loja.

## 4. Operações do painel

### Produtos

1. **Criar:** validar nome, preço, tipo, categoria opcional e campos de combo; salvar associado à loja atual.
2. **Editar:** carregar pelo par loja/produto; preservar campos não alterados e imagem atual.
3. **Desativar:** mudar `active` para false; não excluir registro nem imagem.
4. **Reativar:** validar novamente categoria e dados obrigatórios antes de publicar.
5. **Ordenar/destacar:** atualizar `sort_order` e `highlight` apenas dentro da loja.

### Categorias

1. Criar com nome, slug e ordem.
2. Renomear/reordenar sem mudar o vínculo dos produtos.
3. Desativar sem apagar categoria nem produtos; ocultar os produtos vinculados no menu público.
4. Reativar e tornar visíveis novamente os produtos que também estejam ativos.
5. Não permitir mover produto para categoria de outra loja.

### Combos

- Preservar `included_items` durante a migração.
- Validar a estrutura do conteúdo no painel antes de salvar.
- Não transformar automaticamente combos em produtos individuais.
- A apresentação e o pedido devem manter os detalhes dos itens incluídos.

## 5. Imagens

- Manter URLs e objetos atuais sem mover ou renomear durante a primeira migração.
- Novos uploads usam caminho isolado: `{store_id}/{product_id}/{filename}`.
- Validar MIME real e tamanho no upload; manter o limite atual como referência inicial até decisão de produto.
- Ao substituir imagem, primeiro concluir o upload e salvar a nova URL; só depois considerar limpeza da imagem antiga.
- RLS do Storage deve validar associação do usuário à loja e o prefixo do caminho.
- Desativar produto não apaga imagem.

## 6. Escala e experiência

O número de produtos não deve ser limitado pelo código da interface. Para listas maiores:

- Paginação no painel (tamanho inicial sugerido: 20 ou 50 por página), sem truncar o catálogo total.
- Busca por nome e descrição; filtros por categoria, tipo e status.
- Ordenação por nome, preço, atualização e ordem manual.
- Contagem total e estado vazio/erro/carregamento claros.
- Índices iniciais candidatos: `(store_id, active)`, `(store_id, category_id, active)` e `(store_id, sort_order)`; confirmar com planos de consulta antes de adicionar índices extras.
- Testar catálogos com 6, 40, 100 e 500 produtos por loja.
- Compressão/redimensionamento de imagens no cliente ou pipeline controlado, sem degradar imagens já publicadas.

## 7. Carrinho, checkout e WhatsApp

- Um carrinho pertence a uma única loja.
- Ao trocar de loja, não misturar itens; limpar ou solicitar confirmação antes de trocar o contexto do carrinho.
- Checkout valida novamente disponibilidade, preço e pertencimento de cada produto à loja.
- O texto enviado ao WhatsApp identifica a loja e contém apenas itens daquele catálogo.
- Preservar o fluxo atual do MGW na primeira etapa de migração.

## 8. Regras de autorização

| Perfil | Catálogo |
|---|---|
| Público | Ler somente produtos ativos e categorias ativas da loja publicada |
| Owner/Admin | Criar, editar, ordenar, ativar/desativar produtos e categorias |
| Editor | Gerenciar catálogo, sem administrar membros ou propriedade da loja |
| Staff | Consultar catálogo no painel; sem escrita |
| Super Admin | Acesso de plataforma separado, auditável e protegido |

RLS deve impor isolamento por loja em SELECT/INSERT/UPDATE/DELETE e Storage. Testar também usuário autenticado de outra loja, membro inativo e usuário sem associação. Não confiar apenas em permissões calculadas no React.

## 9. Compatibilidade e liberação em duas fases

### Fase A — MGW somente

- Migrar MGW sem alterar IDs, imagens, seis produtos existentes ou pedidos/fluxo atual.
- Frontend passa a resolver loja e filtrar todas as consultas por `store_id`.
- Painel passa a usar operações escopadas e `store_public_settings`.
- Testar menu público, painel, carrinho e WhatsApp com o catálogo real.
- Manter tabela e políticas legadas durante janela de compatibilidade controlada.

### Fase B — segunda loja

Só liberar após comprovar que todos os caminhos de leitura, gravação, upload, carrinho e checkout estão escopados. Criar loja de teste, cadastrar produtos e categorias, e executar testes cruzados antes de publicar.

## 10. Critérios de aceite

- [ ] Uma loja nunca lê nem altera produtos/categorias/configurações de outra.
- [ ] Testes de catálogo com 6, 40, 100 e 500 produtos passam.
- [ ] Busca, filtros, paginação e ordenação funcionam sem perder registros.
- [ ] Produtos sem categoria continuam válidos.
- [ ] Produto em categoria inativa não aparece publicamente, mas continua no painel.
- [ ] Reativação restaura a visibilidade somente quando produto e categoria estiverem ativos.
- [ ] Combos mantêm itens incluídos e apresentação correta.
- [ ] Imagens existentes continuam carregando; novos uploads ficam isolados por loja.
- [ ] Carrinho não mistura lojas; WhatsApp recebe pedido correto.
- [ ] Testes RLS negativos bloqueiam acesso cruzado e autoelevação.
- [ ] Versão antiga não é capaz de exibir dados de uma segunda loja.

## 11. Fora do escopo desta etapa

Este documento não cria tabelas, políticas, APIs, telas ou migrações. Não executa SQL, não modifica Supabase, dados de produção, Vercel ou branch `main`. A implementação deve ser dividida em etapas pequenas, com revisão do diff, testes automatizados, build e autorização antes de qualquer alteração de produção.
