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
import { Priority } from '../entities/priority.entity';
import { PriorityService } from '../services/priority.service';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CompanyId } from '../../auth/decorators/company_id.decorator';

@UseGuards(JwtAuthGuard)
@Controller('/priorities')
@ApiTags('Priorities')
@ApiBearerAuth()
export class PriorityController {
  constructor(private readonly priorityService: PriorityService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(@CompanyId() companyId: number | null): Promise<Priority[]> {
    return this.priorityService.findAll(companyId);
  }

  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  findById(
    @Param('id', ParseIntPipe) id: number,
    @CompanyId() companyId: number | null,
  ): Promise<Priority> {
    return this.priorityService.findById(id, companyId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() priority: Priority): Promise<Priority> {
    return this.priorityService.create(priority);
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  update(
    @Body() priority: Priority,
    @CompanyId() companyId: number | null,
  ): Promise<Priority> {
    return this.priorityService.update(priority, companyId);
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(
    @Param('id', ParseIntPipe) id: number,
    @CompanyId() companyId: number | null,
  ) {
    return this.priorityService.delete(id, companyId);
  }
}
