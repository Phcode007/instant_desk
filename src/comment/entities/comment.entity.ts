import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Ticket } from '../../ticket/entities/ticket.entity';
import { User } from '../../user/entities/user.entity';
import { Attachment } from '../../attachment/entities/attachment.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'tb_comments' })
export class Comment {
  @PrimaryGeneratedColumn()
  id!: number;

  @IsNotEmpty()
  @Column({ length: 1000, nullable: false })
  @ApiProperty()
  comentario!: string;

  @CreateDateColumn()
  @ApiProperty()
  data!: Date;

  @ApiProperty({ type: () => Ticket })
  @ManyToOne(() => Ticket, (ticket) => ticket.comment)
  ticket!: Ticket;

  @ApiProperty({ type: () => User })
  @ManyToOne(() => User, (user) => user.comment)
  user!: User;

  @ApiProperty({ type: () => Attachment })
  @OneToMany(() => Attachment, (attachment) => attachment.comment)
  attachment!: Attachment[];
}
