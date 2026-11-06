# Decisões propostas do catálogo SaaS (MVP)

**Status: proposta técnica para validação.**  
Este documento fecha uma proposta coerente para o MVP, mas não autoriza migration, alteração de banco ou mudança no cardápio publicado.

## Decisões recomendadas

| Tema | Decisão proposta | Motivo |
|---|---|---|
| Categorias comerciais | Sim, já no MVP | Cada loja poderá organizar itens em Lanches, Bebidas, Sobremesas etc. |
| Tipo do produto | Campo separado: `product_type` = `individual` ou `combo` | Preserva a lógica e as seções atuais do cardápio MGW. |
| Categoria por produto | Uma categoria opcional por produto | Modelo simples para painel e navegação; permite itens ainda não classificados. |
| Slug MGW | `mgw-x-salada` | É o identificador provisório já usado pelo resolvedor de loja no frontend. Deve ser confirmado antes de inserir a loja no banco. |
| Categoria inativa | Não aparece no cardápio público; seus produtos também ficam ocultos enquanto ela estiver inativa | Evita exibir produtos sem a categoria que os organiza. O painel continua mostrando a categoria e seus produtos para reativação/edição. |
| Exclusão de categoria | Arquivamento lógico/inativação, nunca exclusão em cascata | Evita perda acidental de produtos e histórico. Para remover uma categoria de vez, primeiro reatribuir seus produtos ou deixá-los sem categoria, com confirmação explícita. |
| Exclusão de produto | Inativação lógica por padrão | Preserva dados, histórico e possibilidade de reativação. Exclusão física fica restrita a fluxo administrativo futuro, com confirmação. |

## Compatibilidade com o cardápio atual

1. O valor legado `store_products.category` será copiado para `product_type` sem conversão: `individual` continua `individual`, `combo` continua `combo`.
2. A nova `category_id` começa nula para os seis produtos atuais. Nenhuma categoria comercial será inventada ou atribuída durante a migração.
3. A interface atual de Individual/Combo deve continuar funcionando durante a transição.
4. Categorias comerciais serão uma dimensão adicional. A interface poderá oferecer navegação/filtros por categoria sem remover a distinção Individual/Combo.
5. Se uma categoria estiver inativa, seus produtos não devem aparecer no catálogo público, mesmo que o campo `active` do produto seja verdadeiro.
6. Produto sem categoria poderá continuar visível no público em uma seção “Outros” ou sem filtro de categoria, desde que ativo. A interface final deverá deixar isso explícito; não ocultar silenciosamente itens legados.

## Regras de integridade propostas

- Slug único dentro da mesma loja: `UNIQUE (store_id, slug)`.
- Nome de categoria não precisa ser único; a interface poderá avisar sobre nomes repetidos, mas não bloquear sem necessidade.
- Produto só pode referenciar categoria pertencente à mesma loja. Preferir FK composta (`store_id, category_id`) para garantir essa regra no banco, além da RLS.
- Exclusão de categoria não pode apagar produtos.
- Toda consulta pública deve filtrar loja ativa, produto ativo e, quando houver categoria, categoria ativa.
- Toda escrita administrativa deve validar membership ativa e papel permitido para a loja correspondente.

## Escopo explicitamente fora desta etapa

- Nenhum SQL executável ou migration.
- Nenhuma mudança em tabelas, RLS, Storage ou dados de produção.
- Nenhuma atribuição automática de categorias aos produtos MGW.
- Nenhuma alteração visual do cardápio ou painel.
- Nenhuma cobrança, assinatura ou plano comercial.
- Nenhuma alteração na branch `main`.

## Próxima etapa após validação

Após aprovação destas decisões, preparar uma migration SQL revisável e um plano de rollback, ainda sem executá-los. A migration deverá incluir prechecks, criação/ajuste de tabelas, constraints, índices, políticas RLS, migração dos dados MGW, verificações pós-migração e rollback documentado. A execução continuará bloqueada até autorização explícita.
