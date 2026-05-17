import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, Length } from 'class-validator';
import { EmaTypeEvaluationType } from '@/common/enums/ema-type-evaluation-type.enum';

export class CreateEmaTypeDto {
  @ApiProperty({
    description: 'Nombre del tipo de EMA',
    example: 'Estado de ánimo',
  })
  @IsString()
  @Length(2, 50)
  name: string;

  @ApiProperty({
    enum: EmaTypeEvaluationType,
    description: 'Tipo de evaluación',
    example: 'rating',
  })
  @IsEnum(EmaTypeEvaluationType)
  evaluationType: EmaTypeEvaluationType;
}
