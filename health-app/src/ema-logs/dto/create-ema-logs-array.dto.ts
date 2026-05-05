import { IsArray, IsInt, ValidateNested } from 'class-validator';
import { CreateEmaLogDto } from './create-ema-log.dto';
import { Type } from 'class-transformer';

export class CreateEmaLogsArrayDto {
  @IsInt()
  userId: number;

  @IsArray()
  @ValidateNested()
  @Type(() => CreateEmaLogDto)
  emaLogs: CreateEmaLogDto[];
}
