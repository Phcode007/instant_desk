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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CompanyId } from '../../auth/decorators/company_id.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guard/roles.guard';
import { UserRole } from '../enums/user-role.enum';

@ApiTags('Users')
@Controller('/users')
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('/all')
  @HttpCode(HttpStatus.OK)
  findAll(@CompanyId() companyId: number | null): Promise<User[]> {
    return this.userService.findAll(companyId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  findById(
    @Param('id', ParseIntPipe) id: number,
    @CompanyId() companyId: number | null,
  ): Promise<User> {
    return this.userService.findById(id, companyId);
  }

  @Post('/cadastrar')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() user: User): Promise<Omit<User, 'senha'>> {
    const created = await this.userService.create(user);
    const { senha, ...resposta } = created;
    return resposta;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put('/atualizar')
  @HttpCode(HttpStatus.OK)
  update(
    @Body() user: User,
    @CompanyId() companyId: number | null,
  ): Promise<User> {
    return this.userService.update(user, companyId);
  }
}
