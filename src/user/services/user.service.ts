import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Bcrypt } from '../../auth/bcrypt/bcrypt';
import { CompanyService } from '../../company/services/company.service';
import { Company } from '../../company/entities/company.entity';
import { UserRole } from '../enums/user-role.enum';

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

  async findAll(companyId: number | null): Promise<User[]> {
    const id = this.checkCompanyId(companyId);

    return await this.userRepository.find({
      where: { company: { id } },
      relations: { ticket: true },
    });
  }

  async findById(id: number, companyId: number | null): Promise<User> {
    const validCompanyId = this.checkCompanyId(companyId);

    const user = await this.userRepository.findOne({
      where: { id, company: { id: validCompanyId } },
      relations: { ticket: true },
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
        throw new HttpException('Empresa não encontrada!', HttpStatus.NOT_FOUND);
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
    });
  }

  async update(user: User, companyId: number | null): Promise<User> {
    if (!user.company || !user.company.id)
      throw new HttpException(
        'A empresa (company) é obrigatória para atualizar um usuário',
        HttpStatus.BAD_REQUEST,
      );

    await this.findById(user.id, companyId);

    const buscaUser = await this.findByUsuario(user.usuario);

    if (buscaUser && buscaUser.id !== user.id)
      throw new HttpException(
        'Usuário (login) já cadastrado!',
        HttpStatus.BAD_REQUEST,
      );

    await this.companyService.findById(user.company.id);

    user.senha = await this.bcrypt.criptografarSenha(user.senha);
    user.role = UserRole.USER;
    return await this.userRepository.save(user);
  }
}
