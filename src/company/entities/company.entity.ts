import { IsNotEmpty } from 'class-validator';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../user/entities/user.entity';
import { Category } from '../../category/entities/category.entity';
import { Priority } from '../../priority/entities/priority.entity';

@Entity({ name: 'tb_companies' })
export class Company {
  @PrimaryGeneratedColumn()
  id!: number;

  @IsNotEmpty()
  @Column({ length: 255, nullable: false })
  @ApiProperty()
  nome!: string;

  @IsNotEmpty()
  @Column({ length: 14, nullable: false, unique: true })
  @ApiProperty()
  cnpj!: string;

  @ApiProperty({ type: () => User })
  @OneToMany(() => User, (user) => user.company)
  user!: User[];

  @ApiProperty({ type: () => Category })
  @OneToMany(() => Category, (category) => category.company)
  category!: Category[];

  @ApiProperty({ type: () => Priority })
  @OneToMany(() => Priority, (priority) => priority.company)
  priority!: Priority[];
}
