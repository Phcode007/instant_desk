import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Priority } from './entities/priority.entity';
import { PriorityService } from './services/priority.service';
import { PriorityController } from './controllers/priority.controller';
import { CompanyModule } from '../company/company.module';

@Module({
  imports: [TypeOrmModule.forFeature([Priority]), CompanyModule],
  providers: [PriorityService],
  controllers: [PriorityController],
  exports: [PriorityService],
})
export class PriorityModule {}
