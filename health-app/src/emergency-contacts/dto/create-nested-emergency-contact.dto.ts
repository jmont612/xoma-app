import { OmitType } from '@nestjs/swagger';
import { CreateEmergencyContactDto } from './create-emergency-contact.dto';

export class CreateNestedEmergencyContactDto extends OmitType(
  CreateEmergencyContactDto,
  ['userId'] as const,
) {}
