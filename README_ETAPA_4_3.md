# STO KA — Etapa 4.3

## Mudanças
- Edição de produtos (sem alterar estoque).
- Desativação lógica de produtos (histórico preservado).
- Listagens e dashboard filtram `ativo = true`.
- Ajuste de estoque impede repetir a mesma quantidade.

## Pré-requisitos
Execute no Supabase os SQLs da Etapa 4.3 antes de testar esta interface.

## Instalação
Copie sua URL e Publishable Key para `js/config.js` (somente chave pública). Não publique chaves secretas. Rode pelo Live Server.

## Testes
1. Edite o nome ou preço de um produto e confirme no catálogo.
2. Tente ajustar para a mesma quantidade: o formulário deve bloquear.
3. Desative um produto de teste: ele deve sumir da lista e do dashboard, sem apagar a movimentação do banco.
4. Confirme no Supabase que `ativo = false` e `excluido_em` foi preenchido.
