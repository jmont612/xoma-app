import { CreateDiaryBehaviorDto } from './create-diary-behavior.dto';
import { OmitType } from '@nestjs/mapped-types';

export class CreateDiaryBehaviorNestedDto extends OmitType(
  CreateDiaryBehaviorDto,
  ['diaryId'] as const,
) {}
