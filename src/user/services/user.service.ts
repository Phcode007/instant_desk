import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Bcrypt } from '../../auth/bcrypt/bcrypt';
import { CompanyService } from '../../company/services/company.service';
import { Company } from '../../company/entities/company.entity';
import { UserRole } from '../enums/user-role.enum';
import { UserRoleAudit } from '../entities/user-role-audit.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private bcrypt: Bcrypt,
    private companyService: CompanyService,
    private dataSource: DataSource,
  ) {}

  private checkCompanyId(companyId: number | null): number {
    if (!companyId)
      throw new HttpException(
        'Usuário não está vinculado a uma empresa',
        HttpStatus.FORBIDDEN,
      );
    return companyId;
  }

  async findByUsuario(usuario: string): Promise<User | undefined> {
    return (
      (await this.userRepository.findOne({
        where: { usuario },
        relations: { company: true },
      })) ?? undefined
    );
  }

  async findForAuthentication(id: number): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.company', 'company')
      .select(['user.id', 'user.usuario', 'user.role', 'company.id'])
      .where('user.id = :id', { id })
      .getOne();
  }

  private async assertAdmin(
    administratorId: number,
    companyId: number,
  ): Promise<void> {
    const administrator = await this.findForAuthentication(administratorId);

    if (
      !administrator ||
      administrator.role !== UserRole.ADMIN ||
      administrator.company?.id !== companyId
    ) {
      throw new HttpException(
        'Acesso permitido somente a administradores da empresa',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  async findAll(
    companyId: number | null,
    administratorId: number,
  ): Promise<User[]> {
    const id = this.checkCompanyId(companyId);
    await this.assertAdmin(administratorId, id);

    return await this.userRepository.find({
      where: { company: { id } },
      select: { id: true, nome: true, usuario: true, role: true },
    });
  }

  async findById(
    id: number,
    companyId: number | null,
    administratorId: number,
  ): Promise<User> {
    const validCompanyId = this.checkCompanyId(companyId);
    await this.assertAdmin(administratorId, validCompanyId);

    const user = await this.userRepository.findOne({
      where: { id, company: { id: validCompanyId } },
      select: { id: true, nome: true, usuario: true, role: true },
    });

    if (!user)
      throw new HttpException('Usuário não encontrado!', HttpStatus.NOT_FOUND);

    return user;
  }

  async findByIdUnscoped(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: { company: true, ticket: true, comment: true },
    });

    if (!user)
      throw new HttpException('Usuário não encontrado!', HttpStatus.NOT_FOUND);

    return user;
  }

  async create(user: User): Promise<User> {
    if (!user.company || !user.company.id)
      throw new HttpException(
        'A empresa (company) é obrigatória para cadastrar um usuário',
        HttpStatus.BAD_REQUEST,
      );

    const buscaUser = await this.findByUsuario(user.usuario);

    if (buscaUser)
      throw new HttpException('O usuário já existe!', HttpStatus.BAD_REQUEST);

    await this.companyService.findById(user.company.id);

    user.senha = await this.bcrypt.criptografarSenha(user.senha);
    user.role = UserRole.USER;
    return await this.userRepository.save(user);
  }

  async bootstrapAdmin(companyId: number, userId: number): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const companyQuery = manager
        .getRepository(Company)
        .createQueryBuilder('company')
        .where('company.id = :companyId', { companyId });

      if (this.dataSource.options.type === 'postgres') {
        companyQuery.setLock('pessimistic_write');
      }

      if (!(await companyQuery.getOne())) {
        throw new HttpException(
          'Empresa não encontrada!',
          HttpStatus.NOT_FOUND,
        );
      }

      const existingAdmin = await manager.findOne(User, {
        where: { company: { id: companyId }, role: UserRole.ADMIN },
      });

      if (existingAdmin) {
        throw new HttpException(
          'A empresa já possui um administrador',
          HttpStatus.CONFLICT,
        );
      }

      const user = await manager.findOne(User, {
        where: { id: userId, company: { id: companyId } },
      });

      if (!user) {
        throw new HttpException(
          'Usuário não encontrado nesta empresa',
          HttpStatus.NOT_FOUND,
        );
      }

      if (user.role !== UserRole.USER) {
        throw new HttpException(
          'Somente um usuário USER pode ser o administrador inicial',
          HttpStatus.CONFLICT,
        );
      }

      await manager.update(User, { id: userId }, { role: UserRole.ADMIN });
      await manager.save(UserRoleAudit, {
        administratorId: null,
        affectedUserId: userId,
        companyId,
        previousRole: UserRole.USER,
        newRole: UserRole.ADMIN,
        source: 'BOOTSTRAP',
      });
    });
  }

  async update(
    user: User,
    companyId: number | null,
    currentUserId: number,
  ): Promise<User> {
    if (user.id !== currentUserId) {
      throw new HttpException(
        'Não é permitido alterar os dados de outro usuário',
        HttpStatus.FORBIDDEN,
      );
    }

    const existing = await this.findByIdUnscoped(user.id);
    if (existing.company?.id !== this.checkCompanyId(companyId)) {
      throw new HttpException('Usuário não encontrado!', HttpStatus.NOT_FOUND);
    }

    const buscaUser = await this.findByUsuario(user.usuario);

    if (buscaUser && buscaUser.id !== user.id)
      throw new HttpException(
        'Usuário (login) já cadastrado!',
        HttpStatus.BAD_REQUEST,
      );

    existing.nome = user.nome;
    existing.usuario = user.usuario;
    if (user.senha) {
      existing.senha = await this.bcrypt.criptografarSenha(user.senha);
    }
    return await this.userRepository.save(existing);
  }

  async changeRole(
    targetUserId: number,
    targetRole: UserRole,
    companyId: number | null,
    administratorId: number,
  ): Promise<User> {
    const validCompanyId = this.checkCompanyId(companyId);

    if (!Object.values(UserRole).includes(targetRole)) {
      throw new HttpException('Perfil inválido', HttpStatus.BAD_REQUEST);
    }
    if (targetUserId === administratorId) {
      throw new HttpException(
        'Não é permitido alterar o próprio perfil',
        HttpStatus.FORBIDDEN,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const companyQuery = manager
        .getRepository(Company)
        .createQueryBuilder('company')
        .where('company.id = :companyId', { companyId: validCompanyId });
      if (this.dataSource.options.type === 'postgres') {
        companyQuery.setLock('pessimistic_write');
      }
      if (!(await companyQuery.getOne())) {
        throw new HttpException(
          'Empresa não encontrada!',
          HttpStatus.NOT_FOUND,
        );
      }

      const administrator = await manager.findOne(User, {
        where: {
          id: administratorId,
          company: { id: validCompanyId },
          role: UserRole.ADMIN,
        },
      });
      if (!administrator) {
        throw new HttpException(
          'Acesso permitido somente a administradores da empresa',
          HttpStatus.FORBIDDEN,
        );
      }

      const target = await manager.findOne(User, {
        where: { id: targetUserId, company: { id: validCompanyId } },
      });
      if (!target) {
        throw new HttpException(
          'Usuário não encontrado nesta empresa',
          HttpStatus.NOT_FOUND,
        );
      }
      if (target.role === targetRole) {
        return target;
      }

      if (target.role === UserRole.ADMIN && targetRole !== UserRole.ADMIN) {
        const administratorCount = await manager.count(User, {
          where: { company: { id: validCompanyId }, role: UserRole.ADMIN },
        });
        if (administratorCount <= 1) {
          throw new HttpException(
            'Não é possível rebaixar o último administrador da empresa',
            HttpStatus.CONFLICT,
          );
        }
      }

      const previousRole = target.role;
      target.role = targetRole;
      await manager.save(User, target);
      await manager.save(UserRoleAudit, {
        administratorId,
        affectedUserId: target.id,
        companyId: validCompanyId,
        previousRole,
        newRole: targetRole,
        source: 'ADMIN',
      });

      return target;
    });
  }
}
