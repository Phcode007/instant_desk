import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { Priority } from '../entities/priority.entity';
import { CompanyService } from '../../company/services/company.service';
import { UserRole } from '../../user/enums/user-role.enum';

@Injectable()
export class PriorityService {
  constructor(
    @InjectRepository(Priority)
    private priorityRepository: Repository<Priority>,
    private companyService: CompanyService,
  ) {}

  private checkCompanyId(companyId: number | null): number {
    if (!companyId)
      throw new HttpException(
        'Usuário não está vinculado a uma empresa',
        HttpStatus.FORBIDDEN,
      );
    return companyId;
  }

  private checkSupportRole(role: UserRole | null): void {
    if (role !== UserRole.SUPPORT && role !== UserRole.ADMIN) {
      throw new HttpException('Perfil sem permissão', HttpStatus.FORBIDDEN);
    }
  }

  async findAll(companyId: number | null): Promise<Priority[]> {
    const id = this.checkCompanyId(companyId);

    return await this.priorityRepository.find({
      where: { company: { id } },
    });
  }

  async findById(id: number, companyId: number | null): Promise<Priority> {
    const validCompanyId = this.checkCompanyId(companyId);

    const priority = await this.priorityRepository.findOne({
      where: { id, company: { id: validCompanyId } },
    });

    if (!priority)
      throw new HttpException(
        'Prioridade não encontrada!',
        HttpStatus.NOT_FOUND,
      );

    return priority;
  }

  async findByIdUnscoped(id: number): Promise<Priority> {
    const priority = await this.priorityRepository.findOne({
      where: { id },
    });

    if (!priority)
      throw new HttpException(
        'Prioridade não encontrada!',
        HttpStatus.NOT_FOUND,
      );

    return priority;
  }

  async create(
    priority: Priority,
    companyId: number | null,
    role: UserRole | null,
  ): Promise<Priority> {
    this.checkSupportRole(role);
    const id = this.checkCompanyId(companyId);
    await this.companyService.findById(id);
    priority.company = { id } as Priority['company'];
    return await this.priorityRepository.save(priority);
  }

  async update(
    priority: Priority,
    companyId: number | null,
    role: UserRole | null,
  ): Promise<Priority> {
    this.checkSupportRole(role);
    await this.findById(priority.id, companyId);
    priority.company = {
      id: this.checkCompanyId(companyId),
    } as Priority['company'];
    return await this.priorityRepository.save(priority);
  }

  async delete(
    id: number,
    companyId: number | null,
    role: UserRole | null,
  ): Promise<DeleteResult> {
    if (role !== UserRole.ADMIN) {
      throw new HttpException('Perfil sem permissão', HttpStatus.FORBIDDEN);
    }
    await this.findById(id, companyId);
    return await this.priorityRepository.delete(id);
  }
}
