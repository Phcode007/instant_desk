import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from './ticket/entities/ticket.entity';
import { TicketModule } from './ticket/ticket.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres123',
      database: 'db_instant_desk',
      entities: [Ticket],
      synchronize: true,
    }),
    TicketModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
