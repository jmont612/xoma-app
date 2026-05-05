import { OmitType } from '@nestjs/mapped-types';
import { CreateEmergencyContactDto } from './create-emergency-contact.dto';

export class CreateNestedEmergencyContactDto extends OmitType(
  CreateEmergencyContactDto,
  ['userId'] as const,
) {}
