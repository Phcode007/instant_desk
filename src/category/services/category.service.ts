import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from 'src/category/entities/category.entity';
import { DeleteResult, Repository } from 'typeorm';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}
  async findAll(): Promise<Category[]> {
    return await this.categoryRepository.find();
  }

  async findById(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category)
      throw new HttpException('Categoria não encontrada', HttpStatus.NOT_FOUND);
    return category;
  }
  async create(category: Category): Promise<Category> {
    return await this.categoryRepository.save(category);
  }

  async update(category: Category): Promise<Category> {
    await this.findById(category.id);
    return await this.categoryRepository.save(category);
  }

  async delete(id: number): Promise<DeleteResult> {
    await this.findById(id);
    return await this.categoryRepository.delete(id);
  }
}
