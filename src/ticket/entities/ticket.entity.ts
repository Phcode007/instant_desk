import { IsNotEmpty } from 'class-validator';
import { Category } from 'src/category/entities/category.entity';
import { Priority } from 'src/priority/entities/priority.entity';
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
}
