import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsArray,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateDiaryMoodStateNestedDto } from '../../diary-mood-states/dto/create-diary-mood-state-nested.dto';
import { CreateDiaryBehaviorNestedDto } from '../../diary-behaviors/dto/create-diary-behavior-nested.dto';
import { CreateUserSkillActivityNestedDto } from '../../user-skill-activities/dto/create-user-skill-activity-nested.dto';
import { CreateReflectionNestedDto } from '../../reflections/dto/create-reflection-nested.dto';

export class CreateDiaryDto {
  @ApiProperty({ description: 'ID del usuario', example: 1 })
  @IsInt()
  userId: number;

  @ApiProperty({
    description:
      'Fecha del diario en formato YYYY-MM-DD. Por defecto el día actual. ' +
      'Permite registrar diarios de días pasados.',
    required: false,
    example: '2026-05-28',
  })
  @IsOptional()
  @IsDateString()
  entryDate?: string;

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
