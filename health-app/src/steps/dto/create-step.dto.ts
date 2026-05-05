import { IsString, IsInt, IsBoolean, Length } from 'class-validator';

export class CreateStepDto {
  @IsInt()
  subSkillId: number;

  @IsString()
  @Length(5, 500)
  description: string;

  @IsBoolean()
  hasTimer: boolean;

  @IsBoolean()
  requiresValidation: boolean;
}
