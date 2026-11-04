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

  async findForCompany(companyId: number | null): Promise<Company[]> {
    if (!companyId) {
      throw new HttpException(
        'Usuário não está vinculado a uma empresa',
        HttpStatus.FORBIDDEN,
      );
    }
    return [await this.findById(companyId)];
  }

  async findByIdForCompany(
    id: number,
    companyId: number | null,
  ): Promise<Company> {
    if (!companyId || id !== companyId) {
      throw new HttpException('Empresa não encontrada!', HttpStatus.NOT_FOUND);
    }
    return this.findById(id);
  }

  async findById(id: number): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: { id },
    });

    if (!company)
      throw new HttpException('Empresa não encontrada!', HttpStatus.NOT_FOUND);

    return company;
  }
  create(): Promise<Company> {
    throw new HttpException(
      'Administradores não podem criar outras empresas',
      HttpStatus.FORBIDDEN,
    );
  }

  async update(company: Company, companyId: number | null): Promise<Company> {
    const existing = await this.findByIdForCompany(company.id, companyId);
    existing.nome = company.nome;
    existing.cnpj = company.cnpj;
    return this.companyRepository.save(existing);
  }

  async delete(id: number, companyId: number | null): Promise<DeleteResult> {
    await this.findByIdForCompany(id, companyId);
    throw new HttpException(
      'A exclusão da empresa não é permitida por esta API',
      HttpStatus.FORBIDDEN,
    );
  }
}
