import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class SearchFiltersDto {
  @ApiProperty({
    name: 'date',
    required: false,
    description: 'Fecha en formato ISO (default: hoy)',
    example: '2026-05-20',
  })
  @IsOptional()
  @IsDateString()
  date?: string;
}
