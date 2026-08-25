/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../src/company/entities/company.entity';

describe('Testes dos Módulos Comment e Attachment (e2e)', () => {
  let token: any;
  let companyId: any;
  let categoryId: any;
  let priorityId: any;
  let ticketId: any;
  let userId: any;
  let commentId: any;
  let attachmentId: any;
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: [__dirname + './../src/**/entities/*.entity.ts'],
          synchronize: true,
          dropSchema: true,
        }),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // BOOTSTRAP: como o cadastro de usuário exige company (Fase 3) e a
    // criação de company exige usuário autenticado (guard JWT), inserimos
    // a primeira Company diretamente via repositório do TypeORM, do
    // mesmo jeito que fizemos via psql em produção — só que aqui, como
    // é um teste, usamos a própria infraestrutura do Nest para isso.
    const companyRepository = app.get<Repository<Company>>(
      getRepositoryToken(Company),
    );
    const bootstrapCompany = await companyRepository.save({
      nome: 'Empresa Bootstrap',
    });

    // 1) Cadastro do primeiro usuário, já vinculado à company de bootstrap
    await request(app.getHttpServer())
      .post('/users/cadastrar')
      .send({
        nome: 'Root',
        usuario: 'root@root.com',
        senha: 'rootroot',
        company: { id: bootstrapCompany.id },
      });

    const respostaLogin = await request(app.getHttpServer())
      .post('/users/logar')
      .send({
        usuario: 'root@root.com',
        senha: 'rootroot',
      });

    token = respostaLogin.body.token;

    // 2) Criar a Company de teste "de verdade", agora já autenticado
    const respostaCompany = await request(app.getHttpServer())
      .post('/companies')
      .set('Authorization', `${token}`)
      .send({ nome: 'Empresa Teste' });

    companyId = respostaCompany.body.id;

    // 3) Criar Category e Priority vinculadas à Company
    const respostaCategory = await request(app.getHttpServer())
      .post('/category')
      .set('Authorization', `${token}`)
      .send({ nome: 'Hardware', company: { id: companyId } });

    categoryId = respostaCategory.body.id;

    const respostaPriority = await request(app.getHttpServer())
      .post('/priorities')
      .set('Authorization', `${token}`)
      .send({ nome: 'Urgente', company: { id: companyId } });

    priorityId = respostaPriority.body.id;

    // 4) Criar um segundo usuário, já vinculado à Company, para ser
    //    o autor do comentário
    const respostaUser = await request(app.getHttpServer())
      .post('/users/cadastrar')
      .send({
        nome: 'Agente Suporte',
        usuario: 'agente@teste.com',
        senha: 'agente123',
        company: { id: companyId },
      });

    userId = respostaUser.body.id;

    // 5) Criar um Ticket para pendurar o Comment
    const respostaTicket = await request(app.getHttpServer())
      .post('/tickets')
      .set('Authorization', `${token}`)
      .send({
        titulo: 'Impressora não liga',
        descricao: 'A impressora do setor financeiro não liga',
        category: { id: categoryId },
        priority: { id: priorityId },
      });

    ticketId = respostaTicket.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  // ---------------------------------------------------------------
  // COMMENT
  // ---------------------------------------------------------------

  it('01 - Não Deve Acessar Comments sem Token (Guard)', async () => {
    await request(app.getHttpServer()).get('/comments').expect(401);
  });

  it('02 - Deve Cadastrar um novo Comment', async () => {
    const resposta = await request(app.getHttpServer())
      .post('/comments')
      .set('Authorization', `${token}`)
      .send({
        comentario: 'Já verificamos o cabo de energia, aguardando retorno.',
        ticket: { id: ticketId },
        user: { id: userId },
      })
      .expect(201);

    commentId = resposta.body.id;
  });

  it('03 - Não Deve Cadastrar Comment com Ticket Inexistente', async () => {
    await request(app.getHttpServer())
      .post('/comments')
      .set('Authorization', `${token}`)
      .send({
        comentario: 'Comentário inválido',
        ticket: { id: 99999 },
        user: { id: userId },
      })
      .expect(404);
  });

  it('04 - Não Deve Cadastrar Comment com User Inexistente', async () => {
    await request(app.getHttpServer())
      .post('/comments')
      .set('Authorization', `${token}`)
      .send({
        comentario: 'Comentário inválido',
        ticket: { id: ticketId },
        user: { id: 99999 },
      })
      .expect(404);
  });

  it('05 - Deve Listar todos os Comments', async () => {
    return request(app.getHttpServer())
      .get('/comments')
      .set('Authorization', `${token}`)
      .expect(200);
  });

  it('06 - Deve Buscar Comment por Id', async () => {
    return request(app.getHttpServer())
      .get(`/comments/${commentId}`)
      .set('Authorization', `${token}`)
      .expect(200);
  });

  it('07 - Não Deve Buscar Comment com Id Inexistente', async () => {
    return request(app.getHttpServer())
      .get('/comments/99999')
      .set('Authorization', `${token}`)
      .expect(404);
  });

  it('08 - Deve Buscar Comments por Ticket', async () => {
    return request(app.getHttpServer())
      .get(`/comments/ticket/${ticketId}`)
      .set('Authorization', `${token}`)
      .expect(200)
      .then((resposta) => {
        expect(resposta.body.length).toBeGreaterThan(0);
      });
  });

  it('09 - Deve Atualizar um Comment', async () => {
    return request(app.getHttpServer())
      .put('/comments')
      .set('Authorization', `${token}`)
      .send({
        id: commentId,
        comentario: 'Atualizado: problema resolvido, cabo substituído.',
        ticket: { id: ticketId },
        user: { id: userId },
      })
      .expect(200)
      .then((resposta) => {
        expect('Atualizado: problema resolvido, cabo substituído.').toEqual(
          resposta.body.comentario,
        );
      });
  });

  // ---------------------------------------------------------------
  // ATTACHMENT
  // ---------------------------------------------------------------

  it('10 - Não Deve Acessar Attachments sem Token (Guard)', async () => {
    await request(app.getHttpServer()).get('/attachments').expect(401);
  });

  it('11 - Deve Cadastrar um novo Attachment', async () => {
    const resposta = await request(app.getHttpServer())
      .post('/attachments')
      .set('Authorization', `${token}`)
      .send({
        nomeArquivo: 'print-erro.png',
        url: 'https://storage.exemplo.com/anexos/print-erro.png',
        comment: { id: commentId },
      })
      .expect(201);

    attachmentId = resposta.body.id;
  });

  it('12 - Não Deve Cadastrar Attachment com Comment Inexistente', async () => {
    await request(app.getHttpServer())
      .post('/attachments')
      .set('Authorization', `${token}`)
      .send({
        nomeArquivo: 'arquivo-invalido.png',
        url: 'https://storage.exemplo.com/anexos/invalido.png',
        comment: { id: 99999 },
      })
      .expect(404);
  });

  it('13 - Deve Listar todos os Attachments', async () => {
    return request(app.getHttpServer())
      .get('/attachments')
      .set('Authorization', `${token}`)
      .expect(200);
  });

  it('14 - Deve Buscar Attachment por Id', async () => {
    return request(app.getHttpServer())
      .get(`/attachments/${attachmentId}`)
      .set('Authorization', `${token}`)
      .expect(200);
  });

  it('15 - Não Deve Buscar Attachment com Id Inexistente', async () => {
    return request(app.getHttpServer())
      .get('/attachments/99999')
      .set('Authorization', `${token}`)
      .expect(404);
  });

  it('16 - Deve Atualizar um Attachment', async () => {
    return request(app.getHttpServer())
      .put('/attachments')
      .set('Authorization', `${token}`)
      .send({
        id: attachmentId,
        nomeArquivo: 'print-erro-atualizado.png',
        url: 'https://storage.exemplo.com/anexos/print-erro-atualizado.png',
        comment: { id: commentId },
      })
      .expect(200)
      .then((resposta) => {
        expect('print-erro-atualizado.png').toEqual(resposta.body.nomeArquivo);
      });
  });

  it('17 - Deve Deletar um Attachment', async () => {
    return request(app.getHttpServer())
      .delete(`/attachments/${attachmentId}`)
      .set('Authorization', `${token}`)
      .expect(204);
  });

  it('18 - Deve Deletar um Comment', async () => {
    return request(app.getHttpServer())
      .delete(`/comments/${commentId}`)
      .set('Authorization', `${token}`)
      .expect(204);
  });
});
