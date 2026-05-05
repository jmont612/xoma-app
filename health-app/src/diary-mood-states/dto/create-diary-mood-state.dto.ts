import { IsInt, IsOptional, Min, Max } from 'class-validator';

export class CreateDiaryMoodStateDto {
  @IsInt()
  diaryId: number;

  @IsInt()
  moodStateId: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  rating?: number;
}
