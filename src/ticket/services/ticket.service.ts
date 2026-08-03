import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository, DeleteResult } from 'typeorm';
import { Ticket } from '../entities/ticket.entity';
import { CategoryService } from 'src/category/services/category.service';
import { PriorityService } from 'src/priority/services/priority.service';

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    private categoryService: CategoryService,
    private priorityService: PriorityService,
  ) {}

  async findAll(): Promise<Ticket[]> {
    return await this.ticketRepository.find();
  }

  async findById(id: number): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({ where: { id } });

    if (!ticket) {
      throw new HttpException('Ticket não encontrado', HttpStatus.NOT_FOUND);
    }
    return ticket;
  }
  async findByDescricao(descricao: string): Promise<Ticket[]> {
    return await this.ticketRepository.find({
      where: { descricao: ILike(`%${descricao}%`) },
    });
  }

  async create(ticket: Ticket): Promise<Ticket> {
    await this.categoryService.findById(ticket.category.id);
    await this.priorityService.findById(ticket.priority.id);
    return await this.ticketRepository.save(ticket);
  }

  async update(ticket: Ticket): Promise<Ticket> {
    await this.findById(ticket.id);
    await this.categoryService.findById(ticket.category.id);
    await this.priorityService.findById(ticket.priority.id);
    return await this.ticketRepository.save(ticket);
  }

  async delete(id: number): Promise<DeleteResult> {
    await this.findById(id);
    return await this.ticketRepository.delete(id);
  }
}
