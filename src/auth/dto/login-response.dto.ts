import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../user/enums/user-role.enum';

export class LoginResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  nome!: string;

  @ApiProperty()
  usuario!: string;

  @ApiProperty({ enum: UserRole })
  role!: UserRole;

  @ApiProperty({ description: 'Sempre vazio, mantido por compatibilidade.' })
  senha!: string;

  @ApiProperty({ example: 'Bearer eyJ...' })
  token!: string;
}
