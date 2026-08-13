import { Company } from './../../company/entities/company.entity';
import { Ticket } from '../../ticket/entities/ticket.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'tb_users' })
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @IsNotEmpty()
  @Column({ length: 255, nullable: false })
  @ApiProperty()
  nome!: string;

  @IsEmail()
  @Column({ length: 255, nullable: false })
  @ApiProperty()
  usuario!: string;

  @MinLength(8)
  @Column({ length: 255, nullable: false })
  @ApiProperty()
  senha!: string;

  @ApiProperty()
  @OneToMany(() => Ticket, (ticket) => ticket.user)
  ticket!: Ticket[];

  @ApiProperty()
  @OneToMany(() => Company, (company) => company.user)
  company!: Company[];
}
