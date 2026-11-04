# STO KA — Sistema de Gestão de Estoque

## 1. Nome do projeto
STO KA.

## 2. Problema identificado
Pequenos negócios têm dificuldades em controlar produtos, quantidades e movimentações, especialmente quando dependem de planilhas.

## 3. Objetivo
Oferecer um sistema web multiempresa para organizar o estoque, com autenticação, controle de acesso e futura importação de Excel.

## 4. Integrantes
- Pedro Henrique Faber
- [Adicionar demais integrantes do grupo]

## 5. Tecnologias
HTML5, CSS3, JavaScript Vanilla, Tailwind CSS, Supabase Auth/PostgreSQL/RLS, SweetAlert2, Lucide Icons, Git, GitHub e GitHub Pages.

## 6. Funcionalidades
**Implementadas nesta etapa:** cadastro por e-mail/senha, login, logout, sessão, proteção de páginas e cadastro inicial da empresa via RPC. **Implementadas:** categorias (criar, renomear, excluir), cadastro de produtos, ajustes de estoque com histórico e indicadores no painel. **Em desenvolvimento:** edição/exclusão de produtos, tela de movimentações, importação Excel com substituição de quantidades e permissões operacionais completas.

## 7. Instruções de utilização
1. Extraia o ZIP e abra a pasta no VS Code.
2. Em `js/config.js`, confira a **Project URL** e substitua `supabaseAnonKey` pela **Publishable key** (ou anon) do Supabase. A chave do ZIP foi removida intencionalmente. **Nunca use secret/service_role.**
3. No Supabase, em **Authentication > URL Configuration**, configure **Site URL** para a URL local de teste ou para o endereço publicado e adicione **Redirect URLs** correspondentes, incluindo `http://127.0.0.1:5500/**` e a URL de produção no GitHub Pages (se aplicável).
4. Em **Authentication > Providers > Email**, mantenha a autenticação por e-mail habilitada. Se a confirmação de e-mail estiver ligada, confirme o endereço antes do login.
5. Inicie um servidor local (ex.: extensão Live Server). Não abra via `file://`.
6. Acesse `cadastro.html`, confirme o e-mail se necessário, entre por `login.html`, cadastre a empresa e acesse o painel.
7. **Segurança:** URL e chave publishable são públicas, mas o banco deve estar protegido por RLS. Não publique senhas nem chaves secretas.

## 8. Link da aplicação no GitHub Pages
A definir após publicação.

### Observações importantes
- As sete tabelas e políticas RLS de leitura precisam estar instaladas; a função `stoka_criar_empresa` deve existir e estar liberada para `authenticated`.
- As páginas de importação, movimentações e configurações ainda são protótipos visuais. O dashboard e a página de produtos consultam dados reais.
- A política de leitura `perfis` só permite ver o próprio perfil. A gestão de funcionários será implementada separadamente.
- `js/config.js` contém apenas informações públicas e pode ser versionado para GitHub Pages.
- O CDN do Tailwind é usado no protótipo acadêmico; para produção, recomendamos compilar o CSS.

### Etapa 4.2 — Banco de dados
Antes de utilizar a página de produtos, execute no SQL Editor as funções `stoka_criar_categoria`, `stoka_editar_categoria`, `stoka_excluir_categoria`, `stoka_criar_produto` e `stoka_ajustar_estoque` fornecidas nas etapas anteriores. As permissões são verificadas nas funções SQL.
