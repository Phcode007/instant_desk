import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { Attachment } from '../entities/attachment.entity';
import { CommentService } from '../../comment/services/comment.service';
import { UserRole } from '../../user/enums/user-role.enum';

@Injectable()
export class AttachmentService {
  constructor(
    @InjectRepository(Attachment)
    private attachmentRepository: Repository<Attachment>,
    private commentService: CommentService,
  ) {}

  private checkRole(role: UserRole | null): UserRole {
    if (!role || !Object.values(UserRole).includes(role)) {
      throw new HttpException('Perfil inválido', HttpStatus.FORBIDDEN);
    }
    return role;
  }

  async findAll(
    companyId: number | null,
    userId: number | null,
    role: UserRole | null,
  ): Promise<Attachment[]> {
    const currentRole = this.checkRole(role);
    if (!companyId || (currentRole === UserRole.USER && !userId)) {
      throw new HttpException(
        'Contexto de usuário inválido',
        HttpStatus.FORBIDDEN,
      );
    }
    return await this.attachmentRepository.find({
      where: {
        comment: {
          ticket: {
            user: {
              ...(currentRole === UserRole.USER ? { id: userId! } : {}),
              company: { id: companyId },
            },
          },
        },
      },
      relations: { comment: true },
    });
  }

  async findById(
    id: number,
    companyId: number | null,
    userId: number | null,
    role: UserRole | null,
  ): Promise<Attachment> {
    const currentRole = this.checkRole(role);
    if (!companyId || (currentRole === UserRole.USER && !userId)) {
      throw new HttpException(
        'Contexto de usuário inválido',
        HttpStatus.FORBIDDEN,
      );
    }
    const attachment = await this.attachmentRepository.findOne({
      where: {
        id,
        comment: {
          ticket: {
            user: {
              ...(currentRole === UserRole.USER ? { id: userId! } : {}),
              company: { id: companyId },
            },
          },
        },
      },
      relations: { comment: true },
    });

    if (!attachment)
      throw new HttpException('Anexo não encontrado', HttpStatus.NOT_FOUND);

    return attachment;
  }

  async create(
    attachment: Attachment,
    companyId: number | null,
    userId: number | null,
    role: UserRole | null,
  ): Promise<Attachment> {
    await this.commentService.findById(
      attachment.comment.id,
      companyId,
      userId,
      role,
    );
    return await this.attachmentRepository.save(attachment);
  }

  async update(
    attachment: Attachment,
    companyId: number | null,
    userId: number | null,
    role: UserRole | null,
  ): Promise<Attachment> {
    const existing = await this.findById(
      attachment.id,
      companyId,
      userId,
      role,
    );
    existing.nomeArquivo = attachment.nomeArquivo;
    existing.url = attachment.url;
    return this.attachmentRepository.save(existing);
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
    return await this.attachmentRepository.delete(id);
  }
}
