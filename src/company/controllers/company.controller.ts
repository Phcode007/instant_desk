import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Company } from '../entities/company.entity';
import { CompanyService } from '../services/company.service';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guard/roles.guard';
import { UserRole } from '../../user/enums/user-role.enum';
import { CompanyId } from '../../auth/decorators/company_id.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiTags('Companies')
@ApiBearerAuth()
@Controller('/companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(@CompanyId() companyId: number | null): Promise<Company[]> {
    return this.companyService.findForCompany(companyId);
  }

  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  findById(
    @Param('id', ParseIntPipe) id: number,
    @CompanyId() companyId: number | null,
  ): Promise<Company> {
    return this.companyService.findByIdForCompany(id, companyId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(): Promise<Company> {
    return this.companyService.create();
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  update(
    @Body() company: Company,
    @CompanyId() companyId: number | null,
  ): Promise<Company> {
    return this.companyService.update(company, companyId);
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(
    @Param('id', ParseIntPipe) id: number,
    @CompanyId() companyId: number | null,
  ) {
    return this.companyService.delete(id, companyId);
  }
}
