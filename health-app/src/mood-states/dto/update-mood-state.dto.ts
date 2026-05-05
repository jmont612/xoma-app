import { PartialType } from '@nestjs/mapped-types';
import { CreateMoodStateDto } from './create-mood-state.dto';

export class UpdateMoodStateDto extends PartialType(CreateMoodStateDto) {}
