import { Module } from '@nestjs/common';
import { Bcrypt } from './entities/bcrypt/bcrypt';

@Module({
  imports: [],
  providers: [Bcrypt],
  controllers: [],
  exports: [Bcrypt],
})
export class AuthModule {}
