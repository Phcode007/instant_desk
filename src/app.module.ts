import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from './ticket/entities/ticket.entity';
import { Category } from './category/entities/category.entity';
import { AuthModule } from './auth/auth.module';
import { TicketModule } from './ticket/ticket.module';
import { CategoryModule } from './category/category.module';
import { PriorityModule } from './priority/priority.module';
import { Priority } from './priority/entities/priority.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres123',
      database: 'db_instant_desk',
      entities: [Ticket, Category, Priority],
      synchronize: true,
    }),
    TicketModule,
    CategoryModule,
    AuthModule,
    PriorityModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
