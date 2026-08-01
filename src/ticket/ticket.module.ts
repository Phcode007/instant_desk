import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from './entities/ticket.entity';
import { TicketService } from './services/ticket.service';
import { TicketController } from './controllers/ticket.controller';
import { CategoryModule } from 'src/category/category.module';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket]), CategoryModule],
  providers: [TicketService],
  controllers: [TicketController],
  exports: [TypeOrmModule],
})
export class TicketModule {}
