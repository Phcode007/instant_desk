/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  TypeOrmModule,
  getDataSourceToken,
  getRepositoryToken,
} from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import request from 'supertest';
import { TestAppModule } from './testapp.module';
import { Company } from '../src/company/entities/company.entity';
import { CompanyDefaultsService } from '../src/company/services/company-defaults.service';
import { Category } from '../src/category/entities/category.entity';
import { Priority } from '../src/priority/entities/priority.entity';
import { SeedCompanyTicketDefaults1762472400000 } from '../src/data/migrations/1762472400000-SeedCompanyTicketDefaults';

const CATEGORIAS_PADRAO = [
  'Geral',
  'Acesso e Permissões',
  'Erro no Sistema',
  'Dúvida',
];
const PRIORIDADES_PADRAO = ['Baixa', 'Média', 'Alta'];

describe('Padrões de categoria e prioridade (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let companyRepository: Repository<Company>;
  let categoryRepository: Repository<Category>;
  let priorityRepository: Repository<Priority>;
  let defaultsService: CompanyDefaultsService;
  let nextUser = 1;
  let nextCnpj = 10000000000000;

  async function register(
    cnpj = String(nextCnpj++),
  ): Promise<{ companyId: number; token: string }> {
    const user = nextUser++;
    await request(app.getHttpServer())
      .post('/users/registrar')
      .send({
        nome: `Usuário ${user}`,
        usuario: `user-${user}@example.com`,
        senha: 'senha1234',
        nomeEmpresa: `Empresa ${user}`,
        cnpj,
      })
      .expect(201);

    const company = await companyRepository.findOneByOrFail({ cnpj });
    const login = await request(app.getHttpServer())
      .post('/users/logar')
      .send({ usuario: `user-${user}@example.com`, senha: 'senha1234' })
      .expect(200);

    return { companyId: company.id, token: login.body.token as string };
  }

  async function categoryNames(companyId: number): Promise<string[]> {
    const categories = await categoryRepository.find({
      where: { company: { id: companyId } },
    });
    return categories.map(({ nome }) => nome);
  }

  async function priorityNames(companyId: number): Promise<string[]> {
    const priorities = await priorityRepository.find({
      where: { company: { id: companyId } },
    });
    return priorities.map(({ nome }) => nome);
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

    dataSource = app.get<DataSource>(getDataSourceToken());
    companyRepository = app.get<Repository<Company>>(
      getRepositoryToken(Company),
    );
    categoryRepository = app.get<Repository<Category>>(
      getRepositoryToken(Category),
    );
    priorityRepository = app.get<Repository<Priority>>(
      getRepositoryToken(Priority),
    );
    defaultsService = app.get(CompanyDefaultsService);
  });

  afterAll(async () => {
    await app?.close();
  });

  it('creates defaults when registering a new company', async () => {
    const { companyId } = await register();

    expect(await categoryNames(companyId)).toEqual(
      expect.arrayContaining(CATEGORIAS_PADRAO),
    );
    expect(await priorityNames(companyId)).toEqual(
      expect.arrayContaining(PRIORIDADES_PADRAO),
    );
  });

  it('adds defaults to an existing company when it has none', async () => {
    const cnpj = String(nextCnpj++);
    const company = await companyRepository.save({
      nome: 'Empresa legada',
      cnpj,
    });

    const registered = await register(cnpj);

    expect(registered.companyId).toBe(company.id);
    expect(await categoryNames(company.id)).toEqual(
      expect.arrayContaining(CATEGORIAS_PADRAO),
    );
    expect(await priorityNames(company.id)).toEqual(
      expect.arrayContaining(PRIORIDADES_PADRAO),
    );
  });

  it('preserves custom records while adding missing defaults', async () => {
    const cnpj = String(nextCnpj++);
    const company = await companyRepository.save({
      nome: 'Empresa personalizada',
      cnpj,
    });
    await categoryRepository.save({ nome: 'Hardware', company });
    await priorityRepository.save({ nome: 'Urgente', company });

    await register(cnpj);

    expect(await categoryNames(company.id)).toEqual(
      expect.arrayContaining([...CATEGORIAS_PADRAO, 'Hardware']),
    );
    expect(await priorityNames(company.id)).toEqual(
      expect.arrayContaining([...PRIORIDADES_PADRAO, 'Urgente']),
    );
  });

  it('can be rerun without creating duplicate defaults', async () => {
    const { companyId } = await register();

    await dataSource.transaction(async (manager) => {
      await defaultsService.ensureDefaults(manager, companyId);
      await defaultsService.ensureDefaults(manager, companyId);
    });

    expect(await categoryNames(companyId)).toHaveLength(
      CATEGORIAS_PADRAO.length,
    );
    expect(await priorityNames(companyId)).toHaveLength(
      PRIORIDADES_PADRAO.length,
    );
  });

  it('keeps defaults separated between companies', async () => {
    const companyA = await register();
    const companyB = await register();
    const categoryA = await categoryRepository.findOneOrFail({
      where: { nome: 'Geral', company: { id: companyA.companyId } },
      relations: { company: true },
    });

    expect(await categoryNames(companyA.companyId)).toEqual(
      expect.arrayContaining(CATEGORIAS_PADRAO),
    );
    expect(await categoryNames(companyB.companyId)).toEqual(
      expect.arrayContaining(CATEGORIAS_PADRAO),
    );
    expect(categoryA.company.id).toBe(companyA.companyId);
    expect(companyA.companyId).not.toBe(companyB.companyId);
  });

  it('returns authenticated lists for the caller company and blocks cross-company IDs', async () => {
    const companyA = await register();
    const companyB = await register();
    const categoryB = await categoryRepository.findOneByOrFail({
      nome: 'Geral',
      company: { id: companyB.companyId },
    });
    const priorityB = await priorityRepository.findOneByOrFail({
      nome: 'Alta',
      company: { id: companyB.companyId },
    });

    const categoriesA = await request(app.getHttpServer())
      .get('/category')
      .set('Authorization', companyA.token)
      .expect(200);
    const prioritiesA = await request(app.getHttpServer())
      .get('/priorities')
      .set('Authorization', companyA.token)
      .expect(200);

    expect(categoriesA.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: expect.any(Number), nome: 'Geral' }),
      ]),
    );
    expect(categoriesA.body).toHaveLength(CATEGORIAS_PADRAO.length);
    expect(prioritiesA.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: expect.any(Number), nome: 'Alta' }),
      ]),
    );
    expect(prioritiesA.body).toHaveLength(PRIORIDADES_PADRAO.length);

    await request(app.getHttpServer())
      .get(`/category/${categoryB.id}`)
      .set('Authorization', companyA.token)
      .expect(404);
    await request(app.getHttpServer())
      .get(`/priorities/${priorityB.id}`)
      .set('Authorization', companyA.token)
      .expect(404);
  });

  it('creates a ticket using defaults belonging to the authenticated company', async () => {
    const { companyId, token } = await register();
    const category = await categoryRepository.findOneByOrFail({
      nome: 'Geral',
      company: { id: companyId },
    });
    const priority = await priorityRepository.findOneByOrFail({
      nome: 'Média',
      company: { id: companyId },
    });

    const ticket = await request(app.getHttpServer())
      .post('/tickets')
      .set('Authorization', token)
      .send({
        titulo: 'Solicitação de acesso',
        descricao: 'Preciso de acesso ao sistema para concluir o trabalho.',
        category: { id: category.id },
        priority: { id: priority.id },
      })
      .expect(201);

    expect(ticket.body.category.id).toBe(category.id);
    expect(ticket.body.priority.id).toBe(priority.id);
  });

  it('rolls back all defaults when the surrounding transaction fails', async () => {
    const company = await companyRepository.save({
      nome: 'Empresa com falha',
      cnpj: String(nextCnpj++),
    });

    await expect(
      dataSource.transaction(async (manager) => {
        await defaultsService.ensureDefaults(manager, company.id);
        throw new Error('falha simulada');
      }),
    ).rejects.toThrow('falha simulada');

    expect(await categoryNames(company.id)).toHaveLength(0);
    expect(await priorityNames(company.id)).toHaveLength(0);
  });

  it('backfills legacy companies through the one-time migration', async () => {
    const company = await companyRepository.save({
      nome: 'Empresa para migration',
      cnpj: String(nextCnpj++),
    });
    await categoryRepository.save({ nome: 'Personalizada', company });

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await new SeedCompanyTicketDefaults1762472400000().up(queryRunner);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    expect(await categoryNames(company.id)).toEqual(
      expect.arrayContaining([...CATEGORIAS_PADRAO, 'Personalizada']),
    );
    expect(await priorityNames(company.id)).toEqual(
      expect.arrayContaining(PRIORIDADES_PADRAO),
    );
  });
});
