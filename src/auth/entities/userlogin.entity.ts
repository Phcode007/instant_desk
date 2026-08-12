import { ApiProperty } from '@nestjs/swagger';

export class UserLogin {
  @ApiProperty()
  usuario!: string;

  @ApiProperty()
  senha!: string;
}
