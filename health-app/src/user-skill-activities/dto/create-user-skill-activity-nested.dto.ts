import { OmitType } from '@nestjs/swagger';
import { CreateUserSkillActivityDto } from './create-user-skill-activity.dto';

export class CreateUserSkillActivityNestedDto extends OmitType(
  CreateUserSkillActivityDto,
  ['userId'] as const,
) {}
