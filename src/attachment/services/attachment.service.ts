import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { Attachment } from '../entities/attachment.entity';
import { CommentService } from '../../comment/services/comment.service';

@Injectable()
export class AttachmentService {
  constructor(
    @InjectRepository(Attachment)
    private attachmentRepository: Repository<Attachment>,
    private commentService: CommentService,
  ) {}

  async findAll(): Promise<Attachment[]> {
    return await this.attachmentRepository.find({
      relations: { comment: true },
    });
  }

  async findById(id: number): Promise<Attachment> {
    const attachment = await this.attachmentRepository.findOne({
      where: { id },
      relations: { comment: true },
    });

    if (!attachment)
      throw new HttpException('Anexo não encontrado', HttpStatus.NOT_FOUND);

    return attachment;
  }

  async create(attachment: Attachment): Promise<Attachment> {
    await this.commentService.findById(attachment.comment.id);
    return await this.attachmentRepository.save(attachment);
  }

  async update(attachment: Attachment): Promise<Attachment> {
    await this.findById(attachment.id);
    await this.commentService.findById(attachment.comment.id);
    return await this.attachmentRepository.save(attachment);
  }

  async delete(id: number): Promise<DeleteResult> {
    await this.findById(id);
    return await this.attachmentRepository.delete(id);
  }
}
