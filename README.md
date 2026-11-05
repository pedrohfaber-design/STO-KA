# 📦 STO KA — Sistema Web de Gestão de Estoque

**Projeto acadêmico — FATEC Itu**  
**Frontend em HTML, CSS e JavaScript Vanilla | Supabase e PostgreSQL**

[🌐 Acessar o STO KA](https://pedrohfaber-design.github.io/STO-KA/) · [💻 Repositório no GitHub](https://github.com/pedrohfaber-design/STO-KA)

O **STO KA** é uma aplicação web de gestão de estoque para empresas de diferentes segmentos. Reúne produtos, categorias, quantidades, movimentações e importação de planilhas Excel em um ambiente centralizado. O sistema permite que **cada empresa mantenha seus próprios dados** e que um mesmo usuário participe de **mais de uma empresa, com papéis e permissões diferentes**.

> **Status:** aplicação desenvolvida e publicada no GitHub Pages. A Etapa 7 (usuários, permissões e seleção de empresas) foi testada localmente em seus fluxos principais; a validação completa dos bloqueios de autorização e a publicação dessa atualização ainda devem ser conferidas antes da entrega definitiva.

## 1. Nome do projeto

**STO KA — Sistema Web de Gestão de Estoque.**

O nome representa uma solução de organização, acompanhamento e controle de estoques, com foco em facilidade de uso, rastreabilidade e personalização por empresa.

## 2. Problema identificado

Muitos estabelecimentos controlam seus estoques por meio de anotações manuais ou planilhas independentes, o que pode causar divergências nas quantidades, duplicidade de registros, retrabalho e dificuldade para identificar alterações. Além disso, diferentes funcionários nem sempre devem possuir os mesmos privilégios administrativos.

O STO KA busca centralizar essas operações e permitir que cada organização administre seus produtos, usuários e acessos sem misturar dados de outras empresas.

## 3. Objetivo do projeto

### Objetivo geral

Desenvolver uma aplicação web responsiva para gestão de estoques, com autenticação, persistência em banco de dados, histórico de movimentações, importação de planilhas e controle de acesso por empresa.

### Objetivos específicos

- Permitir cadastro, login e logout por e-mail e senha.
- Cadastrar empresas e associar usuários a elas.
- Permitir que um usuário tenha vínculos com várias empresas.
- Disponibilizar a seleção da empresa ativa e aplicar o papel correspondente.
- Oferecer gestão de funcionários e permissões individuais pelo Gestor.
- Cadastrar, consultar, editar e desativar produtos.
- Organizar produtos em categorias próprias de cada empresa.
- Acompanhar quantidades, estoque mínimo e histórico de movimentações.
- Importar cadastros e atualizações de estoque a partir de planilhas Excel.
- Disponibilizar o sistema online por meio do GitHub Pages.

## 4. Integrantes da equipe

- **Pedro Henrique Faber**
- **Wagner Aparecido de Castro Junior**
- **João Paulo Sonsim Barbieri**

**Instituição:** Faculdade de Tecnologia de Itu — FATEC Itu.

## 5. Tecnologias utilizadas

| Tecnologia | Utilização |
|---|---|
| **HTML5** | Estrutura das páginas e formulários |
| **CSS3** | Estilos e responsividade |
| **JavaScript Vanilla** | Regras de interface e integração, sem frameworks JavaScript |
| **Tailwind CSS** | Classes utilitárias para layout e componentes |
| **Supabase Authentication** | Cadastro, login e gerenciamento de sessão |
| **Supabase / PostgreSQL** | Persistência de empresas, usuários, produtos e movimentações |
| **Row Level Security (RLS)** | Restrições de acesso a dados conforme usuário e empresa |
| **Funções PostgreSQL (RPC)** | Operações com validações e verificações de autorização |
| **SheetJS (XLSX)** | Leitura de planilhas Excel no navegador |
| **SweetAlert2** | Alertas, confirmações e mensagens de feedback |
| **Lucide Icons** | Ícones de navegação e ações |
| **Git e GitHub** | Controle de versão e hospedagem do repositório |
| **GitHub Pages** | Publicação do frontend estático |

### Arquitetura

O frontend é formado por arquivos HTML, CSS e JavaScript executados no navegador. A autenticação e os dados são gerenciados pelo Supabase, com PostgreSQL, políticas RLS e funções RPC. O GitHub Pages hospeda somente a interface; **não armazena os dados do estoque**.

## 6. Funcionalidades implementadas

### 6.1. Autenticação e acesso

- Cadastro e login com e-mail e senha.
- Logout e proteção de páginas que exigem autenticação.
- Cadastro inicial de empresa e vínculo do responsável.
- Identificação do papel do usuário na empresa ativa.

### 6.2. Dashboard

- Indicadores de produtos ativos, unidades em estoque e itens com estoque baixo.
- Resumo de informações do estoque da empresa selecionada.
- Interface adaptada para computador e dispositivos móveis.

### 6.3. Produtos e categorias

- Cadastro, consulta, pesquisa e edição de produtos.
- Organização em categorias configuráveis por empresa.
- Definição de estoque mínimo e acompanhamento de quantidades.
- Ajustes de estoque com registro de movimentações.
- Desativação lógica de produtos, preservando os registros no banco.

### 6.4. Movimentações

- Histórico de alterações de quantidade.
- Identificação de produto, tipo, data, quantidade anterior e nova quantidade.
- Observações e rastreabilidade de ajustes, incluindo operações originadas por importação.

### 6.5. Importação de planilhas Excel

O projeto disponibiliza dois modelos na pasta `modelos/`:

| Modelo | Finalidade |
|---|---|
| `STO_KA_Modelo_Cadastro.xlsx` | Cadastro de novos produtos e atualização de quantidades de produtos existentes |
| `STO_KA_Modelo_Atualizacao.xlsx` | Atualização de estoque usando código e quantidade |

**Fluxo:** selecionar o modelo e o arquivo, validar os dados, conferir a pré-visualização e confirmar a importação.

Validações implementadas incluem códigos duplicados na planilha, quantidades negativas, produtos inexistentes ou inativos na atualização e categorias inválidas. Na atualização, **a quantidade informada substitui a quantidade atual**, em vez de ser somada. As operações são registradas no banco e no histórico de movimentações.

A função de importação possui limite de **1.000 linhas por operação**; a interface restringe arquivos a **5 MB**.

### 6.6. Gestão de usuários e permissões — Etapa 7

O **Gestor (papel `administrador`)** possui acesso administrativo à empresa. Na página `usuarios.html`, ele pode:

- Visualizar os usuários vinculados à empresa.
- Vincular como Analista uma conta previamente cadastrada no Supabase Auth.
- Habilitar ou desabilitar permissões individuais de cada Analista.
- Salvar as permissões e remover vínculos de Analistas.

O **Analista (papel `operador`)** recebe as permissões definidas pelo Gestor, como criar, editar ou desativar produtos, gerenciar categorias, ajustar estoque e importar Excel. As permissões são armazenadas no campo `permissoes` da tabela `membros_empresa` e verificadas por funções SQL.

**Importante:** esconder controles na interface não é suficiente para garantir segurança. As funções RPC e políticas do banco também precisam impedir ações não autorizadas. A verificação final dessas restrições deve ser feita com uma conta de Analista.

### 6.7. Múltiplas empresas por usuário

Uma mesma conta pode participar de mais de uma empresa, com papéis distintos em cada uma. Exemplo:

| Empresa | Papel |
|---|---|
| Empresa Teste | Gestor |
| Mojang | Analista |

O STO KA apresenta um **seletor de empresas** quando o usuário possui mais de um vínculo. Ao escolher uma empresa, o sistema utiliza seu vínculo correspondente para carregar os dados e permissões. A escolha é mantida durante a sessão do navegador, e a troca de empresa pode ser realizada sem sair da conta.

### 6.8. Configurações e experiência de uso

- Consulta de informações da conta e da empresa.
- Navegação entre as páginas do sistema.
- Interface responsiva, incluindo navegação em dispositivos móveis.
- Validação de formulários, labels, alertas de confirmação, sucesso e erro.

## 7. Instruções básicas de utilização

### 7.1. Acessar o sistema online

1. Abra **https://pedrohfaber-design.github.io/STO-KA/**.
2. Cadastre-se com e-mail e senha ou entre com uma conta existente.
3. Se necessário, conclua o cadastro inicial da empresa.
4. Caso possua mais de um vínculo, escolha a empresa em que deseja trabalhar.
5. Utilize **Dashboard**, **Produtos**, **Importação**, **Movimentações**, **Configurações** e, se for Gestor, **Usuários e Permissões**.
6. Ao terminar, clique em **Sair da conta**.

### 7.2. Cadastrar produtos e movimentar estoque

1. Acesse **Produtos**.
2. Cadastre as categorias necessárias.
3. Cadastre produtos com código, nome e demais informações.
4. Utilize as ações disponíveis conforme suas permissões.
5. Confira as alterações em **Movimentações** e os indicadores no **Dashboard**.

### 7.3. Importar planilhas

1. Abra **Importar Excel**.
2. Baixe o modelo correspondente à operação.
3. Preencha o arquivo sem alterar os cabeçalhos exigidos.
4. Selecione o arquivo, valide e revise a pré-visualização.
5. Confirme a importação e confira o resultado.

### 7.4. Gerenciar Analistas

1. Entre como Gestor na empresa desejada.
2. Acesse **Usuários e Permissões**.
3. Informe o e-mail de uma conta já cadastrada para vinculá-la à empresa.
4. Selecione as permissões desejadas e clique em **Salvar permissões**.
5. Teste o acesso com a conta do Analista, inclusive ações que devem ser bloqueadas.

### 7.5. Executar localmente

**Pré-requisitos:** navegador moderno, servidor HTTP local (por exemplo, Live Server), Git e projeto Supabase configurado.

```bash
git clone https://github.com/pedrohfaber-design/STO-KA.git
cd STO-KA
```

1. Configure `js/config.js` com a **URL** e a **chave pública (publishable/anon)** do seu projeto Supabase, usando `js/config.example.js` como referência.
2. Prepare no Supabase as tabelas, políticas RLS e funções RPC necessárias. Os scripts em `database/` documentam migrações e partes da configuração; **não constituem necessariamente um instalador completo para um banco vazio**.
3. Configure as URLs de autenticação e redirecionamento no painel do Supabase.
4. Inicie um servidor HTTP local e abra a URL indicada. Não utilize `file://`.

**Segurança:** nunca publique chaves `service_role`, chaves secretas ou senhas no frontend. O uso de chave pública exige políticas RLS e verificações de autorização adequadas.

### 7.6. Estrutura de pastas

```text
STO-KA/
├── index.html                  # Dashboard
├── cadastro.html               # Cadastro
├── login.html                  # Login
├── empresa.html                # Cadastro inicial da empresa
├── produtos.html               # Produtos e categorias
├── importacao.html             # Importação de Excel
├── movimentacoes.html          # Histórico de movimentações
├── configuracoes.html          # Configurações
├── usuarios.html               # Gestão de funcionários e permissões
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── auth.js                 # Sessão e seleção de empresas
│   ├── supabase.js
│   ├── config.js
│   ├── config.example.js
│   ├── dashboard.js
│   ├── produtos.js
│   ├── importacao.js
│   ├── movimentacoes.js
│   ├── configuracoes.js
│   └── usuarios.js
├── modelos/
│   ├── STO_KA_Modelo_Cadastro.xlsx
│   └── STO_KA_Modelo_Atualizacao.xlsx
├── database/
│   ├── README.md
│   ├── etapa_4_3.sql
│   ├── etapa_5_1_importacao.sql
│   ├── etapa_7_permissoes.sql
│   └── ETAPA_7_INSTRUCOES.md
└── README.md
```

### 7.7. Principais tabelas

| Tabela | Finalidade |
|---|---|
| `empresas` | Identificação das empresas |
| `perfis` | Dados básicos dos usuários |
| `membros_empresa` | Vínculos, papéis e permissões por empresa |
| `categorias` | Categorias próprias de cada empresa |
| `produtos` | Cadastros, quantidades e situação dos produtos |
| `movimentacoes` | Histórico de alterações de estoque |
| `importacoes` | Registro das importações realizadas |

### 7.8. Testes e validações

Durante o desenvolvimento foram realizados testes manuais de autenticação, cadastro e edição de produtos, ajustes de estoque, importação e validação de planilhas, isolamento de dados entre empresas e responsividade do dashboard em celular.

Na Etapa 7, foram observados o vínculo de Analista, o salvamento de permissões e a seleção entre Empresa Teste e Mojang com a mesma conta. **Antes da entrega final, é necessário concluir o teste de negação de operações para Analistas sem permissão** e conferir a consistência entre as chaves `ajustar_estoque` (interface) e `movimentar_estoque` (função SQL de ajuste). Essas verificações não equivalem a uma auditoria completa de segurança.

## 8. Link da aplicação no GitHub Pages

- **Aplicação:** https://pedrohfaber-design.github.io/STO-KA/
- **Dashboard:** https://pedrohfaber-design.github.io/STO-KA/index.html
- **Código-fonte:** https://github.com/pedrohfaber-design/STO-KA

> O endereço público poderá exibir a versão anterior até que as alterações locais da Etapa 7 sejam enviadas ao GitHub e o GitHub Pages conclua a publicação.

---

### Diferenciais do STO KA

O STO KA combina **gestão multiempresa**, **permissões individuais**, **troca de empresa sem novo login**, **importação de Excel com pré-visualização** e **histórico de movimentações**. Assim, cada empresa pode configurar seus próprios produtos e funcionários e migrar gradualmente de planilhas para uma aplicação web centralizada.

**STO KA — Seu estoque, suas regras. Da planilha à gestão inteligente.**
