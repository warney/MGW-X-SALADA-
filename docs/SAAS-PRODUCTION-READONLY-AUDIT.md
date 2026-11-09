# Auditoria somente de leitura do Supabase — SaaS MGW

**Data da verificação:** 06/11/2026  
**Projeto:** `MGW-X-SALADA-` (`zvjancomlonxzzqtwxqj`)  
**Escopo:** leitura de catálogo, migrações, políticas RLS, grants, Storage e advisors.  
**Alterações realizadas:** nenhuma. Nenhum SQL de escrita, migração, alteração de política ou dado foi executado.

## 1. Estado do catálogo legado

| Objeto | Estado observado |
|---|---|
| `public.store_products` | 6 registros; RLS habilitado |
| `public.store_settings` | 1 registro; RLS habilitado |
| Bucket `product-images` | público; limite 5 MB; JPEG, PNG e WebP |
| Objetos no bucket | 2 |
| Migrações registradas | 3 |

Migrações existentes:
- `20261106023559 mgw_store_catalog_storage`
- `20261106023620 mgw_rls_policy_tuning`
- `20261106024008 mgw_admin_email_access`

### Estrutura relevante

`store_products` mantém chave primária textual `id`, nome, descrição, preço, URL de imagem, ativo, destaque, itens incluídos e `updated_at`. A coluna legada `category` tem CHECK limitado a `individual` e `combo`; portanto, ela representa tipo de produto e não categorias comerciais.

`store_settings` tem chave primária `id` com CHECK `id = 1`, além de nome, slogan, WhatsApp, horário, endereço, estimativa, nota de taxa e estado aberto/fechado.

**Implicação:** a migração deve preservar os seis IDs e os valores atuais, manter a coluna legada durante a transição e não inventar categorias comerciais. O registro de configuração precisa ser associado à futura loja sem perder o identificador legado antes de existir compatibilidade.

## 2. RLS e permissões atuais

As duas tabelas têm:
- leitura pública para `anon` e `authenticated`;
- política ampla de gerenciamento para `authenticated`, condicionada ao e-mail JWT atual `warney.fernandes22@gmail.com`;
- grants de SELECT/INSERT/UPDATE/DELETE para `authenticated`, com o RLS limitando as linhas afetadas;
- SELECT concedido a `anon`.

O bucket `product-images` tem leitura pública. Upload, atualização e exclusão são permitidos a usuários autenticados cuja declaração de e-mail JWT corresponda ao e-mail administrativo atual, restritos ao bucket.

**Implicação:** o modelo atual é de uma única loja e um único e-mail. Não é isolamento multi-loja. As políticas legadas precisam ser substituídas cuidadosamente por políticas por loja/membership, sem abrir uma janela de acesso entre as etapas.

## 3. Outros objetos observados

- Nenhum trigger foi listado no schema `public`.
- Foi encontrada a função `public.rls_auto_enable()`, uma função de evento `SECURITY DEFINER`, com `search_path` limitado a `pg_catalog`. Ela tenta habilitar RLS em novas tabelas criadas no schema `public`.
- Não foi encontrada evidência, nesta consulta, de tabelas SaaS `stores`, `store_memberships`, `platform_admins` ou `store_categories`.

A função de evento deve ser considerada ao criar futuras tabelas e suas políticas; não deve ser removida ou modificada como parte automática desta migração.

## 4. Advisors do Supabase

### Segurança
- **Aviso:** proteção contra senhas vazadas está desativada no Supabase Auth. Recomendação: avaliar e habilitar nas configurações de Auth. Isso não foi alterado nesta etapa.

### Performance
- **Aviso:** duas políticas de leitura/gerenciamento reavaliam funções de Auth por linha em `store_products` e `store_settings`. O advisor recomenda encapsular a chamada em subconsulta, por exemplo `(select auth.jwt())`, quando a política for revisada.
- **Aviso:** há políticas permissivas sobrepostas para SELECT nas duas tabelas (política pública e política administrativa). Isso pode aumentar o custo de avaliação. A consolidação deve ocorrer junto da migração de RLS, após testes.

Esses avisos foram registrados para planejamento; não foram corrigidos nesta auditoria.

## 5. Decisões técnicas para a migração

1. Preservar os seis produtos, IDs, preços, imagens, estados e dados atuais.
2. Preservar o registro único de configurações e associá-lo à loja MGW.
3. Manter `category` durante a compatibilidade; copiar `individual|combo` para `product_type` quando a migração for aprovada.
4. Usar `category_id` separado para categorias comerciais, sem atribuir categorias automaticamente aos produtos atuais.
5. Migrar RLS e Storage para isolamento por `store_id` e associação de usuário, com testes negativos entre lojas.
6. Manter o bucket público para imagens públicas do cardápio, mas restringir escrita por associação à loja e caminho do objeto.
7. Não usar e-mail como identificador de autorização permanente; usar Auth UUID e memberships.
8. Não expor `service_role` no navegador.

## 6. Bloqueios antes de gerar/aplicar a migração

- Aprovação explícita do slug MGW `mgw-x-salada`.
- Aprovação explícita das decisões de categorias do MVP registradas no documento de decisões.
- UUID do usuário proprietário obtido na tela Authentication → Users do Supabase. Não usar e-mail como substituto do UUID.
- Backup completo e plano de rollback. O backup manual existente é parcial e não equivale a dump completo do PostgreSQL.
- Ambiente isolado de teste ou plano de validação que não altere produção.
- Revisão final do SQL, políticas e grants antes de qualquer execução.

## 7. Limites desta etapa

Esta auditoria foi somente de leitura. Não houve:
- criação ou alteração de tabelas, políticas, funções, triggers ou grants;
- alteração de Auth, Storage, produtos ou configurações;
- criação de projeto/branch Supabase pago;
- alteração de `main` ou deploy de produção.

**Próxima etapa recomendada:** resolver as aprovações pendentes e validar o UUID do proprietário. Só então preparar a migração SQL final para revisão, ainda sem aplicá-la.
