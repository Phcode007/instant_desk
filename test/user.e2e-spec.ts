/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TestAppModule } from './testapp.module';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../src/company/entities/company.entity';
import { UserService } from '../src/user/services/user.service';
import { UserRole } from '../src/user/enums/user-role.enum';

describe('Testes dos Módulos User e Auth (e2e)', () => {
  let token: any;
  let usuarioId: any;
  let empresaId: number;
  let supportId: number;
  let supportToken: string;
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
        TestAppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    const companyRepository = app.get<Repository<Company>>(
      getRepositoryToken(Company),
    );
    const company = await companyRepository.save({ nome: 'Empresa Auth Teste' });
    empresaId = company.id;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('01 - Deve Cadastrar um novo Usuário', async () => {
    const resposta = await request(app.getHttpServer())
      .post('/users/cadastrar')
      .send({
        nome: 'Root',
        usuario: 'root@root.com',
        senha: 'rootroot',
        role: UserRole.ADMIN,
        company: { id: empresaId },
      })
      .expect(201);

    usuarioId = resposta.body.id;
    expect(resposta.body.role).toBe(UserRole.USER);
    await app.get(UserService).bootstrapAdmin(empresaId, usuarioId);
  });

  it('02 - Não Deve Cadastrar um Usuário Duplicado', async () => {
    await request(app.getHttpServer())
      .post('/users/cadastrar')
      .send({
        nome: 'Root',
        usuario: 'root@root.com',
        senha: 'rootroot',
        company: { id: empresaId },
      })
      .expect(400);
  });

  it('03 - Deve Autenticar o Usuário (Login)', async () => {
    const resposta = await request(app.getHttpServer())
      .post('/users/logar')
      .send({
        usuario: 'root@root.com',
        senha: 'rootroot',
      })
      .expect(200);

    token = resposta.body.token;
    expect(resposta.body.role).toBe(UserRole.ADMIN);
    expect(resposta.body.senha).toBe('');
  });

  it('04 - Deve Listar todos #1 os Usuários', async () => {
    return request(app.getHttpServer())
      .get('/users/all')
      .set('Authorization', `${token}`)
      .send({})
      .expect(200);
  });

  it('05 - Cadastro ignora tentativas de escolher SUPPORT', async () => {
    const response = await request(app.getHttpServer())
      .post('/users/cadastrar')
      .send({
        nome: 'Solicitante',
        usuario: 'solicitante@teste.com',
        senha: 'solicitante123',
        company: { id: empresaId },
        role: UserRole.SUPPORT,
      })
      .expect(201);

    supportId = response.body.id;
    expect(response.body.role).toBe(UserRole.USER);

    const login = await request(app.getHttpServer())
      .post('/users/logar')
      .send({ usuario: 'solicitante@teste.com', senha: 'solicitante123' })
      .expect(200);
    supportToken = login.body.token;
  });

  it('06 - SUPPORT não lista usuários nem promove usuários', async () => {
    await request(app.getHttpServer())
      .get('/users/all')
      .set('Authorization', supportToken)
      .expect(403);

    await request(app.getHttpServer())
      .put(`/users/${usuarioId}/role`)
      .set('Authorization', supportToken)
      .send({ role: UserRole.ADMIN })
      .expect(403);
  });

  it('07 - ADMIN promove usuário da própria empresa', async () => {
    const response = await request(app.getHttpServer())
      .put(`/users/${supportId}/role`)
      .set('Authorization', token)
      .send({ role: UserRole.SUPPORT })
      .expect(200);

    expect(response.body.role).toBe(UserRole.SUPPORT);
  });

  it('08 - Usuário não altera o próprio perfil nem seus vínculos', async () => {
    await request(app.getHttpServer())
      .put(`/users/${supportId}/role`)
      .set('Authorization', supportToken)
      .send({ role: UserRole.ADMIN })
      .expect(403);

    const response = await request(app.getHttpServer())
      .put('/users/atualizar')
      .set('Authorization', token)
      .send({
        id: usuarioId,
        nome: 'Root Atualizado',
        usuario: 'root@root.com',
        senha: 'rootroot',
        role: UserRole.USER,
        company: { id: 99999 },
      })
      .expect(200);

    expect(response.body.nome).toBe('Root Atualizado');
    expect(response.body.role).toBe(UserRole.ADMIN);
    expect(response.body.company.id).toBe(empresaId);
    expect(response.body.senha).toBeUndefined();
  });

  it('09 - Deve consultar a lista sem expor senhas', async () => {
    const response = await request(app.getHttpServer())
      .get('/users/all')
      .set('Authorization', token)
      .expect(200);

    expect(response.body.every((user: { senha?: string }) => !user.senha)).toBe(
      true,
    );
  });

  it('10 - ADMIN não pode alterar seu próprio perfil', async () => {
    await request(app.getHttpServer())
      .put(`/users/${usuarioId}/role`)
      .set('Authorization', token)
      .send({ role: UserRole.USER })
      .expect(403);
  });

  it('12 - Bootstrap repetido é recusado', async () => {
    await expect(
      app.get(UserService).bootstrapAdmin(empresaId, usuarioId),
    ).rejects.toMatchObject({ status: 409 });
  });

  it('13 - /registrar também ignora perfil ADMIN enviado pelo cliente', async () => {
    const response = await request(app.getHttpServer())
      .post('/users/registrar')
      .send({
        nome: 'Cadastro público',
        usuario: 'publico@example.com',
        senha: 'senha1234',
        nomeEmpresa: 'Empresa Pública',
        cnpj: '12345678000199',
        role: UserRole.ADMIN,
      })
      .expect(201);

    expect(response.body.role).toBe(UserRole.USER);
    expect(response.body.senha).toBeUndefined();
  });

  it('14 - Deve atualizar os próprios dados sem alterar o perfil', async () => {
    return request(app.getHttpServer())
      .put('/users/atualizar')
      .set('Authorization', `${token}`)
      .send({
        id: usuarioId,
        nome: 'Root Atualizado',
        usuario: 'root@root.com',
        senha: 'rootroot',
        role: UserRole.USER,
      })
      .expect(200)
      .then((resposta) => {
        expect('Root Atualizado').toEqual(resposta.body.nome);
        expect(resposta.body.role).toBe(UserRole.ADMIN);
      });
  });
});
