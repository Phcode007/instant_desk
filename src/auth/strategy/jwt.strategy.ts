import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConstants } from '../constants/constant';
import { UserService } from '../../user/services/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: { id?: number }) {
    if (!payload.id) {
      throw new UnauthorizedException();
    }

    const user = await this.userService.findForAuthentication(payload.id);

    if (!user) {
      throw new UnauthorizedException();
    }

    return {
      sub: user.usuario,
      id: user.id,
      company_id: user.company?.id ?? null,
      role: user.role,
    };
  }
}
