import { IsNotEmpty } from 'class-validator';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Comment } from '../../comment/entities/comment.entity';

@Entity({ name: 'tb_attachments' })
export class Attachment {
  @PrimaryGeneratedColumn()
  id!: number;

  @IsNotEmpty()
  @Column({ length: 255, nullable: false })
  @ApiProperty()
  nomeArquivo!: string;

  @IsNotEmpty()
  @Column({ length: 2000, nullable: false })
  @ApiProperty()
  url!: string;

  @ApiProperty({ type: () => Comment })
  @ManyToOne(() => Comment, (comment) => comment.attachment)
  comment!: Comment;
}
