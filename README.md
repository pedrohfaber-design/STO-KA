📦 STO KA — Sistema Web de Gestão de Estoque
Projeto acadêmico | FATEC Itu

O STO KA é uma aplicação web de gerenciamento de estoque voltada a empresas de diferentes segmentos. O sistema centraliza o cadastro de produtos, o acompanhamento das quantidades e o histórico de movimentações, com importação de planilhas Excel padronizadas, autenticação de usuários e separação dos dados por empresa.

🌐 Acessar o sistema: https://pedrohfaber-design.github.io/STO-KA/
💻 Repositório: https://github.com/pedrohfaber-design/STO-KA
Observação: o sistema exige uma conta cadastrada e conexão com o Supabase para utilizar as funcionalidades protegidas.

1. Nome do projeto
STO KA — Sistema Web de Gestão de Estoque.

O nome identifica uma solução para organizar, consultar e atualizar estoques em uma interface web, com atenção à simplicidade de utilização e à rastreabilidade das operações.
2. Problema identificado
O controle de estoque é uma atividade essencial para negócios de diferentes portes. Entretanto, muitas empresas ainda dependem de anotações manuais e planilhas eletrônicas isoladas, que podem provocar:
- divergências entre quantidades registradas e quantidades disponíveis;
- retrabalho na atualização de produtos e estoques;
- duplicidade de cadastros e dificuldade de padronização;
- pouca visibilidade sobre itens esgotados ou abaixo do estoque mínimo;
- dificuldade para identificar quando e como uma quantidade foi alterada;
- falta de centralização e de separação adequada dos dados entre empresas.
O STO KA foi desenvolvido para reduzir esses problemas por meio de um sistema centralizado, com registros persistidos em banco de dados e operações acompanhadas por histórico.
3. Objetivo do projeto
Objetivo geral
Desenvolver uma aplicação web para facilitar a gestão de estoque de diferentes empresas, reunindo cadastro, consulta, atualização e rastreabilidade de produtos em um ambiente acessível pelo navegador.
Objetivos específicos
- Permitir cadastro e autenticação por e-mail e senha.
- Vincular os dados a uma empresa e aplicar regras de acesso.
- Cadastrar, consultar, editar e desativar produtos.
- Organizar produtos em categorias definidas pela empresa.
- Controlar quantidades e estoque mínimo.
- Registrar alterações de estoque e consultar o histórico.
- Apresentar indicadores no painel inicial.
- Importar produtos e atualizar quantidades a partir de modelos oficiais de Excel.
- Validar dados antes de confirmar alterações, evitando duplicidades e valores inválidos.
- Disponibilizar o frontend por meio do GitHub Pages.
4. Integrantes da equipe
- Pedro Henrique Faber
Caso o trabalho tenha outros integrantes, acrescentar os nomes nesta seção antes da entrega.

5. Tecnologias utilizadas
Tecnologia	Aplicação no projeto
HTML5	Estrutura semântica das páginas e formulários.
CSS3	Estilização e ajustes de apresentação.
JavaScript Vanilla	Lógica da interface, validações, navegação e integração com serviços, sem frameworks JavaScript.
Tailwind CSS	Classes utilitárias para construção da interface.
Supabase Authentication	Cadastro, login e gerenciamento da sessão dos usuários.
Supabase / PostgreSQL	Persistência de empresas, perfis, categorias, produtos, importações e movimentações.
PostgreSQL RLS	Políticas de controle de leitura dos dados por usuário e empresa.
Funções SQL (RPC)	Operações de escrita com verificações de permissão e regras de negócio.
SheetJS (XLSX)	Leitura de arquivos Excel no navegador.
SweetAlert2	Mensagens de sucesso, erro e confirmação.
Lucide Icons	Ícones da interface.
Git e GitHub	Versionamento e armazenamento do código-fonte.
GitHub Pages	Hospedagem estática do frontend.
Visual Studio Code	Ambiente de desenvolvimento.


