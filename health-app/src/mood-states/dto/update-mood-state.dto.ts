import { PartialType } from '@nestjs/swagger';
import { CreateMoodStateDto } from './create-mood-state.dto';

export class UpdateMoodStateDto extends PartialType(CreateMoodStateDto) {}
