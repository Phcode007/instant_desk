import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { LocalAuthGuard } from '../guard/local-auth.guard';
import { AuthService } from '../services/auth.service';
import { UserLogin } from '../entities/userlogin.entity';
import { RegisterDto } from '../dto/register.dto';
import { User } from '../../user/entities/user.entity';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('users')
@Controller('/users')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('/logar')
  login(@Body() user: UserLogin): Promise<any> {
    return this.authService.login(user);
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('/registrar')
  registrar(@Body() dto: RegisterDto): Promise<User> {
    return this.authService.registrar(dto);
  }
}
