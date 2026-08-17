import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './auth/auth.module';
import { TicketModule } from './ticket/ticket.module';
import { CategoryModule } from './category/category.module';
import { PriorityModule } from './priority/priority.module';
import { UserModule } from './user/user.module';
import { CompanyModule } from './company/company.module';
import { AppController } from './app.controller';
import { ProdService } from './data/service/prod.service';

@Module({
  imports: [
    ConfigModule.forRoot(),

    TypeOrmModule.forRootAsync({
      useClass: ProdService,
      imports: [ConfigModule],
    }),

    TicketModule,
    CategoryModule,
    AuthModule,
    PriorityModule,
    UserModule,
    CompanyModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
