import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { Comment } from '../entities/comment.entity';
import { TicketService } from '../../ticket/services/ticket.service';
import { UserService } from '../../user/services/user.service';

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

  async findAll(companyId: number | null): Promise<Comment[]> {
    const id = this.checkCompanyId(companyId);

    return await this.commentRepository.find({
      where: { ticket: { user: { company: { id } } } },
      relations: { ticket: true, user: true, attachment: true },
    });
  }

  async findById(id: number, companyId: number | null): Promise<Comment> {
    const validCompanyId = this.checkCompanyId(companyId);

    const comment = await this.commentRepository.findOne({
      where: { id, ticket: { user: { company: { id: validCompanyId } } } },
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
  ): Promise<Comment[]> {
    const id = this.checkCompanyId(companyId);

    return await this.commentRepository.find({
      where: { ticket: { id: ticketId, user: { company: { id } } } },
      relations: { user: true, attachment: true },
      order: { data: 'ASC' },
    });
  }

  async create(comment: Comment): Promise<Comment> {
    await this.ticketService.findByIdUnscoped(comment.ticket.id);
    await this.userService.findByIdUnscoped(comment.user.id);
    return await this.commentRepository.save(comment);
  }

  async update(comment: Comment): Promise<Comment> {
    await this.findByIdUnscoped(comment.id);
    await this.ticketService.findByIdUnscoped(comment.ticket.id);
    await this.userService.findByIdUnscoped(comment.user.id);
    return await this.commentRepository.save(comment);
  }

  async delete(id: number): Promise<DeleteResult> {
    await this.findByIdUnscoped(id);
    return await this.commentRepository.delete(id);
  }
}
