# Matriz e desenho de políticas RLS — SaaS MGW

**Status: desenho para revisão, NÃO EXECUTAR.** Este documento não contém migration oficial e não altera o Supabase.

## 1. Princípios obrigatórios
1. RLS habilitada em todas as tabelas expostas no schema public.
2. Toda linha de catálogo pertence a exatamente um store_id.
3. A autorização usa auth.uid() e memberships persistidas; nunca usa e-mail como regra definitiva.
4. Nunca usar user_metadata para papel ou privilégios.
5. O browser nunca recebe service_role ou secret key.
6. Esconder botões não é segurança; RLS valida cada operação.
7. Policies antigas por e-mail permanecem só durante compatibilidade e devem ser removidas no corte controlado; não podem continuar permitindo escrita transversal.
8. Super Admin é provisionado fora do cliente e não pode alterar o próprio papel.
9. UPDATE exige SELECT compatível e USING + WITH CHECK.
10. Views públicas devem usar security_invoker=true (Postgres 15+) ou ficar inacessíveis aos papéis públicos.

## 2. Funções auxiliares — desenho
As funções de verificação de papel precisam evitar recursão de RLS. Se SECURITY DEFINER for necessário, devem ficar em schema privado não exposto pela Data API (ex.: private), usar SET search_path='', nomes totalmente qualificados, verificar auth.uid() no corpo, ter proprietário confiável e privilégios mínimos, revogar EXECUTE de PUBLIC e anon e conceder somente a authenticated quando necessário. Não aceitar user_id arbitrário como parâmetro de autorização. Não expor operações genéricas de escrita. Revisar com advisors e testes.

Funções conceituais: private.is_platform_admin() e private.has_store_role(store_id, roles[]). Preferir SECURITY INVOKER quando não houver necessidade comprovada de bypass controlado de RLS. Não criar SECURITY DEFINER no schema public por conveniência.

## 3. Matriz de leitura e escrita
| Recurso | Anônimo | Staff | Editor | Admin/Owner | Super Admin |
|---|---|---|---|---|---|
| Loja ativa e campos públicos | leitura | leitura própria | leitura própria | leitura própria | leitura global controlada |
| Loja draft/suspensa/arquivada | não | própria | própria | própria | leitura global controlada |
| Produtos/categorias ativos e publicáveis | leitura | leitura própria | leitura própria | leitura própria | leitura global controlada |
| Produtos/categorias inativos | não | não | painel próprio | painel próprio | leitura global controlada |
| Criar/editar produtos | não | não | própria | própria | ferramenta administrativa controlada |
| Criar/editar categorias | não | não | própria | própria | ferramenta administrativa controlada |
| Configurações privadas | não | leitura mínima se necessária | leitura | leitura/edição | leitura controlada |
| Gerenciar memberships | não | não | não | operação segura | operação segura |
| Consultar platform_admins diretamente | não | não | não | não | não pelo cliente |

Super Admin não recebe acesso irrestrito por condição escondida no frontend. Operações globais devem ser explícitas, auditáveis e limitadas.

## 4. Regras por tabela
### stores
- SELECT público somente para status active e campos públicos.
- Membros ativos consultam a própria loja, inclusive draft/suspensa.
- Escrita de identidade, slug e status não é livre pelo browser; usar operação autorizada e auditável.

### store_memberships
- Usuário lê o próprio vínculo; owner/admin podem consultar membros da própria loja.
- Sem INSERT/UPDATE/DELETE direto pelo cliente no MVP.
- Convites e mudanças de papel por RPC/backend seguro, validando papel e protegendo o último owner.
- Ninguém cria membership para si ou eleva seu próprio papel.

### platform_admins
- Sem SELECT/INSERT/UPDATE/DELETE direto para anon ou authenticated.
- Bootstrap inicial do Super Admin por operação controlada usando o UUID confirmado.
- Nenhuma RPC pública concede super_admin.

### store_categories
- Público lê apenas categoria ativa de loja ativa.
- Membros autorizados consultam também categorias inativas da própria loja.
- Editor/admin/owner gerenciam somente categorias da própria loja.
- Inativação não apaga produtos; produtos associados ficam ocultos no público.

### store_products
- Público lê apenas produto ativo de loja ativa e categoria ausente ou ativa.
- Membros autorizados consultam também produtos inativos da própria loja.
- Editor/admin/owner gerenciam somente produtos da própria loja.
- WITH CHECK exige que store_id permaneça no escopo autorizado.
- FK composta impede categoria de outra loja; manter category legado durante transição.

### store_settings
- Público lê somente campos necessários ao cardápio da loja ativa.
- Avaliar separação de campos privados, como telefone/endereço interno.
- Escrita apenas owner/admin da loja; uma configuração por store_id.

### Storage product-images
- Bucket permanece público para leitura das imagens publicadas.
- INSERT/UPDATE/DELETE apenas para membership ativa e papel autorizado na loja do primeiro segmento do caminho.
- Validar formato/tamanho e impedir alteração do primeiro segmento.
- Upload com upsert precisa INSERT, SELECT e UPDATE conforme operação usada.
- Não mover os dois objetos existentes na migração inicial.
- Substituir policy atual por e-mail somente no corte controlado.

## 5. Testes negativos obrigatórios
1. Anônimo não lê loja draft, suspensa ou arquivada.
2. Usuário A não lê produtos inativos da loja B.
3. Usuário A não cria/edita/exclui produto da loja B.
4. Usuário A não atribui produto da loja A a categoria da loja B.
5. Staff não cria, edita ou desativa produtos/categorias.
6. Editor não altera settings, memberships, slug ou status.
7. Admin/owner não altera papel de Super Admin.
8. Usuário não cria membership para si mesmo.
9. Usuário não muda seu role para owner/admin.
10. Usuário não acessa platform_admins diretamente.
11. user_metadata.role=super_admin não concede privilégio.
12. Membership inativa perde acesso administrativo.
13. Super Admin inativo perde privilégio global.
14. Upload, replace e delete de imagem de outra loja são negados.
15. Usuário não muda store_id durante UPDATE.
16. UPDATE sem SELECT compatível não pode falhar silenciosamente no painel.
17. Sem sessão, funções privilegiadas não podem ser usadas.
18. Nenhuma policy antiga permissiva contorna a nova matriz.

## 6. Corte das policies legadas
A auditoria identificou leitura pública e escrita autenticada condicionada ao e-mail warney.fernandes22@gmail.com nas tabelas legadas e no Storage.

Plano: implantar memberships; publicar frontend que resolve store_id; testar owner e usuário de outra loja; criar policies novas e grants; em transação controlada remover policies antigas de escrita por e-mail e consolidar SELECT público; testar anônimo, owner, editor, staff e usuário de outra loja; manter rollback documentado. Não remover policies atuais antes da nova aplicação estar pronta nem deixá-las ativas após o corte.

## 7. Critérios de saída
- SQL de policies revisado linha a linha.
- Funções privadas auditadas e grants mínimos.
- RLS e Storage testados em ambiente isolado.
- Advisors sem alertas críticos novos.
- Testes negativos 1–18 aprovados.
- Compatibilidade dos seis produtos, uma configuração e duas imagens preservada.
- Backup integral e rollback testado.
- Aprovação separada antes de qualquer execução em produção.

**Limite desta etapa:** apenas desenho/documentação. Nenhuma tabela, policy, função, grant, sessão Auth, objeto Storage, produto ou configuração foi alterada.