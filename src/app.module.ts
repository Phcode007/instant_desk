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
import { DevService } from './data/service/dev.service';
import { AttachmentModule } from './attachment/attachment.module';
import { CommentModule } from './comment/comment.module';

@Module({
  imports: [
    ConfigModule.forRoot(),

    TypeOrmModule.forRootAsync({
      useClass:
        process.env.NODE_ENV === 'production' ? ProdService : DevService,
      imports: [ConfigModule],
    }),

    TicketModule,
    CategoryModule,
    AuthModule,
    PriorityModule,
    UserModule,
    CompanyModule,
    CommentModule,
    AttachmentModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
