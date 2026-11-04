import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  TicketService,
  PaginatedTickets,
  TicketStats,
} from '../services/ticket.service';
import { Ticket } from '../entities/ticket.entity';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';
import { CompanyId } from '../../auth/decorators/company_id.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserId } from '../../auth/decorators/user_id.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guard/roles.guard';
import { UserRole } from '../../user/enums/user-role.enum';
import { CurrentRole } from '../../auth/decorators/current_role.decorator';

@UseGuards(JwtAuthGuard)
@Controller('/tickets')
@ApiTags('Tickets')
@ApiBearerAuth()
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(
    @CompanyId() companyId: number | null,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @UserId() userId: number | null,
    @CurrentRole() role: UserRole | null,
  ): Promise<PaginatedTickets> {
    return this.ticketService.findAll(companyId, page, limit, userId, role);
  }

  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  findById(
    @Param('id', ParseIntPipe) id: number,
    @CompanyId() companyId: number | null,
    @UserId() userId: number | null,
    @CurrentRole() role: UserRole | null,
  ): Promise<Ticket> {
    return this.ticketService.findById(id, companyId, userId, role);
  }

  @Get('/descricao/:descricao')
  @HttpCode(HttpStatus.OK)
  findByDescricao(
    @Param('descricao') descricao: string,
    @CompanyId() companyId: number | null,
    @UserId() userId: number | null,
    @CurrentRole() role: UserRole | null,
  ): Promise<Ticket[]> {
    return this.ticketService.findByDescricao(
      descricao,
      companyId,
      userId,
      role,
    );
  }

  @Get('/stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  getStats(
    @CompanyId() companyId: number | null,
    @CurrentRole() role: UserRole | null,
  ): Promise<TicketStats> {
    return this.ticketService.getStats(companyId, role);
  }
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() ticket: Ticket,
    @UserId() userId: number | null,
    @CompanyId() companyId: number | null,
  ): Promise<Ticket> {
    return this.ticketService.create(ticket, userId, companyId);
  }

  @Put()
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPPORT, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  update(
    @Body() ticket: Ticket,
    @CompanyId() companyId: number | null,
    @UserId() userId: number | null,
    @CurrentRole() role: UserRole | null,
  ): Promise<Ticket> {
    return this.ticketService.update(ticket, companyId, userId, role);
  }

  @Delete('/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(
    @Param('id', ParseIntPipe) id: number,
    @CompanyId() companyId: number | null,
    @CurrentRole() role: UserRole | null,
  ) {
    return this.ticketService.delete(id, companyId, role);
  }
}
