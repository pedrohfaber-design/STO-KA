# Etapa 7 — Instruções e cuidados

1. Faça backup do banco no Supabase antes de aplicar a migração.
2. Execute `etapa_7_permissoes.sql` integralmente no SQL Editor (transação única). Se houver erro, a transação será revertida.
3. Faça deploy dos arquivos no GitHub Pages depois que o SQL terminar com sucesso.
4. Para cadastrar um Analista: peça que ele crie uma conta pelo cadastro público e confirme o e-mail, mas **não crie uma empresa**. Depois, como Gestor, vá em Configurações > Usuários e permissões e vincule pelo e-mail.
5. Conceda permissões e teste com uma sessão diferente de Analista.
6. Teste cada permissão negada por RPC e cada permissão permitida.

## Limitações a verificar antes de considerar produção
- As funções `stoka_criar_categoria` e `stoka_ajustar_estoque` não estavam no CSV fornecido. A migração só substitui uma checagem explícita `stoka_eh_admin` se presente; caso contrário interrompe a transação, sem aplicar alterações. É obrigatório revisar essas duas funções e as políticas RLS de escrita antes de liberar Analistas em ambiente real.
- A leitura do dashboard, produtos e histórico continua seguindo as políticas RLS atuais para membros; as permissões individuais desta etapa controlam **operações de escrita**, não leitura por módulo.
- A função de vínculo só aceita contas já registradas e sem vínculo com outra empresa, pois o frontend atual pressupõe um vínculo principal por conta.
- A função `stoka_vincular_operador` usa `auth.users` com SECURITY DEFINER; deve ser criada pelo administrador do banco no SQL Editor.
- Se uma função existente não usar a checagem esperada, revise manualmente antes de declarar a proteção concluída.
