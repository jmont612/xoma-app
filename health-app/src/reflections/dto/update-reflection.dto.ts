import { PartialType } from '@nestjs/mapped-types';
import { CreateReflectionDto } from './create-reflection.dto';

export class UpdateReflectionDto extends PartialType(CreateReflectionDto) {}
