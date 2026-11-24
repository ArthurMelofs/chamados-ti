# HelpDesk TI — Organização de Chamados

# Nome: Arthur Melo Ferreira Santos
# RA: 151566

**Última atualização: 23/11/2026**

Sistema web para abertura, acompanhamento e organização de chamados de TI, construído no padrão **MVC** com **Node.js, Express, EJS, CSS e Sequelize (SQLite)**.

O sistema foi atualizado com a integração do **Firebase Authentication e Cloud Firestore**, permitindo a autenticação de usuários, o gerenciamento de sessões e o controle de acesso de acordo com o perfil de cada usuário.

## Como rodar

```bash
npm install
npm start
```

Acesse:

http://localhost:3000

- `npm run dev` — reinicia automaticamente ao salvar arquivos (`node --watch`).
- `npm run seed` — recria o banco com os dados de exemplo.

Na primeira execução, o arquivo `database.sqlite` é criado e populado automaticamente.

### Configuração do Firebase

Para executar o sistema com autenticação, é necessário:

- Possuir um projeto configurado no Firebase.
- Habilitar o Firebase Authentication.
- Habilitar os provedores de autenticação por e-mail/senha e Google.
- Configurar o Cloud Firestore.
- Configurar o arquivo `public/js/firebase-config.js`.
- Gerar uma credencial de serviço para o Firebase Admin SDK.
- Armazenar a credencial localmente conforme o caminho definido em `config/firebaseAdmin.js`.

Por questões de segurança, o arquivo `serviceAccountKey.json` não deve ser publicado no GitHub.

## Funcionalidades

- **Dashboard:** indicadores, fila prioritária, chamados por prioridade/status, carga da equipe, distribuição por categoria e tempo médio de resolução.

- **Chamados:** CRUD completo, busca por título, solicitante e protocolo (`CH-00001`), filtros por status, prioridade, categoria e técnico.

- **Ações rápidas:** alteração de status, prioridade e responsável com registro automático no histórico, respeitando as permissões de acesso.

- **Comentários:** registro de comentários e linha do tempo por chamado.

- **Técnicos e categorias:** cadastro, edição e remoção, restritos aos administradores.

- **Autenticação:** cadastro de usuários, login por e-mail e senha, integração com o Google e logout.

- **Controle de acesso:** diferenciação entre administradores e usuários comuns.

- **Restrição de chamados:** associação dos chamados ao usuário responsável pela sua abertura.

- **Gerenciamento de sessões:** validação da autenticação pelo backend.

## Atualizações realizadas

### 1. Integração com Firebase Authentication

Foi implementado um sistema de autenticação utilizando o Firebase Authentication.

Principais alterações:

- Criação da página de login.
- Criação do formulário de cadastro.
- Autenticação por e-mail e senha.
- Integração com o provedor de autenticação do Google.
- Implementação da funcionalidade de logout.
- Redirecionamento de usuários não autenticados para a página de login.
- Integração do Firebase Admin SDK com o backend.

### 2. Integração com Cloud Firestore

Foi criada uma coleção denominada `usuarios` no Cloud Firestore, responsável pelo armazenamento das informações dos usuários cadastrados.

Cada usuário possui os seguintes campos:

| Campo | Descrição |
| --- | --- |
| uid | Identificador único do Firebase |
| nome | Nome do usuário |
| email | E-mail cadastrado |
| perfil | Nível de acesso ao sistema |

Os novos usuários recebem automaticamente o perfil `user` após o cadastro.

Também foram configuradas regras de segurança para impedir que usuários comuns alterem diretamente suas permissões pelo cliente.

### 3. Gerenciamento de sessões

Foi implementado o gerenciamento de sessões utilizando cookies e o Firebase Admin SDK.

Principais alterações:

- Instalação da dependência `firebase-admin`.
- Instalação da dependência `cookie-parser`.
- Criação de cookies de sessão HTTP-only.
- Validação das sessões pelo backend.
- Implementação das rotas de criação e encerramento de sessão.
- Redirecionamento para a página de login quando não existe uma sessão válida.

### 4. Controle de acesso por perfil

Foram implementados middlewares responsáveis pela autenticação e autorização dos usuários.

Os principais perfis implementados e testados foram:

#### Administrador (ADMIN)

- Visualização de todos os chamados.
- Cadastro, edição e exclusão de chamados.
- Gerenciamento de técnicos.
- Gerenciamento de categorias.
- Alteração de status e prioridade.
- Atribuição de técnicos aos chamados.
- Visualização dos indicadores gerais do sistema.

#### Usuário comum (USER)

