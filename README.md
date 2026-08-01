# Instant Desk

Sistema de Help Desk desenvolvido como projeto de estudo, aplicando os conceitos do bootcamp (baseado no guia "Blog Pessoal") adaptados para o domínio de gestão de chamados/tickets de suporte.

## Sobre o projeto

O Instant Desk permite abrir, categorizar, priorizar e acompanhar tickets de suporte, com comentários e anexos associados a cada chamado. O objetivo principal é praticar a construção de uma API REST completa com NestJS, TypeORM e PostgreSQL, seguindo boas práticas de arquitetura em camadas (controller → service → repository).

## Tecnologias utilizadas

- **[NestJS](https://nestjs.com/)** — framework Node.js para construção da API
- **[TypeORM](https://typeorm.io/)** — ORM para mapeamento objeto-relacional
- **[PostgreSQL](https://www.postgresql.org/)** — banco de dados relacional
- **[class-validator](https://github.com/typestack/class-validator)** — validação de DTOs/entidades
- **TypeScript**

## Modelo de dados

O sistema é organizado em torno da entidade `Ticket`, que se relaciona com `Category` e `Priority`. Cada `Ticket` é aberto por um `User` (que possui um `Role`) e pode receber vários `Comment`, cada um podendo ter `Attachment`.

```
Category ──┐
Priority ──┼──> Ticket ──> Comment ──> Attachment
   User  ──┘       ↑
  Role  ────────────┘
```

| Entidade   | Descrição                                              |
|------------|---------------------------------------------------------|
| Ticket     | Entidade central: chamado de suporte aberto por um usuário |
| Category   | Categoria do chamado (ex: Hardware, Software, Rede)     |
| Priority   | Nível de prioridade do chamado                          |
| User       | Usuário do sistema (quem abre ou atende tickets)        |
| Role       | Papel/permissão do usuário                               |
| Comment    | Comentário/interação dentro de um ticket                |
| Attachment | Arquivo anexado a um comentário                          |

## Status do desenvolvimento

| Módulo     | Status              |
|------------|----------------------|
| Ticket     | ✅ Completo e testado |
| Category   | 🚧 Em andamento       |
| Priority   | ⏳ Não iniciado       |
| User       | ⏳ Não iniciado       |
| Role       | ⏳ Não iniciado       |
| Comment    | ⏳ Não iniciado       |
| Attachment | ⏳ Não iniciado       |
| Autenticação/JWT | ⏳ Planejado para depois dos CRUDs básicos |

## Convenções do projeto

- Tabelas no banco usam prefixo `tb_` (ex: `tb_tickets`, `tb_categories`)
- Nomes de campos e classes em português (`titulo`, `descricao`, `nome`, etc.)
- Cada módulo segue o padrão de camadas: `entity` → `service` → `controller` → `module`
- Services seguem o padrão: `findAll`, `findById` (lança 404 se não encontrar), `create`, `update`, `delete`
- Controllers seguem o padrão REST: `GET /`, `GET /:id`, `POST /`, `PUT /`, `DELETE /:id`
- Validações feitas com `class-validator`

## Como rodar o projeto localmente

### Pré-requisitos

- Node.js (versão 18 ou superior)
- PostgreSQL instalado e rodando
- npm ou yarn

### Passo a passo

1. Clone o repositório:
```bash
git clone https://github.com/SEU-USUARIO/instant-desk.git
cd instant-desk
```

2. Instale as dependências:
```bash
npm install
```

3. Crie o banco de dados no PostgreSQL:
```sql
CREATE DATABASE db_instant_desk;
```

4. Configure as variáveis de conexão com o banco em `src/app.module.ts` (ou em um arquivo `.env`, caso o projeto já tenha migrado para essa abordagem):
```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=sua_senha
DB_DATABASE=db_instant_desk
```

5. Rode a aplicação em modo de desenvolvimento:
```bash
npm run start:dev
```

A API estará disponível em `http://localhost:3000`.

## Testando a API

Recomendado testar todos os endpoints via [Postman](https://www.postman.com/), cobrindo os cenários de sucesso (200/201/204) e de erro (400/404) para cada recurso.

### Endpoints disponíveis (Ticket)

| Método | Rota          | Descrição                  |
|--------|---------------|-----------------------------|
| GET    | /tickets      | Lista todos os tickets      |
| GET    | /tickets/:id  | Busca um ticket por ID      |
| POST   | /tickets      | Cria um novo ticket         |
| PUT    | /tickets      | Atualiza um ticket existente|
| DELETE | /tickets/:id  | Remove um ticket             |

> Os demais recursos (`Category`, `Priority`, `User`, `Comment`, `Attachment`) seguirão o mesmo padrão de rotas conforme forem implementados.

## Fluxo de trabalho (Git)

- O módulo `Ticket` foi desenvolvido diretamente na branch `main`
- A partir do módulo `Category`, cada novo módulo passou a ser desenvolvido em uma branch própria (ex: `category`, `priority`, `user`)
- Após finalizar e testar um módulo, a branch correspondente é mergeada de volta na `main`

```bash
git checkout main
git merge nome-do-modulo
git push origin main
```

## Roadmap

- [x] CRUD de Ticket
- [x] CRUD de Category + relacionamento com Ticket
- [ ] CRUD de Priority + relacionamento com Ticket
- [ ] CRUD de User + Role
- [ ] CRUD de Comment (vinculado a Ticket)
- [ ] CRUD de Attachment (vinculado a Comment)
- [ ] Autenticação e autorização com JWT
- [ ] Documentação da API (Swagger)

## Autor

Paulo — projeto desenvolvido para fins de aprendizado em NestJS, TypeORM e PostgreSQL.