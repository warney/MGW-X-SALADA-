# Rascunho de autorização SaaS

**Estado: proposta para revisão — não aplicada ao Supabase.**

## Modelo
- `stores`: identidade e estado de publicação por slug.
- `store_memberships`: associação de usuário Auth à loja, com papel `owner`, `admin`, `editor` ou `staff`.
- `platform_admins`: lista separada e protegida de Super Admins.
- Papéis de loja nunca concedem automaticamente Super Admin.

## Regras de segurança propostas
- Visitantes leem somente lojas com status `active`.
- Membros leem a própria loja conforme o vínculo ativo.
- Owners/admins podem consultar os membros da própria loja.
- O cliente não recebe permissão direta para inserir, alterar ou apagar memberships ou Super Admins.
- Nenhuma autorização usa `user_metadata` ou e-mail enviado pelo navegador.
- Funções auxiliares usam `SECURITY DEFINER` apenas para leitura estritamente necessária, com `search_path` vazio, referências qualificadas e execução revogada de `PUBLIC`/ `anon`.
- RLS e GRANT são tratados em conjunto.

## Compatibilidade e limites desta proposta
- Não altera as tabelas legadas `store_products` e `store_settings`.
- Não remove nem modifica a política de acesso atual da MGW.
- Não cria automaticamente o registro MGW nem associa usuários por e-mail. O UUID correto do Auth precisa ser confirmado antes da migração de dados.
- Não implementa convite, troca de papel, recuperação de acesso, nem painel Super Admin. Essas operações exigem fluxos controlados e testes próprios.
- A migração de produtos/configurações para `store_id` será uma etapa separada, com compatibilidade e rollback.

## Critérios antes de executar
1. Confirmar o UUID Auth do proprietário inicial sem compartilhar tokens ou senhas.
2. Definir como o primeiro Super Admin será provisionado por operação confiável.
3. Revisar grants, políticas RLS e funções com testes positivos e negativos para `anon`, membros de lojas diferentes e Super Admin.
4. Confirmar a estratégia de migração MGW e preservar IDs, imagens, URLs, carrinho e WhatsApp.
5. Gerar a migração executável usando o fluxo Supabase CLI suportado; este arquivo SQL é documentação de desenho, não um arquivo de migração executável.
6. Fazer backup e aprovar plano de rollback antes de qualquer execução em produção.

## Referência de segurança
A proposta segue o padrão atual do Supabase: RLS em tabelas expostas, grants explícitos, políticas por operação/escopo, `auth.uid()` para identidade e nunca `user_metadata` para autorização.
