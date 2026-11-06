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
import { UserRole } from '../../user/enums/user-role.enum';
import { CompanyDefaultsService } from '../../company/services/company-defaults.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private bcrypt: Bcrypt,
    @InjectDataSource() private dataSource: DataSource,
    private companyDefaultsService: CompanyDefaultsService,
  ) {}

  async validateUser(username: string, password: string): Promise<User | null> {
    const buscaUser = await this.userService.findByUsuario(username);

    if (!buscaUser)
      throw new HttpException('Usuário não encontrado!', HttpStatus.NOT_FOUND);

    const matchPassword = await this.bcrypt.compararSenhas(
      password,
      buscaUser.senha,
    );

    if (buscaUser && matchPassword) {
      return { ...buscaUser, senha: '' };
    }

    return null;
  }

  async login(userLogin: UserLogin) {
    const buscaUser = await this.userService.findByUsuario(userLogin.usuario);

    if (!buscaUser)
      throw new HttpException('Usuário não encontrado!', HttpStatus.NOT_FOUND);

    const payload = {
      sub: userLogin.usuario,
      id: buscaUser.id,
      company_id: buscaUser.company?.id ?? null,
      role: buscaUser.role,
    };

    return {
      id: buscaUser.id,
      nome: buscaUser.nome,
      usuario: userLogin.usuario,
      role: buscaUser.role,
      senha: '',
      token: `Bearer ${this.jwtService.sign(payload)}`,
    };
  }

  async registrar(dto: RegisterDto): Promise<Omit<User, 'senha'>> {
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
        const novaEmpresa = await queryRunner.manager.save(
          Company,
          queryRunner.manager.create(Company, {
            nome: dto.nomeEmpresa,
            cnpj: cnpjLimpo,
          }),
        );
        company = novaEmpresa;
      }

      await this.companyDefaultsService.ensureDefaults(
        queryRunner.manager,
        company.id,
      );

      const senhaCriptografada = await this.bcrypt.criptografarSenha(dto.senha);

      let user = queryRunner.manager.create(User, {
        nome: dto.nome,
        usuario: dto.usuario,
        senha: senhaCriptografada,
        company,
        role: UserRole.USER,
      });
      user = await queryRunner.manager.save(User, user);

      await queryRunner.commitTransaction();

      const resposta = { ...user };
      Reflect.deleteProperty(resposta, 'senha');
      return resposta;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
