import { IsNotEmpty } from 'class-validator';
import { Category } from '../../category/entities/category.entity';
import { Priority } from '../../priority/entities/priority.entity';
import { User } from '../../user/entities/user.entity';
import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'tb_tickets' })
export class Ticket {
  @PrimaryGeneratedColumn()
  id!: number;

  @IsNotEmpty()
  @Column({ length: 100, nullable: false })
  titulo!: string;

  @IsNotEmpty()
  @Column({ length: 100, nullable: false })
  descricao!: string;

  @Column({ length: 20, nullable: false, default: 'aberto' })
  status!: string;

  @UpdateDateColumn()
  data!: Date;

  @ManyToOne(() => Category, (category) => category.ticket)
  category!: Category;

  @ManyToOne(() => Priority, (priority) => priority.ticket)
  priority!: Priority;

  @ManyToOne(() => User, (user) => user.ticket)
  user!: User;
}
