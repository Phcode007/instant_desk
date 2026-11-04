import { Injectable } from '@nestjs/common';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { AddUserRole1762214400000 } from '../migrations/1762214400000-AddUserRole';
import { CreateUserRoleAudits1762214401000 } from '../migrations/1762214401000-CreateUserRoleAudits';

@Injectable()
export class ProdService implements TypeOrmOptionsFactory {
  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      url: process.env.DATABASE_URL,
      logging: false,
      dropSchema: false,
      ssl: {
        rejectUnauthorized: false,
      },
      synchronize: true,
      autoLoadEntities: true,
      migrations: [AddUserRole1762214400000, CreateUserRoleAudits1762214401000],
      migrationsRun: true,
    };
  }
}
