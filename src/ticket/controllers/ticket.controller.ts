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
import { UserId } from 'src/auth/decorators/user_id.decorator';

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
  ): Promise<PaginatedTickets> {
    return this.ticketService.findAll(companyId, page, limit);
  }

  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  findById(
    @Param('id', ParseIntPipe) id: number,
    @CompanyId() companyId: number | null,
  ): Promise<Ticket> {
    return this.ticketService.findById(id, companyId);
  }

  @Get('/descricao/:descricao')
  @HttpCode(HttpStatus.OK)
  findByDescricao(
    @Param('descricao') descricao: string,
    @CompanyId() companyId: number | null,
  ): Promise<Ticket[]> {
    return this.ticketService.findByDescricao(descricao, companyId);
  }

  @Get('/stats')
  @HttpCode(HttpStatus.OK)
  getStats(@CompanyId() companyId: number | null): Promise<TicketStats> {
    return this.ticketService.getStats(companyId);
  }
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() ticket: Ticket,
    @UserId() userId: number | null,
  ): Promise<Ticket> {
    return this.ticketService.create(ticket, userId);
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  update(@Body() ticket: Ticket): Promise<Ticket> {
    return this.ticketService.update(ticket);
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.ticketService.delete(id);
  }
}
