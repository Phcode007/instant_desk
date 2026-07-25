import { IsNotEmpty } from 'class-validator';
import {
  Column,
  Entity,
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
}
