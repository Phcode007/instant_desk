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

  async findAll(): Promise<Comment[]> {
    return await this.commentRepository.find({
      relations: { ticket: true, user: true, attachment: true },
    });
  }

  async findById(id: number): Promise<Comment> {
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

  async findByTicket(ticketId: number): Promise<Comment[]> {
    return await this.commentRepository.find({
      where: { ticket: { id: ticketId } },
      relations: { user: true, attachment: true },
    });
  }

  async create(comment: Comment): Promise<Comment> {
    await this.ticketService.findByIdUnscoped(comment.ticket.id);
    await this.userService.findByIdUnscoped(comment.user.id);
    return await this.commentRepository.save(comment);
  }

  async update(comment: Comment): Promise<Comment> {
    await this.findById(comment.id);
    await this.ticketService.findByIdUnscoped(comment.ticket.id);
    await this.userService.findByIdUnscoped(comment.user.id);
    return await this.commentRepository.save(comment);
  }

  async delete(id: number): Promise<DeleteResult> {
    await this.findById(id);
    return await this.commentRepository.delete(id);
  }
}
