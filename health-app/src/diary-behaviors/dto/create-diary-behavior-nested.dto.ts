import { OmitType } from '@nestjs/swagger';
import { CreateDiaryBehaviorDto } from './create-diary-behavior.dto';

export class CreateDiaryBehaviorNestedDto extends OmitType(
  CreateDiaryBehaviorDto,
  ['diaryId'] as const,
) {}
