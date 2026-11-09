# Requisitos de escala e catálogo multiestabelecimento

**Projeto:** MGW X-SALADA SaaS  
**Branch:** `development/saas-foundation`  
**Status:** especificação de produto e arquitetura; não é migração SQL.

## 1. Objetivo

Cada estabelecimento deve administrar um catálogo independente, sem limite artificial de seis, trinta ou quarenta produtos imposto pelo código da aplicação. A solução deve suportar catálogos pequenos e grandes — por exemplo, 6, 40, 100 ou mais produtos — conforme os limites futuros de infraestrutura e de plano comercial.

Não se promete capacidade ilimitada: a capacidade real será validada por testes de desempenho e pelas cotas do banco, armazenamento e hospedagem.

## 2. Separação obrigatória de dados

Todo produto e categoria comercial pertence a um `store_id`.

- Uma loja só pode administrar os próprios produtos e categorias.
- Um visitante vê apenas o catálogo público da loja selecionada e ativa.
- A consulta pública deve sempre filtrar pelo estabelecimento resolvido.
- RLS deve validar a associação do usuário à loja e sua função.
- Nenhuma autorização pode depender apenas de esconder botões na interface.
- Testes devem comprovar que usuários de uma loja não leem nem alteram dados de outra.

## 3. Modelo do catálogo

Manter conceitos distintos:

| Campo/conceito | Exemplos | Finalidade |
|---|---|---|
| Categoria comercial | Lanches, Bebidas, Sobremesas | Organização livre criada pela loja |
| Tipo de produto | Individual, Combo | Comportamento/apresentação do produto |
| Produto | X-Salada, Refrigerante, Batata | Item vendido |

Decisões iniciais propostas:
- Cada produto terá uma categoria comercial opcional.
- A categoria comercial pertence a uma única loja.
- O tipo legado `individual|combo` será preservado como `product_type` na migração.
- A coluna legada `category` permanece durante a compatibilidade.
- Produtos atuais não recebem categorias comerciais inventadas; começam com `category_id` nulo até o dono organizá-los.

Combos devem poder armazenar itens incluídos e suas quantidades. Produtos e categorias devem poder ser ativados/desativados sem exclusão em cascata.

## 4. Administração do catálogo

O painel de cada loja deverá permitir:
- criar, editar, ativar, desativar e arquivar produtos;
- criar, renomear, ordenar, ativar e desativar categorias;
- cadastrar nome, descrição, preço, foto e tipo;
- montar combos e editar seus itens incluídos;
- pesquisar produtos por nome;
- filtrar por categoria e estado;
- ordenar produtos por nome, categoria e ordem manual;
- visualizar o catálogo em listas paginadas.

As telas devem mostrar estados vazios e mensagens de erro claras, sem exigir edição de código.

## 5. Desempenho e escala

Para catálogos maiores:
- não carregar imagens originais em resolução excessiva;
- usar miniaturas e dimensões adequadas;
- carregar produtos em páginas ou lotes, com tamanho configurável;
- aplicar busca e filtros no banco quando o catálogo crescer;
- evitar consultas repetidas por produto (N+1);
- indexar colunas de consulta frequente, especialmente `store_id`, `category_id`, `active` e campos de ordenação, após validar o plano de consulta;
- não carregar produtos de todas as lojas para depois filtrar no navegador;
- manter o carrinho associado à loja correta e impedir mistura de itens de lojas diferentes no mesmo pedido.

O tamanho inicial da página será definido por testes; não deve ser tratado como limite máximo de produtos da loja.

## 6. Armazenamento de imagens

- Manter imagens públicas do cardápio acessíveis ao visitante.
- Restringir escrita, substituição e exclusão a membros autorizados da loja.
- Organizar novos objetos por caminho de loja, por exemplo `{store_id}/{product_id}/{filename}`.
- Validar MIME type e tamanho no upload.
- Não mover nem renomear as imagens existentes durante a primeira migração sem plano de compatibilidade.

## 7. Testes de aceitação

1. Uma loja com 6 produtos continua funcionando.
2. Uma loja consegue cadastrar 40 produtos e navegar por todos.
3. Uma loja consegue cadastrar 100+ produtos e navegar por páginas.
4. Criar 30 bebidas não altera o catálogo de outra loja.
5. Categorias criadas por uma loja não aparecem em outra.
6. Desativar uma categoria oculta seus produtos no cardápio público, mantendo-os recuperáveis no painel conforme regra aprovada.
7. Produtos sem categoria continuam administráveis e não desaparecem do painel.
8. Combos mantêm seus itens incluídos.
9. Pesquisa e filtros respeitam o `store_id`.
10. O carrinho não mistura produtos de estabelecimentos diferentes.
11. Usuário sem associação não consegue escrever no catálogo.
12. Tentativas de leitura/escrita cruzada entre lojas são bloqueadas por RLS.

## 8. Critério de implementação

A migração do banco e as telas de catálogo só devem ser implementadas depois de:
- aprovar o modelo comercial e o slug da MGW;
- confirmar o UUID do proprietário;
- validar backup e rollback;
- revisar as políticas RLS e Storage;
- executar testes em ambiente isolado ou plano de teste aprovado.

**Este documento não altera banco, dados, Auth, Storage, políticas ou produção.**
