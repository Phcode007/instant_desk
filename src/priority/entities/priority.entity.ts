import { IsNotEmpty } from 'class-validator';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Ticket } from '../../ticket/entities/ticket.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Company } from '../../company/entities/company.entity';

@Entity('tb_priorities')
export class Priority {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100, nullable: false })
  @IsNotEmpty()
  @ApiProperty()
  nome!: string;

  @ApiProperty()
  @OneToMany(() => Ticket, (ticket) => ticket.priority, {
    onDelete: 'CASCADE',
  })
  ticket!: Ticket[];

  @ApiProperty({ type: () => Company })
  @ManyToOne(() => Company, (company) => company.priority)
  company!: Company;
}
