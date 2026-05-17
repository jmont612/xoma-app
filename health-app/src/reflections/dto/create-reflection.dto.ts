import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Length } from 'class-validator';

export class CreateReflectionDto {
  @ApiProperty({ description: 'ID del diario', example: 1 })
  @IsInt()
  diaryId: number;

  @ApiProperty({
    description: 'Lo más difícil del día',
    example: 'Controlar mis pensamientos negativos',
  })
  @IsString()
  @Length(1, 500)
  mostDifficultToday: string;

  @ApiProperty({
    description: 'Lo más útil o positivo del día',
    example: 'Practicar la respiración profunda',
  })
  @IsString()
  @Length(1, 500)
  mostHelpfulToday: string;
}
