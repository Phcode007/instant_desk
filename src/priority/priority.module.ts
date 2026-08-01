import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Priority } from './entities/priority.entity';
import { PriorityService } from './services/priority.service';
import { PriorityController } from './controllers/priority.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Priority])],
  providers: [PriorityService],
  controllers: [PriorityController],
  exports: [PriorityService],
})
export class PriorityModule {}
