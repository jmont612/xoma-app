import { PartialType } from '@nestjs/swagger';
import { CreateEmaTypeDto } from './create-ema-type.dto';

export class UpdateEmaTypeDto extends PartialType(CreateEmaTypeDto) {}
