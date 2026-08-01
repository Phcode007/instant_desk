import { IsNotEmpty } from 'class-validator';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Ticket } from '../../ticket/entities/ticket.entity';

@Entity('tb_priorities')
export class Priority {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100, nullable: false })
  @IsNotEmpty()
  nome!: string;

  @OneToMany(() => Ticket, (ticket) => ticket.priority, {
    onDelete: 'CASCADE',
  })
  ticket!: Ticket[];
}
