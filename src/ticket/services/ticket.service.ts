import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository, DeleteResult } from 'typeorm';
import { Ticket } from '../entities/ticket.entity';
import { CategoryService } from '../../category/services/category.service';
import { PriorityService } from '../../priority/services/priority.service';

export interface PaginatedTickets {
  data: Ticket[];
  total: number;
  page: number;
  totalPages: number;
}

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    private categoryService: CategoryService,
    private priorityService: PriorityService,
  ) {}

  private checkCompanyId(companyId: number | null): number {
    if (!companyId)
      throw new HttpException(
        'Usuário não está vinculado a uma empresa',
        HttpStatus.FORBIDDEN,
      );
    return companyId;
  }

  async findAll(
    companyId: number | null,
    page: number,
    limit: number,
  ): Promise<PaginatedTickets> {
    const id = this.checkCompanyId(companyId);

    const [data, total] = await this.ticketRepository.findAndCount({
      where: { user: { company: { id } } },
      relations: { category: true, priority: true, user: true },
      order: { data: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: number, companyId: number | null): Promise<Ticket> {
    const validCompanyId = this.checkCompanyId(companyId);

    const ticket = await this.ticketRepository.findOne({
      where: { id, user: { company: { id: validCompanyId } } },
      relations: { category: true, priority: true, user: true },
    });

    if (!ticket) {
      throw new HttpException('Ticket não encontrado', HttpStatus.NOT_FOUND);
    }
    return ticket;
  }

  async findByIdUnscoped(id: number): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { id },
      relations: { category: true, priority: true, user: true },
    });

    if (!ticket) {
      throw new HttpException('Ticket não encontrado', HttpStatus.NOT_FOUND);
    }
    return ticket;
  }

  async findByDescricao(
    descricao: string,
    companyId: number | null,
  ): Promise<Ticket[]> {
    const id = this.checkCompanyId(companyId);

    return await this.ticketRepository.find({
      where: {
        descricao: ILike(`%${descricao}%`),
        user: { company: { id } },
      },
      relations: { category: true, priority: true, user: true },
    });
  }

  async create(ticket: Ticket): Promise<Ticket> {
    await this.categoryService.findByIdUnscoped(ticket.category.id);
    await this.priorityService.findByIdUnscoped(ticket.priority.id);
    return await this.ticketRepository.save(ticket);
  }

  async update(ticket: Ticket): Promise<Ticket> {
    await this.findByIdUnscoped(ticket.id);
    await this.categoryService.findByIdUnscoped(ticket.category.id);
    await this.priorityService.findByIdUnscoped(ticket.priority.id);
    return await this.ticketRepository.save(ticket);
  }

  async delete(id: number): Promise<DeleteResult> {
    await this.findByIdUnscoped(id);
    return await this.ticketRepository.delete(id);
  }
}
