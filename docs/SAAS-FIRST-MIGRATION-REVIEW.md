# SQL de migração SaaS — rascunho para revisão

**Status: NÃO EXECUTAR.** Arquivo de estudo, fora de `supabase/migrations`. Nenhuma alteração no banco foi feita.

## Identidade inicial

A conta `warney.fernandes22@gmail.com` foi localizada por consulta somente leitura em `auth.users`, confirmada e não banida. UUID confirmado para bootstrap:

`9ea5631d-5045-480b-bd77-8d2ca50c6222`

Esse UUID será a referência técnica do proprietário inicial da MGW e do único Super Admin inicial. A senha continua exclusivamente no Supabase Auth: não será solicitada, copiada para SQL, armazenada no GitHub ou codificada no frontend.

## O que o rascunho contempla

- Prechecks para tabelas legadas, seis produtos, uma configuração e conta Auth.
- Criação proposta de `stores`, `store_memberships`, `platform_admins` e `store_categories`.
- Criação da loja MGW com slug aprovado `mgw-x-salada`, em estado `draft`.
- Associação do usuário confirmado como `owner` da MGW e único `super_admin` inicial.
- Expansão compatível de `store_products` com `store_id`, `product_type` e `category_id`.
- Associação da configuração legada à MGW.
- Preservação de `category` legado, IDs e URLs atuais; categorias comerciais não são inventadas.
- Integridade para impedir produto associado a categoria de outra loja.
- RLS habilitada nas novas tabelas.

## Por que ainda não é executável

O SQL é um rascunho estrutural, não uma migration pronta. Há bloqueios de segurança e operação que exigem etapa própria:

1. Backup integral verificável e rollback testado. O backup manual atual é parcial.
2. Teste em ambiente isolado sem criar recurso pago sem autorização.
3. Revisão das policies legadas por e-mail: elas não podem permanecer como caminho de escrita que contorne o isolamento entre lojas após o corte.
4. Policies finais de leitura pública, membership e papéis ainda precisam ser desenhadas/testadas; o rascunho deixa as tabelas novas fechadas por RLS.
5. Policies do Storage devem ser atualizadas com base nos nomes e caminhos reais, sem quebrar as duas imagens existentes.
6. O schema real deve ser reconsultado imediatamente antes de gerar a migration formal.
7. Testes de autorização cruzada, grants, índices e compatibilidade do frontend são obrigatórios.

## Atenção técnica

O rascunho inclui `BEGIN/COMMIT` para demonstrar o escopo transacional, mas **não deve ser colado no SQL Editor nem aplicado**. A etapa de políticas será escrita separadamente após revisão, evitando publicar uma autorização incompleta. O arquivo também não remove a autorização legada por e-mail.

## Critérios para avançar

- Revisar este SQL linha a linha.
- Gerar migration formal pelo fluxo Supabase CLI apropriado.
- Validar em ambiente isolado e executar todos os testes de segurança.
- Criar plano de corte e rollback verificável.
- Obter autorização explícita separada para qualquer execução no banco de produção.

**Nenhuma tabela, policy, grant, função, Storage, produto ou configuração foi alterada nesta etapa.**
