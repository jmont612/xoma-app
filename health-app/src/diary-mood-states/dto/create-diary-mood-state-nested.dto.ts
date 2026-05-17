import { OmitType } from '@nestjs/swagger';
import { CreateDiaryMoodStateDto } from './create-diary-mood-state.dto';

export class CreateDiaryMoodStateNestedDto extends OmitType(
  CreateDiaryMoodStateDto,
  ['diaryId'] as const,
) {}
