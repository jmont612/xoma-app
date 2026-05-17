import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateEmergencyContactDto } from './create-emergency-contact.dto';

export class SyncEmergencyContactsDto {
  @ApiProperty({
    type: [CreateEmergencyContactDto],
    description:
      'Lista de contactos de emergencia a sincronizar (upsert por tipo)',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEmergencyContactDto)
  contacts: CreateEmergencyContactDto[];
}
