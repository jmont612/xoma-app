import { IsInt, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateDiaryMoodStateNestedDto } from '../../diary-mood-states/dto/create-diary-mood-state-nested.dto';
import { CreateDiaryBehaviorNestedDto } from '../../diary-behaviors/dto/create-diary-behavior-nested.dto';
import { CreateUserSkillActivityNestedDto } from '../../user-skill-activities/dto/create-user-skill-activity-nested.dto';
import { CreateReflectionNestedDto } from '../../reflections/dto/create-reflection-nested.dto';

export class CreateDiaryDto {
  @IsInt()
  userId: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDiaryMoodStateNestedDto)
  moodStates?: CreateDiaryMoodStateNestedDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDiaryBehaviorNestedDto)
  behaviors?: CreateDiaryBehaviorNestedDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateUserSkillActivityNestedDto)
  userSkillActivities?: CreateUserSkillActivityNestedDto[];

  @IsOptional()
  reflections?: CreateReflectionNestedDto;
}
