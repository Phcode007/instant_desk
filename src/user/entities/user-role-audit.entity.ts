import { CreateDateColumn, Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { UserRole } from '../enums/user-role.enum';

@Entity({ name: 'tb_user_role_audits' })
export class UserRoleAudit {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer', nullable: true })
  administratorId!: number | null;

  @Column({ type: 'integer' })
  affectedUserId!: number;

  @Column({ type: 'integer' })
  companyId!: number;

  @Column({ type: 'varchar', length: 16 })
  previousRole!: UserRole;

  @Column({ type: 'varchar', length: 16 })
  newRole!: UserRole;

  @Column({ type: 'varchar', length: 16, default: 'ADMIN' })
  source!: 'ADMIN' | 'BOOTSTRAP';

  @CreateDateColumn()
  createdAt!: Date;
}