import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attachment } from './entities/attachment.entity';
import { AttachmentService } from './services/attachment.service';
import { AttachmentController } from './controllers/attachment.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Attachment])],
  providers: [AttachmentService],
  controllers: [AttachmentController],
  exports: [AttachmentService],
})
export class AttachmentModule {}
