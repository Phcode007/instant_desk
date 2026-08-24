import { IsNotEmpty } from 'class-validator';
import { Category } from '../../category/entities/category.entity';
import { Priority } from '../../priority/entities/priority.entity';
import { User } from '../../user/entities/user.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Comment } from '../../comment/entities/comment.entity';

@Entity({ name: 'tb_tickets' })
export class Ticket {
  @PrimaryGeneratedColumn()
  id!: number;

  @IsNotEmpty()
  @Column({ length: 100, nullable: false })
  @ApiProperty()
  titulo!: string;

  @IsNotEmpty()
  @Column({ length: 100, nullable: false })
  @ApiProperty()
  descricao!: string;

  @Column({ length: 20, nullable: false, default: 'aberto' })
  @ApiProperty()
  status!: string;

  @UpdateDateColumn()
  @ApiProperty()
  data!: Date;

  @ManyToOne(() => Category, (category) => category.ticket)
  @ApiProperty({ type: () => Category })
  category!: Category;

  @ManyToOne(() => Priority, (priority) => priority.ticket)
  @ApiProperty({ type: () => Priority })
  priority!: Priority;

  @ManyToOne(() => User, (user) => user.ticket)
  @ApiProperty({ type: () => User })
  user!: User;

  @ApiProperty({ type: () => Comment })
  @OneToMany(() => Comment, (comment) => comment.ticket)
  comment!: Comment[];
}
