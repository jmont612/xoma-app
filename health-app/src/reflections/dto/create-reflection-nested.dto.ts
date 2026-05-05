import { OmitType } from '@nestjs/mapped-types';
import { CreateReflectionDto } from './create-reflection.dto';

export class CreateReflectionNestedDto extends OmitType(CreateReflectionDto, [
  'diaryId',
] as const) {}
