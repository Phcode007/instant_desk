import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { Priority } from '../entities/priority.entity';
import { CompanyService } from '../../company/services/company.service';

@Injectable()
export class PriorityService {
  constructor(
    @InjectRepository(Priority)
    private priorityRepository: Repository<Priority>,
    private companyService: CompanyService,
  ) {}

  async findAll(): Promise<Priority[]> {
    return await this.priorityRepository.find();
  }

  async findById(id: number): Promise<Priority> {
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

  async create(priority: Priority): Promise<Priority> {
    await this.companyService.findById(priority.company.id);
    return await this.priorityRepository.save(priority);
  }

  async update(priority: Priority): Promise<Priority> {
    await this.findById(priority.id);
    await this.companyService.findById(priority.company.id);
    return await this.priorityRepository.save(priority);
  }

  async delete(id: number): Promise<DeleteResult> {
    await this.findById(id);
    return await this.priorityRepository.delete(id);
  }
}
