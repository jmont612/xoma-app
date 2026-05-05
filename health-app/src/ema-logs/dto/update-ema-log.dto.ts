import { PartialType } from '@nestjs/mapped-types';
import { CreateEmaLogDto } from './create-ema-log.dto';

export class UpdateEmaLogDto extends PartialType(CreateEmaLogDto) {}
