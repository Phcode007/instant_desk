import { JwtService } from '@nestjs/jwt';
import { UserService } from '../../user/services/user.service';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Bcrypt } from '../bcrypt/bcrypt';
import { UserLogin } from '../entities/userlogin.entity';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private bcrypt: Bcrypt,
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
    const payload = { sub: userLogin.usuario };

    const buscaUser = await this.userService.findByUsuario(userLogin.usuario);

    return {
      id: buscaUser.id,
      nome: buscaUser.nome,
      usuario: userLogin.usuario,
      senha: '',
      token: `Bearer ${this.jwtService.sign(payload)}`,
    };
  }
}
