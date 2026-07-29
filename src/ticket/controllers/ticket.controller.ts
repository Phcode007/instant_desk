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
} from '@nestjs/common';
import { TicketService } from '../services/ticket.service';
import { Ticket } from '../entities/ticket.entity';

@Controller('/tickets')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(): Promise<Ticket[]> {
    return this.ticketService.findAll();
  }

  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  findById(@Param('id', ParseIntPipe) id: number): Promise<Ticket> {
    return this.ticketService.findById(id);
  }
  @Get('/descricao/:descricao')
  @HttpCode(HttpStatus.OK)
  findByDescricao(@Param('descricao') descricao: string): Promise<Ticket[]> {
    return this.ticketService.findByDescricao(descricao);
  }
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() ticket: Ticket): Promise<Ticket> {
    return this.ticketService.create(ticket);
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
