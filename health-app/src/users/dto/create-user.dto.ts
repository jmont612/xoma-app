import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsInt,
  IsEnum,
  IsBoolean,
  Length,
  Min,
  Max,
} from 'class-validator';
import { Gender } from '@/common/enums/gender.enum';

export class CreateUserDto {
  @ApiProperty({ description: 'Nombre del usuario', example: 'Juan' })
  @IsString()
  @Length(2, 50)
  firstName: string;

  @ApiProperty({ description: 'Apellido del usuario', example: 'Pérez' })
  @IsString()
  @Length(2, 50)
  lastName: string;

  @ApiProperty({ description: 'Nombre de usuario único', example: 'juanperez' })
  @IsString()
  @Length(3, 30)
  username: string;

  @ApiProperty({ description: 'Correo electrónico', example: 'juan@email.com' })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Contraseña (mín. 6 caracteres)',
    example: 'password123',
  })
  @IsString()
  @Length(6, 100)
  password: string;

  @ApiProperty({ description: 'Edad del usuario (13–120)', example: 25 })
  @IsInt()
  @Min(13)
  @Max(120)
  age: number;

  @ApiProperty({ enum: Gender, description: 'Género', example: Gender.MALE })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({
    description: 'Aceptación del consentimiento informado',
    example: true,
  })
  @IsBoolean()
  consentAccepted: boolean;
}
