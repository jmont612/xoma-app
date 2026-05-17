import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, Min, Max } from 'class-validator';

export class CreateDiaryMoodStateDto {
  @ApiProperty({ description: 'ID del diario', example: 1 })
  @IsInt()
  diaryId: number;

  @ApiProperty({ description: 'ID del estado de ánimo', example: 2 })
  @IsInt()
  moodStateId: number;

  @ApiProperty({
    description: 'Puntuación del estado de ánimo (0–10)',
    example: 7,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  rating?: number;
}
