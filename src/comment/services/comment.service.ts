import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { Comment } from '../entities/comment.entity';
import { TicketService } from '../../ticket/services/ticket.service';
import { UserService } from '../../user/services/user.service';
import { UserRole } from '../../user/enums/user-role.enum';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    private ticketService: TicketService,
    private userService: UserService,
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
    userId: number | null,
    role: UserRole | null,
  ): Promise<Comment[]> {
    const id = this.checkCompanyId(companyId);
    const requesterId = this.requesterId(this.checkRole(role), userId);

    return await this.commentRepository.find({
      where: {
        ticket: {
          user: {
            ...(requesterId !== undefined ? { id: requesterId } : {}),
            company: { id },
          },
        },
      },
      relations: { ticket: true, user: true, attachment: true },
    });
  }

  async findById(
    id: number,
    companyId: number | null,
    userId: number | null,
    role: UserRole | null,
  ): Promise<Comment> {
    const validCompanyId = this.checkCompanyId(companyId);
    const requesterId = this.requesterId(this.checkRole(role), userId);

    const comment = await this.commentRepository.findOne({
      where: {
        id,
        ticket: {
          user: {
            ...(requesterId !== undefined ? { id: requesterId } : {}),
            company: { id: validCompanyId },
          },
        },
      },
      relations: { ticket: true, user: true, attachment: true },
    });

    if (!comment)
      throw new HttpException(
        'Comentário não encontrado',
        HttpStatus.NOT_FOUND,
      );

    return comment;
  }

  async findByIdUnscoped(id: number): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: { ticket: true, user: true, attachment: true },
    });

    if (!comment)
      throw new HttpException(
        'Comentário não encontrado',
        HttpStatus.NOT_FOUND,
      );

    return comment;
  }

  async findByTicket(
    ticketId: number,
    companyId: number | null,
    userId: number | null,
    role: UserRole | null,
  ): Promise<Comment[]> {
    const id = this.checkCompanyId(companyId);
    const requesterId = this.requesterId(this.checkRole(role), userId);
    await this.ticketService.findById(ticketId, id, userId, role);

    return await this.commentRepository.find({
      where: {
        ticket: {
          id: ticketId,
          user: {
            ...(requesterId !== undefined ? { id: requesterId } : {}),
            company: { id },
          },
        },
      },
      relations: { user: true, attachment: true },
      order: { data: 'ASC' },
    });
  }

  async create(
    comment: Comment,
    companyId: number | null,
    userId: number | null,
    role: UserRole | null,
  ): Promise<Comment> {
    if (!userId) {
      throw new HttpException(
        'Usuário não autenticado',
        HttpStatus.UNAUTHORIZED,
      );
    }
    await this.ticketService.findById(
      comment.ticket.id,
      companyId,
      userId,
      role,
    );
    const author = await this.userService.findForAuthentication(userId);
    if (!author) {
      throw new HttpException(
        'Usuário não encontrado',
        HttpStatus.UNAUTHORIZED,
      );
    }
    comment.user = { id: userId } as Comment['user'];
    return await this.commentRepository.save(comment);
  }

  async update(
    comment: Comment,
    companyId: number | null,
    userId: number | null,
    role: UserRole | null,
  ): Promise<Comment> {
    const currentRole = this.checkRole(role);
    if (currentRole === UserRole.USER) {
      throw new HttpException('Perfil sem permissão', HttpStatus.FORBIDDEN);
    }
    const existing = await this.findById(comment.id, companyId, userId, role);
    existing.comentario = comment.comentario;
    return this.commentRepository.save(existing);
  }

  async delete(
    id: number,
    companyId: number | null,
    userId: number | null,
    role: UserRole | null,
  ): Promise<DeleteResult> {
    if (this.checkRole(role) === UserRole.USER) {
      throw new HttpException('Perfil sem permissão', HttpStatus.FORBIDDEN);
    }
    await this.findById(id, companyId, userId, role);
    return await this.commentRepository.delete(id);
  }
}
