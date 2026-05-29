import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, Min, Max, Length } from 'class-validator';

export class CreateDailyQuoteDto {
  @ApiProperty({
    description: 'Texto de la cita motivacional (10–500 chars)',
    example: 'Cada día es una nueva oportunidad para crecer.',
  })
  @IsString()
  @Length(10, 500)
  quote: string;

  @ApiProperty({
    description: 'Día del año al que corresponde la cita (1–365)',
    example: 1,
  })
  @IsInt()
  @Min(1)
  @Max(365)
  day: number;
}
