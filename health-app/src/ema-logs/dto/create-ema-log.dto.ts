import { IsInt, IsOptional, Min, Max, IsBoolean } from 'class-validator';

export class CreateEmaLogDto {
  @IsInt()
  emaTypeId: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  rating?: number;

  @IsOptional()
  @IsBoolean()
  booleanValue?: boolean;
}
