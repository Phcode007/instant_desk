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
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CompanyId } from '../../auth/decorators/company_id.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guard/roles.guard';
import { UserRole } from '../enums/user-role.enum';
import { UserId } from '../../auth/decorators/user_id.decorator';
import { ChangeUserRoleDto } from '../dto/change-user-role.dto';

@ApiTags('Users')
@Controller('/users')
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('/all')
  @HttpCode(HttpStatus.OK)
  findAll(
    @CompanyId() companyId: number | null,
    @UserId() administratorId: number,
  ): Promise<User[]> {
    return this.userService.findAll(companyId, administratorId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  findById(
    @Param('id', ParseIntPipe) id: number,
    @CompanyId() companyId: number | null,
    @UserId() administratorId: number,
  ): Promise<User> {
    return this.userService.findById(id, companyId, administratorId);
  }

  @Post('/cadastrar')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() user: User): Promise<Omit<User, 'senha'>> {
    const created = await this.userService.create(user);
    const { senha, ...resposta } = created;
    return resposta;
  }

  @UseGuards(JwtAuthGuard)
  @Put('/atualizar')
  @HttpCode(HttpStatus.OK)
  async update(
    @Body() user: User,
    @CompanyId() companyId: number | null,
    @UserId() currentUserId: number,
  ): Promise<Omit<User, 'senha'>> {
    const updated = await this.userService.update(
      user,
      companyId,
      currentUserId,
    );
    const { senha, ...resposta } = updated;
    return resposta;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put('/:id/role')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Altera o perfil de usuário da própria empresa (ADMIN)',
  })
  @ApiOkResponse({ description: 'Perfil alterado e registrado em auditoria.' })
  @ApiForbiddenResponse({ description: 'Requer ADMIN e não permite autoalteração.' })
  async changeRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangeUserRoleDto,
    @CompanyId() companyId: number | null,
    @UserId() administratorId: number,
  ): Promise<Omit<User, 'senha'>> {
    const updated = await this.userService.changeRole(
      id,
      dto.role,
      companyId,
      administratorId,
    );
    const { senha, ...resposta } = updated;
    return resposta;
  }
}
