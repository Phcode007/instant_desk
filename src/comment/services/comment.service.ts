import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { Comment } from '../entities/comment.entity';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
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
    return await this.commentRepository.save(comment);
  }

  async update(comment: Comment): Promise<Comment> {
    await this.findById(comment.id);
    return await this.commentRepository.save(comment);
  }

  async delete(id: number): Promise<DeleteResult> {
    await this.findById(id);
    return await this.commentRepository.delete(id);
  }
}
