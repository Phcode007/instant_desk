import { Module } from '@nestjs/common';
import { AuthModule } from '../src/auth/auth.module';
import { TicketModule } from '../src/ticket/ticket.module';
import { CategoryModule } from '../src/category/category.module';
import { PriorityModule } from '../src/priority/priority.module';
import { UserModule } from '../src/user/user.module';
import { CompanyModule } from '../src/company/company.module';
import { CommentModule } from '../src/comment/comment.module';
import { AttachmentModule } from '../src/attachment/attachment.module';
import { AppController } from '../src/app.controller';

@Module({
  imports: [
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
})
export class TestAppModule {}
