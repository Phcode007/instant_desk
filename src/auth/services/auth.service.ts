import { JwtService } from '@nestjs/jwt';
import { UserService } from '../../user/services/user.service';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Bcrypt } from '../bcrypt/bcrypt';
import { UserLogin } from '../entities/userlogin.entity';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Company } from '../../company/entities/company.entity';
import { User } from '../../user/entities/user.entity';
import { RegisterDto } from '../dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private bcrypt: Bcrypt,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const buscaUser = await this.userService.findByUsuario(username);

    if (!buscaUser)
      throw new HttpException('Usuário não encontrado!', HttpStatus.NOT_FOUND);

    const matchPassword = await this.bcrypt.compararSenhas(
      password,
      buscaUser.senha,
    );

    if (buscaUser && matchPassword) {
      const { senha, ...resposta } = buscaUser;
      return resposta;
    }

    return null;
  }

  async login(userLogin: UserLogin) {
    const buscaUser = await this.userService.findByUsuario(userLogin.usuario);

    if (!buscaUser)
      throw new HttpException('Usuário não encontrado!', HttpStatus.NOT_FOUND);

    const payload = {
      sub: userLogin.usuario,
      company_id: buscaUser.company?.id ?? null,
    };

    return {
      id: buscaUser.id,
      nome: buscaUser.nome,
      usuario: userLogin.usuario,
      senha: '',
      token: `Bearer ${this.jwtService.sign(payload)}`,
    };
  }

  async registrar(dto: RegisterDto): Promise<User> {
    const cnpjLimpo = dto.cnpj.replace(/\D/g, '');

    if (cnpjLimpo.length !== 14)
      throw new HttpException(
        'CNPJ inválido, deve conter 14 dígitos',
        HttpStatus.BAD_REQUEST,
      );

    const usuarioExistente = await this.userService.findByUsuario(dto.usuario);

    if (usuarioExistente)
      throw new HttpException('O usuário já existe!', HttpStatus.BAD_REQUEST);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let company = await queryRunner.manager.findOne(Company, {
        where: { cnpj: cnpjLimpo },
      });

      if (!company) {
        company = queryRunner.manager.create(Company, {
          nome: dto.nomeEmpresa,
          cnpj: cnpjLimpo,
        });
        company = await queryRunner.manager.save(Company, company);
      }

      const senhaCriptografada = await this.bcrypt.criptografarSenha(dto.senha);

      let user = queryRunner.manager.create(User, {
        nome: dto.nome,
        usuario: dto.usuario,
        senha: senhaCriptografada,
        company,
      });
      user = await queryRunner.manager.save(User, user);

      await queryRunner.commitTransaction();

      return user;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
