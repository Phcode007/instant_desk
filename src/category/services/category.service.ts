import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from '../entities/category.entity';
import { DeleteResult, Repository } from 'typeorm';
import { CompanyService } from '../../company/services/company.service';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
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

  async findAll(companyId: number | null): Promise<Category[]> {
    const id = this.checkCompanyId(companyId);

    return await this.categoryRepository.find({
      where: { company: { id } },
    });
  }

  async findById(id: number, companyId: number | null): Promise<Category> {
    const validCompanyId = this.checkCompanyId(companyId);

    const category = await this.categoryRepository.findOne({
      where: { id, company: { id: validCompanyId } },
    });

    if (!category)
      throw new HttpException('Categoria não encontrada', HttpStatus.NOT_FOUND);

    return category;
  }

  /**
   * Busca sem filtro de empresa. Uso interno para validação de
   * integridade referencial (ex: TicketService confirmando que a
   * categoria informada existe), já que Ticket não é isolado
   * diretamente por company.
   */
  async findByIdUnscoped(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
    });

    if (!category)
      throw new HttpException('Categoria não encontrada', HttpStatus.NOT_FOUND);

    return category;
  }

  async create(category: Category): Promise<Category> {
    await this.companyService.findById(category.company.id);
    return await this.categoryRepository.save(category);
  }

  async update(
    category: Category,
    companyId: number | null,
  ): Promise<Category> {
    await this.findById(category.id, companyId);
    await this.companyService.findById(category.company.id);
    return await this.categoryRepository.save(category);
  }

  async delete(id: number, companyId: number | null): Promise<DeleteResult> {
    await this.findById(id, companyId);
    return await this.categoryRepository.delete(id);
  }
}
