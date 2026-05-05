import { IsString, IsInt, Min, Max, Length } from 'class-validator';

export class CreateDailyQuoteDto {
  @IsString()
  @Length(10, 500)
  quote: string;

  @IsInt()
  @Min(1)
  @Max(365)
  day: number;
}
