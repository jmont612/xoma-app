import { PartialType } from '@nestjs/swagger';
import { CreateReflectionDto } from './create-reflection.dto';

export class UpdateReflectionDto extends PartialType(CreateReflectionDto) {}
