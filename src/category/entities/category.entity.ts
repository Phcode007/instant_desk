import { IsNotEmpty } from 'class-validator';
import { Ticket } from '../../ticket/entities/ticket.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Company } from '../../company/entities/company.entity';

@Entity({ name: 'tb_categories' })
export class Category {
  @PrimaryGeneratedColumn()
  id!: number;

  @IsNotEmpty()
  @Column({ length: 255, nullable: false })
  @ApiProperty()
  nome!: string;

  @ApiProperty({ type: () => Ticket })
  @OneToMany(() => Ticket, (ticket) => ticket.category, {
    onDelete: 'CASCADE',
  })
  ticket!: Ticket[];

  @ApiProperty({ type: () => Company })
  @ManyToOne(() => Company, (company) => company.category)
  company!: Company;
}
