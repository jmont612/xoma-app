import { IsBoolean, IsInt } from 'class-validator';

export class CreateDiaryBehaviorDto {
  @IsInt()
  diaryId: number;

  @IsInt()
  behaviorId: number;

  @IsBoolean()
  hasHappened: boolean;
}
