import { PartialType } from '@nestjs/swagger';
import { CreateDiaryMoodStateDto } from './create-diary-mood-state.dto';

export class UpdateDiaryMoodStateDto extends PartialType(
  CreateDiaryMoodStateDto,
) {}
