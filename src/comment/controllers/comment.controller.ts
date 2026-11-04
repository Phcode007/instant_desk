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
import { UserId } from '../../auth/decorators/user_id.decorator';
import { CurrentRole } from '../../auth/decorators/current_role.decorator';
import { UserRole } from '../../user/enums/user-role.enum';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guard/roles.guard';

@UseGuards(JwtAuthGuard)
@ApiTags('Comments')
@ApiBearerAuth()
@Controller('/comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(
    @CompanyId() companyId: number | null,
    @UserId() userId: number | null,
    @CurrentRole() role: UserRole | null,
  ): Promise<Comment[]> {
    return this.commentService.findAll(companyId, userId, role);
  }

  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  findById(
    @Param('id', ParseIntPipe) id: number,
    @CompanyId() companyId: number | null,
    @UserId() userId: number | null,
    @CurrentRole() role: UserRole | null,
  ): Promise<Comment> {
    return this.commentService.findById(id, companyId, userId, role);
  }

  @Get('/ticket/:ticketId')
  @HttpCode(HttpStatus.OK)
  findByTicket(
    @Param('ticketId', ParseIntPipe) ticketId: number,
    @CompanyId() companyId: number | null,
    @UserId() userId: number | null,
    @CurrentRole() role: UserRole | null,
  ): Promise<Comment[]> {
    return this.commentService.findByTicket(ticketId, companyId, userId, role);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() comment: Comment,
    @CompanyId() companyId: number | null,
    @UserId() userId: number | null,
    @CurrentRole() role: UserRole | null,
  ): Promise<Comment> {
    return this.commentService.create(comment, companyId, userId, role);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPPORT, UserRole.ADMIN)
  @Put()
  @HttpCode(HttpStatus.OK)
  update(
    @Body() comment: Comment,
    @CompanyId() companyId: number | null,
    @CurrentRole() role: UserRole | null,
    @UserId() userId: number | null,
  ): Promise<Comment> {
    return this.commentService.update(comment, companyId, userId, role);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPPORT, UserRole.ADMIN)
  @Delete('/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(
    @Param('id', ParseIntPipe) id: number,
    @CompanyId() companyId: number | null,
    @CurrentRole() role: UserRole | null,
    @UserId() userId: number | null,
  ) {
    return this.commentService.delete(id, companyId, userId, role);
  }
}
