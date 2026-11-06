import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Category } from '../../category/entities/category.entity';
import { Priority } from '../../priority/entities/priority.entity';
import { Company } from '../entities/company.entity';

const CATEGORIAS_PADRAO = [
  'Geral',
  'Acesso e Permissões',
  'Erro no Sistema',
  'Dúvida',
];
const PRIORIDADES_PADRAO = ['Baixa', 'Média', 'Alta'];

export async function ensureCompanyDefaults(
  manager: EntityManager,
  companyId: number,
): Promise<void> {
  const companyQuery = manager
    .getRepository(Company)
    .createQueryBuilder('company')
    .where('company.id = :companyId', { companyId });

  if (manager.connection.options.type === 'postgres') {
    companyQuery.setLock('pessimistic_write');
  }

  const company = await companyQuery.getOne();
  if (!company) {
    throw new Error(
      `Empresa ${companyId} não encontrada ao inicializar padrões`,
    );
  }

  for (const nome of CATEGORIAS_PADRAO) {
    const category = await manager.findOne(Category, {
      where: { nome, company: { id: companyId } },
    });
    if (!category) {
      await manager.save(Category, manager.create(Category, { nome, company }));
    }
  }

  for (const nome of PRIORIDADES_PADRAO) {
    const priority = await manager.findOne(Priority, {
      where: { nome, company: { id: companyId } },
    });
    if (!priority) {
      await manager.save(Priority, manager.create(Priority, { nome, company }));
    }
  }
}

@Injectable()
export class CompanyDefaultsService {
  ensureDefaults(manager: EntityManager, companyId: number): Promise<void> {
    return ensureCompanyDefaults(manager, companyId);
  }
}
