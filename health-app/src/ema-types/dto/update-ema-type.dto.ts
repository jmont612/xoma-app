import { PartialType } from '@nestjs/mapped-types';
import { CreateEmaTypeDto } from './create-ema-type.dto';

export class UpdateEmaTypeDto extends PartialType(CreateEmaTypeDto) {}
