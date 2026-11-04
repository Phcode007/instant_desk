import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository, DeleteResult } from 'typeorm';
import { Ticket } from '../entities/ticket.entity';
import { CategoryService } from '../../category/services/category.service';
import { PriorityService } from '../../priority/services/priority.service';
import { User } from '../../user/entities/user.entity';
import { UserRole } from '../../user/enums/user-role.enum';

export interface PaginatedTickets {
  data: Ticket[];
  total: number;
  page: number;
  totalPages: number;
}

export interface TicketStatusCount {
  status: string;
  total: number;
}

export interface TicketStats {
  abertosHoje: number;
  emAndamento: number;
  total: number;
  porStatus: TicketStatusCount[];
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

  private checkRole(role: UserRole | null): UserRole {
    if (!role || !Object.values(UserRole).includes(role)) {
      throw new HttpException('Perfil inválido', HttpStatus.FORBIDDEN);
    }
    return role;
  }

  private requesterId(
    role: UserRole,
    userId: number | null,
  ): number | undefined {
    if (role !== UserRole.USER) return undefined;
    if (!userId) {
      throw new HttpException(
        'Usuário não autenticado',
        HttpStatus.UNAUTHORIZED,
      );
    }
    return userId;
  }

  async findAll(
    companyId: number | null,
    page: number,
    limit: number,
    userId: number | null,
    role: UserRole | null,
  ): Promise<PaginatedTickets> {
    const id = this.checkCompanyId(companyId);
    const currentRole = this.checkRole(role);
    const requesterId = this.requesterId(currentRole, userId);

    const [data, total] = await this.ticketRepository.findAndCount({
      where: {
        user: {
          ...(requesterId !== undefined ? { id: requesterId } : {}),
          company: { id },
        },
      },
      relations: { category: true, priority: true, user: true },
      order: { data: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findById(
    id: number,
    companyId: number | null,
    userId: number | null,
    role: UserRole | null,
  ): Promise<Ticket> {
    const validCompanyId = this.checkCompanyId(companyId);
    const currentRole = this.checkRole(role);
    const requesterId = this.requesterId(currentRole, userId);

    const ticket = await this.ticketRepository.findOne({
      where: {
        id,
        user: {
          ...(requesterId !== undefined ? { id: requesterId } : {}),
          company: { id: validCompanyId },
        },
      },
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
    userId: number | null,
    role: UserRole | null,
  ): Promise<Ticket[]> {
    const id = this.checkCompanyId(companyId);
    const currentRole = this.checkRole(role);
    const requesterId = this.requesterId(currentRole, userId);

    return await this.ticketRepository.find({
      where: {
        descricao: ILike(`%${descricao}%`),
        user: {
          ...(requesterId !== undefined ? { id: requesterId } : {}),
          company: { id },
        },
      },
      relations: { category: true, priority: true, user: true },
    });
  }

  async create(
    ticket: Ticket,
    userId: number | null,
    companyId: number | null,
  ): Promise<Ticket> {
    if (!userId)
      throw new HttpException(
        'Usuário não autenticado',
        HttpStatus.UNAUTHORIZED,
      );

    const id = this.checkCompanyId(companyId);
    const category = await this.categoryService.findById(
      ticket.category.id,
      id,
    );
    const priority = await this.priorityService.findById(
      ticket.priority.id,
      id,
    );

    ticket.user = { id: userId } as User;
    ticket.category = category;
    ticket.priority = priority;

    return await this.ticketRepository.save(ticket);
  }

  async update(
    ticket: Ticket,
    companyId: number | null,
    userId: number | null,
    role: UserRole | null,
  ): Promise<Ticket> {
    const currentRole = this.checkRole(role);
    if (currentRole !== UserRole.SUPPORT && currentRole !== UserRole.ADMIN) {
      throw new HttpException('Perfil sem permissão', HttpStatus.FORBIDDEN);
    }
    const existing = await this.findById(ticket.id, companyId, userId, role);
    existing.status = ticket.status ?? existing.status;
    if (ticket.priority?.id) {
      existing.priority = await this.priorityService.findById(
        ticket.priority.id,
        this.checkCompanyId(companyId),
      );
    }
    return this.ticketRepository.save(existing);
  }

  async delete(
    id: number,
    companyId: number | null,
    role: UserRole | null,
  ): Promise<DeleteResult> {
    if (this.checkRole(role) !== UserRole.ADMIN) {
      throw new HttpException('Perfil sem permissão', HttpStatus.FORBIDDEN);
    }
    await this.findById(id, companyId, null, role);
    return await this.ticketRepository.delete(id);
  }

  async getStats(
    companyId: number | null,
    role: UserRole | null,
  ): Promise<TicketStats> {
    if (this.checkRole(role) !== UserRole.ADMIN) {
      throw new HttpException('Perfil sem permissão', HttpStatus.FORBIDDEN);
    }
    const id = this.checkCompanyId(companyId);

    const porStatusRaw = await this.ticketRepository
      .createQueryBuilder('ticket')
      .innerJoin('ticket.user', 'user')
      .where('user.company = :id', { id })
      .select('ticket.status', 'status')
      .addSelect('COUNT(ticket.id)', 'total')
      .groupBy('ticket.status')
      .getRawMany<{ status: string; total: string }>();

    const porStatus: TicketStatusCount[] = porStatusRaw.map((linha) => ({
      status: linha.status,
      total: Number(linha.total),
    }));

    const total = porStatus.reduce((soma, item) => soma + item.total, 0);
    const emAndamento =
      porStatus.find((item) => item.status === 'em andamento')?.total ?? 0;

    const inicioDoDia = new Date();
    inicioDoDia.setHours(0, 0, 0, 0);

    const abertosHoje = await this.ticketRepository
      .createQueryBuilder('ticket')
      .innerJoin('ticket.user', 'user')
      .where('user.company = :id', { id })
      .andWhere('ticket.criadoEm >= :inicio', { inicio: inicioDoDia })
      .getCount();

    return { abertosHoje, emAndamento, total, porStatus };
  }
}
