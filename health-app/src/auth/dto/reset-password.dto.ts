import { ApiProperty } from '@nestjs/swagger';
import { IsJWT, IsString } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: 'JWT de recuperación enviado por email' })
  @IsString()
  @IsJWT()
  token: string;

  @ApiProperty({ description: 'Nueva contraseña', example: 'nuevaPassword456' })
  @IsString()
  newPassword: string;
}
