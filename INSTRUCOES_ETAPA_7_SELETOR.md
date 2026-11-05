# STO KA — Seletor de empresas (Etapa 7)

## Alteracoes
- `js/auth.js`: consulta todos os vinculos de `membros_empresa`, identifica a empresa ativa e publica o contexto correto em `stoka:ready`.
- `css/style.css`: estiliza o seletor responsivo de empresa.
- O seletor aparece automaticamente em paginas autenticadas quando a conta pertence a mais de uma empresa.
- A escolha e mantida na sessao do navegador e a troca retorna ao dashboard, recarregando as consultas.
- Quem tem uma unica empresa continua no fluxo anterior.

## Instalacao
1. Faca backup da pasta atual do projeto.
2. Copie os arquivos deste ZIP para a pasta `stoka` mantendo `.git` e o `js/config.js` atual.
3. Teste com a conta que e Gestor da Empresa Teste e Analista da Mojang.
4. Selecione Mojang e confirme que o dashboard mostra somente seus produtos e o perfil Analista.
5. Retorne para Empresa Teste e confirme que o papel Gestor e os dados mudam.
6. Teste os acessos bloqueados antes de publicar no GitHub Pages.

## Observacoes de seguranca
- O seletor e uma facilidade de navegacao, NAO substitui RLS e verificacoes SQL.
- A lista de empresas vem dos vinculos autenticados, e os nomes sao lidos da tabela `empresas` conforme as politicas RLS atuais.
- Se `empresas` nao permitir leitura de uma empresa vinculada, aparecera erro; revise a politica SELECT correspondente no Supabase.
- A funcao de ajuste usa a chave `movimentar_estoque`, enquanto a interface de Usuarios da versao recebida grava `ajustar_estoque`. Essa divergencia precisa ser padronizada no banco antes de validar a permissao de ajuste do Analista.
- As funcoes SQL de gestao de usuarios devem ser verificadas/testadas (vinculo, definir permissoes e remocao).
