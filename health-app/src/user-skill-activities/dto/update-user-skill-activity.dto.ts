import { PartialType } from '@nestjs/swagger';
import { CreateUserSkillActivityDto } from './create-user-skill-activity.dto';

export class UpdateSkillActivityDto extends PartialType(
  CreateUserSkillActivityDto,
) {}