- Abertura de novos chamados.
- Visualização dos próprios chamados.
- Edição e exclusão dos próprios chamados, respeitando as permissões.
- Adição de comentários.
- Visualização dos indicadores relacionados aos próprios chamados.
- Restrição de acesso às páginas administrativas.

As restrições foram implementadas tanto na interface quanto no backend, impedindo o acesso não autorizado por meio das URLs administrativas.

### 5. Restrição de chamados por usuário

O modelo `Ticket` foi atualizado com a inclusão do campo `usuarioUid`, responsável por associar cada chamado ao identificador do usuário autenticado no Firebase.

Principais alterações:

- Inclusão da coluna `usuarioUid` no banco SQLite.
- Verificação automática da existência da coluna durante a inicialização do sistema.
- Associação automática dos novos chamados ao usuário autenticado.
- Filtragem dos chamados de acordo com o UID.
- Restrição de acesso aos chamados pertencentes a outros usuários.
- Adaptação das operações de consulta, edição, exclusão e comentários.
- Adaptação dos indicadores do dashboard.
- Identificação automática do solicitante e do autor dos comentários.

Os chamados cadastrados antes da implementação da autenticação foram preservados no banco de dados.

### 6. Atendimento pelo técnico — Implementação parcial

Foi iniciada a implementação de um terceiro perfil de acesso, denominado `tecnico`.

Foram desenvolvidas as seguintes alterações:

- Inclusão do perfil `tecnico` nas regras de permissão.
- Implementação do vínculo entre uma conta Firebase e um técnico cadastrado no SQLite.
- Inclusão do campo `technicianId` no perfil do usuário vinculado.
- Desenvolvimento da filtragem de chamados atribuídos ao técnico.
- Implementação da permissão de atualização de status dos chamados atribuídos.
- Adaptação das interfaces de visualização e atendimento.
- Restrição das ações administrativas para técnicos.

Entretanto, não foi possível concluir os testes de vinculação da conta, atribuição de chamados e atendimento pelo técnico dentro do prazo estabelecido.

Portanto, essa funcionalidade permanece parcialmente implementada e necessita de validação.

### 7. Gerenciamento de usuários — Implementação parcial

Foi iniciada a implementação de uma área administrativa destinada ao gerenciamento dos usuários cadastrados no Firebase.

Principais alterações desenvolvidas:

- Criação do arquivo `controllers/userController.js`.
- Criação da página `views/users/index.ejs`.
- Implementação das rotas administrativas de usuários.
- Inclusão da opção Usuários no menu administrativo.
- Desenvolvimento da listagem dos usuários cadastrados no Firestore.
- Desenvolvimento da alteração de perfis.
- Desenvolvimento da vinculação entre usuários e técnicos.
- Implementação da lógica de exclusão de contas do Firebase Authentication e Firestore.
- Proteção contra alteração ou exclusão da própria conta administrativa.

Durante os testes finais, foi identificado um problema de página não encontrada no fluxo administrativo.

Não foi possível identificar e corrigir completamente a causa do problema dentro do prazo de entrega.

Dessa forma, o código foi desenvolvido, porém a funcionalidade não foi validada integralmente.

## Estrutura (MVC)

```text
app.js                 # inicialização do Express e do banco

config/                # configurações do banco, Firebase Admin
                       # e constantes do sistema

models/                # Category, Technician, Ticket,
                       # Comment e associações

controllers/           # regras de negócio dos recursos

routes/                # mapeamento de URLs e autenticação

middlewares/           # autenticação, autorização e
                       # variáveis globais para as views

views/                 # templates EJS, páginas de login,
                       # chamados, técnicos, categorias e usuários

public/                # CSS, JavaScript e configuração
                       # web do Firebase

seeders/               # dados de exemplo

utils/                 # funções auxiliares, validações
                       # e permissões dos chamados
```

## Tecnologias utilizadas

### Front-end

- HTML5
- CSS3
- JavaScript
- EJS

### Back-end

- Node.js
- Express
- Sequelize
- Firebase Admin SDK
- Cookie Parser
- Method Override

### Banco de dados

- SQLite
- Cloud Firestore

### Autenticação

- Firebase Authentication
- Autenticação por e-mail e senha
- Integração com Google
- Cookies de sessão

### Ferramentas de desenvolvimento

- Visual Studio Code
- Git
- GitHub
- PowerShell
- Firebase Console

## Testes realizados

Durante o desenvolvimento, foram realizados testes manuais de autenticação, autorização, criação de chamados e integração com o banco de dados.

