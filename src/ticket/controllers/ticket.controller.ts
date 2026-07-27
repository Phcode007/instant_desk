import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
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
}
