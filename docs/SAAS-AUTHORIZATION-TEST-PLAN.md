# Plano de testes — autorização SaaS

**Estado: especificação de testes; nenhuma política ou tabela foi aplicada ao Supabase.**

Este plano deve ser executado em ambiente isolado antes de qualquer migração de produção. O objetivo é provar isolamento entre lojas e separação entre papéis de loja e Super Admin.

## 1. Identidades de teste

Preparar usuários Auth distintos, sem reutilizar credenciais reais:

- Visitante anônimo, sem sessão.
- Usuário A: owner da Loja A.
- Usuário B: admin da Loja A.
- Usuário C: editor da Loja A.
- Usuário D: staff da Loja A.
- Usuário E: membro de outra loja (Loja B).
- Usuário F: usuário autenticado sem membership.
- Usuário G: Super Admin ativo, provisionado por operação confiável.
- Usuário H: Super Admin inativo.

Criar Loja A e Loja B com IDs distintos. Não usar e-mail como identificador de autorização.

## 2. Matriz esperada de leitura de lojas

| Identidade | Loja A ativa | Loja A rascunho/suspensa | Loja B |
|---|---:|---:|---:|
| Anônimo | Sim | Não | Sim, se ativa |
| Owner/Admin da A | Sim | Sim | Somente se também tiver vínculo |
| Editor/Staff da A | Sim | Sim | Somente se também tiver vínculo |
| Usuário sem vínculo | Sim, se ativa | Não | Sim, se ativa |
| Super Admin ativo | Sim | Sim | Sim |
| Super Admin inativo | Sim, se ativa | Não | Sim, se ativa |

A tabela descreve leitura da identidade/registro da loja. A leitura de catálogo e configurações deverá seguir as políticas específicas dessas tabelas quando a migração de dados for desenhada.

## 3. Matriz esperada de memberships

- Usuário autenticado lê seus próprios vínculos.
- Owner/Admin lê os vínculos da própria loja.
- Editor/Staff não lê vínculos de outros usuários.
- Membro da Loja A não lê memberships da Loja B, salvo se também for membro com papel permitido na Loja B.
- Super Admin ativo pode consultar vínculos para suporte administrativo.
- Anônimo não lê memberships.
- Nenhum usuário cliente pode inserir, alterar ou apagar memberships diretamente.

## 4. Matriz de privilégios

| Ação | Owner | Admin | Editor | Staff | Super Admin |
|---|---:|---:|---:|---:|---:|
| Ler dados da própria loja | Sim | Sim | Sim | Sim | Sim |
| Alterar dados da loja | Sim | Sim | Não | Não | Via fluxo administrativo |
| Gerenciar membros | Sim | Sim | Não | Não | Via fluxo administrativo |
| Gerenciar produtos | Sim | Sim | Sim | Não | Via fluxo administrativo |
| Gerenciar categorias | Sim | Sim | Sim | Não | Via fluxo administrativo |
| Gerenciar configurações | Sim | Sim | Não | Não | Via fluxo administrativo |
| Ler assinatura | Sim | Sim | Não | Não | Via fluxo administrativo |
| Administrar plataforma | Não | Não | Não | Não | Sim |

Super Admin é um papel de plataforma separado. Ser owner/admin de uma loja nunca pode concedê-lo.

## 5. Testes negativos obrigatórios

1. Usuário da Loja A tenta ler ou alterar dados privados da Loja B: negar.
2. Editor tenta alterar nome, slug ou estado de publicação da loja: negar.
3. Staff tenta alterar produto ou categoria: negar.
4. Usuário sem vínculo tenta acessar loja em rascunho ou suspensa: negar.
5. Usuário tenta inserir ou alterar o próprio papel em store_memberships: negar.
6. Usuário tenta inserir a si mesmo em platform_admins: negar.
7. Usuário com user_metadata manipulada como super_admin continua sem privilégio de plataforma.
8. Super Admin inativo não recebe privilégios de plataforma.
9. E-mail igual ao do antigo administrador, sem membership válido, não concede papel SaaS.
10. ID de loja ausente, inválido ou pertencente a outra loja nunca deve ampliar acesso.

## 6. Funções e privilégios SQL

Antes da aprovação:

- Conferir GRANT e REVOKE em conjunto com RLS para anon e authenticated.
- Confirmar que funções SECURITY DEFINER têm search_path vazio, nomes de tabelas qualificados e acesso mínimo.
- Confirmar que funções auxiliares não permitem escrita nem recebem papel do cliente como fonte de autoridade.
- Verificar comportamento com RLS habilitada e sem bypass de proprietário.
- Verificar índices para consultas por user_id, store_id e estado ativo.
- Confirmar que tabelas de autorização não expõem platform_admins ao cliente.

## 7. Critérios para liberar a migração

A migração só poderá avançar quando:

- Todos os testes positivos e negativos forem executados em ambiente isolado.
- A origem e o UUID do owner inicial da MGW forem confirmados com segurança.
- O provisionamento do primeiro Super Admin estiver definido fora do cliente.
- O plano de preservação dos seis produtos, configurações, imagens, IDs, carrinho e WhatsApp estiver revisado.
- Backup e rollback estiverem documentados e aprovados.
- O SQL final for revisado; este plano não autoriza sua execução em produção.

## 8. Limite desta etapa

Este documento não cria tabelas, não altera RLS, não cadastra usuários, não modifica dados e não executa comandos no projeto Supabase. A implementação continua isolada na branch de desenvolvimento.
