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
import { CompanyId } from '../../auth/decorators/company_id.decorator';
import { UserId } from '../../auth/decorators/user_id.decorator';
import { CurrentRole } from '../../auth/decorators/current_role.decorator';
import { UserRole } from '../../user/enums/user-role.enum';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guard/roles.guard';

@UseGuards(JwtAuthGuard)
@ApiTags('Attachments')
@ApiBearerAuth()
@Controller('/attachments')
export class AttachmentController {
  constructor(private readonly attachmentService: AttachmentService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(
    @CompanyId() companyId: number | null,
    @UserId() userId: number | null,
    @CurrentRole() role: UserRole | null,
  ): Promise<Attachment[]> {
    return this.attachmentService.findAll(companyId, userId, role);
  }

  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  findById(
    @Param('id', ParseIntPipe) id: number,
    @CompanyId() companyId: number | null,
    @UserId() userId: number | null,
    @CurrentRole() role: UserRole | null,
  ): Promise<Attachment> {
    return this.attachmentService.findById(id, companyId, userId, role);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() attachment: Attachment,
    @CompanyId() companyId: number | null,
    @UserId() userId: number | null,
    @CurrentRole() role: UserRole | null,
  ): Promise<Attachment> {
    return this.attachmentService.create(attachment, companyId, userId, role);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPPORT, UserRole.ADMIN)
  @Put()
  @HttpCode(HttpStatus.OK)
  update(
    @Body() attachment: Attachment,
    @CompanyId() companyId: number | null,
    @UserId() userId: number | null,
    @CurrentRole() role: UserRole | null,
  ): Promise<Attachment> {
    return this.attachmentService.update(attachment, companyId, userId, role);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPPORT, UserRole.ADMIN)
  @Delete('/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(
    @Param('id', ParseIntPipe) id: number,
    @CompanyId() companyId: number | null,
    @UserId() userId: number | null,
    @CurrentRole() role: UserRole | null,
  ) {
    return this.attachmentService.delete(id, companyId, userId, role);
  }
}
