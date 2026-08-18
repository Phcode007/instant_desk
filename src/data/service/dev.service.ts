import { Injectable } from '@nestjs/common';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { Category } from '../../category/entities/category.entity';
import { Company } from '../../company/entities/company.entity';
import { Priority } from '../../priority/entities/priority.entity';
import { Ticket } from '../../ticket/entities/ticket.entity';
import { User } from '../../user/entities/user.entity';

@Injectable()
export class DevService implements TypeOrmOptionsFactory {
  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres123',
      database: 'db_instant_desk',
      entities: [Ticket, Category, Priority, User, Company],
      synchronize: true,
    };
  }
}
