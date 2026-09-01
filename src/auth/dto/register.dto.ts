import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty()
  @ApiProperty()
  nome!: string;

  @IsEmail()
  @ApiProperty()
  usuario!: string;

  @MinLength(8)
  @ApiProperty()
  senha!: string;

  @IsNotEmpty()
  @ApiProperty()
  nomeEmpresa!: string;

  @IsNotEmpty()
  @ApiProperty()
  cnpj!: string;
}
