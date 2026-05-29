import { PartialType } from '@nestjs/swagger';
import { CreateEmaLogDto } from './create-ema-log.dto';

export class UpdateEmaLogDto extends PartialType(CreateEmaLogDto) {}
