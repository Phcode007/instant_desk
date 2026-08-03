import { Ticket } from 'src/ticket/entities/ticket.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

@Entity({ name: 'tb_users' })
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @IsNotEmpty()
  @Column({ length: 255, nullable: false })
  nome!: string;

  @IsEmail()
  @Column({ length: 255, nullable: false })
  usuario!: string;

  @MinLength(8)
  @Column({ length: 255, nullable: false })
  senha!: string;

  @Column({ length: 255, nullable: false })
  foto!: string;

  @OneToMany(() => Ticket, (ticket) => ticket.user)
  ticket!: Ticket[];
}
