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
}