Arquitetura: frontend estático em HTML/CSS/JavaScript, conectado ao Supabase para autenticação, consultas e execução de funções PostgreSQL. O GitHub Pages hospeda os arquivos da interface; os dados são armazenados no Supabase, não no GitHub.
6. Funcionalidades implementadas
6.1. Cadastro, login e sessão
- Cadastro de usuário por e-mail e senha.
- Login e logout.
- Proteção das páginas internas, com redirecionamento para login quando não há sessão.
- Cadastro inicial da empresa e vínculo do usuário à organização.
6.2. Dashboard
- Visão geral dos produtos ativos.
- Indicadores de quantidade em estoque e produtos com estoque baixo.
- Resumo de movimentações e produtos recentes.
- Informações consultadas no banco de dados da empresa autenticada.
6.3. Produtos e categorias
- Cadastro e consulta de produtos com código, nome, categoria e informações de estoque.
- Edição de informações de produtos.
- Ajustes de quantidade com registro de movimentação.
- Definição de estoque mínimo.
- Pesquisa de produtos por código ou nome.
- Cadastro e gerenciamento de categorias.
- Exclusão lógica: produtos desativados deixam de aparecer na listagem de ativos, mas seus registros são preservados no banco.
6.4. Histórico de movimentações
- Consulta das alterações de estoque registradas.
- Identificação de produto, data, tipo, quantidade anterior e nova quantidade.
- Exibição de observações e identificação de ajustes originados por importação.
- Filtros, pesquisa e paginação na interface de movimentações.
6.5. Importação de planilhas Excel
O sistema disponibiliza dois modelos oficiais, para facilitar a padronização dos dados:

Modelo de cadastro: permite incluir novos produtos, com campos como código, nome, categoria, quantidade, estoque mínimo, preços e descrição.

Modelo de atualização: utiliza somente as colunas Código e Quantidade, para atualizar produtos já cadastrados.

A importação possui:
1. Seleção do tipo de operação e do arquivo Excel.
2. Leitura e validação das colunas e linhas.
3. Identificação de produtos novos, existentes e sem alteração.
4. Pré-visualização antes da confirmação.
5. Gravação das alterações no PostgreSQL, com registro da importação e das movimentações correspondentes.
Regras importantes:
- O código do produto é único dentro de cada empresa.
- Para produtos existentes, a quantidade informada na planilha substitui a quantidade atual; não é somada.
- Na importação de cadastro, produtos já existentes têm apenas a quantidade atualizada, preservando os demais dados cadastrados.
- A atualização de estoque não cria produtos inexistentes.
- Quantidades negativas, códigos duplicados na mesma planilha e produtos desativados são rejeitados.
- Categorias informadas para novos produtos devem existir previamente no sistema.
- O processamento no banco é realizado por função SQL, com validações e comportamento transacional.
- O limite implementado na função de importação é de 1.000 linhas por operação; a interface também restringe o tamanho do arquivo a 5 MB.
6.6. Configurações
- Consulta ao nome e à data de cadastro da empresa.
- Consulta ao nome, e-mail e papel do usuário autenticado.
- Acesso ao gerenciamento de produtos e categorias.
6.7. Ambiente multiempresa
O sistema permite que empresas diferentes utilizem a mesma aplicação, com produtos e categorias próprios. As tabelas de negócio relacionam os registros a um identificador de empresa (empresa_id). A interface consulta os dados da empresa do usuário e o banco aplica políticas RLS e verificações de autorização nas funções de escrita.
7. Instruções de utilização
7.1. Acesso online
1. Acesse https://pedrohfaber-design.github.io/STO-KA/.
2. Clique na opção de cadastro, caso ainda não tenha uma conta.
3. Informe os dados solicitados e confirme o e-mail, caso a confirmação esteja habilitada no Supabase.
4. Entre com e-mail e senha.
5. Cadastre a empresa, quando solicitado.
6. Utilize o painel e as páginas de produtos, importação, movimentações e configurações.
7. Ao finalizar, utilize Sair da conta.
7.2. Cadastro e atualização manual
1. Acesse Produtos.
2. Cadastre as categorias necessárias.
3. Cadastre os produtos, informando seus códigos e demais dados.
4. Utilize a opção Ajustar para modificar o estoque e registrar a movimentação.
5. Consulte o dashboard e o histórico para acompanhar os resultados.
7.3. Importação pelo Excel
1. Acesse Importar Excel.
2. Baixe o Modelo de cadastro ou o Modelo de atualização.
3. Preencha a planilha mantendo os cabeçalhos oficiais e a ordem das colunas.
4. Salve o arquivo em formato Excel (.xlsx ou .xls).
5. Selecione no sistema o tipo correspondente à planilha utilizada.
6. Escolha o arquivo e clique em Validar e visualizar.
7. Confira a pré-visualização, especialmente os códigos e as quantidades.
8. Clique em Confirmar importação para gravar as alterações.
9. Consulte Produtos e Movimentações para verificar o resultado.
Exemplo de atualização: se um produto possui 45 unidades e a planilha informa 60, o novo estoque será 60 unidades, com registro da alteração de 45 para 60.
7.4. Executar localmente (desenvolvimento)
Pré-requisitos: navegador moderno, Visual Studio Code ou editor equivalente, servidor HTTP local e acesso a um projeto Supabase configurado.
1. Clone o repositório:
   git clone https://github.com/pedrohfaber-design/STO-KA.git
   cd STO-KA
