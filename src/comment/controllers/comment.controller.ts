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
import { Comment } from '../entities/comment.entity';
import { CommentService } from '../services/comment.service';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';
import { CompanyId } from '../../auth/decorators/company_id.decorator';

@UseGuards(JwtAuthGuard)
@ApiTags('Comments')
@ApiBearerAuth()
@Controller('/comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(@CompanyId() companyId: number | null): Promise<Comment[]> {
    return this.commentService.findAll(companyId);
  }

  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  findById(
    @Param('id', ParseIntPipe) id: number,
    @CompanyId() companyId: number | null,
  ): Promise<Comment> {
    return this.commentService.findById(id, companyId);
  }

  @Get('/ticket/:ticketId')
  @HttpCode(HttpStatus.OK)
  findByTicket(
    @Param('ticketId', ParseIntPipe) ticketId: number,
    @CompanyId() companyId: number | null,
  ): Promise<Comment[]> {
    return this.commentService.findByTicket(ticketId, companyId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() comment: Comment): Promise<Comment> {
    return this.commentService.create(comment);
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  update(@Body() comment: Comment): Promise<Comment> {
    return this.commentService.update(comment);
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.commentService.delete(id);
  }
}
