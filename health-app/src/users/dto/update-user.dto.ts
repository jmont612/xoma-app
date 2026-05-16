import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateNestedEmergencyContactDto } from '@/emergency-contacts/dto/create-nested-emergency-contact.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateNestedEmergencyContactDto)
  emergencyContacts: CreateNestedEmergencyContactDto[];
}
