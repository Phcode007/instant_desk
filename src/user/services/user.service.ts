import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Bcrypt } from '../../auth/bcrypt/bcrypt';
import { CompanyService } from '../../company/services/company.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private bcrypt: Bcrypt,
    private companyService: CompanyService,
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
    return await this.userRepository.save(user);
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
    return await this.userRepository.save(user);
  }
}
