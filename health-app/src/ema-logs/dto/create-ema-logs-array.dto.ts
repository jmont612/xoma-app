import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, ValidateNested } from 'class-validator';
import { CreateEmaLogDto } from './create-ema-log.dto';
import { Type } from 'class-transformer';

export class CreateEmaLogsArrayDto {
  @ApiProperty({ description: 'ID del usuario', example: 1 })
  @IsInt()
  userId: number;

  @ApiProperty({
    type: [CreateEmaLogDto],
    description: 'Array de registros EMA de la sesión',
  })
  @IsArray()
  @ValidateNested()
  @Type(() => CreateEmaLogDto)
  emaLogs: CreateEmaLogDto[];
}
