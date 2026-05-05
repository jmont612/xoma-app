import {
  IsInt,
  IsOptional,
  IsBoolean,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { UserSkillActivityStatus } from 'src/common/enums/diary-skill-activity-status.enum';

export class CreateUserSkillActivityDto {
  @IsInt()
  userId: number;

  @IsInt()
  subSkillId: number;

  @IsEnum(UserSkillActivityStatus)
  status: UserSkillActivityStatus;

  @IsOptional()
  @IsBoolean()
  effective?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;
}
