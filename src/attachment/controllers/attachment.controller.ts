import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Attachment } from '../entities/attachment.entity';
import { AttachmentService } from '../services/attachment.service';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@ApiTags('Attachments')
@ApiBearerAuth()
@Controller('/attachments')
export class AttachmentController {
  constructor(private readonly attachmentService: AttachmentService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(): Promise<Attachment[]> {
    return this.attachmentService.findAll();
  }

  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  findById(@Param('id', ParseIntPipe) id: number): Promise<Attachment> {
    return this.attachmentService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() attachment: Attachment): Promise<Attachment> {
    return this.attachmentService.create(attachment);
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  update(@Body() attachment: Attachment): Promise<Attachment> {
    return this.attachmentService.update(attachment);
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.attachmentService.delete(id);
  }
}
