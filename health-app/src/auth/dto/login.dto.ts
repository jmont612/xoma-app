import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Correo electrónico del usuario',
    example: 'usuario@email.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Contraseña (mín. 6 caracteres)',
    example: 'miPassword123',
  })
  @IsString()
  @Length(6, 100)
  password: string;
}
