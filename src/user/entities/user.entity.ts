import { Ticket } from '../../ticket/entities/ticket.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Company } from '../../company/entities/company.entity';
import { Comment } from '../../comment/entities/comment.entity';
import { UserRole } from '../enums/user-role.enum';

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

  @Column({ type: 'varchar', length: 16, default: UserRole.USER })
  @ApiProperty({ enum: UserRole, default: UserRole.USER })
  role!: UserRole;

  @ApiProperty({ type: () => Ticket })
  @OneToMany(() => Ticket, (ticket) => ticket.user)
  ticket!: Ticket[];

  @ApiProperty({ type: () => Company })
  @ManyToOne(() => Company, (company) => company.user)
  company!: Company;

  @ApiProperty({ type: () => Comment })
  @OneToMany(() => Comment, (comment) => comment.user)
  comment!: Comment[];
}
