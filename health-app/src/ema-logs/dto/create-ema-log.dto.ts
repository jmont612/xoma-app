import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, Min, Max, IsBoolean } from 'class-validator';

export class CreateEmaLogDto {
  @ApiProperty({ description: 'ID del tipo de EMA', example: 1 })
  @IsInt()
  emaTypeId: number;

  @ApiProperty({
    description: 'Puntuación (0–10), para tipos "rating"',
    example: 7,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  rating?: number;

  @ApiProperty({
    description: 'Valor booleano, para tipos "boolean"',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  booleanValue?: boolean;
}
