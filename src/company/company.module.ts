import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { CompanyService } from './services/company.service';
import { CompanyController } from './controllers/company.controller';
import { Category } from '../category/entities/category.entity';
import { Priority } from '../priority/entities/priority.entity';
import { CompanyDefaultsService } from './services/company-defaults.service';

@Module({
  imports: [TypeOrmModule.forFeature([Company, Category, Priority])],
  providers: [CompanyService, CompanyDefaultsService],
  controllers: [CompanyController],
  exports: [CompanyService, CompanyDefaultsService],
})
export class CompanyModule {}
