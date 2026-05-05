import { PartialType } from '@nestjs/mapped-types';
import { CreateDiaryMoodStateDto } from './create-diary-mood-state.dto';

export class UpdateDiaryMoodStateDto extends PartialType(
  CreateDiaryMoodStateDto,
) {}