| Teste | Resultado |
| --- | --- |
| Cadastro de usuário | Concluído |
| Login por e-mail e senha | Concluído |
| Integração com Google | Implementado, com ressalvas nos testes |
| Logout | Concluído |
| Cadastro automático no Firestore | Concluído |
| Criação automática do perfil USER | Concluído |
| Diferenciação entre ADMIN e USER | Concluído |
| Restrição de acesso às categorias | Concluído |
| Restrição de acesso aos técnicos | Concluído |
| Criação de chamados por usuário | Concluído |
| Associação do chamado ao UID | Concluído |
| Restrição de visualização de chamados | Concluído |
| Adição de comentários | Concluído |
| Visualização geral pelo administrador | Concluído |
| Atendimento pelo técnico | Parcial |
| Gerenciamento de usuários | Parcial |
| Exclusão de usuários | Não validado |
| Deploy no Render | Pendente |

### Teste de associação de chamados

Foi realizada uma consulta diretamente ao banco SQLite para verificar a associação dos chamados aos usuários autenticados.

```bash
node -e "const { Ticket } = require('./models'); Ticket.findAll({attributes:['id','titulo','solicitante','usuarioUid'],raw:true}).then(d=>console.table(d)).catch(console.error)"
```

O teste confirmou que o chamado criado pelo usuário Thiago foi associado corretamente ao seu UID do Firebase.

Também foi possível verificar que os chamados anteriores à implementação da autenticação permaneceram armazenados no banco de dados.

### Teste de controle de acesso

Foram realizados testes utilizando contas com os perfis `admin` e `user`.

Foi confirmado durante o desenvolvimento que:

- O administrador consegue visualizar todos os chamados.
- O usuário comum consegue visualizar os chamados associados à sua conta.
- O usuário comum não possui acesso às páginas administrativas de técnicos e categorias.
- O usuário consegue criar chamados e adicionar comentários.
- O sistema identifica o usuário autenticado durante as operações.

Os testes foram realizados localmente durante o desenvolvimento. Não foi possível repetir todos os testes após as últimas alterações.

## Situação dos requisitos acadêmicos

| Requisito | Situação |
| --- | --- |
| Autenticação por e-mail e Google | Implementado, com ressalvas nos testes do Google |
| Cadastro automático com perfil de usuário | Concluído |
| Restrição de chamados por usuário | Concluído |
| Atendimento pelo técnico | Parcialmente implementado |
| Gerenciamento e exclusão de usuários | Parcialmente implementado |
| Deploy no Render | Pendente |
| Atualização da documentação README | Concluído |

## Pendências

As seguintes funcionalidades e melhorias não foram completamente finalizadas dentro do prazo de desenvolvimento:

- Corrigir o erro de página não encontrada no fluxo administrativo.
- Finalizar os testes de vinculação de contas aos técnicos.
- Validar o atendimento de chamados pelo perfil `tecnico`.
- Validar a alteração de perfis pela interface administrativa.
- Validar a exclusão de usuários pelo administrador.
- Finalizar os testes de autenticação pelo Google.
- Configurar as credenciais privadas do Firebase por variáveis de ambiente.
- Configurar o ambiente de produção.
- Realizar o deploy da aplicação na plataforma Render.
- Configurar a persistência do banco SQLite no ambiente de hospedagem.
- Realizar novos testes após a finalização das funcionalidades pendentes.

## Segurança

Durante o desenvolvimento, foram adotadas medidas de segurança relacionadas à autenticação e ao controle de acesso.

- Utilização do Firebase Authentication para autenticação.
- Validação das sessões no backend.
- Utilização de cookies HTTP-only.
- Proteção das rotas administrativas.
- Restrição de acesso aos chamados por UID.
- Regras de segurança no Cloud Firestore.
- Utilização do `.gitignore` para impedir o versionamento de credenciais privadas.

O arquivo `serviceAccountKey.json` contém informações privadas do Firebase e não deve ser compartilhado ou publicado no repositório.

## Considerações finais

O projeto HelpDesk TI inicialmente consistia em um sistema local de gerenciamento de chamados sem autenticação.

Durante o desenvolvimento das novas funcionalidades, foi realizada a integração com o Firebase Authentication e o Cloud Firestore, permitindo a criação de contas, autenticação, gerenciamento de sessões e diferenciação dos níveis de acesso.

Também foi implementada a associação dos chamados aos usuários autenticados, garantindo que usuários comuns tenham acesso aos chamados vinculados às suas respectivas contas.

As funcionalidades de atendimento pelo técnico e gerenciamento de usuários receberam alterações no backend e na interface. Entretanto, devido aos problemas encontrados durante os testes finais e ao prazo disponível, não foi possível concluir integralmente essas funcionalidades.

A publicação da aplicação no Render também permaneceu pendente.

Apesar dessas limitações, o sistema apresentou evolução em relação à versão inicial, principalmente nos aspectos de autenticação, integração de serviços, controle de acesso e organização dos dados.