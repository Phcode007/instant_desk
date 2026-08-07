import { IsNotEmpty } from 'class-validator';
import { Ticket } from '../../ticket/entities/ticket.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'tb_categories' })
export class Category {
  @PrimaryGeneratedColumn()
  id!: number;

  @IsNotEmpty()
  @Column({ length: 255, nullable: false })
  nome!: string;

  @OneToMany(() => Ticket, (ticket) => ticket.category, {
    onDelete: 'CASCADE',
  })
  ticket!: Ticket[];
}
