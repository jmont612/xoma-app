import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsInt, Length } from 'class-validator';
import { ContactType } from '@/common/enums/contact-type.enum';

export class CreateEmergencyContactDto {
  @ApiProperty({ description: 'ID del usuario', example: 1 })
  @IsInt()
  userId: number;

  @ApiProperty({ description: 'Nombre del contacto', example: 'María' })
  @IsString()
  @Length(2, 100)
  firstName: string;

  @ApiProperty({ description: 'Apellido del contacto', example: 'García' })
  @IsString()
  @Length(2, 100)
  lastName: string;

  @ApiProperty({
    description: 'Número de teléfono (9–20 chars)',
    example: '+51987654321',
  })
  @IsString()
  @Length(9, 20)
  phoneNumber: string;

  @ApiProperty({
    enum: ContactType,
    description: 'Tipo de contacto de emergencia',
    example: 'Primary',
  })
  @IsEnum(ContactType)
  contactType: ContactType;
}
