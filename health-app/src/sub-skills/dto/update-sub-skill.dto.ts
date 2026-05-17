import { PartialType } from '@nestjs/swagger';
import { CreateSubSkillDto } from './create-sub-skill.dto';

export class UpdateSubSkillDto extends PartialType(CreateSubSkillDto) {}
