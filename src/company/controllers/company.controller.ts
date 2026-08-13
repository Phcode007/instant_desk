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

@UseGuards(JwtAuthGuard)
@ApiTags('Companies')
@ApiBearerAuth()
@Controller('/companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(): Promise<Company[]> {
    return this.companyService.findAll();
  }

  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  findById(@Param('id', ParseIntPipe) id: number): Promise<Company> {
    return this.companyService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() company: Company): Promise<Company> {
    return this.companyService.create(company);
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  update(@Body() company: Company): Promise<Company> {
    return this.companyService.update(company);
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.companyService.delete(id);
  }
}
