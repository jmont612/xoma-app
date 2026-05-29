import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsBoolean,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { UserSkillActivityStatus } from '@/common/enums/diary-skill-activity-status.enum';

export class CreateUserSkillActivityDto {
  @ApiProperty({ description: 'ID del usuario', example: 1 })
  @IsInt()
  userId: number;

  @ApiProperty({ description: 'ID de la sub-habilidad', example: 3 })
  @IsInt()
  subSkillId: number;

  @ApiProperty({
    enum: UserSkillActivityStatus,
    description: 'Estado de la actividad',
    example: 'completed',
  })
  @IsEnum(UserSkillActivityStatus)
  status: UserSkillActivityStatus;

  @ApiProperty({
    description: '¿La actividad fue efectiva?',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  effective?: boolean;

  @ApiProperty({
    description: 'Calificación de la actividad (1–5)',
    example: 4,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;
}
