import { PartialType } from '@nestjs/mapped-types';
import { CreateSubSkillDto } from './create-sub-skill.dto';

export class UpdateSubSkillDto extends PartialType(CreateSubSkillDto) {}
