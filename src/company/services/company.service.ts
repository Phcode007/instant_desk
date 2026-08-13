import { Company } from './../entities/company.entity';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
  ) {}

  async findAll(): Promise<Company[]> {
    return await this.companyRepository.find();
  }

  async findById(id: number): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: { id },
    });

    if (!company)
      throw new HttpException('Empresa não encontrada!', HttpStatus.NOT_FOUND);

    return company;
  }
  async create(company: Company): Promise<Company> {
    return await this.companyRepository.save(company);
  }

  async update(company: Company): Promise<Company> {
    await this.findById(company.id);
    return await this.companyRepository.save(company);
  }

  async delete(id: number): Promise<DeleteResult> {
    await this.findById(id);
    return await this.companyRepository.delete(id);
  }
}
