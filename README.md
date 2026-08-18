# Instant Desk

Sistema de Help Desk desenvolvido como projeto de estudo, aplicando os conceitos do bootcamp (baseado no guia "Blog Pessoal") adaptados para o domínio de gestão de chamados/tickets de suporte.

🔗 **Aplicação em produção:** [instant-desk.onrender.com](https://instant-desk.onrender.com)
📄 **Documentação da API (Swagger):** [instant-desk.onrender.com/swagger](https://instant-desk.onrender.com/swagger)

## Sobre o projeto

O Instant Desk permite abrir, categorizar e priorizar tickets de suporte, com autenticação JWT e isolamento de dados por empresa (multi-tenancy). O objetivo principal é praticar a construção de uma API REST completa com NestJS, TypeORM e PostgreSQL, seguindo boas práticas de arquitetura em camadas (controller → service → repository), documentação automatizada, testes automatizados e deploy em produção.

## Tecnologias utilizadas

- **[NestJS](https://nestjs.com/)** — framework Node.js para construção da API
- **[TypeORM](https://typeorm.io/)** — ORM para mapeamento objeto-relacional
- **[PostgreSQL](https://www.postgresql.org/)** — banco de dados relacional
- **[class-validator](https://github.com/typestack/class-validator)** — validação de DTOs/entidades
- **[Passport + JWT](https://docs.nestjs.com/security/authentication)** — autenticação e autorização
- **[Bcrypt](https://www.npmjs.com/package/bcrypt)** — hash de senhas
- **[Swagger](https://docs.nestjs.com/openapi/introduction)** — documentação interativa da API
- **[Jest](https://jestjs.io/) + [Supertest](https://github.com/ladjs/supertest)** — testes automatizados (unitários e e2e)
- **TypeScript**
- Deploy: **[Render](https://render.com/)**

## Modelo de dados

O sistema é organizado em torno da entidade `Ticket`, que se relaciona com `Category` e `Priority`, e é aberto por um `User`. Para suportar múltiplas empresas usando o mesmo sistema (multi-tenancy), `User`, `Category` e `Priority` pertencem a uma `Company` — o `Ticket` herda esse isolamento indiretamente, através dessas relações.

```
Company ──┬──> User ──┐
          ├──> Category ─┼──> Ticket
          └──> Priority ─┘
```

| Entidade | Descrição                                                        |
|----------|-------------------------------------------------------------------|
| Ticket   | Entidade central: chamado de suporte aberto por um usuário        |
| Category | Categoria do chamado (ex: Hardware, Software, Rede)                |
| Priority | Nível de prioridade do chamado                                    |
| User     | Usuário do sistema (quem abre tickets), autenticado via JWT       |
| Company  | Empresa à qual usuários, categorias e prioridades pertencem (multi-tenancy) |

> `Comment` e `Attachment` estavam no planejamento inicial, mas foram substituídos pelo módulo `Company` como prioridade de aprendizado (multi-tenancy). Podem retornar ao escopo futuramente.

## Status do desenvolvimento

| Módulo / Funcionalidade          | Status                          |
|-----------------------------------|----------------------------------|
| Ticket                            | ✅ Completo, testado (e2e)       |
| Category                          | ✅ Completo, testado (e2e)       |
| Priority                          | ✅ Completo, testado (e2e)       |
| User                              | ✅ Completo, testado (e2e)       |
| Autenticação / JWT                | ✅ Completo                      |
| Documentação (Swagger)            | ✅ Completo                      |
| Testes e2e (Jest + Supertest)     | ✅ Ticket, Category, Priority, User |
| Deploy em produção (Render)       | ✅ Completo                      |
| **Company (multi-tenancy)**       | 🚧 Em andamento                  |
| &nbsp;&nbsp;— Fase 1: CRUD isolado          | ✅ Completo |
| &nbsp;&nbsp;— Fase 2: Relacionamento com User/Category/Priority | ✅ Completo |
| &nbsp;&nbsp;— Fase 3: Validação obrigatória no create/update    | ✅ Completo |
| &nbsp;&nbsp;— Fase 4: JWT payload com `company_id`              | ⏳ Planejado |
| &nbsp;&nbsp;— Fase 5: Filtro automático por empresa logada       | ⏳ Planejado |
| Comment                           | ⏳ Não iniciado (fora do escopo atual) |
| Attachment                        | ⏳ Não iniciado (fora do escopo atual) |

## Convenções do projeto

- Tabelas no banco usam prefixo `tb_` (ex: `tb_tickets`, `tb_categories`, `tb_companies`)
- Nomes de campos e classes em português (`titulo`, `descricao`, `nome`, etc.)
- Cada módulo segue o padrão de camadas: `entity` → `service` → `controller` → `module`
- Services seguem o padrão: `findAll`, `findById` (lança 404 se não encontrar), `create`, `update`, `delete`
- Controllers seguem o padrão REST: `GET /`, `GET /:id`, `POST /`, `PUT /`, `DELETE /:id`, com guard JWT aplicado a nível de classe
- Validações feitas com `class-validator`
- Relacionamentos entre entidades usam resolução "preguiçosa" (`type: () => Entidade`) tanto no TypeORM quanto no `@ApiProperty()` do Swagger, para evitar problemas de dependência circular

## Como rodar o projeto localmente

### Pré-requisitos

- Node.js (versão 18 ou superior)
- PostgreSQL instalado e rodando
- npm

### Passo a passo

1. Clone o repositório:
```bash
git clone https://github.com/Phcode007/instant_desk.git
cd instant_desk
```

2. Instale as dependências:
```bash
npm install
```

3. Crie o banco de dados no PostgreSQL:
```sql
CREATE DATABASE db_instant_desk;
```

4. A configuração de conexão para desenvolvimento local já está definida em `src/data/service/dev.service.ts` (Postgres local, porta 5432). Ajuste `host`, `username`, `password` e `database` nesse arquivo caso sua configuração local seja diferente. Não é necessário criar um `.env` para rodar localmente — a aplicação usa `DevService` por padrão sempre que `NODE_ENV` não estiver definida como `production`.

5. Rode a aplicação em modo de desenvolvimento:
```bash
npm run start:dev
```

A API estará disponível em `http://localhost:4000`, e a documentação interativa em `http://localhost:4000/swagger`.

## Testando a API

### Via Swagger

Acesse `http://localhost:4000/swagger` (ou a [versão em produção](https://instant-desk.onrender.com/swagger)). Cadastre um usuário em `POST /users/cadastrar`, faça login em `POST /users/logar` para obter o token JWT, clique em **Authorize** e cole o token para desbloquear as rotas protegidas.

### Via testes automatizados (e2e)

```bash
npm run test:e2e
```

Ou para rodar a suíte de um módulo específico:
```bash
npx jest test/user.e2e-spec.ts --config test/jest-e2e.json
npx jest test/category.e2e-spec.ts --config test/jest-e2e.json
npx jest test/priority.e2e-spec.ts --config test/jest-e2e.json
npx jest test/ticket.e2e-spec.ts --config test/jest-e2e.json
```

Os testes usam um banco SQLite em memória (`better-sqlite3`), isolado do banco de desenvolvimento/produção.

### Endpoints disponíveis

| Recurso  | Rotas                                                                 |
|----------|------------------------------------------------------------------------|
| Ticket   | `GET /tickets`, `GET /tickets/:id`, `GET /tickets/descricao/:descricao`, `POST /tickets`, `PUT /tickets`, `DELETE /tickets/:id` |
| Category | `GET /category`, `GET /category/:id`, `POST /category`, `PUT /category`, `DELETE /category/:id` |
| Priority | `GET /priorities`, `GET /priorities/:id`, `POST /priorities`, `PUT /priorities`, `DELETE /priorities/:id` |
| User     | `GET /users/all`, `GET /users/:id`, `POST /users/cadastrar` (público), `PUT /users/atualizar` |
| Auth     | `POST /users/logar` (público) |
| Company  | `GET /companies`, `GET /companies/:id`, `POST /companies`, `PUT /companies`, `DELETE /companies/:id` |

> Todas as rotas exigem token JWT (`Authorization: Bearer <token>`), exceto `POST /users/cadastrar` e `POST /users/logar`.

## Fluxo de trabalho (Git)

- O módulo `Ticket` foi desenvolvido diretamente na branch `main`
- A partir do módulo `Category`, cada novo módulo passou a ser desenvolvido em uma branch própria (ex: `category`, `priority`, `user`, `company`)
- Após finalizar e testar um módulo, a branch correspondente é mergeada de volta na `main`

```bash
git checkout main
git merge nome-do-modulo
git push origin main
```

## Deploy

A aplicação está hospedada no [Render](https://render.com/), com deploy automático a partir da branch `main`. A conexão com o banco de produção alterna automaticamente entre desenvolvimento e produção via a variável de ambiente `NODE_ENV`:

- `NODE_ENV` não definida (ou diferente de `production`) → usa `DevService` (Postgres local)
- `NODE_ENV=production` → usa `ProdService` (lê `DATABASE_URL` da variável de ambiente, com SSL habilitado)

## Roadmap

- [x] CRUD de Ticket
- [x] CRUD de Category + relacionamento com Ticket
- [x] CRUD de Priority + relacionamento com Ticket
- [x] CRUD de User
- [x] Autenticação e autorização com JWT
- [x] Documentação da API (Swagger)
- [x] Testes automatizados e2e (Ticket, Category, Priority, User)
- [x] Deploy em produção (Render)
- [x] Multi-tenancy — Company: CRUD, relacionamentos, validação obrigatória
- [ ] Multi-tenancy — Company: `company_id` no payload JWT
- [ ] Multi-tenancy — Company: filtro automático de dados por empresa logada
- [ ] CRUD de Comment (vinculado a Ticket)
- [ ] CRUD de Attachment (vinculado a Comment)

## Autor

Paulo — projeto desenvolvido para fins de aprendizado em NestJS, TypeORM, PostgreSQL e multi-tenancy.
