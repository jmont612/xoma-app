import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsBoolean, Length } from 'class-validator';

export class CreateStepDto {
  @ApiProperty({ description: 'ID de la sub-habilidad', example: 2 })
  @IsInt()
  subSkillId: number;

  @ApiProperty({
    description: 'Descripción del paso (5–500 chars)',
    example: 'Respira profundamente durante 5 segundos',
  })
  @IsString()
  @Length(5, 500)
  description: string;

  @ApiProperty({ description: '¿El paso tiene temporizador?', example: true })
  @IsBoolean()
  hasTimer: boolean;

  @ApiProperty({
    description: '¿El paso requiere validación del usuario?',
    example: false,
  })
  @IsBoolean()
  requiresValidation: boolean;
}
