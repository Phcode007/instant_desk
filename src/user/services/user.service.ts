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

  async findByUsuario(usuario: string): Promise<User | undefined> {
    return (
      (await this.userRepository.findOne({
        where: { usuario },
      })) ?? undefined
    );
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find({
      relations: { ticket: true },
    });
  }

  async findById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: { ticket: true },
    });

    if (!user)
      throw new HttpException('Usuário não encontrado!', HttpStatus.NOT_FOUND);

    return user;
  }

  async create(user: User): Promise<User> {
    const buscaUser = await this.findByUsuario(user.usuario);

    if (buscaUser)
      throw new HttpException('O usuário já existe!', HttpStatus.BAD_REQUEST);

    await this.companyService.findById(user.company.id);

    user.senha = await this.bcrypt.criptografarSenha(user.senha);
    return await this.userRepository.save(user);
  }

  async update(user: User): Promise<User> {
    await this.findById(user.id);

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
