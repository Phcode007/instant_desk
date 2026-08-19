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

  async findAll(companyId: number | null): Promise<Category[]> {
    if (!companyId) return await this.categoryRepository.find();

    return await this.categoryRepository.find({
      where: { company: { id: companyId } },
    });
  }

  async findById(id: number, companyId: number | null): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: companyId ? { id, company: { id: companyId } } : { id },
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
