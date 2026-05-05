import { IsInt, IsString, Length } from 'class-validator';

export class CreateReflectionDto {
  @IsInt()
  diaryId: number;

  @IsString()
  @Length(1, 500)
  mostDifficultToday: string;

  @IsString()
  @Length(1, 500)
  mostHelpfulToday: string;
}
