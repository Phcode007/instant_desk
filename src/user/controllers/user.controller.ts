import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { UserService } from '../services/user.service';
import { User } from '../entities/user.entity';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';

@Controller('/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/all')
  @HttpCode(HttpStatus.OK)
  findAll(): Promise<User[]> {
    return this.userService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  findById(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return this.userService.findById(id);
  }

  @Post('/cadastrar')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() user: User): Promise<User> {
    return this.userService.create(user);
  }

  @Put('/atualizar')
  @HttpCode(HttpStatus.OK)
  update(@Body() user: User): Promise<User> {
    return this.userService.update(user);
  }
}
