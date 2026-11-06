# Pré-verificação para a migração SaaS

**Status: checklist de preparação — nenhuma consulta ou alteração foi executada neste documento.**

Este checklist será preenchido antes de transformar o rascunho em migration formal. Ele separa confirmações humanas, inspeções somente leitura e critérios técnicos de bloqueio.

## A. Confirmações do responsável

| Item | Estado | Evidência necessária |
|---|---|---|
| Slug MGW `mgw-x-salada` | **Aprovado em 2026-11-06** | Confirmação explícita nesta conversa |
| UUID Auth do owner inicial | Pendente | UUID copiado do usuário correto em Supabase Auth > Users |
| Decisões do catálogo | **Aprovadas em 2026-11-06** | Confirmação explícita nesta conversa; ver `SAAS-CATALOG-MVP-DECISIONS.md` |
| Backup dos dados | Parcial | Backup manual existente; não equivale a dump integral do PostgreSQL |
| Rollback | Pendente | Procedimento testado em ambiente isolado |
| Ambiente de ensaio | Pendente | Confirmar opção sem custo adicional antes de criar qualquer recurso |

### Como confirmar o UUID do owner

1. Abrir o painel Supabase do projeto correto.
2. Acessar Authentication → Users.
3. Localizar a conta que deverá ser proprietária da MGW.
4. Copiar o campo **ID/UUID** exibido para aquela conta.
5. Conferir que a conta está ativa e que o UUID pertence ao usuário esperado.

O UUID deve ser fornecido diretamente como identificador técnico. Não compartilhar senha, access token, refresh token, chave API ou chave `service_role`. E-mail isoladamente nunca será usado como autorização.

## B. Inspeção somente leitura do banco

Imediatamente antes de escrever a migration final, coletar e registrar:
- versão atual do PostgreSQL;
- colunas, tipos, defaults, constraints, índices e chaves estrangeiras das tabelas legadas;
- policies RLS e estado de RLS em todas as tabelas envolvidas;
- grants de `anon`, `authenticated` e roles administrativas;
- triggers e funções que possam afetar escrita/atualização;
- contagem e amostra identificável dos seis produtos esperados;
- configuração legada `id = 1`;
- objetos atuais do bucket `product-images`;
- existência de slug duplicado e de qualquer tabela SaaS já criada.

Não assumir que o esquema da auditoria anterior permaneceu inalterado. Se a realidade diferir do plano, interromper e atualizar a proposta antes de gerar SQL.

## C. Invariantes de dados MGW

Antes da migration, registrar uma referência verificável dos seis produtos:
- ID;
- nome;
- tipo legado (`individual` ou `combo`);
- preço;
- ativo/destaque;
- descrição;
- `included_items`;
- URL da imagem;
- timestamp de atualização.

Registrar também todos os campos da linha de configurações `id = 1`. Comparar os valores antes/depois, sem normalizações silenciosas.

A migration deve abortar se a quantidade ou os registros diferirem do esperado, até que a divergência seja explicada e aprovada.

## D. Matriz de testes de segurança

Executar apenas em ambiente isolado antes da produção:

| Identidade | Loja MGW | Outra loja | Operações esperadas |
|---|---|---|---|
| Visitante anônimo | Apenas catálogo publicado | Apenas catálogo publicado | Sem escrita |
| Owner MGW | Acesso à MGW | Sem acesso | Gerencia a MGW |
| Editor MGW | Acesso à MGW | Sem acesso | Gerencia catálogo permitido da MGW |
| Staff MGW | Leitura autorizada | Sem acesso | Sem escrita |
| Owner da outra loja | Sem acesso | Gerencia a própria | Sem acesso cruzado |
| Super Admin ativo | Acesso administrativo controlado | Acesso administrativo controlado | Somente ações de plataforma explicitamente permitidas |
| Membership inativa | Sem acesso privado | Sem acesso privado | Sem escrita |
| Usuário autenticado sem membership | Sem acesso privado | Sem acesso privado | Sem escrita |

Testes negativos obrigatórios:
- alterar `store_id` no payload para acessar outra loja;
- atualizar produto de loja alheia;
- atribuir papel mais alto a si próprio;
- inserir/alterar/remover membership pelo cliente;
- inserir/remover registro de Super Admin pelo cliente;
- atualizar linha sem policy SELECT compatível;
- substituir imagem Storage em pasta de outra loja;
- consultar produto ativo de categoria inativa;
- invocar função privilegiada como `anon`.

## E. Critérios de liberação

A migração só poderá ser considerada pronta para revisão final quando:
- todos os itens da seção A estiverem confirmados;
- a inspeção da seção B estiver atualizada;
- invariantes da seção C tiverem valores de referência;
- matriz da seção D tiver sido aprovada em ambiente isolado;
- houver backup e rollback verificáveis;
- o frontend novo estiver preparado para consultar dados com escopo de loja;
- as policies antigas forem mapeadas para remoção/substituição sem janela de acesso indevido.

## F. Limites de autorização

Este checklist **não autoriza**:
- criar branch de banco ou projeto Supabase pago;
- executar SQL no Supabase;
- criar ou alterar tabelas, policies, grants, funções ou Storage;
- migrar dados ou imagens;
- remover a autorização administrativa legada;
- publicar mudanças na branch `main` ou em produção.

Qualquer execução no banco exigirá autorização explícita separada, depois da revisão do SQL final.
