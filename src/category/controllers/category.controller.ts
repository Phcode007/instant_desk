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
import { Category } from '../entities/category.entity';
import { CategoryService } from '../services/category.service';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CompanyId } from '../../auth/decorators/company_id.decorator';

@UseGuards(JwtAuthGuard)
@ApiTags('Categories')
@ApiBearerAuth()
@Controller('/category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(@CompanyId() companyId: number | null): Promise<Category[]> {
    return this.categoryService.findAll(companyId);
  }

  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  findById(
    @Param('id', ParseIntPipe) id: number,
    @CompanyId() companyId: number | null,
  ): Promise<Category> {
    return this.categoryService.findById(id, companyId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() category: Category): Promise<Category> {
    return this.categoryService.create(category);
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  update(
    @Body() category: Category,
    @CompanyId() companyId: number | null,
  ): Promise<Category> {
    return this.categoryService.update(category, companyId);
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(
    @Param('id', ParseIntPipe) id: number,
    @CompanyId() companyId: number | null,
  ) {
    return this.categoryService.delete(id, companyId);
  }
}
