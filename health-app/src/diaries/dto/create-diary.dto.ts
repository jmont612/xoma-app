import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateDiaryMoodStateNestedDto } from '../../diary-mood-states/dto/create-diary-mood-state-nested.dto';
import { CreateDiaryBehaviorNestedDto } from '../../diary-behaviors/dto/create-diary-behavior-nested.dto';
import { CreateUserSkillActivityNestedDto } from '../../user-skill-activities/dto/create-user-skill-activity-nested.dto';
import { CreateReflectionNestedDto } from '../../reflections/dto/create-reflection-nested.dto';

export class CreateDiaryDto {
  @ApiProperty({ description: 'ID del usuario', example: 1 })
  @IsInt()
  userId: number;

  @ApiProperty({ type: [CreateDiaryMoodStateNestedDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDiaryMoodStateNestedDto)
  moodStates?: CreateDiaryMoodStateNestedDto[];

  @ApiProperty({ type: [CreateDiaryBehaviorNestedDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDiaryBehaviorNestedDto)
  behaviors?: CreateDiaryBehaviorNestedDto[];

  @ApiProperty({ type: [CreateUserSkillActivityNestedDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateUserSkillActivityNestedDto)
  userSkillActivities?: CreateUserSkillActivityNestedDto[];

  @ApiProperty({ type: CreateReflectionNestedDto, required: false })
  @IsOptional()
  reflections?: CreateReflectionNestedDto;
}
