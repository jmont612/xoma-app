import { OmitType } from '@nestjs/swagger';
import { CreateReflectionDto } from './create-reflection.dto';

export class CreateReflectionNestedDto extends OmitType(CreateReflectionDto, [
  'diaryId',
] as const) {}