2. Confira js/config.js, que deve conter a URL do projeto Supabase e a chave pública apropriada. Utilize js/config.example.js como referência, se necessário.
3. Configure no Supabase as tabelas, políticas e funções SQL exigidas pelo projeto. Os scripts disponíveis na pasta database/ documentam parte dessas definições e atualizações; para uma instalação nova, é necessário garantir também a estrutura e as funções criadas nas etapas anteriores.
4. No Supabase, configure as URLs de autenticação em Authentication → URL Configuration, incluindo o endereço do servidor local nas URLs de redirecionamento.
5. Inicie um servidor local, por exemplo com a extensão Live Server do VS Code.
6. Abra a URL local exibida pelo servidor. Não execute as páginas diretamente via file://.
Segurança: nunca utilize nem publique service_role, secret key, senhas ou outras credenciais privadas no frontend ou no repositório. A chave publishable/anon é destinada ao uso público, mas o acesso aos dados depende das políticas e permissões corretas no Supabase.

7.5. Estrutura do projeto
STO-KA/
├── index.html                 # Dashboard
├── cadastro.html              # Cadastro de usuário
├── login.html                 # Autenticação
├── empresa.html               # Cadastro inicial da empresa
├── produtos.html              # Produtos e categorias
├── importacao.html            # Importação de Excel
├── movimentacoes.html         # Histórico de estoque
├── configuracoes.html         # Informações da conta e empresa
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── auth.js
│   ├── config.js
│   ├── config.example.js
│   ├── supabase.js
│   ├── dashboard.js
│   ├── produtos.js
│   ├── importacao.js
│   ├── movimentacoes.js
│   └── configuracoes.js
├── modelos/
│   ├── STO_KA_Modelo_Cadastro.xlsx
│   └── STO_KA_Modelo_Atualizacao.xlsx
├── database/
│   ├── README.md
│   ├── etapa_4_3.sql
│   └── etapa_5_1_importacao.sql
└── README.md
7.6. Principais tabelas do banco
Tabela	Finalidade
empresas	Identificação das empresas.
perfis	Dados básicos dos usuários.
membros_empresa	Associação entre usuários, empresas e papéis.
categorias	Categorias próprias de cada empresa.
produtos	Cadastros, quantidades, preços e estado dos produtos.
movimentacoes	Histórico das alterações de estoque.
importacoes	Registro dos arquivos processados.


7.7. Validações e testes realizados
Durante o desenvolvimento foram realizados testes manuais de:
- cadastro, login, logout e proteção de páginas;
- acesso à mesma empresa em computadores diferentes;
- cadastro, edição, ajuste e desativação de produtos;
- atualização de quantidade por Excel, com registro no histórico;
- cadastro de produtos novos por planilha;
- reimportação sem duplicar cadastros;
- rejeição de quantidades negativas, códigos repetidos, produtos inexistentes e produtos desativados;
- separação dos produtos de duas empresas pela interface;
- verificação de RLS habilitado nas sete tabelas e consulta às políticas de leitura;
- verificação das permissões de execução da função de importação.
Limite da validação: os testes acima são funcionais e verificações de configuração. Não representam uma auditoria completa de segurança ou teste automatizado abrangente. O acesso autenticado na URL pública deve ser confirmado no ambiente de entrega.
8. Link da aplicação no GitHub Pages
Aplicação publicada: https://pedrohfaber-design.github.io/STO-KA/
Página inicial: https://pedrohfaber-design.github.io/STO-KA/index.html
Código-fonte: https://github.com/pedrohfaber-design/STO-KA
Diferencial do STO KA
O diferencial proposto pelo STO KA está na combinação de gestão multiempresa, modelos oficiais de Excel e pré-visualização das alterações. A empresa pode organizar o estoque no sistema e continuar aproveitando informações já mantidas em planilhas, adaptando-as ao padrão disponibilizado pela aplicação. Essa abordagem busca simplificar a transição de controles manuais ou descentralizados para um ambiente digital com histórico de movimentações.
Escopo e observações
Este é um projeto acadêmico. O foco da versão entregue é o controle de estoque e a importação padronizada de planilhas. Funcionalidades como integração com vendas, emissão fiscal, relatórios avançados, recuperação de importações e gestão completa de funcionários não fazem parte do escopo implementado nesta versão.
STO KA — Seu estoque, suas regras. Da planilha à gestão inteligente.