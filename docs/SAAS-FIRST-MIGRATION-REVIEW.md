# Revisão da migration multi-loja — etapa 1

**Estado: candidata técnica, NÃO aplicada.** Não autoriza execução em produção.

## Entrega proposta
- Tabelas de lojas, memberships, administradores da plataforma, categorias e configurações públicas.
- Escopo por loja no catálogo legado, preservando IDs e URLs dos seis produtos.
- Associação inicial de MGW e do proprietário previamente confirmado.
- Cópia das configurações sem alterar a tabela legada store_settings.
- Funções privadas de autorização e policies RLS para tabelas novas e catálogo.
- Índices e verificações transacionais.

## Bloqueios obrigatórios
1. Testar em projeto Supabase isolado com backup restaurado.
2. Atualizar frontend para enviar e filtrar store_id em todas as leituras, gravações e uploads.
3. Implementar policies do Storage pelo prefixo da loja; esta candidata não altera o bucket.
4. Testar anon, owner, admin, editor, staff, usuário sem membership e tentativa de acesso cruzado.
5. Rever grants e policies antigas. Policies permissivas são combinadas por OR; acrescentar policy restritiva não neutraliza a antiga.
6. Remover policies legadas de escrita/leitura ampla somente no corte controlado, depois do frontend escopado.
7. Testar rollback e preservar o cardápio publicado.

## Limite de liberação
Não criar uma segunda loja com esta candidata isoladamente. O frontend atual ainda consulta catálogo legado sem store_id. A migration não configura Storage multi-tenant e não ativa MGW publicamente.
