import { PartialType } from '@nestjs/mapped-types';
import { CreateUserSkillActivityDto } from './create-user-skill-activity.dto';

export class UpdateSkillActivityDto extends PartialType(
  CreateUserSkillActivityDto,
) {}
