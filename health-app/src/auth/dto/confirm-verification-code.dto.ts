import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class ConfirmVerificationCodeDto {
  @ApiProperty({
    description: 'Correo electrónico del usuario',
    example: 'usuario@email.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Código OTP de 6 dígitos enviado por email',
    example: '123456',
  })
  @IsNotEmpty()
  @IsString()
  verificationCode: string;

  @ApiProperty({ description: 'Nueva contraseña', example: 'nuevaPassword456' })
  @IsString()
  @Length(6, 100)
  newPassword: string;
}
