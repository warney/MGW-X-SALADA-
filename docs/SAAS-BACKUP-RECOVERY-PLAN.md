# Plano de backup integral e recuperação — SaaS MGW

**Status: procedimento de preparação. NÃO EXECUTAR MIGRAÇÃO OU RESTAURAÇÃO EM PRODUÇÃO.**

## 1. Objetivo e limites
Este plano define como obter cópias verificáveis antes de qualquer migração SaaS e como recuperar o projeto se houver falha. O backup manual já existente contém arquivos de produtos/configurações e duas imagens, mas não equivale a um backup integral do PostgreSQL.

Este documento não cria backup, não baixa arquivos, não altera Supabase e não autoriza execução de SQL.

## 2. Inventário que precisa ser preservado
- Estrutura: tabelas, colunas, tipos, defaults, constraints, PK/FK, índices, sequences, views e schemas relevantes.
- Segurança: RLS, policies, grants, funções, triggers e event triggers.
- Dados: seis linhas atuais de `public.store_products` e uma linha atual de `public.store_settings` — conferir novamente no momento do backup.
- Storage: bucket `product-images`, configurações, nomes/caminhos, metadados e bytes de todos os objetos.
- Auth: usuário proprietário existente e seu UUID; não exportar hashes de senha, tokens ou segredos para o repositório.
- Aplicação: commit Git exato implantado, variáveis de ambiente documentadas por nome (nunca valores secretos), configuração Vercel e URLs.

## 3. Pacote de backup recomendado
Separar o pacote em arquivos e registrar data/hora, projeto, branch/commit, tamanho e resultado de verificação:

| Artefato | Conteúdo | Verificação mínima |
|---|---|---|
| `database-schema.sql` | DDL, constraints, índices, sequences, funções e triggers | arquivo abre e contém objetos esperados |
| `database-data` | dados das tabelas de negócio | contagens e amostras comparadas |
| `rls-policies-grants.sql` | policies, grants e estado RLS | tabelas e policies inventariadas |
| `storage-manifest.csv` | bucket, caminho, tipo, tamanho e metadados | contagem e caminhos conferidos |
| `storage-objects/` | bytes originais de todas as imagens | cada arquivo abre e tamanho confere |
| `auth-inventory.txt` | apenas UUID, e-mail e estado de confirmação da conta proprietária | UUID confere com Auth; sem hashes/tokens |
| `release-info.txt` | commit, branch, data, projeto e configuração não secreta | revisão manual |

Se o painel Supabase oferecer backup/download compatível com o plano atual, registrar também o artefato e seu horário. Não presumir retenção, PITR ou download automático sem verificar o plano e a tela do projeto.

## 4. Caminho sem custo adicional
1. Primeiro verificar no painel Supabase do projeto correto quais opções de backup/exportação estão disponíveis no plano atual. Não contratar upgrade nem criar projeto/branch pago.
2. Para dados pequenos, exportar cada tabela de negócio em CSV pelo Table Editor e guardar os arquivos fora do repositório público. Conferir que os CSVs contêm cabeçalhos e todas as linhas.
3. Para esquema e segurança, salvar os DDL e definições obtidos por consultas somente leitura ao catálogo PostgreSQL. Incluir policies, grants, constraints, índices, funções e triggers. Um CSV de dados não substitui DDL.
4. No Storage, listar todos os objetos e baixar cada arquivo original. Não guardar somente URLs públicas: elas não substituem os bytes originais.
5. Guardar cópia em pelo menos dois locais privados controlados pelo responsável. Não colocar dados, exports, credenciais ou arquivos de clientes em repositório Git público.
6. Se não for possível exportar o esquema completo ou os bytes de Storage pelo celular, marcar o backup como INCOMPLETO e interromper a migração. Não declarar backup integral por aproximação.

## 5. Integridade e conferência antes/depois
Registrar uma referência de cada produto: `id`, nome, `category` legado, descrição, preço, `image_url`, `active`, `highlight`, `included_items` e `updated_at`.
Registrar todos os campos da configuração atual `id = 1`, além do número de linhas.
Para Storage, registrar todos os caminhos e tamanhos; quando possível, gerar SHA-256 de cada arquivo antes e depois.
Comparar contagens e valores após qualquer ensaio/restauração. Não aceitar perda silenciosa, normalização de texto, mudança de preço, URL ou status.

### Bloqueio de esquema identificado
A auditoria encontrou `public.store_settings.id` como chave primária com CHECK `id = 1`. Adicionar apenas `store_id` não permite inserir uma configuração independente para uma segunda loja. Antes da migração, decidir e testar uma estratégia compatível: por exemplo, nova tabela multi-loja de configurações públicas/privadas e migração gradual do frontend, mantendo a tabela legada até o corte. Não remover o CHECK nem alterar a chave primária sem plano de compatibilidade e rollback.

## 6. Ensaio de recuperação
Antes de produção, restaurar o pacote em ambiente isolado sem sobrescrever o projeto atual. Validar:
1. Estrutura, constraints, índices, funções e policies recriados.
2. Dados restaurados e contagens iguais às referências.
3. Imagens baixadas e URLs/caminhos consistentes.
4. Login do proprietário e comportamento da aplicação.
5. RLS: anônimo, owner, editor, staff, usuário de outra loja e usuário sem membership.
6. Testes negativos de acesso cruzado e escrita indevida.
7. Build, testes e fluxo público do cardápio.

Se não existir ambiente isolado gratuito, não usar produção como laboratório. Manter migração bloqueada até existir um método de ensaio seguro.

## 7. Plano de recuperação / rollback
- Interromper novas gravações e registrar o último commit e horário conhecido como íntegro.
- Não executar `DROP ... CASCADE` nem apagar tabelas/objetos antigos como parte da migração inicial.
- Reverter o frontend para o commit anterior conhecido e estável, se a falha for apenas de aplicação.
- Para falha de schema/dados, restaurar somente após confirmar alvo, conteúdo do backup e impacto; preferir restaurar em projeto isolado e validar antes de qualquer substituição.
- Se a migração for aditiva, usar scripts de rollback revisados para remover somente objetos novos que não contenham dados válidos; preservar colunas e tabelas legadas.
- Não tentar reconstruir dados apagados a partir de cache do navegador ou URLs públicas.
- Reabrir gravações somente após validar contagens, imagens, login, RLS e pedidos.

## 8. Critérios para considerar backup integral
- Export de esquema e dados completo, com data e projeto identificados.
- Policies, grants, funções, triggers e constraints preservados.
- Todos os objetos Storage baixados e conferidos.
- Dois locais privados de armazenamento.
- Ensaio de restauração realizado e aprovado.
- Procedimento de rollback documentado com responsável e ponto de retorno.

## 9. Limites de autorização
Este plano NÃO autoriza executar SQL, criar projeto ou branch Supabase, alterar Auth/RLS/Storage, migrar produtos, trocar a tabela de configurações, alterar `main` ou publicar em produção. Qualquer execução futura exige revisão do procedimento e autorização explícita separada.