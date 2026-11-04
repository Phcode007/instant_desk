/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request from 'supertest';
import { Company } from '../src/company/entities/company.entity';
import { TestAppModule } from './testapp.module';
import { UserService } from '../src/user/services/user.service';
import { UserRole } from '../src/user/enums/user-role.enum';
import { UserRoleAudit } from '../src/user/entities/user-role-audit.entity';

describe('RBAC e isolamento multiempresa (e2e)', () => {
  let app: INestApplication;
  let companyA: number;
  let companyB: number;
  let adminAToken: string;
  let adminBToken: string;
  let requesterAToken: string;
  let requesterBToken: string;
  let requesterAId: number;
  let requesterBId: number;
  let ticketBId: number;
  let ticketAOtherId: number;
  let priorityAId: number;
  let categoryAId: number;
  let categoryBId: number;
  let priorityBId: number;

  async function register(
    nome: string,
    usuario: string,
    companyId: number,
  ): Promise<number> {
    const response = await request(app.getHttpServer())
      .post('/users/cadastrar')
      .send({
        nome,
        usuario,
        senha: 'senha1234',
        company: { id: companyId },
        role: UserRole.ADMIN,
      })
      .expect(201);

    expect(response.body.role).toBe(UserRole.USER);
    return response.body.id as number;
  }

  async function login(usuario: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/users/logar')
      .send({ usuario, senha: 'senha1234' })
      .expect(200);
    return response.body.token as string;
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: [__dirname + '/../src/**/entities/*.entity.ts'],
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
    const firstCompany = await companyRepository.save({ nome: 'Empresa A' });
    const secondCompany = await companyRepository.save({ nome: 'Empresa B' });
    companyA = firstCompany.id;
    companyB = secondCompany.id;

    const adminAId = await register('Admin A', 'admin-a@example.com', companyA);
    requesterAId = await register(
      'Solicitante A',
      'user-a@example.com',
      companyA,
    );
    await register('Outro solicitante A', 'user-a2@example.com', companyA);
    requesterBId = await register(
      'Solicitante B',
      'user-b@example.com',
      companyB,
    );
    const adminBId = await register('Admin B', 'admin-b@example.com', companyB);

    await app.get<UserService>(UserService).bootstrapAdmin(companyA, adminAId);
    await app.get<UserService>(UserService).bootstrapAdmin(companyB, adminBId);
    adminAToken = await login('admin-a@example.com');
    adminBToken = await login('admin-b@example.com');
    requesterAToken = await login('user-a@example.com');
    requesterBToken = await login('user-b@example.com');

    const categoryA = await request(app.getHttpServer())
      .post('/category')
      .set('Authorization', adminAToken)
      .send({ nome: 'Geral', company: { id: companyB } })
      .expect(201);
    categoryAId = categoryA.body.id as number;

    const priorityA = await request(app.getHttpServer())
      .post('/priorities')
      .set('Authorization', adminAToken)
      .send({ nome: 'Alta', company: { id: companyB } })
      .expect(201);
    priorityAId = priorityA.body.id as number;

    const categoryB = await request(app.getHttpServer())
      .post('/category')
      .set('Authorization', adminBToken)
      .send({ nome: 'Geral', company: { id: companyA } })
      .expect(201);
    const priorityB = await request(app.getHttpServer())
      .post('/priorities')
      .set('Authorization', adminBToken)
      .send({ nome: 'Alta', company: { id: companyA } })
      .expect(201);
    categoryBId = categoryB.body.id as number;
    priorityBId = priorityB.body.id as number;

    const requesterAOtherToken = await login('user-a2@example.com');
    const ticketAOther = await request(app.getHttpServer())
      .post('/tickets')
      .set('Authorization', requesterAOtherToken)
      .send({
        titulo: 'Chamado de outro usuário A',
        descricao: 'Solicitação de outro usuário da empresa A',
        category: { id: categoryAId },
        priority: { id: priorityAId },
      })
      .expect(201);
    ticketAOtherId = ticketAOther.body.id as number;

    const ticketB = await request(app.getHttpServer())
      .post('/tickets')
      .set('Authorization', requesterBToken)
      .send({
        titulo: 'Chamado da Empresa B',
        descricao: 'Solicitação exclusiva da empresa B',
        category: { id: categoryB.body.id },
        priority: { id: priorityB.body.id },
      })
      .expect(201);
    ticketBId = ticketB.body.id as number;
  }, 15000);

  afterAll(async () => {
    await app?.close();
  });

  it('limita o gerenciamento ADMIN aos usuários da própria empresa', async () => {
    const users = await request(app.getHttpServer())
      .get('/users/all')
      .set('Authorization', adminAToken)
      .expect(200);
    const userIds = (users.body as Array<{ id: number }>).map(
      (user) => user.id,
    );
    expect(userIds).not.toContain(requesterBId);

    const categoryA = await request(app.getHttpServer())
      .post('/category')
      .set('Authorization', adminAToken)
      .send({ nome: 'Outra categoria', company: { id: companyB } })
      .expect(201);
    expect(categoryA.body.company.id).toBe(companyA);

    await request(app.getHttpServer())
      .put(`/users/${requesterBId}/role`)
      .set('Authorization', adminAToken)
      .send({ role: UserRole.SUPPORT })
      .expect(404);
  });

  it('rejeita perfis fora do enum', async () => {
    await request(app.getHttpServer())
      .put(`/users/${requesterAId}/role`)
      .set('Authorization', adminAToken)
      .send({ role: 'SUPERADMIN' })
      .expect(400);
  });

  it('USER não consulta o ticket de outro usuário, mesmo com ID válido', async () => {
    await request(app.getHttpServer())
      .get(`/tickets/${ticketAOtherId}`)
      .set('Authorization', requesterAToken)
      .expect(404);

    await request(app.getHttpServer())
      .get(`/tickets/${ticketBId}`)
      .set('Authorization', requesterAToken)
      .expect(404);

    const tickets = await request(app.getHttpServer())
      .get('/tickets')
      .set('Authorization', requesterAToken)
      .expect(200);
    expect(tickets.body.data).toHaveLength(0);
  });

  it('USER não cria ticket usando categoria ou prioridade de outra empresa', async () => {
    await request(app.getHttpServer())
      .post('/tickets')
      .set('Authorization', requesterAToken)
      .send({
        titulo: 'Tentativa entre empresas',
        descricao: 'Tentativa de usar relações de outra empresa',
        category: { id: categoryBId },
        priority: { id: priorityBId },
      })
      .expect(404);
  });

  it('SUPPORT não acessa fila de outra empresa e token perde role rebaixada', async () => {
    await request(app.getHttpServer())
      .put(`/users/${requesterAId}/role`)
      .set('Authorization', adminAToken)
      .send({ role: UserRole.SUPPORT })
      .expect(200);
    const supportToken = await login('user-a@example.com');

    await request(app.getHttpServer())
      .get(`/tickets/${ticketBId}`)
      .set('Authorization', supportToken)
      .expect(404);

    await request(app.getHttpServer())
      .get(`/tickets/${ticketAOtherId}`)
      .set('Authorization', supportToken)
      .expect(200);

    await request(app.getHttpServer())
      .get('/users/all')
      .set('Authorization', supportToken)
      .expect(403);

    await request(app.getHttpServer())
      .put(`/users/${requesterBId}/role`)
      .set('Authorization', supportToken)
      .send({ role: UserRole.ADMIN })
      .expect(403);

    await request(app.getHttpServer())
      .put(`/users/${requesterAId}/role`)
      .set('Authorization', supportToken)
      .send({ role: UserRole.ADMIN })
      .expect(403);

    await request(app.getHttpServer())
      .put(`/users/${requesterAId}/role`)
      .set('Authorization', adminAToken)
      .send({ role: UserRole.USER })
      .expect(200);

    const auditRepository = app.get<Repository<UserRoleAudit>>(
      getRepositoryToken(UserRoleAudit),
    );
    const audit = await auditRepository.findOneBy({
      affectedUserId: requesterAId,
      previousRole: UserRole.SUPPORT,
      newRole: UserRole.USER,
    });
    expect(audit).toMatchObject({
      administratorId: expect.any(Number),
      companyId: companyA,
      affectedUserId: requesterAId,
      previousRole: UserRole.SUPPORT,
      newRole: UserRole.USER,
      source: 'ADMIN',
    });
    expect(audit?.createdAt).toBeInstanceOf(Date);

    await request(app.getHttpServer())
      .post('/priorities')
      .set('Authorization', supportToken)
      .send({ nome: 'Sem autorização', company: { id: companyA } })
      .expect(403);
  });
});
